package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.SystemLog;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.model.ZoneType;
import com.sinaps.c4isr_backend.repository.SystemLogRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Simulation Engine — handles four responsibilities every tick:
 *   1. Movement  : EN_ROUTE assets advance toward their target zone.
 *   2. Arrival   : Assets reaching a zone transition to IN_MISSION (op-area) or IDLE (base).
 *   3. Logistics : BASE zones refuel (+2/tick), OPERATION_AREAs drain (-1/tick).
 *   4. Threat    : Stochastic threat generation with VRAM-protected AI analysis cooldown.
 *
 * All telemetry is routed through TelemetryService so simulated data
 * enters the exact same AI pipeline as real hardware data.
 *
 * Physical hardware prototypes (is_simulated=false) are NEVER touched.
 */
@Service
@RequiredArgsConstructor
public class SimulationEngine {

    private static final Logger log = LoggerFactory.getLogger(SimulationEngine.class);

    private final TelemetryService telemetryService;
    private final TacticalZoneRepository zoneRepository;
    private final SystemLogRepository systemLogRepository;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);
    private static final double EARTH_RADIUS_M = 6_371_000.0;

    private static final int REFUEL_PER_TICK = 2;
    private static final int DRAIN_PER_TICK  = 1;
    private static final int BATTERY_MAX     = 100;
    private static final int BATTERY_MIN     = 5;

    // ═══ VRAM Protection: per-asset cooldown for AI analysis triggers ═══
    private static final long ANALYSIS_COOLDOWN_SEC = 60;
    private final ConcurrentHashMap<String, Instant> lastAnalysisTime = new ConcurrentHashMap<>();

    private static double stepMeters(AssetType type) {
        return switch (type) {
            case DRONE   -> 5_000;
            case VEHICLE -> 2_000;
            case SHIP    -> 1_000;
            case SOLDIER, SOLDIER_WEARABLE -> 800;
            case SENSOR, ELECTRONIC_WARFARE -> 0;
        };
    }

    private static double speedMps(AssetType type) {
        return stepMeters(type) / 3.0;
    }

    // ════════════════════════════════════════════════════════════════
    //  STOCHASTIC THREAT GENERATION
    // ════════════════════════════════════════════════════════════════

    /**
     * Generate a threat level based on asset's operational status.
     *
     *   EN_ROUTE  : 97% NORMAL, 2% SUSPICIOUS, 1% CRITICAL
     *   IN_MISSION: 70% NORMAL, 20% SUSPICIOUS, 10% CRITICAL
     *   Other     : always NORMAL (e.g., IDLE at base)
     */
    private static String generateThreatLevel(String status) {
        double roll = ThreadLocalRandom.current().nextDouble();
        if ("IN_MISSION".equalsIgnoreCase(status)) {
            if (roll < 0.10) return "CRITICAL";
            if (roll < 0.30) return "SUSPICIOUS";
            return "NORMAL";
        }
        if ("EN_ROUTE".equalsIgnoreCase(status)) {
            if (roll < 0.01) return "CRITICAL";
            if (roll < 0.03) return "SUSPICIOUS";
            return "NORMAL";
        }
        return "NORMAL";
    }

    /**
     * Check whether an asset is allowed to trigger an AI analysis
     * (i.e., the cooldown period since its last analysis has elapsed).
     */
    private boolean canTriggerAnalysis(String sourceId) {
        Instant last = lastAnalysisTime.get(sourceId);
        return last == null || Instant.now().isAfter(last.plusSeconds(ANALYSIS_COOLDOWN_SEC));
    }

    /**
     * Save telemetry through the standard pipeline.
     * If threat is non-NORMAL AND the cooldown allows it, the AI analysis is triggered.
     * Otherwise, the telemetry is saved without AI analysis.
     */
    private void saveTelemetry(Telemetry telemetry, String threatLevel) {
        boolean shouldAnalyze = !"NORMAL".equals(threatLevel)
                && canTriggerAnalysis(telemetry.getSourceId());

        if (shouldAnalyze) {
            lastAnalysisTime.put(telemetry.getSourceId(), Instant.now());
            telemetryService.saveAndAnalyzeIfNeeded(telemetry, threatLevel);
            log.info("THREAT [{}]: {} — AI analysis triggered (cooldown reset)",
                    threatLevel, telemetry.getSourceId());
        } else {
            telemetryService.save(telemetry);
            if (!"NORMAL".equals(threatLevel)) {
                log.debug("THREAT [{}]: {} — AI analysis skipped (cooldown active)",
                        threatLevel, telemetry.getSourceId());
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    //  SCHEDULED TICK — every 3 seconds
    // ════════════════════════════════════════════════════════════════

    @Scheduled(fixedRate = 3000)
    public void tick() {
        logisticsTickCounter++;
        List<Telemetry> allLatest = telemetryService.getLatestTelemetry();
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
                if ("EN_ROUTE".equalsIgnoreCase(status) && !zoneIdStr.isBlank()) {
                    if (processMovement(t, payload, zoneIdStr)) moved++;
                } else if (("IN_MISSION".equalsIgnoreCase(status) || "IDLE".equalsIgnoreCase(status))
                        && !zoneIdStr.isBlank()) {
                    if (processLogistics(t, payload, status, zoneIdStr)) logisticsUpdated++;
                }
            } catch (Exception e) {
                log.warn("SimEngine error for {}: {}", t.getSourceId(), e.getMessage());
            }
        }

        if (moved > 0 || logisticsUpdated > 0) {
            log.info("SimEngine tick #{}: moved={}, logistics={}, total_assets={}",
                    logisticsTickCounter, moved, logisticsUpdated, allLatest.size());
        } else {
            log.debug("SimEngine tick #{}: no changes (total_assets={})",
                    logisticsTickCounter, allLatest.size());
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
        String finalStatus;
        double arrivalThreshold = Math.max(zone.getRadiusMeters() * 0.5, 1000);

        if (dist <= arrivalThreshold) {
            newLat = tgtLat;
            newLon = tgtLon;
            newPayload.put("distance_remaining_m", 0L);
            newPayload.put("arrived_at", LocalDateTime.now().toString());

            boolean isBase = zone.getZoneType() == ZoneType.BASE;
            finalStatus = isBase ? "IDLE" : "IN_MISSION";
            newPayload.put("status", finalStatus);

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
                    t.getSourceId(), zone.getName(), finalStatus);
        } else {
            finalStatus = "EN_ROUTE";
            double brg  = bearing(curLat, curLon, tgtLat, tgtLon);
            double[] dest = destinationPoint(curLat, curLon, brg, step);
            newLat = dest[0];
            newLon = dest[1];
            newPayload.put("status", finalStatus);

            double heading = Math.toDegrees(brg);
            if (heading < 0) heading += 360;
            newPayload.put("heading", Math.round(heading * 10.0) / 10.0);
            newPayload.put("distance_remaining_m", Math.max(0L, Math.round(dist - step)));
        }

        // ── Stochastic threat ──
        String threat = generateThreatLevel(finalStatus);
        newPayload.put("threatLevel", threat);

        int battery = t.getBatteryLevel() != null ? t.getBatteryLevel() : 80;
        battery = Math.max(battery - DRAIN_PER_TICK, BATTERY_MIN);

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

        saveTelemetry(newTelemetry, threat);
        return true;
    }

    // ─── Logistics sub-routine (refuel / drain while stationary) ────
    //
    // IMPORTANT: We must ALWAYS emit a new telemetry row even when
    // battery is fully charged/drained. Otherwise the frontend loses
    // the "live" feed and Gemma 2 has no fresh data to analyse.
    // The tick counter throttles stable units to 1 row per ~15 s.
    //
    private int logisticsTickCounter = 0;
    private static final int STABLE_EMIT_EVERY_N_TICKS = 5; // 5 × 3 s = 15 s

    private boolean processLogistics(Telemetry t, Map<String, Object> payload,
                                     String status, String zoneIdStr) {
        UUID zoneId = UUID.fromString(zoneIdStr);
        Optional<TacticalZone> zoneOpt = zoneRepository.findById(zoneId);
        if (zoneOpt.isEmpty()) return false;

        TacticalZone zone = zoneOpt.get();
        int battery = t.getBatteryLevel() != null ? t.getBatteryLevel() : 80;
        boolean isBase = zone.getZoneType() == ZoneType.BASE;

        boolean batteryChanged;
        if (isBase) {
            batteryChanged = battery < BATTERY_MAX;
            battery = Math.min(battery + REFUEL_PER_TICK, BATTERY_MAX);
        } else {
            batteryChanged = battery > BATTERY_MIN;
            battery = Math.max(battery - DRAIN_PER_TICK, BATTERY_MIN);
        }

        // Throttle: if battery is stable, only emit every Nth tick
        if (!batteryChanged && (logisticsTickCounter % STABLE_EMIT_EVERY_N_TICKS != 0)) {
            return false;
        }

        Map<String, Object> newPayload = new HashMap<>(payload);
        newPayload.put("deployment_zone", zone.getName());
        newPayload.put("deployment_zone_id", zone.getId().toString());

        String threat = isBase ? "NORMAL" : generateThreatLevel(status);
        newPayload.put("threatLevel", threat);

        double lat = t.getLocation() != null ? t.getLocation().getY() : zone.getLatitude();
        double lon = t.getLocation() != null ? t.getLocation().getX() : zone.getLongitude();

        Telemetry newTelemetry = Telemetry.builder()
                .sourceId(t.getSourceId())
                .sourceType(t.getSourceType())
                .timestamp(LocalDateTime.now())
                .location(GF.createPoint(new Coordinate(lon, lat)))
                .altitude(t.getAltitude())
                .speed(0.0)
                .batteryLevel(battery)
                .payload(newPayload)
                .build();

        saveTelemetry(newTelemetry, threat);
        return true;
    }

    // ════════════════════════════════════════════════════════════════
    //  GEODESY MATH
    // ════════════════════════════════════════════════════════════════

    static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_M * c;
    }

    static double bearing(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dLambda = Math.toRadians(lon2 - lon1);
        double y = Math.sin(dLambda) * Math.cos(phi2);
        double x = Math.cos(phi1) * Math.sin(phi2)
                - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
        return Math.atan2(y, x);
    }

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
