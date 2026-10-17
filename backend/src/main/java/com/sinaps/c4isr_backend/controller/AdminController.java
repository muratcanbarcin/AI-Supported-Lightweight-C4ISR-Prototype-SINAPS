package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.AdminCreateUserRequest;
import com.sinaps.c4isr_backend.dto.AdminServiceStatusResponse;
import com.sinaps.c4isr_backend.dto.AdminSystemStatusResponse;
import com.sinaps.c4isr_backend.dto.AdminUserResponse;
import com.sinaps.c4isr_backend.service.AdminHealthService;
import com.sinaps.c4isr_backend.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(
    name = "Admin",
    description = "KARARGAH_ADMIN rolüne özel yönetim endpointleri: kullanıcı yönetimi, sistem ve servis sağlık durumu. " +
                  "Tümü JWT gerektirir."
)
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminUserService adminUserService;
    private final AdminHealthService adminHealthService;

    @Operation(summary = "Tüm kullanıcıları listele",
               description = "Sistemdeki tüm kullanıcıları (id, kullanıcı adı, rol, atanmış zone) döner.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Kullanıcı listesi"),
        @ApiResponse(responseCode = "403", description = "KARARGAH_ADMIN rolü gerekli")
    })
    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {
        return adminUserService.listUsers();
    }

    @Operation(summary = "Yeni kullanıcı oluştur",
               description = "username, password ve role zorunlu. HAREKAT_SUBAYI rolü için `assignedZoneId` (TacticalZone UUID) zorunludur. Parola BCrypt ile hash'lenerek saklanır. Yanıt parola içermez.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Kullanıcı oluşturuldu"),
        @ApiResponse(responseCode = "400", description = "Eksik/geçersiz alan veya kullanıcı adı çakışması")
    })
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody AdminCreateUserRequest request) {
        try {
            return ResponseEntity.ok(adminUserService.createUser(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("User creation failed");
        }
    }

    @Operation(summary = "Kullanıcı sil", description = "Verilen UUID'ye sahip kullanıcıyı kalıcı olarak siler.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Silindi"),
        @ApiResponse(responseCode = "404", description = "Kullanıcı bulunamadı")
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        if (!adminUserService.deleteUser(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Sistem durumu",
               description = "Toplam kullanıcı, asset, aktif görev ve zone sayısı gibi özet metrikleri döner.")
    @GetMapping("/system-status")
    public AdminSystemStatusResponse getSystemStatus() {
        return adminHealthService.systemStatus();
    }

    @Operation(summary = "Servislerin sağlık durumu",
               description = "Backend, PostgreSQL, AI servisi (FastAPI), MQTT broker ve Docker engine için ONLINE/OFFLINE durumlarını döner. " +
                             "Admin dashboard'ında yan panel için kullanılır.")
    @GetMapping("/service-status")
    public AdminServiceStatusResponse getServiceStatus() {
        return adminHealthService.serviceStatus();
    }
}
