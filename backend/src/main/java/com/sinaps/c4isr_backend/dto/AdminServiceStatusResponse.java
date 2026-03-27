package com.sinaps.c4isr_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminServiceStatusResponse {
    private String backend;
    private String database;
    private String aiService;
    private String mqttBroker;
    private String dockerEngine;
    private LocalDateTime checkedAt;
}
