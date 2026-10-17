package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.ProfileResponse;
import com.sinaps.c4isr_backend.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Profile endpoints — exposes the logged-in user's aggregated profile data
 * (commander info, units under their command, active operations in their zone).
 */
@Tag(name = "Profile", description = "Logged-in user's profile aggregation (commander info, units, operations).")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

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

        Optional<ProfileResponse> profile = profileService.getProfile(authentication.getName());
        if (profile.isEmpty()) {
            return ResponseEntity.status(404).body("User not found");
        }
        return ResponseEntity.ok(profile.get());
    }
}
