package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Telemetry Entity - Stores real-time telemetry data from field assets.
 * 
 * This entity uses:
 * - PostGIS for geospatial data (location as Point with SRID 4326)
 * - PostgreSQL JSONB for flexible payload storage
 * - Hibernate Spatial for geometry mapping
 */
@Entity
@Table(name = "telemetry", indexes = {
    @Index(name = "idx_telemetry_source_id", columnList = "source_id"),
    @Index(name = "idx_telemetry_timestamp", columnList = "timestamp"),
    @Index(name = "idx_telemetry_source_timestamp", columnList = "source_id, timestamp DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Telemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique identifier for the device/asset sending telemetry.
     * Format example: "DRONE-001", "SOLDIER-ALPHA", "VEHICLE-T001"
     */
    @Column(name = "source_id", nullable = false, length = 100)
    private String sourceId;

    /**
     * Type of asset sending the telemetry.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 50)
    private AssetType sourceType;

    /**
     * Timestamp when the telemetry was recorded at the source.
     * This is NOT when it was received by the server.
     */
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    /**
     * Geographic location using PostGIS Point geometry.
     * SRID 4326 = WGS84 (standard GPS coordinate system).
     * 
     * Example usage:
     * GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
     * Point location = geometryFactory.createPoint(new Coordinate(longitude, latitude));
     */
    @Column(columnDefinition = "geometry(Point, 4326)")
    private Point location;

    /**
     * Altitude in meters above sea level (MSL).
     */
    private Double altitude;

    /**
     * Speed in meters per second.
     */
    private Double speed;

    /**
     * Battery level as percentage (0-100).
     */
    @Column(name = "battery_level")
    private Integer batteryLevel;

    /**
     * Flexible payload for additional sensor data or metadata.
     * Stored as PostgreSQL JSONB for efficient querying.
     * 
     * Example payload:
     * {
     *   "heading": 45.5,
     *   "signalStrength": -67,
     *   "sensors": {
     *     "temperature": 22.5,
     *     "humidity": 65
     *   }
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload", columnDefinition = "jsonb")
    private Map<String, Object> payload;

    /**
     * Server-side timestamp when this record was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
