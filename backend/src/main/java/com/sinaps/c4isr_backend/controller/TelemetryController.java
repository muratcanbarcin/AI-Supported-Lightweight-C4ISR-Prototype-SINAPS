package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Bu sınıfın bir REST API olduğunu belirtir
@RequestMapping("/api/v1/telemetry") // Class Diagram'a uygun ana adres yapısı
// Note: CORS is now handled globally by GlobalCorsConfig.java
public class TelemetryController {

    private final TelemetryService telemetryService;

    // Servis katmanını buraya bağlıyoruz
    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    /**
     * SIN-11: En güncel verileri döndüren endpoint.
     * Frontend haritası buraya sürekli istek atarak (polling) ikonları hareket
     * ettirecek.
     * Adres: http://localhost:8080/api/v1/telemetry/latest
     */
    @GetMapping("/latest")
    public ResponseEntity<List<com.sinaps.c4isr_backend.dto.TelemetryResponseDTO>> getLatestTelemetry() {
        // Servisten en son verileri iste
        List<Telemetry> latestData = telemetryService.getLatestTelemetry();

        // DTO'ya çevir
        List<com.sinaps.c4isr_backend.dto.TelemetryResponseDTO> response = latestData.stream()
                .map(com.sinaps.c4isr_backend.dto.TelemetryResponseDTO::fromEntity)
                .toList();

        // 200 OK koduyla birlikte listeyi JSON olarak döndür
        return ResponseEntity.ok(response);
    }

    /**
     * AI Eğitimi (Training) için geçmiş verileri döndüren endpoint.
     * CSV dosyası kullanmak istemeyenler için tüm veritabanını JSON olarak sunar.
     * Adres: http://localhost:8080/api/v1/telemetry/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<com.sinaps.c4isr_backend.dto.TelemetryResponseDTO>> getTelemetryHistory() {
        // Tüm geçmiş veriyi çek (Dikkat: Büyük veride sayfalama gerekebilir)
        List<Telemetry> allData = telemetryService.findAll();

        List<com.sinaps.c4isr_backend.dto.TelemetryResponseDTO> response = allData.stream()
                .map(com.sinaps.c4isr_backend.dto.TelemetryResponseDTO::fromEntity)
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * Simülasyondan gelen telemetri verilerini alır ve işler.
     * Adres: POST http://localhost:8080/api/v1/telemetry
     * 
     * Expected JSON format:
     * {
     *   "domain": "drone",
     *   "type": "telemetry",
     *   "id": "DRONE-001",
     *   "time": "2026-02-03T10:00:00.000Z",
     *   "payload": {
     *     "position": { "lat": 39.95, "lon": 32.60, "alt_m": 150.0 },
     *     "ground_speed_mps": 25.5,
     *     "battery": { "soc_pct": 85.0 }
     *   }
     * }
     */
    @PostMapping
    public ResponseEntity<String> ingestTelemetry(@RequestBody String jsonPayload) {
        try {
            telemetryService.processSimulatorMessage(jsonPayload);
            return ResponseEntity.ok("{\"status\": \"OK\", \"message\": \"Telemetry ingested successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("{\"status\": \"ERROR\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Batch telemetry ingestion - accepts array of telemetry messages.
     * Adres: POST http://localhost:8080/api/v1/telemetry/batch
     */
    @PostMapping("/batch")
    public ResponseEntity<String> ingestBatchTelemetry(@RequestBody String jsonArrayPayload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode arrayNode = mapper.readTree(jsonArrayPayload);
            
            int count = 0;
            if (arrayNode.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode node : arrayNode) {
                    telemetryService.processSimulatorMessage(node.toString());
                    count++;
                }
            }
            
            return ResponseEntity.ok("{\"status\": \"OK\", \"message\": \"Processed " + count + " telemetry records\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("{\"status\": \"ERROR\", \"message\": \"" + e.getMessage() + "\"}");
        }
    }
}