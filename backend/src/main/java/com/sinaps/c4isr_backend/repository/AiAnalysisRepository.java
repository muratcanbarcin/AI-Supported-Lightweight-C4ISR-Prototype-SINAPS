package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AiAnalysis entity.
 *
 * Provides methods to query AI-generated threat analysis results,
 * including filtering by alert status and threat level.
 */
@Repository
public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, Long> {

    /**
     * Find all analyses ordered by creation date (most recent first).
     */
    List<AiAnalysis> findAllByOrderByCreatedAtDesc();

    /**
     * Find all analyses flagged as alerts (for the Alerts page).
     */
    List<AiAnalysis> findByIsAlertTrueOrderByCreatedAtDesc();

    /**
     * Find all analyses for a specific asset (most recent first).
     */
    List<AiAnalysis> findByAssetIdOrderByCreatedAtDesc(String assetId);

    /**
     * Find all analyses by threat level.
     */
    List<AiAnalysis> findByThreatLevelOrderByCreatedAtDesc(String threatLevel);

    /**
     * Find analyses for an asset by threat level.
     */
    List<AiAnalysis> findByAssetIdAndThreatLevel(String assetId, String threatLevel);
}
