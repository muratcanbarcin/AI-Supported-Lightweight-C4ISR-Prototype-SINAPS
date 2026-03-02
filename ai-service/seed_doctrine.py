#!/usr/bin/env python3
"""
============================================================================
    C4ISR — SEED DOCTRINE v2.0 (Tactical Memory Population)
============================================================================
    Populates the `tactical_memory` table with 30 categorised TSK
    engagement rules and standard operating procedures.

    Categories:
        1. HAVA_SAHASI_IHA      — Airspace & UAV operations
        2. KARA_BIRLIKLERI      — Ground forces & combat
        3. SAGLIK_BIYOMETRI     — Medical & biometrics
        4. LOJISTIK_ARAC        — Logistics & vehicles
        5. SIBER_ELEKTRONIK     — Cyber & electronic warfare

    Each rule is embedded using all-MiniLM-L6-v2 (384 dims) and stored
    with its pgvector embedding for cosine similarity search.

    Usage:
        cd ai-service
        python seed_doctrine.py

    Prerequisites:
        - PostgreSQL running (docker compose up -d)
        - pgvector extension enabled
        - local_models/embedding/ directory present
============================================================================
"""

import sys
import time
from pathlib import Path

# ── Ensure project root is in sys.path ──────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config.settings import settings
from config.database import initialize_database, close_database
from services.rag_engine import rag_engine

# ====================================================================
#                  TSK ENGAGEMENT RULES & DOCTRINE v2.0
# ====================================================================
# 30 detailed, semantically distinct rules across 5 operational categories.
# Written in Turkish to maximize embedding similarity with Turkish queries.

