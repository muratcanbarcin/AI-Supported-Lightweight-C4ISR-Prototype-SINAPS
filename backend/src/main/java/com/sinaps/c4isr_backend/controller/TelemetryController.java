package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.service.TelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(
    name = "Telemetry",
    description = "Tüm assetlerden (simüle + donanım) toplanan telemetri için genel sorgu/ingest endpointleri. " +
                  "Frontend haritası `/latest` adresini periyodik olarak çağırır."
)
@RestController
@RequestMapping("/api/v1/telemetry")
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
    @Operation(
        summary = "En güncel telemetri (her asset için)",
        description = "Her benzersiz kaynak (sourceId) için en son telemetri kaydını döner. Harita ikonlarını sürekli güncellemek için kullanılır. " +
                      "Kullanıcı rolü zone-kısıtlıysa sadece atanmış zone'daki assetler döner; KARARGAH_ADMIN ve anonim erişimde tamamı görünür."
    )
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Telemetri listesi"))
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
    @Operation(
        summary = "Tüm telemetri geçmişi",
        description = "Veritabanındaki tüm telemetri kayıtlarını döner. AI eğitimi (training) ve dışa aktarım için kullanılır. " +
                      "DİKKAT: Büyük veride yavaş olabilir; ileride sayfalama eklenebilir."
    )
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Tüm geçmiş telemetri"))
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
    @Operation(
        summary = "Generic simulator telemetri ingest",
        description = "UAV/Vehicle/Soldier simülatörlerinden gelen tek bir telemetri JSON'unu işler. " +
                      "Donanım prototipleri için bunun yerine `/api/v1/hardware/...` endpointlerini kullanın."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Telemetri kaydedildi"),
        @ApiResponse(responseCode = "400", description = "JSON parse veya saklama hatası")
    })
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
    @Operation(
        summary = "Batch telemetri ingest",
        description = "JSON array içinde birden fazla telemetri kaydını tek istekle gönderir. Replay/import senaryoları için kullanılır."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Toplu işlem tamamlandı"),
        @ApiResponse(responseCode = "400", description = "JSON parse hatası")
    })
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