package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.service.TelemetryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // Bu sınıfın bir REST API olduğunu belirtir
@RequestMapping("/api/v1/telemetry") // Class Diagram'a uygun ana adres yapısı
@CrossOrigin(origins = "*") // ÖNEMLİ: React (Port 3000) ile Backend (Port 8080) konuşabilsin diye izin
                            // veriyoruz.
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
}