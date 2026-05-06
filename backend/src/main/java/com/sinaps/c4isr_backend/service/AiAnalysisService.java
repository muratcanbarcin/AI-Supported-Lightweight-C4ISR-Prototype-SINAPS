package com.sinaps.c4isr_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinaps.c4isr_backend.client.AIServiceClient;
import com.sinaps.c4isr_backend.dto.AIAnalysisResult;
import com.sinaps.c4isr_backend.model.TacticalAnalysis;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.TacticalAnalysisRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Queued Gemma threat analysis — runs only on {@code gemmaExecutor}, never on Tomcat threads.
 */
@Service
@RequiredArgsConstructor
public class AiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisService.class);

    private final TelemetryRepository telemetryRepository;
    private final TacticalAnalysisRepository analysisRepository;
    private final AIServiceClient aiServiceClient;
    private final ObjectMapper objectMapper;

    @Async("gemmaExecutor")
    public void analyzeThreatTelemetry(Long telemetryId) {
        Telemetry telemetry = telemetryRepository.findById(telemetryId).orElse(null);
        if (telemetry == null) {
            log.warn("analyzeThreatTelemetry: telemetry {} not found", telemetryId);
            return;
        }
        try {
            log.debug("Gemma queue: analyzing telemetry id={} source={}", telemetryId, telemetry.getSourceId());
            AIAnalysisResult result = aiServiceClient.analyzeAsync(telemetry).block(Duration.ofMinutes(2));
            if (result != null) {
                persistAnalysis(telemetry, result);
            }
        } catch (Exception e) {
            log.error("Gemma analysis failed for telemetry id={} | {}", telemetryId, e.getMessage(), e);
        }
    }

    private void persistAnalysis(Telemetry telemetry, AIAnalysisResult result) {
        try {
            log.info("AI analysis received for telemetry ID: {} | Threat: {} | Decision: {}",
                    telemetry.getId(), result.threatLevel(), result.decision());

            if (analysisRepository.existsByTelemetryId(telemetry.getId())) {
                log.warn("Analysis already exists for telemetry ID: {}, skipping duplicate", telemetry.getId());
                return;
            }

            TacticalAnalysis analysis = TacticalAnalysis.builder()
                    .telemetry(telemetry)
                    .threatLevel(result.threatLevel())
                    .decision(result.decision())
                    .reasoning(result.reasoning())
                    .confidence(result.confidence())
                    .rawResponse(serializeToJson(result))
                    .build();

            TacticalAnalysis saved = analysisRepository.save(analysis);
            log.info(">> Tactical Analysis Saved! ID: {} | Telemetry ID: {} | Threat: {}",
                    saved.getId(), telemetry.getId(), saved.getThreatLevel());
        } catch (Exception e) {
            log.error("Failed to save AI analysis for telemetry ID: {} | Error: {}",
                    telemetry.getId(), e.getMessage(), e);
        }
    }

    private String serializeToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Failed to serialize object to JSON: {}", e.getMessage());
            return "{}";
        }
    }
}
