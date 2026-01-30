package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the response from the Python AI Microservice.
 * 
 * Expected JSON response format from http://localhost:8000/analyze:
 * {
 *   "threat_level": "MEDIUM",
 *   "decision": "MONITOR",
 *   "reasoning": "Asset is operating within normal parameters but elevated speed detected...",
 *   "confidence": 0.85
 * }
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AIAnalysisResult(
        @JsonProperty("threat_level") String threatLevel,
        @JsonProperty("decision") String decision,
        @JsonProperty("reasoning") String reasoning,
        @JsonProperty("confidence") Double confidence
) {
    /**
     * Factory method for creating an error/fallback result.
     */
    public static AIAnalysisResult errorResult(String errorMessage) {
        return new AIAnalysisResult(
                "UNKNOWN",
                "ERROR",
                "AI analysis failed: " + errorMessage,
                0.0
        );
    }
}
