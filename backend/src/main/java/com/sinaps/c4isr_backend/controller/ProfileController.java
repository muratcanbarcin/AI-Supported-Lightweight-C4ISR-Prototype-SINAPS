package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.ProfileResponse;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Asset;
import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.Task;
import com.sinaps.c4isr_backend.model.Telemetry;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.AssetRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import com.sinaps.c4isr_backend.repository.TaskRepository;
import com.sinaps.c4isr_backend.repository.TelemetryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Profile endpoints — exposes the logged-in user's aggregated profile data
 * (commander info, units under their command, active operations in their zone).
 */
@Tag(name = "Profile", description = "Logged-in user's profile aggregation (commander info, units, operations).")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private static final int UNIT_LIMIT = 12;
    private static final int OPERATION_LIMIT = 8;
    private static final List<String> ACTIVE_STATUSES = Arrays.asList("IN_PROGRESS", "EN_ROUTE", "PENDING");

    private final AppUserRepository appUserRepository;
    private final AssetRepository assetRepository;
    private final TacticalZoneRepository tacticalZoneRepository;
    private final TaskRepository taskRepository;
    private final TelemetryRepository telemetryRepository;

    @Operation(
            summary = "Mevcut kullanıcı profili",
            description = "JWT'den çözümlenen kullanıcının komutan kartı, emrindeki birlikler ve aktif operasyonlarını döner."
    )
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body("Unauthenticated");
        }

        Optional<AppUser> userOpt = appUserRepository.findByUsername(authentication.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        AppUser user = userOpt.get();

        TacticalZone zone = resolveZone(user.getAssignedZoneId());
        ProfileResponse.Commander commander = buildCommander(user, zone);

        List<Asset> assets = loadAssetsForUser(user);
        List<ProfileResponse.ResponsibleUnit> units = assets.stream()
                .limit(UNIT_LIMIT)
                .map(this::toResponsibleUnit)
                .collect(Collectors.toList());

        List<ProfileResponse.ActiveOperation> operations = loadActiveOperations(user);

        return ResponseEntity.ok(ProfileResponse.builder()
                .commander(commander)
                .responsibleUnits(units)
                .activeOperations(operations)
                .build());
    }

    // ──────────────────────────────────────────────────────────────────

    private TacticalZone resolveZone(String assignedZoneId) {
        if (assignedZoneId == null || assignedZoneId.isBlank()) {
            return null;
        }
        try {
            return tacticalZoneRepository.findById(UUID.fromString(assignedZoneId)).orElse(null);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private ProfileResponse.Commander buildCommander(AppUser user, TacticalZone zone) {
        String[] nameParts = humanizeUsername(user.getUsername());
        String firstName = nameParts[0];
        String lastName = nameParts[1];
        String fullName = (firstName + " " + lastName).trim();

        return ProfileResponse.Commander.builder()
                .username(user.getUsername())
                .role(user.getRole().name())
                .rank(rankForRole(user.getRole()))
                .roleLabel(roleLabel(user.getRole()))
                .fullName(fullName)
                .firstName(firstName)
                .lastName(lastName)
                .unitName(zone != null ? zone.getName() : defaultUnitName(user.getRole()))
                .assignedZoneId(user.getAssignedZoneId())
                .serviceTag(buildServiceTag(user))
                .build();
    }

    private List<Asset> loadAssetsForUser(AppUser user) {
        if (user.getRole() == Role.KARARGAH_ADMIN || user.getAssignedZoneId() == null) {
            return assetRepository.findAll();
        }
        return assetRepository.findByAssignedZoneId(user.getAssignedZoneId());
    }

    private ProfileResponse.ResponsibleUnit toResponsibleUnit(Asset asset) {
        Optional<Telemetry> latest = telemetryRepository.findTopBySourceIdOrderByTimestampDesc(asset.getId());
        Integer battery = latest.map(Telemetry::getBatteryLevel).orElse(null);
        String status = "ONLINE";
        if (battery != null && battery < 20) {
            status = "WARNING";
        }
        return ProfileResponse.ResponsibleUnit.builder()
                .id(asset.getId())
                .name(asset.getName())
                .type(displayType(asset.getType()))
                .status(status)
                .batteryLevel(battery)
                .build();
    }

    private List<ProfileResponse.ActiveOperation> loadActiveOperations(AppUser user) {
        List<Task> tasks;
        if (user.getRole() == Role.KARARGAH_ADMIN || user.getAssignedZoneId() == null) {
            tasks = taskRepository.findAllByOrderByCreatedAtDesc();
        } else {
            tasks = taskRepository.findByZoneIdOrderByCreatedAtDesc(user.getAssignedZoneId());
        }

        return tasks.stream()
                .filter(t -> t.getStatus() != null && ACTIVE_STATUSES.contains(t.getStatus()))
                .sorted(Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(OPERATION_LIMIT)
                .map(t -> ProfileResponse.ActiveOperation.builder()
                        .id(t.getId())
                        .name(t.getTitle())
                        .region(t.getZoneName())
                        .status(t.getStatus())
                        .taskType(t.getTaskType())
                        .createdAt(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────────
    // Mapping helpers
    // ──────────────────────────────────────────────────────────────────

    private static String displayType(AssetType type) {
        if (type == null) return "UAV";
        return switch (type) {
            case DRONE -> "UAV";
            case SOLDIER, SOLDIER_WEARABLE -> "SOLDIER";
            case VEHICLE -> "GROUND_VEHICLE";
            case SHIP -> "SHIP";
            case SENSOR -> "SENSOR";
            case ELECTRONIC_WARFARE -> "EW";
        };
    }

    private static String rankForRole(Role role) {
        return switch (role) {
            case KARARGAH_ADMIN -> "ORGENERAL";
            case ORDU_KOMUTANI -> "KORGENERAL";
            case HAREKAT_SUBAYI -> "YÜZBAŞI";
        };
    }

    private static String roleLabel(Role role) {
        return switch (role) {
            case KARARGAH_ADMIN -> "KARARGAH KOMUTANI";
            case ORDU_KOMUTANI -> "ORDU KOMUTANI";
            case HAREKAT_SUBAYI -> "HAREKAT SUBAYI";
        };
    }

    private static String defaultUnitName(Role role) {
        return switch (role) {
            case KARARGAH_ADMIN -> "GENEL KARARGAH";
            case ORDU_KOMUTANI -> "ORDU KARARGAHI";
            case HAREKAT_SUBAYI -> "HAREKAT MERKEZİ";
        };
    }

    /**
     * Turns a snake-case username like "harekat_subayi_zap" into a displayable
     * first/last name pair. Picks the first token as the name and the rest as the surname.
     */
    private static String[] humanizeUsername(String username) {
        if (username == null || username.isBlank()) {
            return new String[]{"KOMUTAN", ""};
        }
        String[] tokens = username.trim().split("[_\\s]+");
        String first = capitalize(tokens[0]);
        StringBuilder rest = new StringBuilder();
        for (int i = 1; i < tokens.length; i++) {
            if (rest.length() > 0) rest.append(' ');
            rest.append(capitalize(tokens[i]));
        }
        return new String[]{first, rest.toString()};
    }

    private static String capitalize(String word) {
        if (word == null || word.isEmpty()) return "";
        return word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase();
    }

    /**
     * Deterministic 4-digit service tag derived from the user's id (fallback to username hash).
     */
    private static String buildServiceTag(AppUser user) {
        int seed;
        if (user.getId() != null) {
            seed = Math.abs(user.getId().hashCode());
        } else {
            seed = Math.abs(user.getUsername() == null ? 0 : user.getUsername().hashCode());
        }
        int suffix = 1000 + (seed % 9000);
        return "TR-AF-" + suffix;
    }
}
