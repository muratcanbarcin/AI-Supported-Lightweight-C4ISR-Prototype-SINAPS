package com.sinaps.c4isr_backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing the position object from the UAV simulator.
 * 
 * Example JSON:
 * {
 *   "lat": 38.4237,
 *   "lon": 27.1428,
 *   "alt_m": 120.5
 * }
 */
public record SimPositionDTO(
    double lat,
    double lon,
    @JsonProperty("alt_m") double altM
) {}
