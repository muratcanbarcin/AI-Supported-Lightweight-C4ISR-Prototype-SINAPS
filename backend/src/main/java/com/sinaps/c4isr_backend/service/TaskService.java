package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import com.sinaps.c4isr_backend.model.Telemetry;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;
    private final TacticalZoneRepository zoneRepository;
    private final TelemetryRepository telemetryRepository;

    @Transactional
    public Task deployAsset(String assetId, String zoneIdStr) {
        UUID zoneUuid = UUID.fromString(zoneIdStr);
        TacticalZone zone = zoneRepository.findById(zoneUuid)
                .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + zoneIdStr));

        Optional<Telemetry> latestOpt = telemetryRepository.findTopBySourceIdOrderByTimestampDesc(assetId);
        if (latestOpt.isEmpty()) {
            throw new IllegalArgumentException("Asset telemetry not found: " + assetId);
        }

        Telemetry latest = latestOpt.get();
        Map<String, Object> payload = latest.getPayload();
        if (payload == null) {
            payload = new HashMap<>();
        }
        payload.put("status", "EN_ROUTE");
        payload.put("deployment_zone", zone.getName());
        payload.put("deployment_zone_id", zoneIdStr);
        latest.setPayload(payload);
        telemetryRepository.save(latest);

        Task task = Task.builder()
                .assetId(assetId)
                .title("İntikal: " + zone.getName())
                .description(String.format(
                        "%s birimi %s bölgesine sevk edildi. Hedef koordinat: %.4f°N, %.4f°E. Yarıçap: %.0f m.",
                        assetId, zone.getName(), zone.getLatitude(), zone.getLongitude(), zone.getRadiusMeters()
                ))
                .taskType("DEPLOYMENT")
                .status("IN_PROGRESS")
                .zoneId(zoneIdStr)
                .zoneName(zone.getName())
                .build();

        Task saved = taskRepository.save(task);

        log.info("DEPLOYMENT: {} → {} (Task #{})", assetId, zone.getName(), saved.getId());
        return saved;
    }
}
