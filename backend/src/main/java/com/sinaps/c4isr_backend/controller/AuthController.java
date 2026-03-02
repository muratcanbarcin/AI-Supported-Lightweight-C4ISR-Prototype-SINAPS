package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.LoginRequest;
import com.sinaps.c4isr_backend.dto.LoginResponse;
import com.sinaps.c4isr_backend.model.User;
import com.sinaps.c4isr_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Check if user is active
            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Account is deactivated");
            }

            // Plain text password check (prototype)
            if (user.getPassword().equals(request.getPassword())) {
                String token = UUID.randomUUID().toString();

                // Update last login timestamp
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);

                return ResponseEntity.ok(LoginResponse.builder()
                        .token(token)
                        .username(user.getUsername())
                        .roles(Collections.singletonList(user.getRole().name()))
                        .fullName(user.getFullName())
                        .rank(user.getRank())
                        .build());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
