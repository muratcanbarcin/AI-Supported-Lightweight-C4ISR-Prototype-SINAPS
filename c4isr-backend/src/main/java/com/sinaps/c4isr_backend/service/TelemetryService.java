package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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

    private final TelemetryRepository repository;
    private final ObjectMapper objectMapper;
    private final GeometryFactory geometryFactory;

    // Constructor Injection
    public TelemetryService(TelemetryRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
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