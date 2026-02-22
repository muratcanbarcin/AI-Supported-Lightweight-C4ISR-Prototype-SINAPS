package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SystemLog Entity - Stores operational event logs for field assets.
 *
 * Records events such as:
 * - Emergency stops
 * - Connection status changes
 * - Mode transitions
 * - Operator actions
 */
@Entity
@Table(name = "system_logs", indexes = {
    @Index(name = "idx_system_logs_asset_id", columnList = "asset_id"),
    @Index(name = "idx_system_logs_event_type", columnList = "event_type"),
    @Index(name = "idx_system_logs_created_at", columnList = "created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The asset this log entry belongs to (e.g., "DRONE-001").
     */
    @Column(name = "asset_id", length = 50)
    private String assetId;

    /**
     * Type of event (e.g., "EMERGENCY_STOP", "CONNECTION_LOST", "MODE_CHANGE").
     */
    @Column(name = "event_type", length = 100)
    private String eventType;

    /**
     * Human-readable log message with event details.
     */
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    /**
     * Timestamp when the event occurred.
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
