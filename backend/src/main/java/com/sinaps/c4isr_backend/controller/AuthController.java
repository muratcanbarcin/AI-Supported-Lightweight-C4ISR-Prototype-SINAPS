package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.LoginRequest;
import com.sinaps.c4isr_backend.dto.LoginResponse;
import com.sinaps.c4isr_backend.model.User;
import com.sinaps.c4isr_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow frontend access
public class AuthController {

    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // TODO: Implement real password hashing. For prototype, using plain text check.
            if (user.getPassword().equals(request.getPassword())) {
                String token = UUID.randomUUID().toString(); // Simple mock token

                return ResponseEntity.ok(LoginResponse.builder()
                        .token(token)
                        .username(user.getUsername())
                        .roles(Collections.singletonList(user.getRole().name()))
                        .build());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
