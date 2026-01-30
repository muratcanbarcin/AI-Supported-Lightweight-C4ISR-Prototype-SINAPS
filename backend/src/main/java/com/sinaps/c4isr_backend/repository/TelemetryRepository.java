package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.Telemetry;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Telemetry entity with support for geospatial queries.
 * 
 * Uses PostGIS functions for spatial operations:
 * - ST_DWithin: Find points within a distance (uses spatial index)
 * - ST_Distance: Calculate distance between two points
 * - ST_MakePoint: Create a point from coordinates
 */
@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    // ========================================
    // Basic Query Methods
    // ========================================

    /**
     * Find the most recent telemetry record for a specific source/device.
     * 
     * @param sourceId The unique identifier of the device
     * @return The latest telemetry record, if exists
     */
    Optional<Telemetry> findTopBySourceIdOrderByTimestampDesc(String sourceId);

    /**
     * Get the latest telemetry for each unique source (for map display).
     * Uses a subquery to find the max timestamp per source.
     */
    @Query("SELECT t FROM Telemetry t WHERE t.timestamp IN " +
            "(SELECT MAX(t2.timestamp) FROM Telemetry t2 GROUP BY t2.sourceId)")
    List<Telemetry> findLatestTelemetryBySource();

    /**
     * Find all telemetry for a specific source within a time range.
     */
    List<Telemetry> findBySourceIdAndTimestampBetweenOrderByTimestampDesc(
            String sourceId, LocalDateTime startTime, LocalDateTime endTime);

    // ========================================
    // Geospatial Query Methods (PostGIS)
    // ========================================

    /**
     * Find all telemetry points within a specified radius from a center point.
     * Uses PostGIS ST_DWithin which is optimized for spatial index usage.
     * 
     * @param center The center point (must have SRID 4326)
     * @param radiusInMeters The search radius in meters
     * @return List of telemetry records within the radius
     * 
     * Note: ST_DWithin automatically uses the spatial index when geography 
     * type cast is applied, making this query very efficient.
     */
    @Query(value = """
            SELECT * FROM telemetry t 
            WHERE ST_DWithin(
                t.location::geography, 
                :center::geography, 
                :radiusInMeters
            )
            ORDER BY t.timestamp DESC
            """, nativeQuery = true)
    List<Telemetry> findWithinRadius(
            @Param("center") Point center,
            @Param("radiusInMeters") double radiusInMeters);

    /**
     * Find the LATEST telemetry for each source within a radius.
     * Useful for showing current positions on a map within an area of interest.
     * 
     * @param center The center point
     * @param radiusInMeters The search radius in meters
     * @return Latest telemetry for each source within radius
     */
    @Query(value = """
            SELECT DISTINCT ON (t.source_id) * 
            FROM telemetry t 
            WHERE ST_DWithin(
                t.location::geography, 
                :center::geography, 
                :radiusInMeters
            )
            ORDER BY t.source_id, t.timestamp DESC
            """, nativeQuery = true)
    List<Telemetry> findLatestWithinRadius(
            @Param("center") Point center,
            @Param("radiusInMeters") double radiusInMeters);

    /**
     * Find telemetry points within a radius using raw coordinates.
     * This is useful when you don't want to create a Point object.
     * 
     * @param longitude Longitude of center point
     * @param latitude Latitude of center point  
     * @param radiusInMeters Search radius in meters
     * @return List of telemetry within radius
     */
    @Query(value = """
            SELECT * FROM telemetry t 
            WHERE ST_DWithin(
                t.location::geography, 
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, 
                :radiusInMeters
            )
            ORDER BY ST_Distance(
                t.location::geography, 
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
            )
            """, nativeQuery = true)
    List<Telemetry> findWithinRadiusByCoordinates(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusInMeters") double radiusInMeters);

    /**
     * Find telemetry points within a bounding box.
     * Useful for map viewport queries.
     * 
     * @param minLon Minimum longitude (west)
     * @param minLat Minimum latitude (south)
     * @param maxLon Maximum longitude (east)
     * @param maxLat Maximum latitude (north)
     * @return Telemetry points within the bounding box
     */
    @Query(value = """
            SELECT * FROM telemetry t 
            WHERE t.location && ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)
            ORDER BY t.timestamp DESC
            """, nativeQuery = true)
    List<Telemetry> findWithinBoundingBox(
            @Param("minLon") double minLon,
            @Param("minLat") double minLat,
            @Param("maxLon") double maxLon,
            @Param("maxLat") double maxLat);

    /**
     * Count telemetry points within a radius (useful for analytics).
     */
    @Query(value = """
            SELECT COUNT(*) FROM telemetry t 
            WHERE ST_DWithin(
                t.location::geography, 
                :center::geography, 
                :radiusInMeters
            )
            """, nativeQuery = true)
    long countWithinRadius(
            @Param("center") Point center,
            @Param("radiusInMeters") double radiusInMeters);
}