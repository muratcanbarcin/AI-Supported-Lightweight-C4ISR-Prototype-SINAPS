package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.service.HardwareTelemetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dedicated REST endpoints for the physical hardware prototypes
 *   - IZMIR-HW-WATCH-01 (Soldier Tactical Watch)  : HTTP POST   /api/v1/hardware/watch/telemetry
 *   - IZMIR-HW-DRONE-01 (Edge-AI Drone)           : HTTP POST   /api/v1/hardware/drone/telemetry  (test/fallback)
 *
 * Drone primary transport is MQTT (topic: hardware/drone/+/telemetry) — see MqttListenerService.
 */
@Tag(
    name = "Hardware Telemetry",
    description = "Fiziksel donanım prototipleri (IZMIR-HW-WATCH-01 ve IZMIR-HW-DRONE-01) için telemetri ingest endpointleri. " +
                  "Veri `is_simulated=false` olarak işaretlenir; SimulationEngine bu assetlere dokunmaz. " +
                  "Sunucu tarafında threat_level hesaplanır ve CRITICAL/SUSPICIOUS ise Gemma analizi kuyruklanır."
)
@RestController
@RequestMapping("/api/v1/hardware")
public class HardwareTelemetryController {

    private static final Logger log = LoggerFactory.getLogger(HardwareTelemetryController.class);

    private final HardwareTelemetryService hardwareTelemetryService;

    public HardwareTelemetryController(HardwareTelemetryService hardwareTelemetryService) {
        this.hardwareTelemetryService = hardwareTelemetryService;
    }

    @Operation(
        summary = "Watch (Asker Saati) telemetri ingest",
        description = """
                IZMIR-HW-WATCH-01 saatinden gelen position + vitals + device verisini parse eder.
                Sunucu tarafında vitals'a göre threat_level hesaplanır:
                  - CRITICAL  : hr_bpm > 150 veya < 40, ya da spo2_pct < 90
                  - SUSPICIOUS: hr_bpm > 130 veya spo2_pct < 94
                  - NORMAL    : aksi halde
                Client'in gönderdiği `threat_level` alanı silinir — gerçeği sunucu belirler.
                Telemetri simüle veri ile aynı pipeline'a girer; threat NORMAL değilse Gemma analiz kuyruğuna alınır.
                """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Telemetri kaydedildi"),
        @ApiResponse(responseCode = "400", description = "Geçersiz payload (örn. position alanı eksik)")
    })
    @PostMapping("/watch/telemetry")
    public ResponseEntity<Map<String, Object>> ingestWatch(
            @RequestBody(
                description = "Watch telemetri JSON'u",
                required = true,
                content = @Content(
                    schema = @Schema(type = "object"),
                    examples = {
                        @ExampleObject(
                            name = "Normal vitals",
                            value = """
                            {
                              "domain": "watch",
                              "type": "telemetry",
                              "id": "IZMIR-HW-WATCH-01",
                              "time": "2026-05-14T10:00:00.000Z",
                              "payload": {
                                "position": { "lat": 38.5090, "lon": 27.0140, "alt_m": 12.5 },
                                "vitals": { "hr_bpm": 88, "spo2_pct": 98 },
                                "device": { "model": "SINAPS-Tactical-Watch", "battery_pct": 88.0 },
                                "is_simulated": false,
                                "status": "IN_MISSION"
                              }
                            }
                            """
                        ),
                        @ExampleObject(
                            name = "Critical vitals (yaralı asker)",
                            value = """
                            {
                              "domain": "watch",
                              "type": "telemetry",
                              "id": "IZMIR-HW-WATCH-01",
                              "time": "2026-05-14T10:01:00.000Z",
                              "payload": {
                                "position": { "lat": 38.5090, "lon": 27.0140, "alt_m": 12.5 },
                                "vitals": { "hr_bpm": 175, "spo2_pct": 84 },
                                "device": { "model": "SINAPS-Tactical-Watch", "battery_pct": 65.0 },
                                "is_simulated": false,
                                "status": "IN_MISSION"
                              }
                            }
                            """
                        )
                    }
                )
            )
            @org.springframework.web.bind.annotation.RequestBody String json) {
        try {
            Telemetry saved = hardwareTelemetryService.processWatchTelemetry(json);
            return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "id", saved.getId(),
                    "sourceId", saved.getSourceId(),
                    "threatLevel", saved.getPayload().get("threatLevel")
            ));
        } catch (Exception e) {
            log.error("Watch ingest error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", String.valueOf(e.getMessage())
            ));
        }
    }

    @Operation(
        summary = "Drone telemetri ingest (HTTP fallback)",
        description = """
                IZMIR-HW-DRONE-01'in HTTP fallback endpoint'i.
                Birincil yol MQTT'tir (topic: `hardware/drone/+/telemetry`); bu endpoint test ve broker erişimi yokken kullanılır.
                Threat değerlendirmesi `payload.edge_analysis.detections` üzerinden yapılır:
                  - CRITICAL  : confidence ≥ 0.7 ile HOSTILE tespit
                  - SUSPICIOUS: confidence ≥ 0.7 ile UNKNOWN tespit
                  - NORMAL    : aksi halde
                """
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Telemetri kaydedildi"),
        @ApiResponse(responseCode = "400", description = "Geçersiz payload")
    })
    @PostMapping("/drone/telemetry")
    public ResponseEntity<Map<String, Object>> ingestDrone(
            @RequestBody(
                description = "Drone telemetri JSON'u (MQTT'ye gönderilen yapı ile aynı)",
                required = true,
                content = @Content(
                    schema = @Schema(type = "object"),
                    examples = @ExampleObject(
                        name = "HOSTILE detection (CRITICAL)",
                        value = """
                        {
                          "domain": "drone",
                          "type": "telemetry",
                          "id": "IZMIR-HW-DRONE-01",
                          "time": "2026-05-14T14:15:00.000Z",
                          "payload": {
                            "position": { "lat": 38.5120, "lon": 27.0155, "alt_m": 450.0 },
                            "battery": { "soc_pct": 82.5 },
                            "is_simulated": false,
                            "status": "IN_MISSION",
                            "edge_analysis": {
                              "detections": [
                                { "class": "MILITARY_VEHICLE", "alignment": "HOSTILE",  "confidence": 0.89, "estimated_distance_m": 718.4 },
                                { "class": "SOLDIER",          "alignment": "FRIENDLY", "confidence": 0.95, "estimated_distance_m": 150.2 },
                                { "class": "TRUCK",            "alignment": "UNKNOWN",  "confidence": 0.87, "estimated_distance_m": 710.1 },
                                { "class": "CIVILIAN_VEHICLE", "alignment": "NEUTRAL",  "confidence": 0.88, "estimated_distance_m": 328.1 }
                              ]
                            }
                          }
                        }
                        """
                    )
                )
            )
            @org.springframework.web.bind.annotation.RequestBody String json) {
        try {
            Telemetry saved = hardwareTelemetryService.processDroneTelemetry(json);
            return ResponseEntity.ok(Map.of(
                    "status", "OK",
                    "id", saved.getId(),
                    "sourceId", saved.getSourceId(),
                    "threatLevel", saved.getPayload().get("threatLevel")
            ));
        } catch (Exception e) {
            log.error("Drone ingest error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", String.valueOf(e.getMessage())
            ));
        }
    }
}
