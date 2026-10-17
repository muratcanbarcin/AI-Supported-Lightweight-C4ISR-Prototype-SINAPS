package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.service.TacticalZoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(
    name = "Tactical Zones",
    description = "Taktik bölge (BASE, OPERATION_AREA vb.) yönetimi. Listeleme herkese açık; yaratma/güncelleme/silme KARARGAH_ADMIN gerektirir."
)
@RestController
@RequestMapping("/api/v1/zones")
@RequiredArgsConstructor
public class TacticalZoneController {

    private static final Logger log = LoggerFactory.getLogger(TacticalZoneController.class);

    private final TacticalZoneRepository zoneRepository;
    private final TacticalZoneService tacticalZoneService;

    @Operation(summary = "Tüm taktik bölgeleri listele")
    @GetMapping
    public List<TacticalZone> getAllZones() {
        return tacticalZoneService.getAllZones();
    }

    @Operation(summary = "Yeni taktik bölge oluştur", description = "Sadece KARARGAH_ADMIN. Yeni bölge için isim, tip, lat/lon ve radius_meters alanlarını içerir.")
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Bölge oluşturuldu"),
        @ApiResponse(responseCode = "403", description = "Yetkisiz")
    })
    @PostMapping
    @PreAuthorize("hasRole('KARARGAH_ADMIN')")
    public TacticalZone createZone(@RequestBody TacticalZone zone) {
        log.info("Creating tactical zone: {} ({})", zone.getName(), zone.getZoneType());
        return zoneRepository.save(zone);
    }

    @Operation(summary = "Taktik bölge sil")
    @SecurityRequirement(name = "Bearer Authentication")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Silindi"),
        @ApiResponse(responseCode = "404", description = "Bölge bulunamadı")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('KARARGAH_ADMIN')")
    public ResponseEntity<?> deleteZone(@PathVariable UUID id) {
        if (!zoneRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        zoneRepository.deleteById(id);
        log.info("Deleted tactical zone: {}", id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Taktik bölge güncelle", description = "İsim, tip, koordinat ve yarıçap bilgilerini günceller.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('KARARGAH_ADMIN')")
    public ResponseEntity<TacticalZone> updateZone(@PathVariable UUID id, @RequestBody TacticalZone updated) {
        return zoneRepository.findById(id)
                .map(zone -> {
                    zone.setName(updated.getName());
                    zone.setZoneType(updated.getZoneType());
                    zone.setLatitude(updated.getLatitude());
                    zone.setLongitude(updated.getLongitude());
                    zone.setRadiusMeters(updated.getRadiusMeters());
                    return ResponseEntity.ok(zoneRepository.save(zone));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
