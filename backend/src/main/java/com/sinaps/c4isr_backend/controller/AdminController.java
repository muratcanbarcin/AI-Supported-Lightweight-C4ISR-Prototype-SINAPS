package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.AdminCreateUserRequest;
import com.sinaps.c4isr_backend.dto.AdminServiceStatusResponse;
import com.sinaps.c4isr_backend.dto.AdminSystemStatusResponse;
import com.sinaps.c4isr_backend.dto.AdminUserResponse;
import com.sinaps.c4isr_backend.service.MqttListenerService;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.AssetRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AdminController {

    private final AppUserRepository appUserRepository;
    private final AssetRepository assetRepository;
    private final TaskRepository taskRepository;
    private final TacticalZoneRepository tacticalZoneRepository;
    private final MqttListenerService mqttListenerService;
    private final PasswordEncoder passwordEncoder;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {
        return appUserRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole(),
                        user.getAssignedZoneId()
                ))
                .toList();
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody AdminCreateUserRequest request) {
        if (request.getUsername() == null || request.getPassword() == null || request.getRole() == null) {
            return ResponseEntity.badRequest().body("username, password and role are required");
        }

        String normalizedUsername = request.getUsername().trim();
        if (normalizedUsername.isEmpty()) {
            return ResponseEntity.badRequest().body("username cannot be empty");
        }

        String normalizedPassword = request.getPassword().trim();
        if (normalizedPassword.isEmpty()) {
            return ResponseEntity.badRequest().body("password cannot be empty");
        }

        if (appUserRepository.findByUsername(normalizedUsername).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        String assignedZoneId = normalizeNullable(request.getAssignedZoneId());
        if (request.getRole() == Role.HAREKAT_SUBAYI && assignedZoneId == null) {
            return ResponseEntity.badRequest().body("assignedZoneId is required for HAREKAT_SUBAYI");
        }
        if (assignedZoneId != null) {
            try {
                UUID zoneId = UUID.fromString(assignedZoneId);
                if (!tacticalZoneRepository.existsById(zoneId)) {
                    return ResponseEntity.badRequest().body("assignedZoneId does not match any TacticalZone");
                }
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body("assignedZoneId must be a valid UUID");
            }
        }

        try {
            AppUser user = new AppUser();
            user.setUsername(normalizedUsername);
            // BCrypt is explicitly applied before persistence.
            user.setPassword(passwordEncoder.encode(normalizedPassword));
            user.setRole(request.getRole());
            // CRITICAL: Persist assignedZoneId from DTO.
            user.setAssignedZoneId(assignedZoneId);

            log.info("Creating user={} role={} assignedZoneId={}",
                    normalizedUsername,
                    request.getRole(),
                    assignedZoneId);

            AppUser savedUser = appUserRepository.save(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception ex) {
            log.error("Failed to create admin user for username={}", normalizedUsername, ex);
            return ResponseEntity.internalServerError().body("User creation failed");
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        if (!appUserRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        appUserRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/system-status")
    public AdminSystemStatusResponse getSystemStatus() {
        long activeTasks = taskRepository.countByStatusIn(List.of("IN_PROGRESS", "EN_ROUTE"));
        return AdminSystemStatusResponse.builder()
                .status("ONLINE")
                .activeUsers(appUserRepository.count())
                .totalAssets(assetRepository.count())
                .activeTasks(activeTasks)
                .totalZones(tacticalZoneRepository.count())
                .build();
    }

    @GetMapping("/service-status")
    public AdminServiceStatusResponse getServiceStatus() {
        String dbStatus = isDatabaseReachable() ? "ONLINE" : "OFFLINE";
        String aiStatus = isAiServiceReachable() ? "ONLINE" : "OFFLINE";
        String mqttStatus = mqttListenerService.isBrokerConnected() ? "ONLINE" : "OFFLINE";
        String dockerStatus = getDockerEngineStatus();

        return AdminServiceStatusResponse.builder()
                .backend("ONLINE")
                .database(dbStatus)
                .aiService(aiStatus)
                .mqttBroker(mqttStatus)
                .dockerEngine(dockerStatus)
                .checkedAt(LocalDateTime.now())
                .build();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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
