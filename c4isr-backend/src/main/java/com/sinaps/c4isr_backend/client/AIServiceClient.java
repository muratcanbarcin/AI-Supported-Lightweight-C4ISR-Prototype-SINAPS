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
            Map<String, Object> requestBody = mapTelemetryToAIRequest(telemetry);
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            
            log.debug("Sending AI analysis request for telemetry ID: {} | Type: {} | Body: {}", 
                    telemetry.getId(), telemetry.getSourceType(), jsonBody);

            // 2. Make non-blocking POST request
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
     * CRITICAL: Python expects snake_case keys. This method handles the polymorphic
     * mapping based on asset type:
     * 
     * - DRONE: battery_level, altitude, speed
     * - SOLDIER: vitals, status
     * - VEHICLE: fuel_pct, vehicle_type
     * 
     * @param telemetry The telemetry entity to map
     * @return Map representing the JSON structure for Python
     */
    private Map<String, Object> mapTelemetryToAIRequest(Telemetry telemetry) {
        Map<String, Object> request = new HashMap<>();
        
        // Common fields
        request.put("source_id", telemetry.getSourceId());
        request.put("timestamp", telemetry.getTimestamp() != null ? telemetry.getTimestamp().toString() : null);
        
        // Location data (if available)
        if (telemetry.getLocation() != null) {
            Map<String, Object> position = new HashMap<>();
            position.put("lat", telemetry.getLocation().getY()); // Y = latitude
            position.put("lon", telemetry.getLocation().getX()); // X = longitude
            if (telemetry.getAltitude() != null) {
                position.put("alt_m", telemetry.getAltitude());
            }
            request.put("position", position);
        }

        // Extract payload data for additional fields
        Map<String, Object> payload = telemetry.getPayload();

        // Polymorphic mapping based on asset type
        AssetType type = telemetry.getSourceType();
        if (type == null) {
            type = AssetType.SENSOR; // Default fallback
        }

        switch (type) {
            case DRONE:
                request.put("type", "drone");
                // Drone-specific fields (snake_case for Python)
                request.put("battery_level", telemetry.getBatteryLevel());
                request.put("altitude", telemetry.getAltitude());
                request.put("speed", telemetry.getSpeed());
                
                // Additional drone fields from payload
                if (payload != null) {
                    if (payload.containsKey("yawDeg") || payload.containsKey("yaw_deg")) {
                        request.put("heading", payload.getOrDefault("yawDeg", payload.get("yaw_deg")));
                    }
                    if (payload.containsKey("mode")) {
                        request.put("mode", payload.get("mode"));
                    }
                }
                break;

            case SOLDIER:
                request.put("type", "soldier");
                // Soldier-specific fields
                if (payload != null) {
                    // Extract vitals object
                    if (payload.containsKey("vitals")) {
                        request.put("vitals", payload.get("vitals"));
                    }
                    // Status from device or direct field
                    if (payload.containsKey("device")) {
                        request.put("device", payload.get("device"));
                    }
                    // Soldier ID and unit
                    if (payload.containsKey("soldier_id")) {
                        request.put("soldier_id", payload.get("soldier_id"));
                    }
                    if (payload.containsKey("unit_id")) {
                        request.put("unit_id", payload.get("unit_id"));
                    }
                }
                // Battery as device battery for soldiers
                if (telemetry.getBatteryLevel() != null) {
                    request.put("device_battery_pct", telemetry.getBatteryLevel());
                }
                request.put("status", determineStatus(telemetry, payload));
                break;

            case VEHICLE:
                request.put("type", "vehicle");
                // Vehicle-specific fields (snake_case for Python)
                if (payload != null) {
                    // Fuel percentage
                    if (payload.containsKey("fuelPct") || payload.containsKey("fuel_pct")) {
                        request.put("fuel_pct", payload.getOrDefault("fuelPct", payload.get("fuel_pct")));
                    } else if (telemetry.getBatteryLevel() != null) {
                        // Fallback: battery field sometimes stores fuel for vehicles
                        request.put("fuel_pct", telemetry.getBatteryLevel());
                    }
                    
                    // Vehicle type (tank, apc, etc.)
                    if (payload.containsKey("type")) {
                        request.put("vehicle_type", payload.get("type"));
                    } else if (payload.containsKey("vehicleType")) {
                        request.put("vehicle_type", payload.get("vehicleType"));
                    }
                    
                    // Engine status
                    if (payload.containsKey("engine")) {
                        request.put("engine", payload.get("engine"));
                    }
                    
                    // Health percentage
                    if (payload.containsKey("healthPct") || payload.containsKey("health_pct")) {
                        request.put("health_pct", payload.getOrDefault("healthPct", payload.get("health_pct")));
                    }
                }
                // Speed
                if (telemetry.getSpeed() != null) {
                    request.put("speed", telemetry.getSpeed());
                }
                break;

            default: // SENSOR or unknown types
                request.put("type", "sensor");
                // Include all available data
                if (telemetry.getBatteryLevel() != null) {
                    request.put("battery_level", telemetry.getBatteryLevel());
                }
                if (telemetry.getSpeed() != null) {
                    request.put("speed", telemetry.getSpeed());
                }
                if (telemetry.getAltitude() != null) {
                    request.put("altitude", telemetry.getAltitude());
                }
                // Include full payload for sensor type
                if (payload != null) {
                    request.put("payload", payload);
                }
                break;
        }

        log.debug("Mapped telemetry ID: {} to AI request with type: {}", telemetry.getId(), request.get("type"));
        return request;
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
