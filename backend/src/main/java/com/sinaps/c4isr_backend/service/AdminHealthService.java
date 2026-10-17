package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.dto.AdminServiceStatusResponse;
import com.sinaps.c4isr_backend.dto.AdminSystemStatusResponse;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.AssetRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminHealthService {

    private final AppUserRepository appUserRepository;
    private final AssetRepository assetRepository;
    private final TaskRepository taskRepository;
    private final TacticalZoneRepository tacticalZoneRepository;
    private final MqttListenerService mqttListenerService;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    public AdminSystemStatusResponse systemStatus() {
        long activeTasks = taskRepository.countByStatusIn(List.of("IN_PROGRESS", "EN_ROUTE"));
        return AdminSystemStatusResponse.builder()
                .status("ONLINE")
                .activeUsers(appUserRepository.count())
                .totalAssets(assetRepository.count())
                .activeTasks(activeTasks)
                .totalZones(tacticalZoneRepository.count())
                .build();
    }

    public AdminServiceStatusResponse serviceStatus() {
        return AdminServiceStatusResponse.builder()
                .backend("ONLINE")
                .database(isDatabaseReachable() ? "ONLINE" : "OFFLINE")
                .aiService(isAiServiceReachable() ? "ONLINE" : "OFFLINE")
                .mqttBroker(mqttListenerService.isBrokerConnected() ? "ONLINE" : "OFFLINE")
                .dockerEngine(getDockerEngineStatus())
                .checkedAt(LocalDateTime.now())
                .build();
    }

    private boolean isDatabaseReachable() {
        try {
            appUserRepository.count();
            return true;
        } catch (Exception ex) {
            log.warn("Database status check failed", ex);
            return false;
        }
    }

    private boolean isAiServiceReachable() {
        String normalizedBase = normalizeAiBaseUrl(aiServiceUrl);
        Set<String> bases = new LinkedHashSet<>();
        bases.add(normalizedBase);
        if (normalizedBase.contains("localhost")) {
            bases.add(normalizedBase.replace("localhost", "127.0.0.1"));
        }
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2))
                .build();
        String[] paths = {"/health", "/"};
        for (String base : bases) {
            for (String path : paths) {
                try {
                    HttpRequest req = HttpRequest.newBuilder(URI.create(base + path))
                            .timeout(Duration.ofSeconds(2))
                            .GET()
                            .build();
                    HttpResponse<Void> resp = client.send(req, HttpResponse.BodyHandlers.discarding());
                    int sc = resp.statusCode();
                    if (sc >= 200 && sc < 400) {
                        return true;
                    }
                } catch (Exception ex) {
                    log.trace("AI health probe failed {} {}: {}", base, path, ex.getMessage());
                }
            }
        }
        return false;
    }

    private static String normalizeAiBaseUrl(String url) {
        if (url == null || url.isBlank()) {
            return "http://127.0.0.1:8000";
        }
        String t = url.trim();
        if (t.endsWith("/")) {
            t = t.substring(0, t.length() - 1);
        }
        return t;
    }

    private String getDockerEngineStatus() {
        Process process = null;
        try {
            process = new ProcessBuilder("docker", "info", "--format", "{{.ServerVersion}}")
                    .redirectErrorStream(true)
                    .start();
            boolean finished = process.waitFor(2, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return "OFFLINE";
            }
            return process.exitValue() == 0 ? "ONLINE" : "OFFLINE";
        } catch (Exception ex) {
            return "UNAVAILABLE";
        }
    }
}
