package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.SystemLog;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.model.ZoneType;
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
 * Simulation Engine — handles three responsibilities every tick:
 *   1. Movement  : EN_ROUTE assets advance toward their target zone.
 *   2. Arrival   : Assets reaching a zone transition to IN_MISSION (op-area) or IDLE (base).
 *   3. Logistics : BASE zones refuel (+2/tick), OPERATION_AREAs drain (-1/tick).
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

    private static final int REFUEL_PER_TICK    = 2;
    private static final int DRAIN_PER_TICK     = 1;
    private static final int BATTERY_MAX        = 100;
    private static final int BATTERY_MIN        = 5;

    /*
     * Step size per 3-second tick (meters).
     * Deliberately high for demo visibility on a country-scale map.
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
        int logisticsUpdated = 0;

        for (Telemetry t : allLatest) {
            Map<String, Object> payload = t.getPayload();
            if (payload == null) continue;

            Object simFlag = payload.get("is_simulated");
            boolean isSimulated = Boolean.TRUE.equals(simFlag)
                    || "true".equalsIgnoreCase(String.valueOf(simFlag));
            if (!isSimulated) continue;

            String status = Objects.toString(payload.get("status"), "");
            String zoneIdStr = Objects.toString(payload.get("deployment_zone_id"), "");

            try {
                // ── BRANCH 1: EN_ROUTE → Movement toward target zone ──
                if ("EN_ROUTE".equalsIgnoreCase(status) && !zoneIdStr.isBlank()) {
                    if (processMovement(t, payload, zoneIdStr)) moved++;
                }
                // ── BRANCH 2: Stationary at a zone → Logistics (refuel/drain) ──
                else if (("IN_MISSION".equalsIgnoreCase(status) || "IDLE".equalsIgnoreCase(status))
                        && !zoneIdStr.isBlank()) {
                    if (processLogistics(t, payload, status, zoneIdStr)) logisticsUpdated++;
                }
            } catch (Exception e) {
                log.warn("SimEngine error for {}: {}", t.getSourceId(), e.getMessage());
            }
        }

        if (moved > 0 || logisticsUpdated > 0) {
            log.info("SimEngine tick: moved={}, logistics={}", moved, logisticsUpdated);
        }
    }

    // ─── Movement sub-routine ───────────────────────────────────────
    private boolean processMovement(Telemetry t, Map<String, Object> payload, String zoneIdStr) {
        UUID zoneId = UUID.fromString(zoneIdStr);
        Optional<TacticalZone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty() || t.getLocation() == null) return false;

        TacticalZone zone = zoneOpt.get();
        double step = stepMeters(t.getSourceType());
        if (step <= 0) return false;

        double curLat = t.getLocation().getY();
        double curLon = t.getLocation().getX();
        double tgtLat = zone.getLatitude();
        double tgtLon = zone.getLongitude();
        double dist   = haversine(curLat, curLon, tgtLat, tgtLon);

        Map<String, Object> newPayload = new HashMap<>(payload);
        newPayload.put("deployment_zone", zone.getName());
        newPayload.put("deployment_zone_id", zone.getId().toString());

        double newLat, newLon;
        double arrivalThreshold = Math.max(zone.getRadiusMeters() * 0.5, 1000);

        if (dist <= arrivalThreshold) {
            newLat = tgtLat;
            newLon = tgtLon;
            newPayload.put("distance_remaining_m", 0L);
            newPayload.put("arrived_at", LocalDateTime.now().toString());

            boolean isBase = zone.getZoneType() == ZoneType.BASE;
            String arrivalStatus = isBase ? "IDLE" : "IN_MISSION";
            newPayload.put("status", arrivalStatus);

            String logMsg = isBase
                    ? String.format("Birlik %s, %s üssüne döndü ve hazır duruma geçti. (Son mesafe: %d m)",
                            t.getSourceId(), zone.getName(), Math.round(dist))
                    : String.format("Birlik %s, %s operasyon bölgesine başarıyla intikal etti ve göreve başladı. (Son mesafe: %d m)",
                            t.getSourceId(), zone.getName(), Math.round(dist));

            systemLogRepository.save(SystemLog.builder()
                    .assetId(t.getSourceId())
                    .eventType(isBase ? "RTB_COMPLETE" : "ARRIVAL")
                    .message(logMsg)
                    .build());

            log.info("{}: {} reached {} → {}", isBase ? "RTB" : "ARRIVED",
                    t.getSourceId(), zone.getName(), arrivalStatus);
        } else {
            double brg  = bearing(curLat, curLon, tgtLat, tgtLon);
            double[] dest = destinationPoint(curLat, curLon, brg, step);
            newLat = dest[0];
            newLon = dest[1];
            newPayload.put("status", "EN_ROUTE");

            double heading = Math.toDegrees(brg);
            if (heading < 0) heading += 360;
            newPayload.put("heading", Math.round(heading * 10.0) / 10.0);
            newPayload.put("distance_remaining_m", Math.max(0L, Math.round(dist - step)));
        }

        int battery = t.getBatteryLevel() != null ? t.getBatteryLevel() : 80;
        battery = Math.max(battery - DRAIN_PER_TICK, BATTERY_MIN);

        telemetryRepository.save(Telemetry.builder()
                .sourceId(t.getSourceId())
                .sourceType(t.getSourceType())
                .timestamp(LocalDateTime.now())
                .location(GF.createPoint(new Coordinate(newLon, newLat)))
                .altitude(t.getAltitude())
                .speed(speedMps(t.getSourceType()))
                .batteryLevel(battery)
                .payload(newPayload)
                .build());
        return true;
    }

    // ─── Logistics sub-routine (refuel / drain while stationary) ────
    private boolean processLogistics(Telemetry t, Map<String, Object> payload,
                                     String status, String zoneIdStr) {
        UUID zoneId = UUID.fromString(zoneIdStr);
        Optional<TacticalZone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) return false;

        TacticalZone zone = zoneOpt.get();
        int battery = t.getBatteryLevel() != null ? t.getBatteryLevel() : 80;
        boolean isBase = zone.getZoneType() == ZoneType.BASE;

        if (isBase) {
            if (battery >= BATTERY_MAX) return false;
            battery = Math.min(battery + REFUEL_PER_TICK, BATTERY_MAX);
        } else {
            if (battery <= BATTERY_MIN) return false;
            battery = Math.max(battery - DRAIN_PER_TICK, BATTERY_MIN);
        }

        Map<String, Object> newPayload = new HashMap<>(payload);
        newPayload.put("deployment_zone", zone.getName());
        newPayload.put("deployment_zone_id", zone.getId().toString());

        double lat = t.getLocation() != null ? t.getLocation().getY() : zone.getLatitude();
        double lon = t.getLocation() != null ? t.getLocation().getX() : zone.getLongitude();

        telemetryRepository.save(Telemetry.builder()
                .sourceId(t.getSourceId())
                .sourceType(t.getSourceType())
                .timestamp(LocalDateTime.now())
                .location(GF.createPoint(new Coordinate(lon, lat)))
                .altitude(t.getAltitude())
                .speed(0.0)
                .batteryLevel(battery)
                .payload(newPayload)
                .build());
        return true;
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
