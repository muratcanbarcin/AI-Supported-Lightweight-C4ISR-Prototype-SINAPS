package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.AiAnalysis;
import com.sinaps.c4isr_backend.repository.AiAnalysisRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ============================================================================
 * AI Analysis Controller - AI-Generated Threat Assessments
 * ============================================================================
 *
 * Provides REST endpoints for querying AI analysis results.
 *
 * Endpoints:
 * - GET /api/v1/ai-analyses            → All analyses (optionally filtered by isAlert=true)
 * - GET /api/v1/ai-analyses/tactical   → Past AI recommendations (tactical log)
 * ============================================================================
 */
@RestController
@RequestMapping("/api/v1/ai-analyses")
public class AiAnalysisController {

    private final AiAnalysisRepository aiAnalysisRepository;

    public AiAnalysisController(AiAnalysisRepository aiAnalysisRepository) {
        this.aiAnalysisRepository = aiAnalysisRepository;
    }

    /**
     * Fetch all AI analyses (most recent first).
     * When isAlert=true is provided, returns only records flagged as alerts.
     *
     * GET /api/v1/ai-analyses
     * GET /api/v1/ai-analyses?isAlert=true
     */
    @GetMapping
    public ResponseEntity<List<AiAnalysis>> getAnalyses(
            @RequestParam(required = false) Boolean isAlert) {

        List<AiAnalysis> analyses;
        if (Boolean.TRUE.equals(isAlert)) {
            analyses = aiAnalysisRepository.findByIsAlertTrueOrderByCreatedAtDesc();
        } else {
            analyses = aiAnalysisRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(analyses);
    }

    /**
     * Fetch past AI tactical recommendations (all analyses with recommendations).
     * Used by the tactical log / history page.
     *
     * GET /api/v1/ai-analyses/tactical
     */
    @GetMapping("/tactical")
    public ResponseEntity<List<AiAnalysis>> getTacticalRecommendations() {
        List<AiAnalysis> analyses = aiAnalysisRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(analyses);
    }

    /**
     * Create a new AI analysis record.
     *
     * POST /api/v1/ai-analyses
     * Request body (JSON):
     * {
     *   "assetId": "DRONE-001",
     *   "threatLevel": "HIGH",
     *   "recommendation": "Immediate evasive action recommended",
     *   "isAlert": true
     * }
     */
    @PostMapping
    public ResponseEntity<AiAnalysis> createAnalysis(@RequestBody AiAnalysis analysis) {
        if (analysis.getIsAlert() == null) {
            analysis.setIsAlert(false);
        }
        AiAnalysis saved = aiAnalysisRepository.save(analysis);
        return ResponseEntity.ok(saved);
    }
}
