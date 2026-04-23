package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.AppUser;
import com.sinaps.c4isr_backend.model.Role;
import com.sinaps.c4isr_backend.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * @deprecated Replaced by {@link DatabaseSeeder} for production-grade demo seeding.
 * Kept for reference only. Remove @Component to prevent duplicate seeding.
 */
// @Component — DISABLED: Use DatabaseSeeder instead
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // NO-OP: Superseded by DatabaseSeeder
    }
}

