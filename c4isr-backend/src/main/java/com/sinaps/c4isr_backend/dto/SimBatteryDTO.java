package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the battery object from the UAV simulator.
 * 
 * Example JSON:
 * {
 *   "soc_pct": 74.2
 * }
 */
public record SimBatteryDTO(
    @JsonProperty("soc_pct") double socPct
) {}
