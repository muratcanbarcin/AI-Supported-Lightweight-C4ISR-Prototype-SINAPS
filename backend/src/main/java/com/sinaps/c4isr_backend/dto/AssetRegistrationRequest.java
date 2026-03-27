package com.sinaps.c4isr_backend.dto;

import com.sinaps.c4isr_backend.model.AssetType;
import lombok.Data;

@Data
public class AssetRegistrationRequest {
    private String id;
    private AssetType type;
    private Boolean isSimulated;
    private Double initialLatitude;
    private Double initialLongitude;
    private String assignedZoneId;
}
