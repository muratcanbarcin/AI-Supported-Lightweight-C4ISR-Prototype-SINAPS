package com.sinaps.c4isr_backend.dto;

import com.sinaps.c4isr_backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class AdminUserResponse {
    private UUID id;
    private String username;
    private Role role;
    private String assignedZoneId;
}
