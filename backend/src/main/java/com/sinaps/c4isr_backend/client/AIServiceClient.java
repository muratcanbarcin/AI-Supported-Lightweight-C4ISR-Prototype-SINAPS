package com.sinaps.c4isr_backend.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.dto.AIAnalysisResult;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * AI Service Client - Communicates with Python AI Microservice using WebClient (Reactive/Non-blocking).
 * 
 * This client handles:
 * - Converting Java Telemetry entities to Python-expected snake_case JSON
 * - Polymorphic data mapping based on asset type (DRONE, SOLDIER, VEHICLE)
 * - Non-blocking HTTP communication with retry and timeout support
 * - Graceful error handling to prevent transaction failures
 * 
 * Python AI Service Endpoint: http://localhost:8000/analyze
 */
@Component
public class AIServiceClient {

    private static final Logger log = LoggerFactory.getLogger(AIServiceClient.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    /**
     * Constructor with configurable AI service URL.
     * 
     * @param aiServiceUrl The base URL of the AI service (default: http://localhost:8000)
     */
    public AIServiceClient(
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl,
            WebClient.Builder webClientBuilder
    ) {
        this.webClient = webClientBuilder
                .baseUrl(aiServiceUrl)
                .build();
        this.objectMapper = new ObjectMapper();
        log.info("AIServiceClient initialized with base URL: {}", aiServiceUrl);
    }

    /**
     * Analyze telemetry data asynchronously using the Python AI service.
     * 
     * This method:
     * 1. Maps the Java Telemetry entity to Python-expected JSON format
     * 2. Sends a non-blocking POST request to the /analyze endpoint
     * 3. Returns a Mono<AIAnalysisResult> that can be subscribed to
     * 
     * @param telemetry The telemetry entity to analyze
     * @return Mono<AIAnalysisResult> containing the AI analysis result
     */
    public Mono<AIAnalysisResult> analyzeAsync(Telemetry telemetry) {
        try {
            // 1. Map telemetry to Python-expected JSON structure
            Map<String, Object> telemetryData = mapTelemetryToAIRequest(telemetry);
            
            // 2. CRITICAL: Wrap telemetry in AnalysisRequest wrapper
            // Python expects: { "telemetry": {...}, "include_context": true, "max_context_items": 3 }
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("telemetry", telemetryData);
            requestBody.put("include_context", true);
            requestBody.put("max_context_items", 3);
            
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            log.info("Sending AI analysis request for telemetry ID: {} | Type: {} | Body: {}", 
                    telemetry.getId(), telemetry.getSourceType(), jsonBody);

            // 3. Make non-blocking POST request
            return webClient.post()
                    .uri("/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(AIAnalysisResult.class)
                    .timeout(Duration.ofSeconds(30))
                    .retryWhen(Retry.backoff(2, Duration.ofMillis(500))
                            .filter(this::isRetryableError)
                            .doBeforeRetry(signal -> 
                                log.warn("Retrying AI request, attempt: {}", signal.totalRetries() + 1)))
                    .doOnSuccess(result -> 
                            log.info("AI analysis completed for telemetry ID: {} | Threat: {} | Decision: {}", 
                                    telemetry.getId(), result.threatLevel(), result.decision()))
                    .doOnError(error -> 
                            log.error("AI analysis failed for telemetry ID: {} | Error: {}", 
                                    telemetry.getId(), error.getMessage()))
                    .onErrorResume(error -> {
                        // Return error result instead of propagating exception
                        log.error("AI service unavailable, returning error result", error);
                        return Mono.just(AIAnalysisResult.errorResult(error.getMessage()));
                    });

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize telemetry for AI request: {}", e.getMessage());
            return Mono.just(AIAnalysisResult.errorResult("JSON serialization failed: " + e.getMessage()));
        }
    }

    /**
     * Maps a Java Telemetry entity to the Python AI service expected JSON format.
     * 
     * CRITICAL: Python expects EXACT field names matching Pydantic models:
     * 
     * - DroneTelemetry: type, source_id, timestamp, latitude, longitude, altitude, speed, battery_level, mode
     * - SoldierTelemetry: type, source_id, timestamp, latitude, longitude, vitals{hr_bpm, spo2}, status
     * - VehicleTelemetry: type, source_id, timestamp, latitude, longitude, speed, fuel_pct, vehicle_type
     * 
     * @param telemetry The telemetry entity to map
     * @return Map representing the JSON structure for Python
     */
    private Map<String, Object> mapTelemetryToAIRequest(Telemetry telemetry) {
        Map<String, Object> request = new HashMap<>();
        
        // ========== COMMON REQUIRED FIELDS ==========
        request.put("source_id", telemetry.getSourceId());
        request.put("timestamp", telemetry.getTimestamp() != null 
                ? telemetry.getTimestamp().toString() 
                : java.time.Instant.now().toString());
        
        // Location: Python expects latitude/longitude at ROOT level, NOT nested!
        if (telemetry.getLocation() != null) {
            request.put("latitude", telemetry.getLocation().getY());  // Y = latitude
            request.put("longitude", telemetry.getLocation().getX()); // X = longitude
        } else {
            // Default values if location is missing (required by Pydantic)
            request.put("latitude", 0.0);
            request.put("longitude", 0.0);
        }

        // Extract payload data
        Map<String, Object> payload = telemetry.getPayload();
        if (payload == null) {
            payload = new HashMap<>();
        }

        // ========== POLYMORPHIC MAPPING BASED ON SOURCE TYPE ==========
        AssetType assetType = telemetry.getSourceType();
        if (assetType == null) {
            assetType = AssetType.SENSOR;
        }

        switch (assetType) {
            case DRONE:
                mapDroneTelemetry(request, telemetry, payload);
                break;

            case SOLDIER:
                mapSoldierTelemetry(request, telemetry, payload);
                break;

            case VEHICLE:
                mapVehicleTelemetry(request, telemetry, payload);
                break;

            default:
                // Fallback: try to determine from payload or use generic
                request.put("type", "drone"); // Default to drone as safest
                mapDroneTelemetry(request, telemetry, payload);
                break;
        }

        log.debug("Mapped telemetry ID: {} | Type: {} | Request: {}", 
                telemetry.getId(), request.get("type"), request);
        return request;
    }

    /**
     * Maps DRONE telemetry to Python DroneTelemetry schema.
     * Required fields: type, source_id, timestamp, latitude, longitude, altitude, battery_level
     */
    private void mapDroneTelemetry(Map<String, Object> request, Telemetry telemetry, Map<String, Object> payload) {
        request.put("type", "drone");
        
        // Required fields
        request.put("altitude", telemetry.getAltitude() != null ? telemetry.getAltitude() : 0.0);
        request.put("battery_level", telemetry.getBatteryLevel() != null ? telemetry.getBatteryLevel() : 100.0);
        
        // Optional fields
        request.put("speed", telemetry.getSpeed() != null ? telemetry.getSpeed() : 0.0);
        request.put("mode", payload.getOrDefault("mode", "AUTO"));
        
        // Heading from yawDeg if available
        if (payload.containsKey("yawDeg")) {
            request.put("heading_deg", payload.get("yawDeg"));
        } else if (payload.containsKey("yaw_deg")) {
            request.put("heading_deg", payload.get("yaw_deg"));
        }
    }

    /**
     * Maps SOLDIER telemetry to Python SoldierTelemetry schema.
     * Required fields: type, source_id, timestamp, latitude, longitude, vitals{hr_bpm, spo2}
     */
    private void mapSoldierTelemetry(Map<String, Object> request, Telemetry telemetry, Map<String, Object> payload) {
        request.put("type", "soldier");
        
        // Build vitals object - Python expects: hr_bpm (int), spo2 (float)
        Map<String, Object> vitals = new HashMap<>();
        
        // Extract vitals from payload
        Object payloadVitals = payload.get("vitals");
        if (payloadVitals instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> vitalsMap = (Map<String, Object>) payloadVitals;
            
            // Map heart rate: hrBpm or heartRateBpm -> hr_bpm
            Number hrBpm = extractNumber(vitalsMap, "hrBpm", "heartRateBpm", "hr_bpm", "heart_rate_bpm");
            vitals.put("hr_bpm", hrBpm != null ? hrBpm.intValue() : 75);
            
            // Map SpO2: spo2 or spo2_pct or spO2 -> spo2
            Number spo2 = extractNumber(vitalsMap, "spo2", "spo2_pct", "spO2", "oxygen");
            vitals.put("spo2", spo2 != null ? spo2.doubleValue() : 98.0);
            
            // Optional vitals fields
            Number respBpm = extractNumber(vitalsMap, "respBpm", "respirationRate", "resp_bpm");
            if (respBpm != null) {
                vitals.put("resp_bpm", respBpm.doubleValue());
            }
            
            Number skinTemp = extractNumber(vitalsMap, "skinTempC", "skin_temp_c", "temperature");
            if (skinTemp != null) {
                vitals.put("skin_temp_c", skinTemp.doubleValue());
            }
            
            Number stressIndex = extractNumber(vitalsMap, "stressIdx", "stress_index", "stress");
            if (stressIndex != null) {
                vitals.put("stress_index", stressIndex.doubleValue());
            }
        } else {
            // Default vitals if not provided
            vitals.put("hr_bpm", 75);
            vitals.put("spo2", 98.0);
        }
        
        request.put("vitals", vitals);
        
        // Status field
        request.put("status", determineStatus(telemetry, payload));
        
        // Optional fields
        if (payload.containsKey("unit_id") || payload.containsKey("unitId")) {
            request.put("unit_id", payload.getOrDefault("unit_id", payload.get("unitId")));
        }
        if (payload.containsKey("callsign")) {
            request.put("callsign", payload.get("callsign"));
        }
    }

    /**
     * Maps VEHICLE telemetry to Python VehicleTelemetry schema.
     * Required fields: type, source_id, timestamp, latitude, longitude, fuel_pct
     */
    private void mapVehicleTelemetry(Map<String, Object> request, Telemetry telemetry, Map<String, Object> payload) {
        request.put("type", "vehicle");
        
        // Required: fuel_pct
        Number fuelPct = extractNumber(payload, "fuelPct", "fuel_pct", "fuel");
        if (fuelPct != null) {
            request.put("fuel_pct", fuelPct.doubleValue());
        } else if (telemetry.getBatteryLevel() != null) {
            request.put("fuel_pct", telemetry.getBatteryLevel().doubleValue());
        } else {
            request.put("fuel_pct", 100.0);
        }
        
        // Speed
        request.put("speed", telemetry.getSpeed() != null ? telemetry.getSpeed() : 0.0);
        
        // Vehicle type: must match VehicleType enum (TANK, APC, TRUCK, HUMVEE, OTHER)
        String vehicleType = extractString(payload, "vehicleType", "vehicle_type", "type");
        if (vehicleType != null) {
            // Normalize to uppercase for enum matching
            request.put("vehicle_type", vehicleType.toUpperCase());
        } else {
            request.put("vehicle_type", "APC"); // Default
        }
        
        // Optional fields
        Number healthPct = extractNumber(payload, "healthPct", "health_pct");
        if (healthPct != null) {
            request.put("health_pct", healthPct.doubleValue());
        }
        
        String engineStatus = extractString(payload, "engine", "engineStatus", "engine_status");
        if (engineStatus != null) {
            request.put("engine_status", engineStatus);
        }
    }

    /**
     * Extracts a Number from a map trying multiple possible keys.
     */
    private Number extractNumber(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key)) {
                Object value = map.get(key);
                if (value instanceof Number) {
                    return (Number) value;
                }
                if (value instanceof String) {
                    try {
                        return Double.parseDouble((String) value);
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return null;
    }

    /**
     * Extracts a String from a map trying multiple possible keys.
     */
    private String extractString(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key)) {
                Object value = map.get(key);
                return value != null ? String.valueOf(value) : null;
            }
        }
        return null;
    }

