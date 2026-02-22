package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * AiAnalysis Entity - Stores AI-generated threat analysis records.
 *
 * Each record represents a single AI assessment of an asset's situation,
 * including threat level, recommended action, and whether it constitutes
 * an active alert requiring operator attention.
 */
@Entity
@Table(name = "ai_analyses", indexes = {
    @Index(name = "idx_ai_analyses_asset_id", columnList = "asset_id"),
    @Index(name = "idx_ai_analyses_threat_level", columnList = "threat_level"),
    @Index(name = "idx_ai_analyses_is_alert", columnList = "is_alert"),
    @Index(name = "idx_ai_analyses_created_at", columnList = "created_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The asset this analysis pertains to (e.g., "DRONE-001").
     */
    @Column(name = "asset_id", length = 50)
    private String assetId;

    /**
     * AI-determined threat level.
     * Values: LOW, MEDIUM, HIGH, CRITICAL
     */
    @Column(name = "threat_level", length = 50)
    private String threatLevel;

    /**
     * AI-recommended tactical action or decision.
     */
    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    /**
     * Whether this analysis constitutes an active alert.
     * true = should appear on the Alerts page.
     */
    @Builder.Default
    @Column(name = "is_alert")
    private Boolean isAlert = false;

    /**
     * Timestamp when the analysis was generated.
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
