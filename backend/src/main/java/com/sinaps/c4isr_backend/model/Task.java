package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Task Entity - Stores operational task assignments for field assets.
 *
 * Each task is linked to an asset and tracks its status lifecycle:
 * PENDING → IN_PROGRESS → COMPLETED / CANCELLED
 */
@Entity
@Table(name = "tasks", indexes = {
    @Index(name = "idx_tasks_asset_id", columnList = "asset_id"),
    @Index(name = "idx_tasks_status", columnList = "status"),
    @Index(name = "idx_tasks_created_at", columnList = "created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The asset this task is assigned to (e.g., "DRONE-001", "VEHICLE-T001").
     */
    @Column(name = "asset_id", length = 50)
    private String assetId;

    /**
     * Short human-readable title of the task.
     */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * Detailed description of the task objectives and instructions.
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Current status of the task.
     * Values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
     */
    @Builder.Default
    @Column(name = "status", length = 50)
    private String status = "PENDING";

    /**
     * Timestamp when the task was created.
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
