package com.sinaps.c4isr_backend.controller;

import com.sinaps.c4isr_backend.dto.LoginRequest;
import com.sinaps.c4isr_backend.dto.LoginResponse;
import com.sinaps.c4isr_backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@Tag(
    name = "Authentication",
    description = "Kullanıcı kimlik doğrulama. Login başarılı olursa JWT döner; bu token Swagger UI üzerindeki \"Authorize\" butonuna girilerek korumalı endpointler test edilebilir."
)
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
        Optional<LoginResponse> session = authService.authenticate(request);
        if (session.isPresent()) {
            return ResponseEntity.ok(session.get());
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
