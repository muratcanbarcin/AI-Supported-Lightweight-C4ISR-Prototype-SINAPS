package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.TacticalAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for TacticalAnalysis entity.
 * 
 * Provides methods to query AI-generated tactical analysis results.
 */
@Repository
public interface TacticalAnalysisRepository extends JpaRepository<TacticalAnalysis, Long> {

    /**
     * Find the analysis linked to a specific telemetry record.
     * 
     * @param telemetryId The ID of the telemetry record
     * @return The tactical analysis if exists
     */
    Optional<TacticalAnalysis> findByTelemetryId(Long telemetryId);

    /**
     * Check if an analysis exists for a telemetry record.
     * 
     * @param telemetryId The ID of the telemetry record
     * @return true if analysis exists
     */
    boolean existsByTelemetryId(Long telemetryId);

    /**
     * Find all analyses by threat level.
     * 
     * @param threatLevel The threat level to filter by
     * @return List of analyses with the given threat level
     */
    List<TacticalAnalysis> findByThreatLevel(String threatLevel);

    /**
     * Find high-priority analyses (HIGH or CRITICAL threat levels).
     * 
     * @return List of high-priority analyses ordered by analyzed timestamp
     */
    @Query("SELECT ta FROM TacticalAnalysis ta WHERE ta.threatLevel IN ('HIGH', 'CRITICAL') ORDER BY ta.analyzedAt DESC")
    List<TacticalAnalysis> findHighPriorityAnalyses();

    /**
     * Find analyses within a time range.
     * 
     * @param start Start of time range
     * @param end End of time range
     * @return Analyses within the time range
     */
    List<TacticalAnalysis> findByAnalyzedAtBetweenOrderByAnalyzedAtDesc(
            LocalDateTime start, LocalDateTime end);

    /**
     * Find recent analyses with pagination support.
     * 
     * @param limit Maximum number of results
     * @return Recent analyses
     */
    @Query(value = "SELECT * FROM tactical_analysis ORDER BY analyzed_at DESC LIMIT :limit", nativeQuery = true)
    List<TacticalAnalysis> findRecentAnalyses(@Param("limit") int limit);

    /**
     * Find analysis by telemetry source ID (via join).
     * 
     * @param sourceId The source ID of the telemetry
     * @return List of analyses for the source
     */
    @Query("SELECT ta FROM TacticalAnalysis ta WHERE ta.telemetry.sourceId = :sourceId ORDER BY ta.analyzedAt DESC")
    List<TacticalAnalysis> findByTelemetrySourceId(@Param("sourceId") String sourceId);

    /**
     * Find all analyses ordered by analyzed date (most recent first).
     */
    List<TacticalAnalysis> findAllByOrderByAnalyzedAtDesc();

    /**
     * Find top 50 most recent analyses.
     */
    List<TacticalAnalysis> findTop50ByOrderByAnalyzedAtDesc();

    /**
     * Find analyses by threat level ordered by analyzed date.
     */
    List<TacticalAnalysis> findByThreatLevelOrderByAnalyzedAtDesc(String threatLevel);

    /**
     * Find analyses for asset by source ID.
     */
    @Query("SELECT ta FROM TacticalAnalysis ta WHERE ta.telemetry.sourceId = :sourceId ORDER BY ta.analyzedAt DESC")
    List<TacticalAnalysis> findByTelemetrySourceIdOrderByAnalyzedAtDesc(@Param("sourceId") String sourceId);

    /**
     * Find most recent analysis.
     */
    Optional<TacticalAnalysis> findTopByOrderByAnalyzedAtDesc();
}
