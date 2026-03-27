package com.sinaps.c4isr_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSystemStatusResponse {
    private String status;
    private long activeUsers;
    private long totalAssets;
    private long activeTasks;
    private long totalZones;
}
