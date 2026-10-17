package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.AssetRegistrationRequest;
import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
@Tag(
    name = "Assets",
    description = "Asset (DRONE, SOLDIER, VEHICLE, SHIP, SENSOR, ELECTRONIC_WARFARE) yönetimi ve acil durdurma (emergency stop) kontrolü."
)
@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @Operation(summary = "Tüm assetleri listele")
    @GetMapping
    public List<Asset> getAllAssets() {
        return assetService.getAllAssets();
    }

    @Operation(summary = "Yeni asset kaydı (KARARGAH_ADMIN)",
               description = "Yeni asset kaydeder. ID, isim, tip ve assignedZoneId alanlarını içerir.")
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Asset oluşturuldu"),
        @ApiResponse(responseCode = "400", description = "Doğrulama hatası (örn. ID çakışması)")
    })
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

    @Operation(summary = "Asset sil (KARARGAH_ADMIN)")
    @SecurityRequirement(name = "Bearer Authentication")
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
    @Operation(
        summary = "Acil durdurma",
        description = "Verilen asset için: " +
                      "(1) son telemetriyi STOPPED durumuna geçirir, " +
                      "(2) `emergency_stop=true` bayrağını payload'a ekler, " +
                      "(3) `EMERGENCY_STOP` system log kaydı oluşturur."
    )
    @ApiResponses(@ApiResponse(responseCode = "200", description = "Acil durdurma uygulandı"))
    @PostMapping("/{id}/emergency-stop")
    public ResponseEntity<Map<String, Object>> emergencyStop(@PathVariable String id) {
        return ResponseEntity.ok(assetService.emergencyStop(id));
    }
}
