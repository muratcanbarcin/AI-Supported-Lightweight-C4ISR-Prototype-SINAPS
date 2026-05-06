package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * ============================================================================
 * Alert Service - Tactical Warning Management
 * ============================================================================
 * 
 * Manages operational alerts generated from:
 * - AI tactical analysis (threat detection)
 * - Telemetry anomalies (battery low, vitals abnormal, etc.)
 * - System events (connection lost, etc.)
 * 
 * Alerts are stored in memory and can be retrieved via REST API.
 * ============================================================================
 */
@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final ObjectMapper objectMapper;
    
    // In-memory alert storage (could be replaced with DB persistence)
    private final Map<Long, Alert> alerts = new ConcurrentHashMap<>();
    private final AtomicLong alertIdGenerator = new AtomicLong(1);
    
    // Maximum alerts to keep in memory
    private static final int MAX_ALERTS = 500;

    public AlertService() {
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void seedDemoOperationalAlerts() {
        if (!alerts.isEmpty()) {
            return;
        }
        createTelemetryAlert("161-FILO-YARASA-TB2-01", "LOW_BATTERY",
                "SINAPS_DEMO — Batarya %22 altına indi; üs rotası önerilir.", Map.of("batteryPct", 21));
        createTelemetryAlert("TCG-ANADOLU-L400", "SIGNAL_LOSS",
                "SINAPS_DEMO — UHF bağlantısı zayıf; anten hizalaması kontrol edin.", Map.of("snrDb", -18));
        createAlert("HOSTILE_DETECTED", "PENCE-KIRPI-01",
                "SINAPS_DEMO — Sensör füzyonu şüpheli kara hareketi bildirdi.", "WARNING", Map.of("grid", "37.2N 43.4E"));
        createAlertFromAnalysis("MAVI-TB2-01", "DRONE", "HIGH",
                "SINAPS_DEMO — Mavi Vatan bölgesinde öncelikli keşif", "Otonom devriye", 0.78);
        createAlert("INTRUSION", "AKSUNGUR-DZKK-01",
                "SINAPS_DEMO — Geofence ihlali riski; operatör onayı bekleniyor.", "CRITICAL",
                Map.of("zone", "MAVI_VATAN"));
        log.info("[ALERT] Demo operasyonel uyarılar yüklendi ({} adet).", alerts.size());
    }

    /**
     * Create a new alert.
     * 
     * @param alertType Type of alert (THREAT_HIGH, BATTERY_LOW, VITALS_ABNORMAL, etc.)
     * @param sourceId Asset ID that triggered the alert
     * @param message Human-readable alert message
     * @param severity Alert severity (CRITICAL, WARNING, INFO)
     * @param metadata Additional context data
     * @return Created alert
     */
    public Alert createAlert(String alertType, String sourceId, String message, 
                             String severity, Map<String, Object> metadata) {
        
        long id = alertIdGenerator.getAndIncrement();
        
        Alert alert = new Alert();
        alert.setId(id);
        alert.setType(alertType);
        alert.setSourceId(sourceId);
        alert.setMessage(message);
        alert.setSeverity(severity);
        alert.setTimestamp(LocalDateTime.now());
        alert.setAcknowledged(false);
        alert.setMetadata(metadata);
        
        // Add to storage
        alerts.put(id, alert);
        
        // Cleanup old alerts if necessary
        if (alerts.size() > MAX_ALERTS) {
            cleanupOldAlerts();
        }
        
        log.info("[ALERT] Created: {} - {} - {} (severity: {})", 
            id, alertType, sourceId, severity);
        
        return alert;
    }

    /**
     * Create alert from AI analysis result.
     */
    public Alert createAlertFromAnalysis(String sourceId, String sourceType,
                                         String threatLevel, String decision, 
                                         String reasoning, Double confidence) {
        
        String alertType = "THREAT_" + threatLevel.toUpperCase();
        String severity = mapThreatToSeverity(threatLevel);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("sourceType", sourceType);
        metadata.put("threatLevel", threatLevel);
        metadata.put("reasoning", reasoning != null ? reasoning : "");
        metadata.put("confidence", confidence != null ? confidence : 0.0);
        metadata.put("analysisType", "AI_TACTICAL");
        
        return createAlert(alertType, sourceId, decision, severity, metadata);
    }

    /**
     * Create alert from telemetry anomaly.
     */
    public Alert createTelemetryAlert(String sourceId, String alertType, 
                                      String message, Map<String, Object> telemetryData) {
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("telemetryData", telemetryData);
        metadata.put("analysisType", "TELEMETRY_ANOMALY");
        
        String severity = determineAnomalySeverity(alertType);
        
        return createAlert(alertType, sourceId, message, severity, metadata);
    }

    /**
     * Get all alerts (most recent first).
     */
    public List<Alert> getAllAlerts() {
        List<Alert> allAlerts = new ArrayList<>(alerts.values());
        allAlerts.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return allAlerts;
    }

    /**
     * Get alerts by severity.
     */
    public List<Alert> getAlertsBySeverity(String severity) {
        return alerts.values().stream()
            .filter(a -> a.getSeverity().equalsIgnoreCase(severity))
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .toList();
    }

    /**
     * Get alerts for a specific asset.
     */
    public List<Alert> getAlertsForAsset(String sourceId) {
        return alerts.values().stream()
            .filter(a -> a.getSourceId().equals(sourceId))
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .toList();
    }

    /**
     * Get unacknowledged alerts.
     */
    public List<Alert> getUnacknowledgedAlerts() {
        return alerts.values().stream()
            .filter(a -> !a.isAcknowledged())
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .toList();
    }

    /**
     * Acknowledge an alert.
     */
    public boolean acknowledgeAlert(Long alertId) {
        Alert alert = alerts.get(alertId);
        if (alert != null) {
            alert.setAcknowledged(true);
            alert.setAcknowledgedAt(LocalDateTime.now());
            log.info("[ALERT] Acknowledged: {}", alertId);
            return true;
        }
        return false;
    }

    /**
     * Delete an alert.
     */
    public boolean deleteAlert(Long alertId) {
        Alert removed = alerts.remove(alertId);
        if (removed != null) {
            log.info("[ALERT] Deleted: {}", alertId);
            return true;
        }
        return false;
    }

    /**
     * Get alert statistics.
     */
    public Map<String, Object> getAlertStats() {
        long total = alerts.size();
        long critical = alerts.values().stream()
            .filter(a -> "CRITICAL".equals(a.getSeverity())).count();
        long warning = alerts.values().stream()
            .filter(a -> "WARNING".equals(a.getSeverity())).count();
        long info = alerts.values().stream()
            .filter(a -> "INFO".equals(a.getSeverity())).count();
        long unacknowledged = alerts.values().stream()
            .filter(a -> !a.isAcknowledged()).count();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("critical", critical);
        stats.put("warning", warning);
        stats.put("info", info);
        stats.put("unacknowledged", unacknowledged);
        
        return stats;
    }

    /**
     * Convert alerts to JSON-compatible format.
     */
    public List<JsonNode> getAlertsAsJson() {
        List<JsonNode> result = new ArrayList<>();
        for (Alert alert : getAllAlerts()) {
            ObjectNode node = objectMapper.createObjectNode();
            node.put("id", alert.getId());
            node.put("type", alert.getType());
            node.put("sourceId", alert.getSourceId());
            node.put("message", alert.getMessage());
            node.put("severity", alert.getSeverity());
            node.put("timestamp", alert.getTimestamp().toString());
            node.put("acknowledged", alert.isAcknowledged());
            if (alert.getMetadata() != null) {
                node.set("metadata", objectMapper.valueToTree(alert.getMetadata()));
            }
            result.add(node);
        }
        return result;
    }

    // ========================================================================
    // Private helper methods
    // ========================================================================

    private String mapThreatToSeverity(String threatLevel) {
        if (threatLevel == null) return "INFO";
        return switch (threatLevel.toUpperCase()) {
            case "CRITICAL" -> "CRITICAL";
            case "HIGH" -> "WARNING";
            case "MEDIUM" -> "INFO";
            default -> "INFO";
        };
    }

    private String determineAnomalySeverity(String alertType) {
        if (alertType == null) return "INFO";
        if (alertType.contains("CRITICAL") || alertType.contains("EMERGENCY")) {
            return "CRITICAL";
        } else if (alertType.contains("WARNING") || alertType.contains("LOW")) {
            return "WARNING";
        }
        return "INFO";
    }

    private void cleanupOldAlerts() {
        // Remove oldest acknowledged alerts first
        List<Long> toRemove = alerts.entrySet().stream()
            .filter(e -> e.getValue().isAcknowledged())
            .sorted(Comparator.comparing(e -> e.getValue().getTimestamp()))
            .limit(100)
            .map(Map.Entry::getKey)
            .toList();
        
        toRemove.forEach(alerts::remove);
        log.info("[ALERT] Cleaned up {} old alerts", toRemove.size());
    }

    // ========================================================================
    // Alert model class
    // ========================================================================

    public static class Alert {
        private Long id;
        private String type;
        private String sourceId;
        private String message;
        private String severity;
        private LocalDateTime timestamp;
        private boolean acknowledged;
        private LocalDateTime acknowledgedAt;
        private Map<String, Object> metadata;

        // Getters and Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getSourceId() { return sourceId; }
        public void setSourceId(String sourceId) { this.sourceId = sourceId; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public boolean isAcknowledged() { return acknowledged; }
        public void setAcknowledged(boolean acknowledged) { this.acknowledged = acknowledged; }
        
        public LocalDateTime getAcknowledgedAt() { return acknowledgedAt; }
        public void setAcknowledgedAt(LocalDateTime acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
}
