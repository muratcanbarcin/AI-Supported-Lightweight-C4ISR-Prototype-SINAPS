package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.dto.AssetRegistrationRequest;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.AssetRepository;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssetService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AssetService.class);

    private final AssetRepository assetRepository;
    private final TelemetryRepository telemetryRepository;
    private final TaskRepository taskRepository;
    private final AppUserRepository appUserRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public List<Asset> getAllAssets() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        AppUser currentUser = appUserRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // STRICT DATA ISOLATION
        if (currentUser.getRole() == Role.KARARGAH_ADMIN) {
            return assetRepository.findAll();
        }
        if (currentUser.getRole() == Role.HAREKAT_SUBAYI || currentUser.getRole() == Role.ORDU_KOMUTANI) {
            String assignedZoneId = currentUser.getAssignedZoneId();
            // If user has no assigned zone, they can see nothing.
            if (assignedZoneId == null || assignedZoneId.isBlank()) {
                return Collections.emptyList();
            }
            return assetRepository.findByAssignedZoneId(assignedZoneId);
        }
        return Collections.emptyList();
    }

    @Transactional
    public Asset createAsset(AssetRegistrationRequest request) {
        log.info("createAsset called with request: {}", request);
        try {
            if (request.getId() == null || request.getId().isBlank()) {
                throw new IllegalArgumentException("id is required");
            }
            if (request.getType() == null) {
                throw new IllegalArgumentException("type is required");
            }
            Double latitude = request.getLatitude() != null ? request.getLatitude() : request.getInitialLatitude();
            Double longitude = request.getLongitude() != null ? request.getLongitude() : request.getInitialLongitude();
            if (latitude == null || longitude == null) {
                throw new IllegalArgumentException("latitude/longitude (or initialLatitude/initialLongitude) are required");
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
            log.info("Asset saved successfully with id: {}", savedAsset.getId());

            Point location = geometryFactory.createPoint(new Coordinate(longitude, latitude));
            Map<String, Object> initialPayload = new HashMap<>(); // Standard Map without nesting strings
            initialPayload.put("status", "IDLE");
            initialPayload.put("is_simulated", savedAsset.getIsSimulated());
            initialPayload.put("battery", 100);

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
            log.info("Initial telemetry saved successfully for asset: {}", savedAsset.getName());

            return savedAsset;
        } catch (Exception e) {
            log.error("Failed to create asset: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public void deleteAsset(String assetIdentifier) {
        // Try by name first, then by direct ID (both are String now)
        Asset asset = assetRepository.findByName(assetIdentifier)
                .or(() -> assetRepository.findById(assetIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("Asset not found: " + assetIdentifier));

        // Delete child records first to avoid FK violations.
        telemetryRepository.deleteByAssetId(asset.getName());
        taskRepository.deleteByAssetId(asset.getName());
        assetRepository.deleteById(asset.getId());
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
