package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.DeployRequest;
import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(
            @RequestParam(required = false) String assetId) {
        List<Task> tasks = taskService.getAllTasks(assetId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("PENDING");
        }
        Task saved = taskService.createTask(task);
        return ResponseEntity.ok(saved);
    }

    /**
     * Deploy an asset to a tactical zone.
     *
     * POST /api/v1/tasks/deploy
     * { "assetId": "14IUS-TB2-01", "zoneId": "uuid-of-zone" }
     */
    @PostMapping("/deploy")
    public ResponseEntity<?> deployAsset(@RequestBody DeployRequest request) {
        String zoneId = request.resolveZoneId();
        if (zoneId == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "zoneId or targetZoneId is required",
                    "assetId", String.valueOf(request.getAssetId())
            ));
        }
        try {
            Task task = taskService.deployAsset(request.getAssetId(), zoneId);
            log.info("Deploy task created: {} → {}", request.getAssetId(), task.getZoneName());
            return ResponseEntity.ok(task);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "assetId", String.valueOf(request.getAssetId()),
                    "zoneId", zoneId
            ));
        }
    }
}
