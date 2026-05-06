package com.sinaps.c4isr_backend.dto;

import lombok.Data;

@Data
public class DeployRequest {
    private String assetId;
    /** Target tactical zone UUID */
    private String zoneId;
    /** API alias — same semantics as {@link #zoneId} */
    private String targetZoneId;

    public String resolveZoneId() {
        if (zoneId != null && !zoneId.isBlank()) {
            return zoneId.trim();
        }
        if (targetZoneId != null && !targetZoneId.isBlank()) {
            return targetZoneId.trim();
        }
        return null;
    }
}
