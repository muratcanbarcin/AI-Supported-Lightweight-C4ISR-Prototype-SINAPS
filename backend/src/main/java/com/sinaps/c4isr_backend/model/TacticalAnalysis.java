package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * TacticalAnalysis Entity - Stores AI-generated tactical analysis results.
 * 
 * Each analysis is linked to a specific Telemetry record and contains:
 * - Threat assessment level (e.g., "LOW", "MEDIUM", "HIGH", "CRITICAL")
 * - AI-recommended decision/action
 * - Detailed reasoning behind the analysis
 * 
 * This entity is populated asynchronously by the Python AI microservice
 * after telemetry data is received and persisted.
 */
@Entity
@Table(name = "tactical_analysis", indexes = {
    @Index(name = "idx_tactical_analysis_telemetry_id", columnList = "telemetry_id"),
    @Index(name = "idx_tactical_analysis_threat_level", columnList = "threat_level"),
    @Index(name = "idx_tactical_analysis_analyzed_at", columnList = "analyzed_at DESC")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TacticalAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The telemetry record that was analyzed.
     * One-to-One relationship: Each telemetry can have at most one analysis.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "telemetry_id", nullable = false, unique = true)
    private Telemetry telemetry;

    /**
     * Threat level assessment from AI.
     * Values: "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"
     */
    @Column(name = "threat_level", length = 50)
    private String threatLevel;

    /**
     * AI-recommended tactical decision or action.
     * Example: "MONITOR", "EVADE", "ENGAGE", "REQUEST_BACKUP", "INVESTIGATE"
     */
    @Column(name = "decision", columnDefinition = "TEXT")
    private String decision;

    /**
     * Detailed reasoning and explanation for the AI's analysis.
     * Contains the full context and justification for the threat assessment.
     */
    @Column(name = "reasoning", columnDefinition = "TEXT")
    private String reasoning;

    /**
     * Confidence score of the AI analysis (0.0 - 1.0).
     */
    @Column(name = "confidence")
    private Double confidence;

    /**
     * Raw JSON response from the AI service for debugging/audit.
     */
    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    /**
     * Timestamp when the analysis was completed.
     */
    @CreationTimestamp
    @Column(name = "analyzed_at", updatable = false)
    private LocalDateTime analyzedAt;
}
