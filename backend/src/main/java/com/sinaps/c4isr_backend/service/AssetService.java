package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.dto.AssetRegistrationRequest;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.AssetRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final TelemetryRepository telemetryRepository;
    private final AppUserRepository appUserRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public List<Asset> getAllAssets() {
        AppUser currentUser = getCurrentAppUser();
        if (currentUser.getRole() == Role.KARARGAH_ADMIN) {
            return assetRepository.findAll();
        }

        String zoneId = currentUser.getAssignedZoneId();
        if (zoneId == null || zoneId.isBlank()) {
            return List.of();
        }
        return assetRepository.findByAssignedZoneId(zoneId);
    }

    @Transactional
    public Asset registerAsset(AssetRegistrationRequest request) {
        if (request.getId() == null || request.getId().isBlank()) {
            throw new IllegalArgumentException("id is required");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("type is required");
        }
        if (request.getInitialLatitude() == null || request.getInitialLongitude() == null) {
            throw new IllegalArgumentException("initialLatitude and initialLongitude are required");
        }

        String normalizedAssetId = request.getId().trim();
        if (assetRepository.existsByName(normalizedAssetId)) {
            throw new IllegalArgumentException("Asset id already exists: " + normalizedAssetId);
        }

        Asset asset = Asset.builder()
                .name(normalizedAssetId)
                .type(request.getType())
                .isSimulated(request.getIsSimulated() == null ? Boolean.TRUE : request.getIsSimulated())
                .assignedZoneId(normalizeNullable(request.getAssignedZoneId()))
                .build();
        Asset savedAsset = assetRepository.save(asset);

        Point location = geometryFactory.createPoint(
                new Coordinate(request.getInitialLongitude(), request.getInitialLatitude())
        );
        Map<String, Object> initialPayload = new HashMap<>();
        initialPayload.put("status", "IDLE");
        initialPayload.put("registered_by", "admin");

        Telemetry initialTelemetry = Telemetry.builder()
                .sourceId(savedAsset.getName())
                .sourceType(savedAsset.getType())
                .timestamp(LocalDateTime.now())
                .location(location)
                .altitude(0.0)
                .speed(0.0)
                .batteryLevel(100)
                .payload(initialPayload)
                .build();
        telemetryRepository.save(initialTelemetry);

        return savedAsset;
    }

    @Transactional
    public void deleteAssetByIdentifier(String assetIdentifier) {
        Asset asset = assetRepository.findByName(assetIdentifier).orElse(null);
        if (asset == null) {
            try {
                Long numericId = Long.parseLong(assetIdentifier);
                asset = assetRepository.findById(numericId).orElse(null);
            } catch (NumberFormatException ignored) {
                // Identifier is not numeric; continue to not found
            }
        }
        if (asset == null) {
            throw new IllegalArgumentException("Asset not found: " + assetIdentifier);
        }

        telemetryRepository.deleteBySourceId(asset.getName());
        assetRepository.delete(asset);
    }

    private AppUser getCurrentAppUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();
        return appUserRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
