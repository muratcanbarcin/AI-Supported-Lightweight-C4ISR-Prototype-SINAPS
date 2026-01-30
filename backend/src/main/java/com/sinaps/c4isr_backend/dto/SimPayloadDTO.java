package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the payload object from the UAV simulator.
 * 
 * Example JSON:
 * {
 * "position": {
 * "lat": 38.4237,
 * "lon": 27.1428,
 * "alt_m": 120.5
 * },
 * "yaw_deg": 266.2,
 * "ground_speed_mps": 13.4,
 * "mode": "AUTO",
 * "battery": {
 * "soc_pct": 74.2
 * }
 * }
 */
public record SimPayloadDTO(
        SimPositionDTO position,
        @JsonProperty("yaw_deg") double yawDeg,
        @JsonProperty("ground_speed_mps") Double groundSpeedMps, // Nullable for non-drones
        @JsonProperty("speed_kph") Double speedKph, // Vehicle/Soldier speed
        String mode,
        SimBatteryDTO battery,

        // Vehicle specifics
        String engine,
        @JsonProperty("fuel_pct") Double fuelPct,
        @JsonProperty("health_pct") Double healthPct,

        // Soldier specifics
        String soldier_id,
        String unit_id,
        String collected_at,
        Object vitals, // Keep as Object or create DTO
        Object device, // Keep as Object or create DTO

        // AI/Fusion Fields
        @JsonProperty("alignment") String alignment, // FRIEND, FOE, NEUTRAL
        @JsonProperty("threat_level") Integer threatLevel, // 0-100

        // Common
        String type) {
}