DOCTRINE: list[dict] = [

    # ================================================================
    #  1. HAVA SAHASI & İHA (Airspace / UAV)  —  6 rules
    # ================================================================
    {
        "context": (
            "KURAL: İHA batarya seviyesi %20'nin altına düşerse, "
            "derhal RTH (Return-to-Home) prosedürü başlatılmalıdır. "
            "Mevcut görev iptal edilir, en yakın iniş noktasına yönlendirilir. "
            "Batarya %10 altında mecburi otonom iniş devreye girer. "
            "Kurtarma ekibine bilgi verilir."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-IHA-SOP-001",
    },
    {
        "context": (
            "KURAL: Tanımlanmamış İHA, harekat alanına 5 km'den fazla yaklaşırsa "
            "TEHDİT SEVİYESİ YÜKSEK olarak değerlendirilir. IFF (Identify Friend or Foe) "
            "sorgulaması yapılır. 3 dakika içinde yanıt alınamazsa düşman keşif aracı "
            "olarak kabul edilir. Elektronik karıştırma ve fiziksel müdahale "
            "prosedürü başlatılır."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-HAVADEF-002",
    },
    {
        "context": (
            "KURAL: İHA irtifa anomalisi (±200m ani değişim) veya düzensiz hız "
            "paterni tespit edilirse, olası arıza veya siber saldırı olarak "
            "değerlendirilir. TEHDİT SEVİYESİ ORTA. Otonom kontrol devre dışı "
            "bırakılır, manuel kontrole geçilir. Siber güvenlik birimi bilgilendirilir."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-IHA-SOP-003",
    },
    {
        "context": (
            "KURAL: IFF (Dost-Düşman Tanıma) sistemi arızalanırsa, ilgili hava "
            "aracı derhal güvenli bölgeye çekilir. IFF yanıt vermeyen platform, "
            "teyit edilene kadar düşman olarak kabul edilir. Hava savunma birimi "
            "alarm durumuna geçer. Görsel teyit prosedürü uygulanır."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-HAVADEF-004",
    },
    {
        "context": (
            "KURAL: İHA üzerinde RF karıştırma (jamming) tespit edilirse, otonom "
            "navigasyon aktif edilir. GPS reddi ortamında INS (inertial navigation) "
            "moduna geçilir. Karıştırma kaynağı tespit edilir ve raporlanır. "
            "İHA operatörü bağlantı kaybolursa otomatik RTH devreye girer."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-EH-IHA-005",
    },
    {
        "context": (
            "KURAL: İHA sürü operasyonunda bir İHA'nın iletişim kaybı yaşaması "
            "halinde, kalan İHA'lar otonom görev paylaşımı yapar. Kaybedilen "
            "İHA'nın son bilinen konumu raporlanır. 5 dakika içinde bağlantı "
            "kurulamazsa arama-kurtarma modu aktifleştirilir."
        ),
        "category": "HAVA_SAHASI_IHA",
        "source": "TSK-IHA-SOP-006",
    },

    # ================================================================
    #  2. KARA BİRLİKLERİ & ÇATIŞMA (Ground / Combat)  —  6 rules
    # ================================================================
    {
        "context": (
            "KURAL: Pusu tespit edilmesi halinde TEHDİT SEVİYESİ KRİTİK. "
            "Derhal prosedür: 1) Anlık karşı ateş ile temas kesilir, "
            "2) Araçlar killzone dışına çıkartılır, 3) Destek ateşi talep "
            "edilir, 4) Yaralı tahliyesi önceliklendirilir. Pusu bölgesinden "
            "en az 500m uzaklaşılmadan durum değerlendirmesi yapılmaz."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-MUHAREBE-SOP-001",
    },
    {
        "context": (
            "KURAL: Çatışma Kuralları (ROE) — Sivil yerleşim alanına 500m "
            "mesafede ağır silah kullanımı yasaktır. Sivil kayıp riski bulunan "
            "ortamda yalnızca hassas hedefleme (PGM) ile müdahale yapılabilir. "
            "Sivil varlığı teyit edilemezse ateş emri verilmeden önce komutan "
            "onayı gereklidir."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-ROE-002",
    },
    {
        "context": (
            "KURAL: Sınır ihlali tespit edildiğinde (kara/hava/deniz) "
            "TEHDİT SEVİYESİ en az ORTA. Prosedür: "
            "1) Bölge komutanlığı bilgilendirilir "
            "2) IFF sorgulaması yapılır "
            "3) Uyarı mesajı uluslararası frekansta iletilir "
            "4) Yanıt yoksa kademeli müdahale planı devreye girer. "
            "Silahlı/zırhlı araç sınırı geçerse TEHDİT SEVİYESİ KRİTİK."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-SINIR-SOP-003",
    },
    {
        "context": (
            "KURAL: Gece operasyonlarında birlik konumlandırması, termal "
            "görüntüleme ve gece görüş cihazları (NVG) ile desteklenir. "
            "Mavi üzerine mavi (friendly fire) riskini önlemek için IR strobe "
            "ve IFF cihazları zorunludur. Birlik aralığı en az 50m tutulur."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-GECE-SOP-004",
    },
    {
        "context": (
            "KURAL: Konvoy harekâtında devriye aracı ile ana kuvvet arasındaki "
            "mesafe 300-500m olmalıdır. Konvoy IED (el-yapımı patlayıcı) riski "
            "altında ise rota önceden EOD (bomba imha) ekibi tarafından taranır. "
            "Konvoy duraksadığında çevresel güvenlik çemberi 360° oluşturulur."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-KONVOY-SOP-005",
    },
    {
        "context": (
            "KURAL: Düşman esir alındığında Cenevre Sözleşmesi hükümleri "
            "uygulanır. Esir silahsızlandırılır, tıbbi bakım sağlanır, "
            "kimlik bilgileri kaydedilir. İstihbarat birimi bilgilendirilir. "
            "Esire kötü muamele yasaktır ve disiplin cezası gerektirir."
        ),
        "category": "KARA_BIRLIKLERI",
        "source": "TSK-HUKUK-SOP-006",
    },

    # ================================================================
    #  3. SAĞLIK & BİYOMETRİ (Medical / Vitals)  —  6 rules
    # ================================================================
    {
        "context": (
            "KURAL: Personelin kalp atış hızı 180 BPM üzerine çıkarsa "
            "TEHDİT SEVİYESİ KRİTİK — kardiyak acil durum veya yoğun muharebe. "
            "Sağlık ekibi alarm durumuna geçer. Koordinatlar MEDEVAC helikopterine "
            "iletilir. Birim komutanı derhal bilgilendirilir. "
            "150 BPM üzeri ise aktif çatışma veya tıbbi acil olarak izlenir."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-SAGLIK-SOP-001",
    },
    {
        "context": (
            "KURAL: Personelin SpO2 değeri %90'ın altına düşerse "
            "TEHDİT SEVİYESİ KRİTİK — hipoksi riski. Yüksek irtifa hastalığı, "
            "yaralanma veya gaz maruziyeti değerlendirilir. Oksijen desteği "
            "başlatılır, acil tahliye planlanır. SpO2 %94 altı YÜKSEK tehdit."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-SAGLIK-SOP-002",
    },
    {
        "context": (
            "KURAL: Personel durumu YARALI veya PANİK olarak raporlanırsa "
            "TEHDİT SEVİYESİ YÜKSEK. Zayiat prosedürü uygulanır: "
            "1) Bölge güvenliği sağlanır 2) İlk yardım uygulanır "
            "3) MEDEVAC talep edilir 4) Birim yedeklenir. "
            "Kalp atışı 0 ise KRİTİK — teyit sonrası KIA (Killed in Action) raporu."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-SAGLIK-SOP-003",
    },
    {
        "context": (
            "KURAL: Vücut sıcaklığı 40°C üzerine çıkarsa sıcak çarpması "
            "tehlikesi. Personel derhal gölgeye alınır, serum takviyesi "
            "başlatılır. Stres indeksi 0.85 üzeri ise kombat yorgunluğu "
            "olarak değerlendirilir, personel görevden çekilir. "
            "48 saat dinlenme zorunludur."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-SAGLIK-SOP-004",
    },
    {
        "context": (
            "KURAL: Toplu zayiat durumunda (3+ yaralı aynı anda) triyaj "
            "protokolü uygulanır. Kırmızı: acil cerrahi, Sarı: ertelenebilir, "
            "Yeşil: ayakta tedavi. MEDEVAC öncelik sırası triyaj rengine göre "
            "belirlenir. Bölge sağlık merkezi bilgilendirilir."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-SAGLIK-SOP-005",
    },
    {
        "context": (
            "KURAL: NBC (Nükleer-Biyolojik-Kimyasal) maruziyeti şüphesinde "
            "TEHDİT SEVİYESİ KRİTİK. Tüm personel KBRN koruyucu donanım "
            "giyer. Kontaminasyon bölgesi işaretlenir, rüzgar yönüne göre "
            "tahliye rotası belirlenir. Arındırma istasyonu kurulur."
        ),
        "category": "SAGLIK_BIYOMETRI",
        "source": "TSK-KBRN-SOP-006",
    },

    # ================================================================
    #  4. LOJİSTİK & ARAÇ (Logistics / Vehicles)  —  6 rules
    # ================================================================
    {
        "context": (
            "KURAL: Aracın yakıt seviyesi %15'in altına düşerse "
            "TEHDİT SEVİYESİ YÜKSEK — hareketsizleşme riski. "
            "İkmal konvoyuna acil talep gönderilir. Araç savunma pozisyonuna "
            "çekilir. Yakıt %30 altında İKMAL PLANLAMA başlatılır."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-LOJISTIK-SOP-001",
    },
    {
        "context": (
            "KURAL: Araç sağlık/hasar seviyesi %50'nin altına düşerse "
            "TEHDİT SEVİYESİ YÜKSEK — muharebe hasarı, hareket kabiliyeti "
            "tehlikede. Bakım ekibi yönlendirilir. Çekilme rotası planlanır. "
            "Mürettebat tahliye hazırlığı yapılır."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-LOJISTIK-SOP-002",
    },
    {
        "context": (
            "KURAL: Araç motor sıcaklığı kritik eşiği aşarsa (>110°C) veya "
            "motor arıza kodu alınırsa, araç derhal durdurulur. Motor soğuyana "
            "kadar hareket yasaktır. Motor hasarı kalıcı ise yedek araç tahsis "
            "edilir ve arızalı araç çekilme noktasına taşınır."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-LOJISTIK-SOP-003",
    },
    {
        "context": (
            "KURAL: Konvoya saldırı durumunda koruma araçları saldırı yönüne "
            "pozisyon alır. Lojistik araçlar hız keserek killzone'u terk eder. "
            "Saldırı sonrası hasar tespiti yapılır, yükün durumu kontrol edilir. "
            "Kayıp mühimmat/malzeme raporu derhal iletilir."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-KONVOY-SOP-004",
    },
    {
        "context": (
            "KURAL: Zırhlı aracın lastik veya paletinde hasar tespit edilirse, "
            "araç hareket kabiliyetine göre değerlendirilir. Tam immobil ise "
            "mürettebat tahliye edilir, aracın konumu işaretlenir ve kurtarma "
            "ekibi çağrılır. Kısmi hareket varsa en yakın güvenli noktaya çekilir."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-BAKIM-SOP-005",
    },
    {
        "context": (
            "KURAL: Mühimmat ikmal ihtiyacı oluştuğunda birim bazında fire "
            "raporu hazırlanır. %30 altında kritik ikmal hattı açılır. "
            "Mühimmat deposu saldırıya uğrarsa TEHDİT SEVİYESİ KRİTİK — "
            "patlama ve ikincil hasar riski. 300m emniyet çemberi oluşturulur."
        ),
        "category": "LOJISTIK_ARAC",
        "source": "TSK-LOJISTIK-SOP-006",
    },

    # ================================================================
    #  5. SİBER & ELEKTRONİK HARP (Cyber / EW)  —  6 rules
    # ================================================================
    {
        "context": (
            "KURAL: Telsiz sessizliği (EMCON) prosedürü — düşman SIGINT tehdidi "
            "altında tüm RF emisyonları kesilir. İletişim yalnızca önceden "
            "belirlenmiş zaman pencerelerinde frekans atlamalı modda yapılır. "
            "Acil durum haricinde telsiz kullanımı yasaktır. "
            "Siber saldırı/karıştırma tespit edilirse yedek kanal aktifleştirilir."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-MUHABERE-SOP-001",
    },
    {
        "context": (
            "KURAL: GPS spoofing (sahte sinyal) tespit edildiğinde tüm GPS "
            "bağımlı navigasyon devre dışı bırakılır. Harita-pusula ile "
            "INS (Inertial Navigation) moduna geçilir. Sahte sinyal kaynağı "
            "yön bulucu ile tespit edilir. Koordinat verileri doğrulanmadan "
            "ateş komutlarında kullanılamaz."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-SIBER-SOP-002",
    },
    {
        "context": (
            "KURAL: Birlik iletişimi ani ve açıklanamayan paket kaybı (%50+) "
            "yaşarsa, siber saldırı ihtimali değerlendirilir. TEHDİT SEVİYESİ "
            "ORTA. Alternatif haberleşme kanalına geçilir (HF telsiz, kurye). "
            "Siber savunma ekibi olayı incelemeye alır."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-SIBER-SOP-003",
    },
    {
        "context": (
            "KURAL: Düşman elektronik harp (EH) faaliyeti tespit edildiğinde — "
            "radar karıştırma, iletişim bozma, DRFM aldatma — tüm birimler "
            "Elektromanyetik Spektrum Yönetimi (ESY) protokolüne geçer. "
            "Emisyon kontrolü uygulanır, pasif sensörler önceliklendirilir."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-EH-SOP-004",
    },
    {
        "context": (
            "KURAL: C4ISR komuta ağına yetkisiz erişim girişimi tespit edilirse "
            "TEHDİT SEVİYESİ KRİTİK. Etkilenen terminal izole edilir. "
            "Ağ segmentasyonu uygulanır. Tüm kimlik bilgileri yenilenir. "
            "Siber olay müdahale ekibi (CERT) aktive edilir. "
            "Olay kapanana kadar kritik veriler çevrimdışı yedekte tutulur."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-SIBER-SOP-005",
    },
    {
        "context": (
            "KURAL: Sahada kullanılan mobil cihaz veya taktik tablet kaybolursa "
            "veya çalınırsa TEHDİT SEVİYESİ YÜKSEK. Uzaktan silme (remote wipe) "
            "komutu gönderilir. Cihazın son bilinen konumu tespit edilir. "
            "Cihazdaki şifreleme anahtarları iptal edilir ve yenileri dağıtılır."
        ),
        "category": "SIBER_ELEKTRONIK",
        "source": "TSK-SIBER-SOP-006",
    },
]


def main():
    clean_mode = "--clean" in sys.argv

    print("=" * 70)
    print("  C4ISR — SEED DOCTRINE v2.0 (30 Tactical Rules, 5 Categories)")
    if clean_mode:
        print("  ⚠️  CLEAN MODE — existing tactical_memory will be TRUNCATED")
    print("=" * 70)

    # Step 1: Connect to DB
    print("\n📡 Connecting to PostgreSQL...")
    try:
        initialize_database(use_docker_network=False)
        print("   ✅ Database connected")
    except Exception as e:
        print(f"   ❌ Database connection failed: {e}")
        print("   Make sure PostgreSQL is running: docker compose up -d")
        sys.exit(1)

    # Step 2: Initialize embedding model
    print("\n🧠 Loading embedding model (all-MiniLM-L6-v2)...")
    try:
        rag_engine.initialize()
        print("   ✅ Embedding model loaded")
    except Exception as e:
        print(f"   ❌ Embedding model failed: {e}")
        print("   Run 'python download_models.py' first")
        sys.exit(1)

    # Step 3: Clean or check existing rows
    try:
        stats = rag_engine.get_memory_stats()
        existing = stats.get("total_rows", 0)
        print(f"\n📊 Current tactical_memory: {existing} rows")

        if existing > 0 and clean_mode:
            # TRUNCATE for a clean start — removes old v1.0 duplicates
            from config.database import db_manager
            with db_manager.get_cursor() as cur:
                cur.execute("DELETE FROM tactical_memory")
                print("   🗑️  All existing rows DELETED (clean mode)")
        elif existing > 0:
            print("   ⚠️  Table has data. Use --clean to start fresh.")
            print("   📌 Appending new doctrine (may cause duplicates)...")
    except Exception as e:
        print(f"   ⚠️  Could not read stats: {e}")

    # Step 4: Category summary
    categories = {}
    for rule in DOCTRINE:
        cat = rule["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\n📝 Seeding {len(DOCTRINE)} engagement rules across {len(categories)} categories:")
    for cat, count in categories.items():
        print(f"   • {cat}: {count} rules")
    print()

    # Step 5: Seed each rule
    t0 = time.time()
    success = 0
    failed = 0

    for i, rule in enumerate(DOCTRINE, 1):
        try:
            row_id = rag_engine.ingest(
                context=rule["context"],
                category=rule["category"],
                source=rule["source"],
            )
            # Truncate display
            preview = rule["context"][:70].replace("\n", " ") + "..."
            print(f"   [{i:2d}/{len(DOCTRINE)}] id={row_id:3d}  {rule['category']:<20s}  {preview}")
            success += 1
        except Exception as e:
            print(f"   [{i:2d}/{len(DOCTRINE)}] ❌ FAILED: {e}")
            failed += 1

    elapsed = time.time() - t0
    print(f"\n✅ Seeded {success}/{len(DOCTRINE)} rules in {elapsed:.2f}s")
    if failed:
        print(f"   ⚠️  {failed} rules failed to insert")

    # Step 6: Verification — test queries across categories
    print("\n" + "─" * 70)
    print("🔍 VERIFICATION — Sample cosine similarity searches:\n")

    test_queries = [
        ("İHA batarya düşük acil iniş", "HAVA_SAHASI_IHA"),
        ("asker kalp atışı yüksek MEDEVAC", "SAGLIK_BIYOMETRI"),
        ("araç yakıt azalması ikmal", "LOJISTIK_ARAC"),
        ("GPS spoofing sinyal kaybı", "SIBER_ELEKTRONIK"),
        ("sivil bölge ateş kuralları ROE", "KARA_BIRLIKLERI"),
    ]

    for query, expected_cat in test_queries:
        print(f"   Query: '{query}'")
        print(f"   Expected category: {expected_cat}")
        results = rag_engine.search(query, top_k=2)
        if results:
            for j, r in enumerate(results, 1):
                preview = r["context"][:80].replace("\n", " ")
                match = "✅" if r["category"] == expected_cat else "⚠️"
                print(f"      #{j} {match} score={r['score']:.4f} [{r['category']}] {preview}...")
        else:
            print("      ❌ No results found!")
        print()

    # Cleanup
    close_database()
    print("─" * 70)
    print("  DONE — Tactical memory populated with v2.0 doctrine")
    print("─" * 70)


if __name__ == "__main__":
    main()
