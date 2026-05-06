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
            telemetryBatch.clear();
        }

        backfillNavalFleetIfMissing();

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
            ensureGolcukZonePresent();
            log.info("⏭  Tactical zones already seeded — loading existing.");
            // Reverse-map from zone name → internal key
            Map<String, String> nameToKey = Map.of(
                    "İzmir Çiğli 2. Ana Jet Üs Komutanlığı", "ZONE_BASE_IZMIR",
                    "Batman 14. İHA Üs Komutanlığı", "ZONE_BASE_BATMAN",
                    "Eskişehir 1. Birleştirilmiş Hava Harekat Merkezi (BHHM)", "ZONE_BASE_ESKISEHIR",
                    "Gölcük Deniz Ana Üssü", "ZONE_BASE_GOLCUK",
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

        zoneMap.put("ZONE_BASE_GOLCUK", saveZone(
                "Gölcük Deniz Ana Üssü",
                ZoneType.BASE, 40.7170, 29.8160, 12000.0));

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

        log.info("✅  Seeded {} tactical zones (5 bases + 3 operation areas).", zoneMap.size());
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

    /** Eski veritabanlarında Gölcük eksikse ekle (donanma senaryosu). */
    private void ensureGolcukZonePresent() {
        boolean hasGolcuk = zoneRepository.findAll().stream()
                .anyMatch(z -> z.getName() != null && z.getName().contains("Gölcük"));
        if (!hasGolcuk) {
            saveZone("Gölcük Deniz Ana Üssü", ZoneType.BASE, 40.7170, 29.8160, 12000.0);
            log.info("✅  Eksik Gölcük Deniz Ana Üssü bölgesi eklendi.");
        }
    }

    /**
     * Varlık tablosu dolu ama donanma gemileri yoksa (eski seed) Gölcük/Aksaz envanterini tamamla.
     */
    private void backfillNavalFleetIfMissing() {
        if (assetRepository.existsById("TCG-ANADOLU-L400")) {
            return;
        }
        TacticalZone golcuk = zoneRepository.findAll().stream()
                .filter(z -> z.getName() != null && z.getName().contains("Gölcük"))
                .findFirst()
                .orElse(null);
        TacticalZone aksaz = zoneRepository.findAll().stream()
                .filter(z -> z.getName() != null && z.getName().contains("Aksaz"))
                .findFirst()
                .orElse(null);
        if (golcuk == null) {
            log.warn("⚠  Gölcük bölgesi yok — donanma backfill atlandı.");
            return;
        }

        double gLat = golcuk.getLatitude();
        double gLng = golcuk.getLongitude();
        persistStandaloneNavalUnit("TCG-ANADOLU-L400", "TCG-ANADOLU-L400", AssetType.SHIP,
                "TCG Anadolu (L-400)", golcuk, gLat + 0.008, gLng - 0.012);
        persistStandaloneNavalUnit("TCG-ISTANBUL-F515", "TCG-ISTANBUL-F515", AssetType.SHIP,
                "TCG İstanbul (F-515)", golcuk, gLat - 0.006, gLng + 0.010);
        persistStandaloneNavalUnit("AKSUNGUR-DZKK-01", "AKSUNGUR-DZKK-01", AssetType.DRONE,
                "TAI Aksungur DZKK", golcuk, gLat + 0.004, gLng + 0.006);
        persistStandaloneNavalUnit("TB3-DONANMA-01", "TB3-DONANMA-01", AssetType.DRONE,
                "Bayraktar TB3 Donanma", golcuk, gLat + 0.002, gLng - 0.004);
        persistStandaloneNavalUnit("SAT-KOMANDO-TIM-1", "SAT-Komando-Tim-1", AssetType.SOLDIER,
                "SAT komando timi", golcuk, gLat + 0.003, gLng + 0.003);

        if (aksaz != null) {
            double aLat = aksaz.getLatitude();
            double aLng = aksaz.getLongitude();
            persistStandaloneNavalUnit("TCG-KINALIADA-F514", "TCG-KINALIADA-F514", AssetType.SHIP,
                    "TCG Kınalıada (F-514)", aksaz, aLat + 0.005, aLng - 0.008);
            persistStandaloneNavalUnit("TCG-BURGAZADA-P122", "TCG-BURGAZADA-P122", AssetType.SHIP,
                    "TCG Burgazada (P-122)", aksaz, aLat - 0.004, aLng + 0.006);
            persistStandaloneNavalUnit("AKSAZ-TB3-01", "AKSAZ-TB3-01", AssetType.DRONE,
                    "TB3 Aksaz görev", aksaz, aLat, aLng + 0.003);
        }
        log.info("✅  Donanma envanteri backfill tamamlandı (Gölcük{}).",
                aksaz != null ? " + Aksaz" : "");
    }

    private void persistStandaloneNavalUnit(String id, String displayName, AssetType type,
                                            String description, TacticalZone zone, double lat, double lng) {
        if (assetRepository.existsById(id)) {
            return;
        }
        String zid = zone.getId().toString();
        Asset asset = Asset.builder()
                .id(id)
                .name(displayName)
                .type(type)
                .serialNumber("SN-" + id)
                .inventoryStatus("ACTIVE")
                .isSimulated(true)
                .assignedZoneId(zid)
                .description(description)
                .commissionDate(LocalDateTime.now().minusDays(60))
                .build();
        assetRepository.save(asset);
        telemetryRepository.save(buildInitialTelemetry(id, type, lat, lng, zid, zone.getName(), true));
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
                Role.ORDU_KOMUTANI, getZoneId(zones, "ZONE_BASE_GOLCUK")));

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

        TacticalZone izmir = zones.get("ZONE_BASE_IZMIR");
        TacticalZone batman = zones.get("ZONE_BASE_BATMAN");
        TacticalZone eskisehir = zones.get("ZONE_BASE_ESKISEHIR");
        TacticalZone idlib = zones.get("ZONE_OP_IDLIB");
        TacticalZone zap = zones.get("ZONE_OP_ZAP");
        TacticalZone mavi = zones.get("ZONE_OP_MAVI_VATAN");
        TacticalZone golcuk = Optional.ofNullable(zones.get("ZONE_BASE_GOLCUK"))
                .orElse(zones.get("ZONE_BASE_AKSAZ"));
        TacticalZone aksaz = zones.get("ZONE_BASE_AKSAZ");
        if (izmir == null || batman == null || eskisehir == null || idlib == null || golcuk == null || aksaz == null) {
            throw new IllegalStateException("Seeder requires all tactical zone keys (including Gölcük or Aksaz).");
        }

        // ── 3a. İZMİR SPECIAL HARDWARE (isSimulated = false) ──
        totalAssets += createAndSaveAsset("IZMIR-HW-DRONE-01", "İzmir Donanım İHA-01",
                AssetType.DRONE, "İzmir Çiğli üssüne konuşlanmış gerçek donanım İHA",
                false, izmir, 38.5085, 27.0136);

        totalAssets += createAndSaveAsset("IZMIR-HW-WATCH-01", "İzmir Donanım Akıllı Saat-01",
                AssetType.SOLDIER_WEARABLE, "İzmir Çiğli üssündeki askeri giyilebilir sensör (akıllı saat)",
                false, izmir, 38.5090, 27.0140);

        totalAssets += createAndSaveAsset("IZMIR-HW-SENSOR-01", "İzmir Donanım Sensör-01",
                AssetType.SENSOR, "İzmir Çiğli üssüne yerleştirilmiş çevresel algılayıcı",
                false, izmir, 38.5080, 27.0130);

        log.info("   ✔ İzmir Çiğli donanım varlıkları: 3 adet (gerçek)");

        // ── 3b. BATMAN — 161. Filo (Yarasa) & taktik İHA ──
        totalAssets += seedAssetBatch("161-FILO-YARASA-TB2", AssetType.DRONE, 5,
                "161. Filo (Yarasa) — Bayraktar TB2 taktik İHA",
                batman, 37.8942, 41.1122, 0.004);

        totalAssets += seedAssetBatch("AKINCI-TIHA", AssetType.DRONE, 3,
                "181. Filo — Bayraktar AKINCI ağır sınıf SİHA",
                batman, 37.8942, 41.1122, 0.005);

        totalAssets += seedAssetBatch("ANKA-S", AssetType.DRONE, 2,
                "TAI ANKA-S — MALE istihbarat/saldırı İHA",
                batman, 37.8942, 41.1122, 0.006);

        totalAssets += seedAssetBatch("KARGU-KAMIKAZE", AssetType.DRONE, 4,
                "STM KARGU — otonom kamikaze mini İHA (sürü)",
                batman, 37.8942, 41.1122, 0.003);

        log.info("   ✔ Batman 14. İHA Üssü: hava varlıkları");

        // ── 3c. ESKİŞEHİR BHHM — stratejik hava ──
        totalAssets += seedAssetBatch("KIZILELMA-MUIS", AssetType.DRONE, 2,
                "Bayraktar Kızılelma MİUS",
                eskisehir, 39.7820, 30.5400, 0.008);

        totalAssets += seedAssetBatch("HURKUS-C", AssetType.DRONE, 3,
                "TAI HÜRKUŞ-C — hafif saldırı/eğitim uçağı",
                eskisehir, 39.7820, 30.5400, 0.006);

        totalAssets += createAndSaveAsset("BARIS-KARTALI-AWACS-01", "Barış Kartalı HİK-01",
                AssetType.DRONE, "Boeing 737 AEW&C — Havadan İhbar ve Kontrol uçağı",
                true, eskisehir, 39.7920, 30.5500);

        log.info("   ✔ Eskişehir 1. BHHM: stratejik hava varlıkları");

        // ── 3d. İDLİB — kara & özel kuvvet ──
        totalAssets += seedAssetBatch("KIRPI-II", AssetType.VEHICLE, 5,
                "BMC Kırpı II MRAP",
                idlib, 35.9300, 36.6200, 0.008);

        totalAssets += seedAssetBatch("VURAN", AssetType.VEHICLE, 3,
                "BMC Vuran 4x4 taktik zırhlı",
                idlib, 35.9300, 36.6200, 0.006);

        totalAssets += createAndSaveAsset("JOH-TIM-ALFA", "JÖH-Tim-Alfa",
                AssetType.SOLDIER, "Jandarma Özel Harekât timi — taktik piyade",
                true, idlib, 35.9310, 36.6210);

        totalAssets += createAndSaveAsset("BORDO-BERELI-TIM-1", "Bordo-Bereli-Tim-1",
                AssetType.SOLDIER, "Özel Kuvvetler Komutanlığı — müşterek görev timi",
                true, idlib, 35.9290, 36.6190);

        totalAssets += seedAssetBatch("KORAL-EH", AssetType.ELECTRONIC_WARFARE, 2,
                "ASELSAN KORAL mobil EHS",
                idlib, 35.9300, 36.6200, 0.010);

        log.info("   ✔ İdlib Harekat Bölgesi: kara ve özel kuvvet");

        // ── 3d-2. Pençe-Kilit & Mavi Vatan — harekât bölgelerine dağıtılmış kuvvetler ──
        if (zap != null) {
            totalAssets += seedAssetBatch("PENCE-KIRPI", AssetType.VEHICLE, 4,
                    "Pençe-Kilit — Kırpı II MRAP",
                    zap, 37.1500, 43.5000, 0.025);
            totalAssets += seedAssetBatch("PENCE-TB2", AssetType.DRONE, 4,
                    "Pençe-Kilit — TB2 keşif",
                    zap, 37.1500, 43.5000, 0.028);
            totalAssets += seedAssetBatch("PENCE-JOH", AssetType.SOLDIER, 3,
                    "Pençe-Kilit — JÖH timi",
                    zap, 37.1500, 43.5000, 0.020);
            log.info("   ✔ Pençe-Kilit harekât bölgesi: kara/hava");
        }
        if (mavi != null) {
            totalAssets += seedAssetBatch("MAVI-TB2", AssetType.DRONE, 4,
                    "Mavi Vatan — TB2 deniz gözetleme",
                    mavi, 34.5000, 30.0000, 0.04);
            totalAssets += seedAssetBatch("MAVI-GEMI", AssetType.SHIP, 3,
                    "Mavi Vatan — devriye gemisi (simüle)",
                    mavi, 34.5000, 30.0000, 0.035);
            totalAssets += seedAssetBatch("MAVI-SAT", AssetType.SOLDIER, 2,
                    "Mavi Vatan — SAT destek timi",
                    mavi, 34.5000, 30.0000, 0.025);
            log.info("   ✔ Mavi Vatan harekât bölgesi: deniz/hava");
        }

        // ── 3e. GÖLCÜK DENİZ ANA ÜSSÜ — Donanma envanteri (TSK) ──
        double gLat = golcuk.getLatitude();
        double gLng = golcuk.getLongitude();

        totalAssets += createAndSaveAsset("TCG-ANADOLU-L400", "TCG-ANADOLU-L400",
                AssetType.SHIP, "TCG Anadolu (L-400) — Çok Maksatlı Amfibi Hücum Gemisi",
                true, golcuk, gLat + 0.008, gLng - 0.012);

        totalAssets += createAndSaveAsset("TCG-ISTANBUL-F515", "TCG-ISTANBUL-F515",
                AssetType.SHIP, "TCG İstanbul (F-515) — MİLGEM sınıfı firkateyn",
                true, golcuk, gLat - 0.006, gLng + 0.010);

        totalAssets += createAndSaveAsset("AKSUNGUR-DZKK-01", "AKSUNGUR-DZKK-01",
                AssetType.DRONE, "TAI Aksungur — Deniz Kuvvetleri gözetleme İHA",
                true, golcuk, gLat + 0.004, gLng + 0.006);

        totalAssets += createAndSaveAsset("TB3-DONANMA-01", "TB3-DONANMA-01",
                AssetType.DRONE, "Bayraktar TB3 — LHD/Amfibi harekât uyumlu İHA",
                true, golcuk, gLat + 0.002, gLng - 0.004);

        totalAssets += createAndSaveAsset("SAT-KOMANDO-TIM-1", "SAT-Komando-Tim-1",
                AssetType.SOLDIER, "Sualtı Taarruz (SAT) komando timi",
                true, golcuk, gLat + 0.003, gLng + 0.003);

        log.info("   ✔ Gölcük Deniz Ana Üssü: donanma envanteri");

        // ── 3f. AKSAZ — ikinci deniz üssü ──
        double aLat = aksaz.getLatitude();
        double aLng = aksaz.getLongitude();
        totalAssets += createAndSaveAsset("TCG-KINALIADA-F514", "TCG-KINALIADA-F514",
                AssetType.SHIP, "TCG Kınalıada (F-514) — MİLGEM",
                true, aksaz, aLat + 0.006, aLng - 0.010);
        totalAssets += createAndSaveAsset("TCG-BURGAZADA-P122", "TCG-BURGAZADA-P122",
                AssetType.SHIP, "TCG Burgazada (P-122) — hücumbot",
                true, aksaz, aLat - 0.005, aLng + 0.008);
        totalAssets += seedAssetBatch("AKSAZ-PATROL-TICG", AssetType.SHIP, 2,
                "Aksaz deniz devriye gemisi (simüle)",
                aksaz, aLat, aLng, 0.004);
        totalAssets += seedAssetBatch("AKSAZ-TB3", AssetType.DRONE, 3,
                "Aksaz TB3 görev İHA",
                aksaz, aLat, aLng, 0.006);

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
                               String description, TacticalZone zone,
                               double baseLat, double baseLng, double scatter) {
        List<Asset> assets = new ArrayList<>();
        Random rng = new Random(idPrefix.hashCode()); // Deterministic scatter per batch
        String zoneId = zone.getId().toString();

        for (int i = 1; i <= count; i++) {
            String seqNum = String.format("%02d", i);
            String assetId = idPrefix + "-" + seqNum;
            // name = id → telemetry.source_id ile birebir; bölge filtreleri ve harita eşlemesi tutarlı

            double lat = baseLat + (rng.nextDouble() - 0.5) * 2 * scatter;
            double lng = baseLng + (rng.nextDouble() - 0.5) * 2 * scatter;

            Asset asset = Asset.builder()
                    .id(assetId)
                    .name(assetId)
                    .type(type)
                    .serialNumber("SN-" + assetId)
                    .inventoryStatus("ACTIVE")
                    .isSimulated(true)
                    .assignedZoneId(zoneId)
                    .description(description)
                    .commissionDate(LocalDateTime.now().minusDays(rng.nextInt(365) + 30))
                    .build();

            assets.add(asset);

            telemetryBatch.add(buildInitialTelemetry(assetId, type, lat, lng, zoneId, zone.getName(), true));
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
                                   TacticalZone zone, double lat, double lng) {
        String zoneId = zone.getId().toString();
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

        telemetryBatch.add(buildInitialTelemetry(id, type, lat, lng, zoneId, zone.getName(), isSimulated));

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
                                            double lat, double lng,
                                            String deploymentZoneId, String deploymentZoneName,
                                            boolean isSimulated) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("status", "IDLE");
        payload.put("heading", 0.0);
        payload.put("signalStrength", -45);
        payload.put("fuelOrCharge", 100);
        payload.put("battery", 100);
        payload.put("deployment_zone_id", deploymentZoneId);
        payload.put("deployment_zone", deploymentZoneName);
        payload.put("is_simulated", isSimulated);
        payload.put("threatLevel", "NORMAL");

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