    /**
     * Determine status string from telemetry and payload data.
     * Used primarily for soldier type telemetry.
     */
    private String determineStatus(Telemetry telemetry, Map<String, Object> payload) {
        if (payload == null) {
            return "UNKNOWN";
        }

        // Try to extract status from various possible fields
        if (payload.containsKey("status")) {
            return String.valueOf(payload.get("status"));
        }
        
        // Infer from vitals if available
        Object vitals = payload.get("vitals");
        if (vitals instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> vitalsMap = (Map<String, Object>) vitals;
            if (vitalsMap.containsKey("status")) {
                return String.valueOf(vitalsMap.get("status"));
            }
            // Check heart rate for status inference
            if (vitalsMap.containsKey("heart_rate_bpm") || vitalsMap.containsKey("heartRateBpm")) {
                Number heartRate = (Number) vitalsMap.getOrDefault("heart_rate_bpm", 
                        vitalsMap.get("heartRateBpm"));
                if (heartRate != null) {
                    int hr = heartRate.intValue();
                    if (hr == 0) return "CRITICAL";
                    if (hr < 50 || hr > 150) return "ALERT";
                    return "NOMINAL";
                }
            }
        }

        return "ACTIVE";
    }

    /**
     * Determines if an error should trigger a retry.
     * Only retry on connection errors, not on 4xx client errors.
     */
    private boolean isRetryableError(Throwable throwable) {
        if (throwable instanceof WebClientResponseException wcre) {
            // Don't retry on 4xx errors (client errors)
            return wcre.getStatusCode().is5xxServerError();
        }
        // Retry on connection errors
        return true;
    }

