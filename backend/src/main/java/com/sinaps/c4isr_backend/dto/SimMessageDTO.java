package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO representing the top-level message from the UAV simulator.
 * 
 * Now includes optional _middleware field injected by the Edge AI Middleware
 * for classification data (NORMAL, SUSPICIOUS, CRITICAL).
 * 
 * Example JSON:
 * {
 * "domain": "drone",
 * "type": "telemetry",
 * "id": "drone1",
 * "time": "2025-01-18T10:00:00.123Z",
 * "payload": { ... },
 * "_middleware": {
 *   "classification": "CRITICAL",
 *   "reason": "RULE: HEART_RATE=179 > 150",
 *   "processed_at": "2026-02-16T12:20:05.123Z"
 * }
 * }
 */
public record SimMessageDTO(
        String domain,
        String type,
        String id,
        String time,
        @JsonProperty("payload") SimPayloadDTO payload,
        @JsonProperty("_middleware") Map<String, Object> middleware) {
}
