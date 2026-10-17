package com.sinaps.c4isr_backend.service;

import com.sinaps.c4isr_backend.dto.LoginRequest;
import com.sinaps.c4isr_backend.dto.LoginResponse;
import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import com.sinaps.c4isr_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public Optional<LoginResponse> authenticate(LoginRequest request) {
        Optional<AppUser> userOpt = appUserRepository.findByUsername(request.getUsername());

        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return Optional.of(LoginResponse.builder()
                        .token(jwtUtil.generateToken(user))
                        .username(user.getUsername())
                        .role(user.getRole().name())
                        .build());
            }
        }

        return Optional.empty();
    }
}
