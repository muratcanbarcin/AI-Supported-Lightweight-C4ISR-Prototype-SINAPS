package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/zones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TacticalZoneController {

    private static final Logger log = LoggerFactory.getLogger(TacticalZoneController.class);

    private final TacticalZoneRepository zoneRepository;

    @GetMapping
    public List<TacticalZone> getAllZones() {
        return zoneRepository.findAll();
    }

    @PostMapping
    public TacticalZone createZone(@RequestBody TacticalZone zone) {
        log.info("Creating tactical zone: {} ({})", zone.getName(), zone.getZoneType());
        return zoneRepository.save(zone);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteZone(@PathVariable UUID id) {
        if (!zoneRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        zoneRepository.deleteById(id);
        log.info("Deleted tactical zone: {}", id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
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
