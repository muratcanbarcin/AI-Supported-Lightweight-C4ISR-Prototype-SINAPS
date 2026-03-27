package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (appUserRepository.count() == 0) {
            AppUser admin = AppUser.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.KARARGAH_ADMIN)
                    .build();

            appUserRepository.save(admin);
        }
    }
}
