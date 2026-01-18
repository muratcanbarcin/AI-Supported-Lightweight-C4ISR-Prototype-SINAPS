package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.dto.SimMessageDTO;
import com.sinaps.c4isr_backend.dto.SimPayloadDTO;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for processing and managing telemetry data.
 * 
 * Handles:
 * - Incoming MQTT telemetry messages
 * - Geospatial queries using PostGIS
 * - Telemetry persistence and retrieval
 */
@Service
public class TelemetryService {

    private static final Logger log = LoggerFactory.getLogger(TelemetryService.class);

    private final TelemetryRepository repository;
    private final ObjectMapper objectMapper;
    private final GeometryFactory geometryFactory;

    // Constructor Injection
    public TelemetryService(TelemetryRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        // SRID 4326: WGS84 GPS Coordinate System
        this.geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    /**
     * Process incoming MQTT telemetry message and persist to database.
     * 
     * Expected JSON format:
     * {
     *   "source_id": "drone-001",
     *   "source_type": "DRONE",
     *   "lat": 39.9334,
     *   "lon": 32.8597,
     *   "alt": 150.0,
     *   "speed": 25.5,
     *   "battery": 85,
     *   "heading": 45.0,
     *   "timestamp": "2024-01-15T10:30:00"
     * }
     * 
     * @param jsonPayload Raw JSON string from MQTT
     */
    public void processIncomingData(String jsonPayload) {
        try {
            // 1. Parse JSON
            JsonNode node = objectMapper.readTree(jsonPayload);

            // 2. Validate required field
            if (!node.has("source_id") || node.get("source_id").asText().isEmpty()) {
                System.err.println("Error: source_id is missing -> " + jsonPayload);
                return;
            }

            // 3. Extract coordinates
            double lat = node.has("lat") ? node.get("lat").asDouble() : 0.0;
            double lon = node.has("lon") ? node.get("lon").asDouble() : 0.0;

            // 4. Create PostGIS Point (Note: Point takes longitude, latitude order)
            Point location = geometryFactory.createPoint(new Coordinate(lon, lat));

            // 5. Parse timestamp or use current time
            LocalDateTime timestamp = LocalDateTime.now();
            if (node.has("timestamp")) {
                try {
                    timestamp = LocalDateTime.parse(node.get("timestamp").asText());
                } catch (Exception e) {
                    // Use server time if parsing fails
                }
            }

            // 6. Parse asset type
            AssetType sourceType = AssetType.SENSOR; // Default
            if (node.has("source_type")) {
                try {
                    sourceType = AssetType.valueOf(node.get("source_type").asText().toUpperCase());
                } catch (IllegalArgumentException e) {
                    // Keep default
                }
            }

            // 7. Build payload map (store all extra fields)
            Map<String, Object> payload = buildPayloadMap(node, jsonPayload);

            // 8. Build and save telemetry entity
            Telemetry telemetry = Telemetry.builder()
                    .sourceId(node.get("source_id").asText())
                    .sourceType(sourceType)
                    .timestamp(timestamp)
                    .location(location)
                    .altitude(node.has("alt") ? node.get("alt").asDouble() : null)
                    .speed(node.has("speed") ? node.get("speed").asDouble() : null)
                    .batteryLevel(node.has("battery") ? node.get("battery").asInt() : null)
                    .payload(payload)
                    .build();

            repository.save(telemetry);

            System.out.println(">> Data Saved: " + telemetry.getSourceId() + 
                    " | Location: " + lat + ", " + lon);

        } catch (Exception e) {
            System.err.println("JSON Parse Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Build a payload map containing all extra fields and raw data.
     */
    private Map<String, Object> buildPayloadMap(JsonNode node, String rawJson) {
        Map<String, Object> payload = new HashMap<>();
        
        // Add common extra fields if present
        if (node.has("heading")) {
            payload.put("heading", node.get("heading").asDouble());
        }
        if (node.has("signal_strength")) {
            payload.put("signalStrength", node.get("signal_strength").asInt());
        }
        if (node.has("sensors")) {
            try {
                Map<String, Object> sensors = objectMapper.convertValue(
                        node.get("sensors"), 
                        new TypeReference<Map<String, Object>>() {}
                );
                payload.put("sensors", sensors);
            } catch (Exception e) {
                // Ignore conversion errors
            }
        }
        
        // Store raw JSON for debugging/audit
        payload.put("_raw", rawJson);
        
        return payload;
    }

    // ========================================
    // UAV Simulator Message Processing
    // ========================================

    /**
     * Process incoming message from the UAV Simulator (drone/events topic).
     * 
     * Expected JSON format from simulator:
     * {
     *   "domain": "drone",
     *   "type": "telemetry",
     *   "id": "drone1",
     *   "time": "2025-01-18T10:00:00.123Z",
     *   "payload": {
     *     "position": { "lat": 38.4237, "lon": 27.1428, "alt_m": 120.5 },
     *     "yaw_deg": 266.2,
     *     "ground_speed_mps": 13.4,
     *     "mode": "AUTO",
     *     "battery": { "soc_pct": 74.2 }
     *   }
     * }
     * 
     * Field Mapping:
     * - dto.id -> entity.sourceId
     * - dto.time -> entity.timestamp (ISO 8601 with timezone)
     * - dto.payload.position.lat/lon -> entity.location (PostGIS Point)
     * - dto.payload.position.alt_m -> entity.altitude
     * - dto.payload.ground_speed_mps -> entity.speed
     * - dto.payload.battery.soc_pct -> entity.batteryLevel (as Integer)
     * - dto.payload (entire object) -> entity.payload (JSONB)
     * 
     * @param jsonPayload Raw JSON string from MQTT drone/events topic
     */
    public void processSimulatorMessage(String jsonPayload) {
        try {
            // 1. Parse JSON into DTO
            SimMessageDTO message = objectMapper.readValue(jsonPayload, SimMessageDTO.class);

            // 2. Only process telemetry type messages
            if (!"telemetry".equalsIgnoreCase(message.type())) {
                log.debug("Ignoring non-telemetry message type: {} from {}", message.type(), message.id());
                return;
            }

            // 3. Validate required fields
            if (message.id() == null || message.id().isEmpty()) {
                log.error("Error: id is missing in simulator message -> {}", jsonPayload);
                return;
            }

            SimPayloadDTO payloadDto = message.payload();
            if (payloadDto == null || payloadDto.position() == null) {
                log.error("Error: payload or position is missing in simulator message -> {}", jsonPayload);
                return;
            }

            // 4. Parse ISO 8601 timestamp with timezone (handles "Z" suffix)
            LocalDateTime timestamp = parseIsoTimestamp(message.time());

            // 5. Extract position and create PostGIS Point
            double lat = payloadDto.position().lat();
            double lon = payloadDto.position().lon();
            Point location = geometryFactory.createPoint(new Coordinate(lon, lat));

            // 6. Determine asset type based on domain
            AssetType sourceType = determineAssetType(message.domain());

            // 7. Build payload map for JSONB storage (store entire payload object)
            Map<String, Object> payloadMap = objectMapper.convertValue(
                    payloadDto, 
                    new TypeReference<Map<String, Object>>() {}
            );

            // 8. Build and save telemetry entity
            Telemetry telemetry = Telemetry.builder()
                    .sourceId(message.id())
                    .sourceType(sourceType)
                    .timestamp(timestamp)
                    .location(location)
                    .altitude(payloadDto.position().altM())
                    .speed(payloadDto.groundSpeedMps())
                    .batteryLevel(payloadDto.battery() != null 
                            ? (int) Math.round(payloadDto.battery().socPct()) 
                            : null)
                    .payload(payloadMap)
                    .build();

            repository.save(telemetry);

            log.info(">> Simulator Data Saved: {} | Location: {}, {} | Alt: {}m | Speed: {} m/s | Battery: {}%",
                    telemetry.getSourceId(), lat, lon, 
                    telemetry.getAltitude(), telemetry.getSpeed(), telemetry.getBatteryLevel());

        } catch (Exception e) {
            log.error("Simulator JSON Parse Error: {}", e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Parse ISO 8601 timestamp string to LocalDateTime.
     * Handles formats like:
     * - "2025-01-18T10:00:00.123Z" (UTC with milliseconds)
     * - "2025-01-18T10:00:00Z" (UTC without milliseconds)
     * - "2025-01-18T10:00:00+03:00" (with timezone offset)
     * 
     * @param isoTimestamp ISO 8601 formatted timestamp string
     * @return LocalDateTime (converted to system timezone)
     */
    private LocalDateTime parseIsoTimestamp(String isoTimestamp) {
        if (isoTimestamp == null || isoTimestamp.isEmpty()) {
            return LocalDateTime.now();
        }
        try {
            // Parse as Instant (handles Z and timezone offsets)
            Instant instant = Instant.parse(isoTimestamp);
            // Convert to LocalDateTime in system's default timezone
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        } catch (Exception e) {
            // Fallback: try parsing as LocalDateTime directly
            try {
                return LocalDateTime.parse(isoTimestamp, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (Exception ex) {
                log.warn("Failed to parse timestamp '{}', using current time", isoTimestamp);
                return LocalDateTime.now();
            }
        }
    }

    /**
     * Determine AssetType based on the domain field from simulator.
     * 
     * @param domain Domain string from simulator message (e.g., "drone")
     * @return Corresponding AssetType enum value
     */
    private AssetType determineAssetType(String domain) {
        if (domain == null) {
            return AssetType.SENSOR; // Default
        }
        return switch (domain.toLowerCase()) {
            case "drone", "uav" -> AssetType.DRONE;
            case "soldier", "infantry" -> AssetType.SOLDIER;
            case "vehicle", "tank", "apc" -> AssetType.VEHICLE;
            default -> AssetType.SENSOR;
        };
    }

    // ========================================
    // Query Methods
    // ========================================

    /**
     * Get the latest telemetry for each unique source.
     * Used for displaying current positions on the map.
     */
    public List<Telemetry> getLatestTelemetry() {
        return repository.findLatestTelemetryBySource();
    }

    /**
     * Get the most recent telemetry for a specific source.
     */
    public Optional<Telemetry> getLatestBySourceId(String sourceId) {
        return repository.findTopBySourceIdOrderByTimestampDesc(sourceId);
    }

    /**
     * Find all telemetry within a radius from a center point.
     * 
     * @param latitude Center latitude
     * @param longitude Center longitude
     * @param radiusMeters Radius in meters
     * @return List of telemetry records within the radius
     */
    public List<Telemetry> findWithinRadius(double latitude, double longitude, double radiusMeters) {
        Point center = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        return repository.findWithinRadius(center, radiusMeters);
    }

    /**
     * Find the latest telemetry for each source within a radius.
     * 
     * @param latitude Center latitude
     * @param longitude Center longitude
     * @param radiusMeters Radius in meters
     * @return Latest telemetry for each source within radius
     */
    public List<Telemetry> findLatestWithinRadius(double latitude, double longitude, double radiusMeters) {
        Point center = geometryFactory.createPoint(new Coordinate(longitude, latitude));
        return repository.findLatestWithinRadius(center, radiusMeters);
    }

    /**
     * Find telemetry within a bounding box (map viewport).
     */
    public List<Telemetry> findWithinBoundingBox(double minLon, double minLat, 
                                                   double maxLon, double maxLat) {
        return repository.findWithinBoundingBox(minLon, minLat, maxLon, maxLat);
    }

    /**
     * Get telemetry history for a source within a time range.
     */
    public List<Telemetry> getHistory(String sourceId, LocalDateTime start, LocalDateTime end) {
        return repository.findBySourceIdAndTimestampBetweenOrderByTimestampDesc(sourceId, start, end);
    }

    /**
     * Save a telemetry record.
     */
    public Telemetry save(Telemetry telemetry) {
        return repository.save(telemetry);
    }

    /**
     * Get all telemetry records.
     */
    public List<Telemetry> findAll() {
        return repository.findAll();
    }
}