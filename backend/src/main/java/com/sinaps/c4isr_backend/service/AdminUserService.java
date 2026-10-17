package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.dto.AdminCreateUserRequest;
import com.sinaps.c4isr_backend.dto.AdminUserResponse;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {

    private final AppUserRepository appUserRepository;
    private final TacticalZoneRepository tacticalZoneRepository;
    private final PasswordEncoder passwordEncoder;

    public List<AdminUserResponse> listUsers() {
        return appUserRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getRole(),
                        user.getAssignedZoneId()
                ))
                .toList();
    }

    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        if (request.getUsername() == null || request.getPassword() == null || request.getRole() == null) {
            throw new IllegalArgumentException("username, password and role are required");
        }

        String normalizedUsername = request.getUsername().trim();
        if (normalizedUsername.isEmpty()) {
            throw new IllegalArgumentException("username cannot be empty");
        }

        String normalizedPassword = request.getPassword().trim();
        if (normalizedPassword.isEmpty()) {
            throw new IllegalArgumentException("password cannot be empty");
        }

        if (appUserRepository.findByUsername(normalizedUsername).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        String assignedZoneId = normalizeNullable(request.getAssignedZoneId());
        if (request.getRole() == Role.HAREKAT_SUBAYI && assignedZoneId == null) {
            throw new IllegalArgumentException("assignedZoneId is required for HAREKAT_SUBAYI");
        }
        if (assignedZoneId != null) {
            try {
                UUID zoneId = UUID.fromString(assignedZoneId);
                if (!tacticalZoneRepository.existsById(zoneId)) {
                    throw new IllegalArgumentException("assignedZoneId does not match any TacticalZone");
                }
            } catch (IllegalArgumentException ex) {
                if ("assignedZoneId does not match any TacticalZone".equals(ex.getMessage())) {
                    throw ex;
                }
                throw new IllegalArgumentException("assignedZoneId must be a valid UUID");
            }
        }

        try {
            AppUser user = new AppUser();
            user.setUsername(normalizedUsername);
            user.setPassword(passwordEncoder.encode(normalizedPassword));
            user.setRole(request.getRole());
            user.setAssignedZoneId(assignedZoneId);

            log.info("Creating user={} role={} assignedZoneId={}",
                    normalizedUsername,
                    request.getRole(),
                    assignedZoneId);

            AppUser savedUser = appUserRepository.save(user);
            return new AdminUserResponse(
                    savedUser.getId(),
                    savedUser.getUsername(),
                    savedUser.getRole(),
                    savedUser.getAssignedZoneId()
            );
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to create admin user for username={}", normalizedUsername, ex);
            throw new IllegalStateException("User creation failed", ex);
        }
    }

    public boolean deleteUser(UUID id) {
        if (!appUserRepository.existsById(id)) {
            return false;
        }
        appUserRepository.deleteById(id);
        return true;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
