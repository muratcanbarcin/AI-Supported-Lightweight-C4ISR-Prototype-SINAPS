package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ============================================================================
 * Task Controller - Operational Task Management
 * ============================================================================
 *
 * Provides REST endpoints for creating and querying tasks assigned to
 * field assets (drones, vehicles, soldiers).
 *
 * Endpoints:
 * - GET  /api/v1/tasks           → List all tasks (most recent first)
 * - POST /api/v1/tasks           → Create / assign a new task
 * ============================================================================
 */
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskRepository taskRepository;

    public TaskController(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    /**
     * Fetch all tasks, ordered by creation date (most recent first).
     *
     * GET /api/v1/tasks
     * Optional query param: ?assetId=DRONE-001
     */
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(
            @RequestParam(required = false) String assetId) {

        List<Task> tasks;
        if (assetId != null && !assetId.isBlank()) {
            tasks = taskRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
        } else {
            tasks = taskRepository.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(tasks);
    }

    /**
     * Create and assign a new task.
     *
     * POST /api/v1/tasks
     * Request body (JSON):
     * {
     *   "assetId": "DRONE-001",
     *   "title": "Reconnaissance Zone Alpha",
     *   "description": "Perform aerial sweep of area 39.92N 32.85E within 500m radius",
     *   "status": "PENDING"          // optional, defaults to PENDING
     * }
     */
    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("PENDING");
        }
        Task saved = taskRepository.save(task);
        return ResponseEntity.ok(saved);
    }
}
