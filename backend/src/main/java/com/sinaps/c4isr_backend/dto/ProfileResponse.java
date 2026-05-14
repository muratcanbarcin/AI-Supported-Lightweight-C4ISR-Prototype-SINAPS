package com.sinaps.c4isr_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Aggregated profile payload for the logged-in user.
 * Powers the /api/v1/auth/me endpoint and the frontend Profile page.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Commander commander;
    private List<ResponsibleUnit> responsibleUnits;
    private List<ActiveOperation> activeOperations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Commander {
        private String username;
        private String role;            // raw enum: KARARGAH_ADMIN | ORDU_KOMUTANI | HAREKAT_SUBAYI
        private String rank;            // Display rank derived from role
        private String roleLabel;       // Display label derived from role
        private String fullName;        // Derived from username
        private String firstName;
        private String lastName;
        private String unitName;        // Assigned zone name (or "GENEL KARARGAH")
        private String assignedZoneId;
        private String serviceTag;      // e.g. TR-AF-XXXX (derived deterministic)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponsibleUnit {
        private String id;
        private String name;
        private String type;            // UAV | SOLDIER | GROUND_VEHICLE | SHIP | SENSOR | EW
        private String status;          // ONLINE | WARNING | OFFLINE
        private Integer batteryLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActiveOperation {
        private Long id;
        private String name;            // task title
        private String region;          // zone name
        private String status;          // task status
        private String taskType;
        private LocalDateTime createdAt;
    }
}
