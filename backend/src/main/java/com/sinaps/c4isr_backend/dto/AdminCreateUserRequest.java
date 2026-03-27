package com.sinaps.c4isr_backend.dto;

import com.sinaps.c4isr_backend.model.Role;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    private String username;
    private String password;
    private Role role;
    private String assignedZoneId;
}
