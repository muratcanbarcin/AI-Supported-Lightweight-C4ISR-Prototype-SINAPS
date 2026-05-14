package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.DeployRequest;
import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(
    name = "Tasks",
    description = "Görev (Task) yönetimi: oluşturma, listeleme ve asset deployment (EN_ROUTE intikal komutu)."
)
@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskController {

    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    private final TaskService taskService;

    @Operation(summary = "Tüm görevleri listele",
               description = "Opsiyonel `assetId` query parametresi ile o asset'e ait görevler filtrelenir.")
    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks(
            @Parameter(description = "Filtrelenecek asset ID (örn. IZMIR-HW-DRONE-01)")
            @RequestParam(required = false) String assetId) {
        List<Task> tasks = taskService.getAllTasks(assetId);
        return ResponseEntity.ok(tasks);
    }

    @Operation(summary = "Yeni görev oluştur",
               description = "Status boşsa PENDING atanır.")
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
    @Operation(
        summary = "Asset'i taktik bölgeye deploy et",
        description = "Verilen asset'in `deployment_zone_id`'sini günceller ve status'unu EN_ROUTE'a alır. " +
                      "SimulationEngine her tick'te bu asset'i hedef bölgeye doğru hareket ettirir (sadece is_simulated=true assetler için). " +
                      "Body örneği: `{ \"assetId\": \"14IUS-TB2-01\", \"zoneId\": \"<uuid>\" }`"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Deploy görevi oluşturuldu"),
        @ApiResponse(responseCode = "400", description = "zoneId eksik veya geçersiz asset/zone")
    })
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
