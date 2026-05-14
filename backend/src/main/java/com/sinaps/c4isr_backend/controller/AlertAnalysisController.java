package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.TacticalAnalysis;
import com.sinaps.c4isr_backend.repository.TacticalAnalysisRepository;
import com.sinaps.c4isr_backend.service.AlertService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ============================================================================
 * Alert & Analysis Controller - Tactical Situational Awareness
 * ============================================================================
 * 
 * Provides REST endpoints for:
 * - Alerts (warnings from AI analysis and telemetry anomalies)
 * - Tactical Analysis results (AI assessments per asset)
 * 
 * Used by frontend pages:
 * - /alerts - Alert list and management
 * - /analysis - Tactical analysis dashboard
 * - /assets/:id - Asset profile with analysis history
 * ============================================================================
 */
@Tag(
    name = "Alerts & Tactical Analysis",
    description = "Uyarı (alert) ve taktik analiz sorguları. Uyarılar AI analizi ve telemetri anomalilerinden üretilir; " +
                  "taktik analizler asset bazlı AI değerlendirmeleridir."
)
@RestController
@RequestMapping("/api/v1")
public class AlertAnalysisController {

    private final AlertService alertService;
    private final TacticalAnalysisRepository analysisRepository;

    public AlertAnalysisController(AlertService alertService, 
                                   TacticalAnalysisRepository analysisRepository) {
        this.alertService = alertService;
        this.analysisRepository = analysisRepository;
    }

    // ========================================================================
    // ALERT ENDPOINTS
    // ========================================================================

    /**
     * Get all alerts (most recent first).
     * Endpoint: GET /api/v1/alerts
     */
    @Operation(summary = "Tüm uyarıları listele")
    @GetMapping("/alerts")
    public ResponseEntity<List<Map<String, Object>>> getAllAlerts() {
        List<AlertService.Alert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(convertAlertsToMaps(alerts));
    }

    /**
     * Get unacknowledged alerts.
     * Endpoint: GET /api/v1/alerts/unacknowledged
     */
    @Operation(summary = "Acknowledge edilmemiş uyarılar")
    @GetMapping("/alerts/unacknowledged")
    public ResponseEntity<List<Map<String, Object>>> getUnacknowledgedAlerts() {
        List<AlertService.Alert> alerts = alertService.getUnacknowledgedAlerts();
        return ResponseEntity.ok(convertAlertsToMaps(alerts));
    }

    /**
     * Get alerts for a specific asset.
     * Endpoint: GET /api/v1/alerts/asset/{sourceId}
     */
    @Operation(summary = "Belirli bir asset için uyarılar")
    @GetMapping("/alerts/asset/{sourceId}")
    public ResponseEntity<List<Map<String, Object>>> getAlertsForAsset(@PathVariable String sourceId) {
        List<AlertService.Alert> alerts = alertService.getAlertsForAsset(sourceId);
        return ResponseEntity.ok(convertAlertsToMaps(alerts));
    }

    /**
     * Get alert statistics.
     * Endpoint: GET /api/v1/alerts/stats
     */
    @Operation(summary = "Uyarı istatistikleri (toplam, ack/unack vb.)")
    @GetMapping("/alerts/stats")
    public ResponseEntity<Map<String, Object>> getAlertStats() {
        return ResponseEntity.ok(alertService.getAlertStats());
    }

