package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.TacticalZone;
import com.sinaps.c4isr_backend.model.ZoneType;
import com.sinaps.c4isr_backend.repository.TacticalZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TacticalZoneRepository zoneRepository;

    @Override
    public void run(String... args) throws Exception {
        seedTacticalZones();
    }

    private void seedTacticalZones() {
        if (zoneRepository.count() > 0) {
            return;
        }

        zoneRepository.save(TacticalZone.builder()
                .name("2. Ordu K. (Malatya)")
                .zoneType(ZoneType.BASE)
                .latitude(38.3552)
                .longitude(38.3095)
                .radiusMeters(20000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("8. Ana Jet Üssü (Diyarbakır)")
                .zoneType(ZoneType.BASE)
                .latitude(37.8931)
                .longitude(40.2007)
                .radiusMeters(15000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("14. İUS Üs K. (Batman)")
                .zoneType(ZoneType.BASE)
                .latitude(37.9272)
                .longitude(41.1213)
                .radiusMeters(12000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("3. Piyade Tümeni (Yüksekova)")
                .zoneType(ZoneType.BASE)
                .latitude(37.5753)
                .longitude(44.2882)
                .radiusMeters(18000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("Gölcük Donanma Ana Üssü")
                .zoneType(ZoneType.BASE)
                .latitude(40.7188)
                .longitude(29.8226)
                .radiusMeters(10000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("Kuzey Irak / Zap Operasyon Bölgesi")
                .zoneType(ZoneType.OPERATION_AREA)
                .latitude(37.1500)
                .longitude(43.5000)
                .radiusMeters(60000.0)
                .build());

        zoneRepository.save(TacticalZone.builder()
                .name("Pençe-Kilit Harekat Bölgesi")
                .zoneType(ZoneType.OPERATION_AREA)
                .latitude(37.0800)
                .longitude(43.0500)
                .radiusMeters(45000.0)
                .build());

        System.out.println("SEEDED 7 TACTICAL ZONES (5 bases + 2 operation areas)");
    }
}
