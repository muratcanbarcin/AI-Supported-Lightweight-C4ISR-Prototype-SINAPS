package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.ZoneType;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;

/**
 * @deprecated Replaced by {@link DatabaseSeeder} for production-grade demo seeding.
 * Kept for reference only. Remove @Component to prevent duplicate seeding.
 */
// @Component — DISABLED: Use DatabaseSeeder instead
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TacticalZoneRepository zoneRepository;

    @Override
    public void run(String... args) throws Exception {
        // NO-OP: Superseded by DatabaseSeeder
    }
}

