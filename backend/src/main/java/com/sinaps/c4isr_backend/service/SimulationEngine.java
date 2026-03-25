package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.SystemLog;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.SystemLogRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Simulation Engine — moves EN_ROUTE simulated assets toward their
 * deployment zones every tick, inserting a new telemetry row each time.
 *
 * Physical hardware prototypes (is_simulated=false) are NEVER touched.
 */
@Service
@RequiredArgsConstructor
public class SimulationEngine {

    private static final Logger log = LoggerFactory.getLogger(SimulationEngine.class);

    private final TelemetryRepository telemetryRepository;
    private final TacticalZoneRepository zoneRepository;
    private final SystemLogRepository systemLogRepository;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double EARTH_RADIUS_M = 6_371_000.0;

    /*
     * Step size per 3-second tick (meters).
     * Deliberately high for demo visibility on a country-scale map.
     *   DRONE  → 5 km/tick  ≈ 6 000 km/h simulated
     *   VEHICLE→ 2 km/tick  ≈ 2 400 km/h simulated
     *   SOLDIER→ 0.8 km/tick≈  960 km/h simulated
     *   SENSOR → 0 (stationary)
     */
    private static double stepMeters(AssetType type) {
        return switch (type) {
            case DRONE   -> 5_000;
            case VEHICLE -> 2_000;
            case SOLDIER ->   800;
            case SENSOR  ->     0;
        };
    }

    private static double speedMps(AssetType type) {
        return stepMeters(type) / 3.0;
    }

    // ════════════════════════════════════════════════════════════════
    //  SCHEDULED TICK — every 3 seconds
    // ════════════════════════════════════════════════════════════════

    @Scheduled(fixedRate = 3000)
    public void tick() {
        List<Telemetry> allLatest = telemetryRepository.findLatestTelemetryBySource();
        int moved = 0;

        for (Telemetry t : allLatest) {
            Map<String, Object> payload = t.getPayload();
            if (payload == null) continue;

            Object simFlag = payload.get("is_simulated");
            boolean isSimulated = Boolean.TRUE.equals(simFlag)
                    || "true".equalsIgnoreCase(String.valueOf(simFlag));
            if (!isSimulated) continue;

            String status = Objects.toString(payload.get("status"), "");
            if (!"EN_ROUTE".equalsIgnoreCase(status)) continue;

            String zoneIdStr = Objects.toString(payload.get("deployment_zone_id"), "");
            if (zoneIdStr.isBlank()) continue;

            try {
                UUID zoneId = UUID.fromString(zoneIdStr);
                Optional<TacticalZone> zoneOpt = zoneRepository.findById(zoneId);
                if (zoneOpt.isEmpty()) continue;

                TacticalZone zone = zoneOpt.get();
                if (t.getLocation() == null) continue;

                double curLat = t.getLocation().getY();
                double curLon = t.getLocation().getX();
                double tgtLat = zone.getLatitude();
                double tgtLon = zone.getLongitude();

                double dist = haversine(curLat, curLon, tgtLat, tgtLon);
                double step = stepMeters(t.getSourceType());

                if (step <= 0) continue;

                Map<String, Object> newPayload = new HashMap<>(payload);
                double newLat, newLon;

                newPayload.put("deployment_zone", zone.getName());
                newPayload.put("deployment_zone_id", zone.getId().toString());

                double arrivalThreshold = Math.max(zone.getRadiusMeters() * 0.5, 1000);

                if (dist <= arrivalThreshold) {
                    newLat = tgtLat;
                    newLon = tgtLon;
                    newPayload.put("status", "IN_MISSION");
                    newPayload.put("distance_remaining_m", 0L);
                    newPayload.put("arrived_at", LocalDateTime.now().toString());

                    log.info("ARRIVED: {} reached {} (dist={}m)",
                            t.getSourceId(), zone.getName(), Math.round(dist));

                    systemLogRepository.save(SystemLog.builder()
                            .assetId(t.getSourceId())
                            .eventType("ARRIVAL")
                            .message(String.format(
                                    "Birlik %s, %s operasyon bölgesine başarıyla intikal etti ve göreve başladı. "
                                    + "(Son mesafe: %d m)",
                                    t.getSourceId(), zone.getName(), Math.round(dist)))
                            .build());
                } else {
                    double bearing = bearing(curLat, curLon, tgtLat, tgtLon);
                    double[] dest = destinationPoint(curLat, curLon, bearing, step);
                    newLat = dest[0];
                    newLon = dest[1];
                    newPayload.put("status", "EN_ROUTE");

                    double heading = Math.toDegrees(bearing);
                    if (heading < 0) heading += 360;
                    newPayload.put("heading", Math.round(heading * 10.0) / 10.0);
                    newPayload.put("distance_remaining_m", Math.max(0L, Math.round(dist - step)));
                }

                int battery = t.getBatteryLevel() != null ? t.getBatteryLevel() : 80;
                battery = Math.max(battery - 1, 5);

                Telemetry newTelemetry = Telemetry.builder()
                        .sourceId(t.getSourceId())
                        .sourceType(t.getSourceType())
                        .timestamp(LocalDateTime.now())
                        .location(GF.createPoint(new Coordinate(newLon, newLat)))
                        .altitude(t.getAltitude())
                        .speed(speedMps(t.getSourceType()))
                        .batteryLevel(battery)
                        .payload(newPayload)
                        .build();

                telemetryRepository.save(newTelemetry);
                moved++;

            } catch (Exception e) {
                log.warn("SimEngine error for {}: {}", t.getSourceId(), e.getMessage());
            }
        }

        if (moved > 0) {
            log.info("SimEngine tick: moved {} units", moved);
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  GEODESY MATH
    // ════════════════════════════════════════════════════════════════

    /**
     * Haversine distance in meters between two WGS84 points.
     */
    static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_M * c;
    }

    /**
     * Initial bearing (radians) from point 1 to point 2.
     */
    static double bearing(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dLambda = Math.toRadians(lon2 - lon1);
        double y = Math.sin(dLambda) * Math.cos(phi2);
        double x = Math.cos(phi1) * Math.sin(phi2)
                - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
        return Math.atan2(y, x);
    }

    /**
     * Destination point given start, bearing (radians) and distance (meters).
     * Returns [lat, lon] in degrees.
     */
    static double[] destinationPoint(double lat, double lon, double bearing, double distMeters) {
        double angularDist = distMeters / EARTH_RADIUS_M;
        double phi1 = Math.toRadians(lat);
        double lambda1 = Math.toRadians(lon);

        double sinPhi1 = Math.sin(phi1);
        double cosPhi1 = Math.cos(phi1);
        double sinD = Math.sin(angularDist);
        double cosD = Math.cos(angularDist);
        double sinBrg = Math.sin(bearing);
        double cosBrg = Math.cos(bearing);

        double phi2 = Math.asin(sinPhi1 * cosD + cosPhi1 * sinD * cosBrg);
        double lambda2 = lambda1 + Math.atan2(
                sinBrg * sinD * cosPhi1,
                cosD - sinPhi1 * Math.sin(phi2)
        );

        return new double[]{Math.toDegrees(phi2), Math.toDegrees(lambda2)};
    }
}
