package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Iterator;
import java.util.Map;

/**
 * Hardware Telemetry Service — bridges real physical prototypes (Watch & Drone)
 * into the same persistence + AI analysis pipeline as the simulator.
 *
 * Responsibilities:
 *   1. Parse the canonical hardware JSON payloads (watch via HTTP, drone via MQTT/HTTP).
 *   2. Compute a server-side threat level from the raw signals
 *      (vitals for watch, edge-AI detections for drone).
 *   3. Persist a Telemetry row with is_simulated=false so SimulationEngine
 *      NEVER moves or drains the battery of these assets.
 *   4. Route CRITICAL / SUSPICIOUS rows through Gemma via TelemetryService.
 *
 * NOTE: We intentionally derive threat_level on the server. Clients should NOT
 * be trusted to self-classify — they only stream raw measurements.
 */
@Service
public class HardwareTelemetryService {

    private static final Logger log = LoggerFactory.getLogger(HardwareTelemetryService.class);

    private final TelemetryService telemetryService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public HardwareTelemetryService(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    // ════════════════════════════════════════════════════════════════
    //  WATCH (Soldier Wearable) — HTTP POST
    // ════════════════════════════════════════════════════════════════

    public Telemetry processWatchTelemetry(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode payload = root.path("payload");
        if (payload.isMissingNode() || payload.path("position").isMissingNode()) {
            throw new IllegalArgumentException("Watch payload or position missing");
        }

        String sourceId = root.path("id").asText("IZMIR-HW-WATCH-01");
        LocalDateTime ts = parseIsoTimestamp(root.path("time").asText(null));

        JsonNode pos = payload.path("position");
        double lat = pos.path("lat").asDouble();
        double lon = pos.path("lon").asDouble();
        Double alt = pos.has("alt_m") ? pos.get("alt_m").asDouble() : null;

        // Battery from device.battery_pct
        Integer battery = null;
        JsonNode device = payload.path("device");
        if (device.has("battery_pct")) {
            battery = (int) Math.round(device.get("battery_pct").asDouble());
        }

        // Threat assessment from vitals
        JsonNode vitals = payload.path("vitals");
        Integer hr = vitals.has("hr_bpm") ? vitals.get("hr_bpm").asInt() : null;
        Integer spo2 = vitals.has("spo2_pct") ? vitals.get("spo2_pct").asInt() : null;
        String[] threat = evaluateWatchThreat(hr, spo2);

        // Build JSONB payload (preserve raw + add server-side fields)
        Map<String, Object> payloadMap = objectMapper.convertValue(
                payload, new TypeReference<Map<String, Object>>() {});
        payloadMap.put("is_simulated", false);
        payloadMap.put("source", "HARDWARE_WATCH");
        payloadMap.put("threatLevel", threat[0]);
        if (threat[1] != null) payloadMap.put("threatReason", threat[1]);
        // status default if missing
        if (!payloadMap.containsKey("status")) payloadMap.put("status", "IN_MISSION");
        // Strip any client-supplied threat_level to enforce server-side classification
        payloadMap.remove("threat_level");

        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        Telemetry t = Telemetry.builder()
                .sourceId(sourceId)
                .sourceType(AssetType.SOLDIER_WEARABLE)
                .timestamp(ts)
                .location(point)
                .altitude(alt)
                .speed(0.0)
                .batteryLevel(battery)
                .payload(payloadMap)
                .build();

        Telemetry saved = telemetryService.saveAndAnalyzeIfNeeded(t, threat[0]);
        log.info("HW WATCH saved id={} src={} threat={} hr={} spo2={}",
                saved.getId(), saved.getSourceId(), threat[0], hr, spo2);
        return saved;
    }

    private String[] evaluateWatchThreat(Integer hr, Integer spo2) {
        if (hr != null && (hr > 150 || hr < 40)) return new String[]{"CRITICAL", "HR=" + hr};
        if (spo2 != null && spo2 < 90) return new String[]{"CRITICAL", "SpO2=" + spo2};
        if (hr != null && hr > 130) return new String[]{"SUSPICIOUS", "HR=" + hr};
        if (spo2 != null && spo2 < 94) return new String[]{"SUSPICIOUS", "SpO2=" + spo2};
        return new String[]{"NORMAL", null};
    }

    // ════════════════════════════════════════════════════════════════
    //  DRONE — MQTT and HTTP
    // ════════════════════════════════════════════════════════════════

    public Telemetry processDroneTelemetry(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode payload = root.path("payload");
        if (payload.isMissingNode() || payload.path("position").isMissingNode()) {
            throw new IllegalArgumentException("Drone payload or position missing");
        }

        String sourceId = root.path("id").asText("IZMIR-HW-DRONE-01");
        LocalDateTime ts = parseIsoTimestamp(root.path("time").asText(null));

        JsonNode pos = payload.path("position");
        double lat = pos.path("lat").asDouble();
        double lon = pos.path("lon").asDouble();
        Double alt = pos.has("alt_m") ? pos.get("alt_m").asDouble() : null;

        Integer battery = null;
        JsonNode batteryNode = payload.path("battery");
        if (batteryNode.has("soc_pct")) {
            battery = (int) Math.round(batteryNode.get("soc_pct").asDouble());
        }

        // Threat assessment from edge_analysis.detections
        String[] threat = evaluateDroneThreat(payload.path("edge_analysis").path("detections"));

        Map<String, Object> payloadMap = objectMapper.convertValue(
                payload, new TypeReference<Map<String, Object>>() {});
        payloadMap.put("is_simulated", false);
        payloadMap.put("source", "HARDWARE_DRONE");
        payloadMap.put("threatLevel", threat[0]);
        if (threat[1] != null) payloadMap.put("threatReason", threat[1]);
        if (!payloadMap.containsKey("status")) payloadMap.put("status", "IN_MISSION");

        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        Telemetry t = Telemetry.builder()
                .sourceId(sourceId)
                .sourceType(AssetType.DRONE)
                .timestamp(ts)
                .location(point)
                .altitude(alt)
                .speed(null)
                .batteryLevel(battery)
                .payload(payloadMap)
                .build();

        Telemetry saved = telemetryService.saveAndAnalyzeIfNeeded(t, threat[0]);
        log.info("HW DRONE saved id={} src={} threat={} reason={}",
                saved.getId(), saved.getSourceId(), threat[0], threat[1]);
        return saved;
    }

    private String[] evaluateDroneThreat(JsonNode detections) {
        if (detections == null || !detections.isArray() || detections.size() == 0) {
            return new String[]{"NORMAL", null};
        }
        boolean hasHostile = false;
        boolean hasUnknown = false;
        String hostileReason = null;
        String unknownReason = null;

        for (Iterator<JsonNode> it = detections.elements(); it.hasNext(); ) {
            JsonNode d = it.next();
            String alignment = d.path("alignment").asText("").toUpperCase();
            double conf = d.path("confidence").asDouble(0.0);
            String klass = d.path("class").asText("?");
            if (conf < 0.7) continue;
            if ("HOSTILE".equals(alignment)) {
                hasHostile = true;
                if (hostileReason == null) {
                    hostileReason = "HOSTILE " + klass + " (conf=" + conf + ")";
                }
            } else if ("UNKNOWN".equals(alignment)) {
                hasUnknown = true;
                if (unknownReason == null) {
                    unknownReason = "UNKNOWN " + klass + " (conf=" + conf + ")";
                }
            }
        }
        if (hasHostile) return new String[]{"CRITICAL", hostileReason};
        if (hasUnknown) return new String[]{"SUSPICIOUS", unknownReason};
        return new String[]{"NORMAL", null};
    }

    // ════════════════════════════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════════════════════════════

    private LocalDateTime parseIsoTimestamp(String iso) {
        if (iso == null || iso.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.ofInstant(Instant.parse(iso), ZoneId.systemDefault());
        } catch (Exception e) {
            log.warn("Bad ISO timestamp '{}', using now()", iso);
            return LocalDateTime.now();
        }
    }
}