    /**
     * Acknowledge an alert.
     * Endpoint: POST /api/v1/alerts/{id}/acknowledge
     */
    @Operation(summary = "Uyarıyı acknowledge et", description = "Uyarıyı görüldü/onaylandı olarak işaretler.")
    @PostMapping("/alerts/{id}/acknowledge")
    public ResponseEntity<Map<String, Object>> acknowledgeAlert(@PathVariable Long id) {
        boolean success = alertService.acknowledgeAlert(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("alertId", id);
        if (!success) {
            response.put("error", "Alert not found");
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an alert.
     * Endpoint: DELETE /api/v1/alerts/{id}
     */
    @Operation(summary = "Uyarıyı sil")
    @DeleteMapping("/alerts/{id}")
    public ResponseEntity<Map<String, Object>> deleteAlert(@PathVariable Long id) {
        boolean success = alertService.deleteAlert(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("alertId", id);
        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // TACTICAL ANALYSIS ENDPOINTS
    // ========================================================================

    /**
     * Get all tactical analyses (most recent first).
     * Endpoint: GET /api/v1/analysis
     */
    @Operation(summary = "Tüm taktik analizler (en yeniden eskiye)")
    @GetMapping("/analysis")
    public ResponseEntity<List<Map<String, Object>>> getAllAnalyses() {
        List<TacticalAnalysis> analyses = analysisRepository.findAllByOrderByAnalyzedAtDesc();
        return ResponseEntity.ok(convertAnalysesToMaps(analyses));
    }

    /**
     * Get latest analysis for each asset.
     * Endpoint: GET /api/v1/analysis/latest
     */
    @Operation(summary = "Son 50 taktik analiz", description = "Dashboard listesi için yaklaşık 50 satırla sınırlı son analizler.")
    @GetMapping("/analysis/latest")
    public ResponseEntity<List<Map<String, Object>>> getLatestAnalyses() {
        // Get latest 50 analyses
        List<TacticalAnalysis> analyses = analysisRepository.findTop50ByOrderByAnalyzedAtDesc();
        return ResponseEntity.ok(convertAnalysesToMaps(analyses));
    }

    /**
     * Get analysis by ID.
     * Endpoint: GET /api/v1/analysis/{id}
     */
    @Operation(summary = "Taktik analizi ID ile getir")
    @GetMapping("/analysis/{id}")
    public ResponseEntity<Map<String, Object>> getAnalysisById(@PathVariable Long id) {
        return analysisRepository.findById(id)
            .map(analysis -> ResponseEntity.ok(convertAnalysisToMap(analysis)))
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get analyses for a specific asset.
     * Endpoint: GET /api/v1/analysis/asset/{sourceId}
     */
    @Operation(summary = "Belirli asset için taktik analizler")
    @GetMapping("/analysis/asset/{sourceId}")
    public ResponseEntity<List<Map<String, Object>>> getAnalysesForAsset(@PathVariable String sourceId) {
        List<TacticalAnalysis> analyses = analysisRepository.findByTelemetrySourceIdOrderByAnalyzedAtDesc(sourceId);
        return ResponseEntity.ok(convertAnalysesToMaps(analyses));
    }

    /**
     * Get analyses by threat level.
     * Endpoint: GET /api/v1/analysis/threat/{level}
     */
    @Operation(summary = "Tehdit seviyesine göre filtrele", description = "level: NORMAL | SUSPICIOUS | CRITICAL")
    @GetMapping("/analysis/threat/{level}")
    public ResponseEntity<List<Map<String, Object>>> getAnalysesByThreatLevel(@PathVariable String level) {
        List<TacticalAnalysis> analyses = analysisRepository.findByThreatLevelOrderByAnalyzedAtDesc(level.toUpperCase());
        return ResponseEntity.ok(convertAnalysesToMaps(analyses));
    }

    /**
     * Get analysis statistics.
     * Endpoint: GET /api/v1/analysis/stats
     */
    @Operation(summary = "Taktik analiz istatistikleri")
    @GetMapping("/analysis/stats")
    public ResponseEntity<Map<String, Object>> getAnalysisStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", analysisRepository.count());
        stats.put("lastAnalyzedAt", analysisRepository.findTopByOrderByAnalyzedAtDesc()
            .map(a -> a.getAnalyzedAt().toString())
            .orElse(null));
        return ResponseEntity.ok(stats);
    }

    // ========================================================================
    // AI SERVICE STATUS ENDPOINT
    // ========================================================================

    /**
     * Get AI service health status.
     * Endpoint: GET /api/v1/ai/status
     */
    @Operation(summary = "AI servis sağlık durumu (özet)",
               description = "Python AI mikroservisinin URL'i ve durumu. Detaylı health-check için Admin → service-status'a bakın.")
    @GetMapping("/ai/status")
    public ResponseEntity<Map<String, Object>> getAIServiceStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "c4isr-ai");
        status.put("url", "http://localhost:8000");
        // TODO: Add actual health check
        status.put("status", "configured");
        return ResponseEntity.ok(status);
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    private List<Map<String, Object>> convertAlertsToMaps(List<AlertService.Alert> alerts) {
        return alerts.stream()
            .map(this::convertAlertToMap)
            .collect(Collectors.toList());
    }

    private Map<String, Object> convertAlertToMap(AlertService.Alert alert) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", String.valueOf(alert.getId()));
        map.put("type", alert.getType());
        map.put("sourceId", alert.getSourceId());
        map.put("message", alert.getMessage());
        map.put("severity", alert.getSeverity());
        map.put("timestamp", alert.getTimestamp().toString());
        map.put("acknowledged", alert.isAcknowledged());
        // Frontend AlarmDTO uyumu (alarmService.ts)
        map.put("threatType", alert.getType());
        map.put("detectedAt", alert.getTimestamp().toString());
        map.put("isAck", alert.isAcknowledged());
        if (alert.getAcknowledgedAt() != null) {
            map.put("acknowledgedAt", alert.getAcknowledgedAt().toString());
        }
        map.put("metadata", alert.getMetadata());
        return map;
    }

    private List<Map<String, Object>> convertAnalysesToMaps(List<TacticalAnalysis> analyses) {
        return analyses.stream()
            .map(this::convertAnalysisToMap)
            .collect(Collectors.toList());
    }

    private Map<String, Object> convertAnalysisToMap(TacticalAnalysis analysis) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", analysis.getId());
        map.put("threatLevel", analysis.getThreatLevel());
        map.put("decision", analysis.getDecision());
        map.put("reasoning", analysis.getReasoning());
        map.put("confidence", analysis.getConfidence());
        map.put("analyzedAt", analysis.getAnalyzedAt() != null ? analysis.getAnalyzedAt().toString() : null);
        
        // Include telemetry info
        if (analysis.getTelemetry() != null) {
            Map<String, Object> telemetryInfo = new HashMap<>();
            telemetryInfo.put("id", analysis.getTelemetry().getId());
            telemetryInfo.put("sourceId", analysis.getTelemetry().getSourceId());
            telemetryInfo.put("sourceType", analysis.getTelemetry().getSourceType() != null 
                ? analysis.getTelemetry().getSourceType().name() : null);
            telemetryInfo.put("timestamp", analysis.getTelemetry().getTimestamp() != null 
                ? analysis.getTelemetry().getTimestamp().toString() : null);
            map.put("telemetry", telemetryInfo);
        }
        
        return map;
    }
}
