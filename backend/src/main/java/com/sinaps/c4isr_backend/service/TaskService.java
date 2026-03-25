package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.ZoneType;
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
        payload.remove("arrived_at");
        latest.setPayload(payload);
        telemetryRepository.save(latest);

        boolean isRtb = zone.getZoneType() == ZoneType.BASE;
        String title = isRtb
                ? "Üsse Dönüş (RTB): " + zone.getName()
                : "İntikal: " + zone.getName();
        String taskType = isRtb ? "RTB" : "DEPLOYMENT";
        String description = isRtb
                ? String.format("%s birimi %s üssüne geri çağrıldı. Hedef: %.4f°N, %.4f°E.",
                        assetId, zone.getName(), zone.getLatitude(), zone.getLongitude())
                : String.format("%s birimi %s bölgesine sevk edildi. Hedef koordinat: %.4f°N, %.4f°E. Yarıçap: %.0f m.",
                        assetId, zone.getName(), zone.getLatitude(), zone.getLongitude(), zone.getRadiusMeters());

        Task task = Task.builder()
                .assetId(assetId)
                .title(title)
                .description(description)
                .taskType(taskType)
                .status("IN_PROGRESS")
                .zoneId(zoneIdStr)
                .zoneName(zone.getName())
                .build();

        Task saved = taskRepository.save(task);

        log.info("{}: {} → {} (Task #{})", taskType, assetId, zone.getName(), saved.getId());
        return saved;
    }
}
