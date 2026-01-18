package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the payload object from the UAV simulator.
 * 
 * Example JSON:
 * {
 *   "position": {
 *     "lat": 38.4237,
 *     "lon": 27.1428,
 *     "alt_m": 120.5
 *   },
 *   "yaw_deg": 266.2,
 *   "ground_speed_mps": 13.4,
 *   "mode": "AUTO",
 *   "battery": {
 *     "soc_pct": 74.2
 *   }
 * }
 */
public record SimPayloadDTO(
    SimPositionDTO position,
    @JsonProperty("yaw_deg") double yawDeg,
    @JsonProperty("ground_speed_mps") double groundSpeedMps,
    String mode,
    SimBatteryDTO battery
) {}
