package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for SystemLog entity.
 *
 * Provides methods to query operational event logs for field assets.
 */
@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    /**
     * Find all logs for a specific asset (most recent first).
     */
    List<SystemLog> findByAssetIdOrderByCreatedAtDesc(String assetId);

    /**
     * Find all logs by event type.
     */
    List<SystemLog> findByEventTypeOrderByCreatedAtDesc(String eventType);

    /**
     * Find all logs for an asset filtered by event type.
     */
    List<SystemLog> findByAssetIdAndEventType(String assetId, String eventType);

    /**
     * Find all logs ordered by creation date (most recent first).
     */
    List<SystemLog> findAllByOrderByCreatedAtDesc();

    List<SystemLog> findTop50ByOrderByCreatedAtDesc();

    long countByMessageContainingIgnoreCase(String fragment);
}
