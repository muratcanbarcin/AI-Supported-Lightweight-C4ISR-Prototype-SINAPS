package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.LoginRequest;
import com.sinaps.c4isr_backend.dto.LoginResponse;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Tag(
    name = "Authentication",
    description = "Kullanıcı kimlik doğrulama. Login başarılı olursa JWT döner; bu token Swagger UI üzerindeki \"Authorize\" butonuna girilerek korumalı endpointler test edilebilir."
)
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Operation(
        summary = "Login (kullanıcı adı + parola → JWT)",
        description = "Kullanıcıyı doğrular ve 24 saat geçerli bir JWT döner. Token'ı sonraki isteklerde `Authorization: Bearer <token>` header'ında kullanın."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login başarılı, token döndü"),
        @ApiResponse(responseCode = "401", description = "Geçersiz kullanıcı adı veya parola")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<AppUser> userOpt = appUserRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                String token = jwtUtil.generateToken(user);
                return ResponseEntity.ok(LoginResponse.builder()
                        .token(token)
                        .username(user.getUsername())
                        .role(user.getRole().name())
                        .build());
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
