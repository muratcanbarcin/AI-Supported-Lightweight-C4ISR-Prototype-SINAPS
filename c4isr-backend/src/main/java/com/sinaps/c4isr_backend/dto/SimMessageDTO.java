package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the top-level message from the UAV simulator.
 * 
 * Example JSON:
 * {
 *   "domain": "drone",
 *   "type": "telemetry",
 *   "id": "drone1",
 *   "time": "2025-01-18T10:00:00.123Z",
 *   "payload": {
 *     "position": { ... },
 *     "yaw_deg": 266.2,
 *     "ground_speed_mps": 13.4,
 *     "mode": "AUTO",
 *     "battery": { ... }
 *   }
 * }
 */
public record SimMessageDTO(
    String domain,
    String type,
    String id,
    String time,
    @JsonProperty("payload") SimPayloadDTO payload
) {}
