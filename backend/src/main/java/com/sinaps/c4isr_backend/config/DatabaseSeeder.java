package com.sinaps.c4isr_backend.config;

import com.sinaps.c4isr_backend.model.*;
import com.sinaps.c4isr_backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Production-grade database seeder for the SINAPS C4ISR Demo.
 * Seeds tactical zones, RBAC users, military assets, and initial telemetry.
 *
 * RULES:
 * - Always checks if tables are empty before seeding (no duplicates).
 * - All passwords are BCrypt-encoded "Sinaps123@".
 * - Every asset gets an initial IDLE telemetry record to prevent map crashes.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final TacticalZoneRepository zoneRepository;
    private final AppUserRepository userRepository;
    private final AssetRepository assetRepository;
    private final TelemetryRepository telemetryRepository;
    private final PasswordEncoder passwordEncoder;

    private static final GeometryFactory GF = new GeometryFactory(new PrecisionModel(), 4326);
    private static final String DEFAULT_PASSWORD = "Sinaps123@";

    // Accumulated telemetry records for batch save
    private final List<Telemetry> telemetryBatch = new ArrayList<>();

    @Override
    public void run(String... args) {
        log.info("╔══════════════════════════════════════════════════════════════╗");
        log.info("║        SINAPS C4ISR — Production Database Seeder           ║");
        log.info("╚══════════════════════════════════════════════════════════════╝");

        Map<String, TacticalZone> zones = seedTacticalZones();
        seedUsers(zones);
        seedAssets(zones);

        // Batch-save all telemetry at once
        if (!telemetryBatch.isEmpty()) {
            telemetryRepository.saveAll(telemetryBatch);
            log.info("✅  Saved {} initial telemetry records.", telemetryBatch.size());
        }

        log.info("╔══════════════════════════════════════════════════════════════╗");
        log.info("║              SEEDING COMPLETE — SYSTEM READY                ║");
        log.info("╚══════════════════════════════════════════════════════════════╝");
    }

    // ═══════════════════════════════════════════════════════════════
    //  1. TACTICAL ZONES
    // ═══════════════════════════════════════════════════════════════

    private Map<String, TacticalZone> seedTacticalZones() {
        Map<String, TacticalZone> zoneMap = new LinkedHashMap<>();

        if (zoneRepository.count() > 0) {
            log.info("⏭  Tactical zones already seeded — loading existing.");
            // Reverse-map from zone name → internal key
            Map<String, String> nameToKey = Map.of(
                    "İzmir Çiğli 2. Ana Jet Üs Komutanlığı", "ZONE_BASE_IZMIR",
                    "Batman 14. İHA Üs Komutanlığı", "ZONE_BASE_BATMAN",
                    "Eskişehir 1. Birleştirilmiş Hava Harekat Merkezi (BHHM)", "ZONE_BASE_ESKISEHIR",
                    "Marmaris Aksaz Deniz Üssü", "ZONE_BASE_AKSAZ",
                    "Pençe-Kilit Harekat Bölgesi - Kuzey Irak", "ZONE_OP_ZAP",
                    "Bahar Kalkanı Harekat Bölgesi - Suriye", "ZONE_OP_IDLIB",
                    "Mavi Vatan - Doğu Akdeniz", "ZONE_OP_MAVI_VATAN"
            );
            zoneRepository.findAll().forEach(z -> {
                String key = nameToKey.getOrDefault(z.getName(), z.getName());
                zoneMap.put(key, z);
            });
            return zoneMap;
        }

        log.info("🌍  Seeding Tactical Zones...");

        // ── Bases ──
        zoneMap.put("ZONE_BASE_IZMIR", saveZone(
                "İzmir Çiğli 2. Ana Jet Üs Komutanlığı",
                ZoneType.BASE, 38.5085, 27.0136, 15000.0));

        zoneMap.put("ZONE_BASE_BATMAN", saveZone(
                "Batman 14. İHA Üs Komutanlığı",
                ZoneType.BASE, 37.8942, 41.1122, 12000.0));

        zoneMap.put("ZONE_BASE_ESKISEHIR", saveZone(
                "Eskişehir 1. Birleştirilmiş Hava Harekat Merkezi (BHHM)",
                ZoneType.BASE, 39.7820, 30.5400, 18000.0));

        zoneMap.put("ZONE_BASE_AKSAZ", saveZone(
                "Marmaris Aksaz Deniz Üssü",
                ZoneType.BASE, 36.8381, 28.4000, 10000.0));

        // ── Operation Zones ──
        zoneMap.put("ZONE_OP_ZAP", saveZone(
                "Pençe-Kilit Harekat Bölgesi - Kuzey Irak",
                ZoneType.OPERATION_AREA, 37.1500, 43.5000, 60000.0));

        zoneMap.put("ZONE_OP_IDLIB", saveZone(
                "Bahar Kalkanı Harekat Bölgesi - Suriye",
                ZoneType.OPERATION_AREA, 35.9300, 36.6200, 45000.0));

        zoneMap.put("ZONE_OP_MAVI_VATAN", saveZone(
                "Mavi Vatan - Doğu Akdeniz",
                ZoneType.OPERATION_AREA, 34.5000, 30.0000, 80000.0));

        log.info("✅  Seeded {} tactical zones (4 bases + 3 operation areas).", zoneMap.size());
        return zoneMap;
    }

    private TacticalZone saveZone(String name, ZoneType type, double lat, double lng, double radius) {
        TacticalZone zone = TacticalZone.builder()
                .name(name)
                .zoneType(type)
                .latitude(lat)
                .longitude(lng)
                .radiusMeters(radius)
                .build();
        return zoneRepository.save(zone);
    }

    // ═══════════════════════════════════════════════════════════════
    //  2. USERS (RBAC)
    // ═══════════════════════════════════════════════════════════════

    private void seedUsers(Map<String, TacticalZone> zones) {
        if (userRepository.count() > 0) {
            log.info("⏭  Users already seeded — skipping.");
            return;
        }

        log.info("👤  Seeding RBAC Users...");
        String encodedPassword = passwordEncoder.encode(DEFAULT_PASSWORD);

        List<AppUser> users = new ArrayList<>();

        // KARARGAH_ADMIN — no zone assignment (full access)
        users.add(createUser("genelkurmay_baskanligi", encodedPassword,
                Role.KARARGAH_ADMIN, null));

        // ORDU_KOMUTANI — assigned to base zones
        users.add(createUser("ikinci_ordu_komutani", encodedPassword,
                Role.ORDU_KOMUTANI, getZoneId(zones, "ZONE_BASE_BATMAN")));

        users.add(createUser("donanma_komutani", encodedPassword,
                Role.ORDU_KOMUTANI, getZoneId(zones, "ZONE_BASE_AKSAZ")));

        // HAREKAT_SUBAYI — assigned to operation zones or bases
        users.add(createUser("harekat_subayi_zap", encodedPassword,
                Role.HAREKAT_SUBAYI, getZoneId(zones, "ZONE_OP_ZAP")));

        users.add(createUser("harekat_subayi_idlib", encodedPassword,
                Role.HAREKAT_SUBAYI, getZoneId(zones, "ZONE_OP_IDLIB")));

        users.add(createUser("harekat_subayi_akdeniz", encodedPassword,
                Role.HAREKAT_SUBAYI, getZoneId(zones, "ZONE_OP_MAVI_VATAN")));

        users.add(createUser("izmir_harekat_mrkz", encodedPassword,
                Role.HAREKAT_SUBAYI, getZoneId(zones, "ZONE_BASE_IZMIR")));

        userRepository.saveAll(users);
        log.info("✅  Seeded {} users (1 Admin, 2 Komutan, 4 Subay).", users.size());
    }

    private AppUser createUser(String username, String encodedPw, Role role, String zoneId) {
        return AppUser.builder()
                .username(username)
                .password(encodedPw)
                .role(role)
                .assignedZoneId(zoneId)
                .build();
    }

    private String getZoneId(Map<String, TacticalZone> zones, String key) {
        TacticalZone zone = zones.get(key);
        return zone != null ? zone.getId().toString() : null;
    }

    // ═══════════════════════════════════════════════════════════════
    //  3. ASSETS & INITIAL TELEMETRY
    // ═══════════════════════════════════════════════════════════════

    private void seedAssets(Map<String, TacticalZone> zones) {
        if (assetRepository.count() > 0) {
            log.info("⏭  Assets already seeded — skipping.");
            return;
        }

        log.info("🛡  Seeding Military Assets & Initial Telemetry...");
        int totalAssets = 0;

        // ── 3a. İZMİR SPECIAL HARDWARE (isSimulated = false) ──
        String izmirZoneId = getZoneId(zones, "ZONE_BASE_IZMIR");
        double izmirLat = 38.5085, izmirLng = 27.0136;

        totalAssets += createAndSaveAsset("IZMIR-HW-DRONE-01", "İzmir Donanım İHA-01",
                AssetType.DRONE, "İzmir Çiğli üssüne konuşlanmış gerçek donanım İHA",
                false, izmirZoneId, izmirLat, izmirLng);

        totalAssets += createAndSaveAsset("IZMIR-HW-WATCH-01", "İzmir Donanım Akıllı Saat-01",
                AssetType.SOLDIER_WEARABLE, "İzmir Çiğli üssündeki askeri giyilebilir sensör (akıllı saat)",
                false, izmirZoneId, 38.5090, 27.0140);

        totalAssets += createAndSaveAsset("IZMIR-HW-SENSOR-01", "İzmir Donanım Sensör-01",
                AssetType.SENSOR, "İzmir Çiğli üssüne yerleştirilmiş çevresel algılayıcı",
                false, izmirZoneId, 38.5080, 27.0130);

        log.info("   ✔ İzmir Çiğli donanım varlıkları: 3 adet (gerçek)");

        // ── 3b. BATMAN BASE — Air Assets ──
        String batmanZoneId = getZoneId(zones, "ZONE_BASE_BATMAN");
        double batmanLat = 37.8942, batmanLng = 41.1122;

        totalAssets += seedAssetBatch("AKINCI-TIHA", AssetType.DRONE, 4,
                "Bayraktar AKINCI TIHA — ağır sınıf SİHA platformu",
                batmanZoneId, batmanLat, batmanLng, 0.005);

        totalAssets += seedAssetBatch("BAYRAKTAR-TB2", AssetType.DRONE, 8,
                "Bayraktar TB2 — taktik İHA platformu",
                batmanZoneId, batmanLat, batmanLng, 0.004);

        totalAssets += seedAssetBatch("ANKA-S", AssetType.DRONE, 3,
                "TAI ANKA-S — MALE sınıfı istihbarat/saldırı İHA",
                batmanZoneId, batmanLat, batmanLng, 0.006);

        totalAssets += seedAssetBatch("KARGU-KAMIKAZE", AssetType.DRONE, 10,
                "STM KARGU — otonom kamikaze mini İHA (sürü)",
                batmanZoneId, batmanLat, batmanLng, 0.003);

        log.info("   ✔ Batman 14. İHA Üssü: 25 hava varlığı");

        // ── 3c. ESKİŞEHİR BHHM — Strategic Air ──
        String eskisehirZoneId = getZoneId(zones, "ZONE_BASE_ESKISEHIR");
        double eskLat = 39.7820, eskLng = 30.5400;

        totalAssets += seedAssetBatch("KIZILELMA-MUIS", AssetType.DRONE, 2,
                "Bayraktar Kızılelma — Muharip İnsansız Uçak Sistemi (MİUS)",
                eskisehirZoneId, eskLat, eskLng, 0.008);

        totalAssets += seedAssetBatch("HURKUS-C", AssetType.DRONE, 4,
                "TAI HÜRKUŞ-C — hafif saldırı/eğitim uçağı",
                eskisehirZoneId, eskLat, eskLng, 0.006);

        // Single special asset: Barış Kartalı AWACS
        totalAssets += createAndSaveAsset("BARIS-KARTALI-AWACS-01", "Barış Kartalı HİK-01",
                AssetType.DRONE, "Boeing 737 AEW&C — Havadan İhbar ve Kontrol uçağı",
                true, eskisehirZoneId, eskLat + 0.01, eskLng + 0.01);

        log.info("   ✔ Eskişehir 1. BHHM: 7 stratejik hava varlığı");

        // ── 3d. İDLİB / LAND FORCES ──
        String idlibZoneId = getZoneId(zones, "ZONE_OP_IDLIB");
        double idlibLat = 35.9300, idlibLng = 36.6200;

        totalAssets += seedAssetBatch("KIRPI-II", AssetType.VEHICLE, 10,
                "BMC Kırpı II — Mayına Dayanıklı Pusu Korumalı Araç (MRAP)",
                idlibZoneId, idlibLat, idlibLng, 0.008);

        totalAssets += seedAssetBatch("VURAN", AssetType.VEHICLE, 5,
                "BMC Vuran — 4x4 taktik zırhlı araç",
                idlibZoneId, idlibLat, idlibLng, 0.006);

        totalAssets += seedAssetBatch("KORAL-EH", AssetType.ELECTRONIC_WARFARE, 2,
                "ASELSAN KORAL — Mobil Elektronik Harp Sistemi (EHS)",
                idlibZoneId, idlibLat, idlibLng, 0.010);

        log.info("   ✔ İdlib Harekat Bölgesi: 17 kara varlığı");

        // ── 3e. AKSAZ / NAVAL & AIR ──
        String aksazZoneId = getZoneId(zones, "ZONE_BASE_AKSAZ");
        double aksazLat = 36.8381, aksazLng = 28.4000;

        // TCG Anadolu — single capital ship
        totalAssets += createAndSaveAsset("TCG-ANADOLU-L400", "TCG Anadolu (L-400)",
                AssetType.SHIP, "TCG Anadolu — Çok Maksatlı Amfibi Hücum Gemisi (LHD)",
                true, aksazZoneId, aksazLat + 0.02, aksazLng - 0.05);

        totalAssets += seedAssetBatch("BAYRAKTAR-TB3", AssetType.DRONE, 4,
                "Bayraktar TB3 — kısa pistli donanma İHA (TCG Anadolu uyumlu)",
                aksazZoneId, aksazLat, aksazLng, 0.007);

        totalAssets += seedAssetBatch("AKSUNGUR", AssetType.DRONE, 2,
                "TAI Aksungur — çift motorlu MALE sınıfı deniz gözetleme İHA",
                aksazZoneId, aksazLat, aksazLng, 0.009);

        log.info("   ✔ Aksaz Deniz Üssü: 7 deniz/hava varlığı");

        log.info("✅  Seeded {} total assets with initial telemetry.", totalAssets);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPER: Batch Asset Creation with Loop
    // ═══════════════════════════════════════════════════════════════

    /**
     * Creates a batch of numbered assets with scattered positions around a base coordinate.
     *
     * @param idPrefix    Asset ID prefix (e.g., "BAYRAKTAR-TB2")
     * @param type        AssetType enum value
     * @param count       Number of assets to create
     * @param description Description template
     * @param zoneId      Assigned zone ID
     * @param baseLat     Base latitude for positioning
     * @param baseLng     Base longitude for positioning
     * @param scatter     Max offset in degrees for deterministic position scatter
     * @return Number of assets created
     */
    private int seedAssetBatch(String idPrefix, AssetType type, int count,
                               String description, String zoneId,
                               double baseLat, double baseLng, double scatter) {
        List<Asset> assets = new ArrayList<>();
        Random rng = new Random(idPrefix.hashCode()); // Deterministic scatter per batch

        for (int i = 1; i <= count; i++) {
            String seqNum = String.format("%02d", i);
            String assetId = idPrefix + "-" + seqNum;
            String assetName = idPrefix.replace("-", " ") + " " + seqNum;

            double lat = baseLat + (rng.nextDouble() - 0.5) * 2 * scatter;
            double lng = baseLng + (rng.nextDouble() - 0.5) * 2 * scatter;

            Asset asset = Asset.builder()
                    .id(assetId)
                    .name(assetName)
                    .type(type)
                    .serialNumber("SN-" + assetId)
                    .inventoryStatus("ACTIVE")
                    .isSimulated(true)
                    .assignedZoneId(zoneId)
                    .description(description)
                    .commissionDate(LocalDateTime.now().minusDays(rng.nextInt(365) + 30))
                    .build();

            assets.add(asset);

            // Queue initial telemetry
            telemetryBatch.add(buildInitialTelemetry(assetId, type, lat, lng));
        }

        assetRepository.saveAll(assets);
        return count;
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPER: Single Asset Creation
    // ═══════════════════════════════════════════════════════════════

    /**
     * Creates and saves a single asset with its initial telemetry record.
     *
     * @return 1 (for counting)
     */
    private int createAndSaveAsset(String id, String name, AssetType type,
                                   String description, boolean isSimulated,
                                   String zoneId, double lat, double lng) {
        Asset asset = Asset.builder()
                .id(id)
                .name(name)
                .type(type)
                .serialNumber("SN-" + id)
                .inventoryStatus("ACTIVE")
                .isSimulated(isSimulated)
                .assignedZoneId(zoneId)
                .description(description)
                .commissionDate(LocalDateTime.now().minusDays(90))
                .build();

        assetRepository.save(asset);

        // Queue initial telemetry
        telemetryBatch.add(buildInitialTelemetry(id, type, lat, lng));

        return 1;
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPER: Initial Telemetry Record
    // ═══════════════════════════════════════════════════════════════

    /**
     * Builds an initial IDLE telemetry record with status, battery 100%,
     * and coordinates matching the asset's base position.
     */
    private Telemetry buildInitialTelemetry(String sourceId, AssetType sourceType,
                                            double lat, double lng) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", "IDLE");
        payload.put("heading", 0.0);
        payload.put("signalStrength", -45);
        payload.put("fuelOrCharge", 100);

        return Telemetry.builder()
                .sourceId(sourceId)
                .sourceType(sourceType)
                .timestamp(LocalDateTime.now())
                .location(GF.createPoint(new Coordinate(lng, lat))) // Note: JTS uses (x=lng, y=lat)
                .altitude(0.0)
                .speed(0.0)
                .batteryLevel(100)
                .payload(payload)
                .build();
    }
}
