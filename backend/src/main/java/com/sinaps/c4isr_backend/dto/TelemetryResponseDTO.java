package com.sinaps.c4isr_backend.dto;

import com.sinaps.c4isr_backend.model.AssetType;
import com.sinaps.c4isr_backend.model.Telemetry;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Data
@Builder
@com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
public class TelemetryResponseDTO {
    private Long id;
    private String sourceId;
    private AssetType sourceType;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private Double altitude;
    private Double speed;
    private Integer batteryLevel;
    private String alignment;
    private Integer threatLevel;
    private Boolean isSimulated;
    private Map<String, Object> payload;

    public static TelemetryResponseDTO fromEntity(Telemetry t) {
        Map<String, Object> cleanPayload = null;
        String alignment = "FRIEND"; 
        Integer threatLevel = 0;
        Boolean isSimulated = true;

        if (t.getPayload() != null) {
            cleanPayload = new HashMap<>(t.getPayload());
            cleanPayload.values().removeIf(v -> v == null);

            if (t.getPayload().containsKey("alignment")) {
                Object alignObj = t.getPayload().get("alignment");
                if (alignObj != null && !alignObj.toString().equalsIgnoreCase("UNKNOWN")) {
                    alignment = alignObj.toString();
                }
            }
            
            if ("FRIEND".equalsIgnoreCase(alignment)) {
                threatLevel = 0;
            } else {
                if (t.getPayload().containsKey("threat_level")) {
                    Object tl = t.getPayload().get("threat_level");
                    if (tl instanceof Number) {
                        threatLevel = ((Number) tl).intValue();
                    }
                }
                
                if (threatLevel == 0 && "FOE".equalsIgnoreCase(alignment)) {
                     threatLevel = 50;
                }
            }

            if (t.getPayload().containsKey("is_simulated")) {
                Object simObj = t.getPayload().get("is_simulated");
                if (simObj instanceof Boolean) {
                    isSimulated = (Boolean) simObj;
                }
            }

            if (cleanPayload.isEmpty())
                cleanPayload = null;
        }

        return TelemetryResponseDTO.builder()
                .id(t.getId())
                .sourceId(t.getSourceId())
                .sourceType(t.getSourceType())
                .timestamp(t.getTimestamp())
                .latitude(t.getLocation() != null ? t.getLocation().getY() : null)
                .longitude(t.getLocation() != null ? t.getLocation().getX() : null)
                .altitude(t.getAltitude())
                .speed(t.getSpeed() != null ? t.getSpeed() : 0.0)
                .batteryLevel(t.getBatteryLevel())
                .alignment(alignment)
                .threatLevel(threatLevel)
                .isSimulated(isSimulated)
                .payload(cleanPayload)
                .build();
    }
}
