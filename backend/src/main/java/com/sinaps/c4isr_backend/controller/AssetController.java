package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.AssetRegistrationRequest;
import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.model.SystemLog;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.SystemLogRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import com.sinaps.c4isr_backend.service.AssetService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ============================================================================
 * Asset Controller - Asset-Level Operations
 * ============================================================================
 *
 * Provides REST endpoints for asset-level actions such as emergency stop and
 * CRUD.
 *
 * Endpoints:
 * - GET /api/v1/assets → Get all assets
 * - POST /api/v1/assets → Create an asset
 * - DELETE /api/v1/assets/{id} → Delete an asset
 * - POST /api/v1/assets/{id}/emergency-stop → Initiate emergency stop
 * ============================================================================
 */
@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AssetController {

    private static final Logger log = LoggerFactory.getLogger(AssetController.class);

    private final AssetService assetService;
    private final TelemetryRepository telemetryRepository;
    private final SystemLogRepository systemLogRepository;

    @GetMapping
    public List<Asset> getAllAssets() {
        return assetService.getAllAssets();
    }

    @PostMapping
    @PreAuthorize("hasRole('KARARGAH_ADMIN')")
    public ResponseEntity<?> createAsset(@RequestBody AssetRegistrationRequest request) {
        try {
            Asset createdAsset = assetService.createAsset(request);
            return ResponseEntity.ok(createdAsset);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('KARARGAH_ADMIN')")
    public ResponseEntity<?> deleteAsset(@PathVariable String id) {
        try {
            assetService.deleteAsset(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Initiate an emergency stop for an asset.
     *
     * This endpoint:
     * 1. Looks up the latest telemetry for the given asset ID.
     * 2. Updates the telemetry payload to mark the asset as STOPPED.
     * 3. Creates a system_logs entry recording the emergency stop event.
     *
     * POST /api/v1/assets/{id}/emergency-stop
     *
     * @param id The asset ID (e.g., "DRONE-001")
     * @return JSON with success status and details
     */
    @PostMapping("/{id}/emergency-stop")
    public ResponseEntity<Map<String, Object>> emergencyStop(@PathVariable String id) {
        log.warn("🚨 EMERGENCY STOP initiated for asset: {}", id);

        Map<String, Object> response = new HashMap<>();

        // 1. Find latest telemetry for the asset
        Optional<Telemetry> latestOpt = telemetryRepository.findTopBySourceIdOrderByTimestampDesc(id);

        if (latestOpt.isPresent()) {
            // 2. Update payload with STOPPED status
            Telemetry latest = latestOpt.get();
            Map<String, Object> payload = latest.getPayload();
            if (payload == null) {
                payload = new HashMap<>();
            }
            payload.put("status", "STOPPED");
            payload.put("emergency_stop", true);
            latest.setPayload(payload);
            telemetryRepository.save(latest);

            log.info("Asset {} telemetry updated to STOPPED.", id);
        } else {
            log.warn("No telemetry found for asset {}. Logging stop anyway.", id);
        }

        // 3. Create a system log entry
        SystemLog logEntry = SystemLog.builder()
                .assetId(id)
                .eventType("EMERGENCY_STOP")
                .message("Emergency stop initiated")
                .build();
        systemLogRepository.save(logEntry);

        response.put("success", true);
        response.put("assetId", id);
        response.put("status", "STOPPED");
        response.put("message", "Emergency stop initiated for asset: " + id);

        return ResponseEntity.ok(response);
    }
}