    /**
     * Send a conversational chat query to the AI service (RAG-augmented).
     * 
     * This method forwards the user's question to the Python AI microservice's
     * /chat endpoint, which performs RAG retrieval + Gemma generation.
     *
     * @param query The user's question
     * @return Mono<Map> containing { response, cited_rule, rag_hits, processing_time_ms }
     */
    public Mono<Map<String, Object>> chatAsync(String query) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("query", query);

        log.info("Sending chat request to AI Service: {}", query.length() > 80 ? query.substring(0, 80) + "..." : query);

        return webClient.post()
                .uri("/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(120)) // Chat + RAG + LLM can take longer
                .map(body -> {
                    try {
                        return objectMapper.readValue(body,
                                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    } catch (Exception e) {
                        Map<String, Object> fallback = new HashMap<>();
                        fallback.put("response", body);
                        fallback.put("cited_rule", "");
                        fallback.put("rag_hits", 0);
                        fallback.put("processing_time_ms", 0.0);
                        return fallback;
                    }
                })
                .doOnSuccess(result ->
                        log.info("Chat response received, rag_hits: {}, processing_time: {}ms",
                                result.get("rag_hits"), result.get("processing_time_ms")))
                .doOnError(error ->
                        log.error("Chat request failed: {}", error.getMessage()))
                .onErrorResume(error -> {
                    Map<String, Object> errorResult = new HashMap<>();
                    errorResult.put("response",
                            "AI servisi su anda yanit veremiyor. Hata: " + error.getMessage());
                    errorResult.put("cited_rule", "");
                    errorResult.put("rag_hits", 0);
                    errorResult.put("processing_time_ms", 0.0);
                    return Mono.just(errorResult);
                });
    }

    /**
     * Health check for the AI service.
     * 
     * @return Mono<Boolean> true if service is available
     */
    public Mono<Boolean> healthCheck() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .timeout(Duration.ofSeconds(5))
                .onErrorReturn(false);
    }
}
