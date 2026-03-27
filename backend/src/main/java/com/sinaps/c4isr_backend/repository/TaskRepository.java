package com.sinaps.c4isr_backend.repository;

import com.sinaps.c4isr_backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Repository for Task entity.
 *
 * Provides methods to query operational tasks assigned to field assets.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Find all tasks for a specific asset.
     */
    List<Task> findByAssetIdOrderByCreatedAtDesc(String assetId);

    /**
     * Find all tasks by status.
     */
    List<Task> findByStatusOrderByCreatedAtDesc(String status);

    /**
     * Find all tasks for an asset with a specific status.
     */
    List<Task> findByAssetIdAndStatus(String assetId, String status);

    /**
     * Find all tasks ordered by creation date (most recent first).
     */
    List<Task> findAllByOrderByCreatedAtDesc();

    List<Task> findByZoneIdOrderByCreatedAtDesc(String zoneId);

    long countByStatusIn(Collection<String> statuses);
}
