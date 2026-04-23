package com.sinaps.c4isr_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "assets")
public class Asset {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., "TB2-001"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type; // DRONE, VEHICLE, etc.

    private String serialNumber;

    // Status in inventory: ACTIVE, MAINTENANCE, RETIRED
    private String inventoryStatus;

    private LocalDateTime commissionDate;

    @Column(length = 2000)
    private String description;

    @Builder.Default
    @Column(name = "is_simulated", nullable = false)
    private Boolean isSimulated = true;

    @Column(name = "assigned_zone_id")
    private String assignedZoneId;

    @PrePersist
    protected void onCreate() {
        if (inventoryStatus == null) {
            inventoryStatus = "ACTIVE";
        }
        if (commissionDate == null) {
            commissionDate = LocalDateTime.now();
        }
        if (isSimulated == null) {
            isSimulated = true;
        }
    }
}
