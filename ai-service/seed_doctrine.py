#!/usr/bin/env python3
"""
============================================================================
    C4ISR — SEED DOCTRINE (Tactical Memory Population)
============================================================================
    Populates the `tactical_memory` table with realistic TSK engagement
    rules and standard operating procedures.

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
#                  TSK ENGAGEMENT RULES & DOCTRINE
# ====================================================================
# Realistic military rules of engagement, SOPs, and medical protocols
# inspired by NATO/TSK operational doctrine.

DOCTRINE: list[dict] = [
    # ── UAV / DRONE Rules ────────────────────────────────────────────
    {
        "context": (
            "KURAL: IHA batarya seviyesi %20'nin altına düşerse, "
            "derhal RTH (Return-to-Home) prosedürü başlatılmalıdır. "
            "Mevcut görev iptal edilir, en yakın iniş noktasına yönlendirilir. "
            "Batarya %10 altında mecburi otonom iniş devreye girer. "
            "Kurtarma ekibine bilgi verilir."
        ),
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-IHA-SOP-001",
    },
    {
        "context": (
            "KURAL: Tanımlanmamış IHA, harekat alanına 5 km'den fazla yaklaşırsa "
            "TEHDİT SEVİYESİ YÜKSEK olarak değerlendirilir. IFF (Identify Friend or Foe) "
            "sorgulaması yapılır. 3 dakika içinde yanıt alınamazsa düşman keşif aracı "
            "olarak kabul edilir. Elektronik karıştırma ve fiziksel müdahale "
            "prosedürü başlatılır."
        ),
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-HAVADEF-002",
    },
    {
        "context": (
            "KURAL: IHA irtifa anomalisi (±200m ani değişim) veya düzensiz hız "
            "paterni tespit edilirse, olası arıza/hack olarak değerlendirilir. "
            "TEHDİT SEVİYESİ ORTA. Otonom kontrol devre dışı bırakılır, "
            "manuel kontrole geçilir. Siber güvenlik birimi bilgilendirilir."
        ),
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-IHA-SOP-003",
    },

    # ── SOLDIER / PERSONNEL Rules ────────────────────────────────────
    {
        "context": (
            "KURAL: Personelin kalp atış hızı 180 BPM üzerine çıkarsa "
            "TEHDİT SEVİYESİ KRİTİK — kardiyak acil durum veya yoğun muharebe. "
            "Sağlık ekibi alarm durumuna geçer. Koordinatlar MEDEVAC helikopterine "
            "iletilir. Birim komutanı derhal bilgilendirilir. "
            "150 BPM üzeri ise aktif çatışma veya tıbbi acil olarak izlenir."
        ),
        "category": "MEDICAL_RULE",
        "source": "TSK-SAGLIK-SOP-001",
    },
    {
        "context": (
            "KURAL: Personelin SpO2 değeri %90'ın altına düşerse "
            "TEHDİT SEVİYESİ KRİTİK — hipoksi riski. Yüksek irtifa hastalığı, "
            "yaralanma veya gaz maruziyeti değerlendirilir. Oksijen desteği "
            "başlatılır, acil tahliye planlanır. SpO2 %94 altı YÜKSEK tehdit."
        ),
        "category": "MEDICAL_RULE",
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
        "category": "MEDICAL_RULE",
        "source": "TSK-SAGLIK-SOP-003",
    },

    # ── VEHICLE Rules ────────────────────────────────────────────────
    {
        "context": (
            "KURAL: Aracın yakıt seviyesi %15'in altına düşerse "
            "TEHDİT SEVİYESİ YÜKSEK — hareketsizleşme riski. "
            "İkmal konvoyuna acil talep gönderilir. Araç savunma pozisyonuna "
            "çekilir. Yakıt %30 altında İKMAL PLANLAMA başlatılır."
        ),
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-LOJISTIK-SOP-001",
    },
    {
        "context": (
            "KURAL: Araç sağlık/hasar seviyesi %50'nin altına düşerse "
            "TEHDİT SEVİYESİ YÜKSEK — muharebe hasarı, hareket kabiliyeti "
            "tehlikede. Bakım ekibi yönlendirilir. Çekilme rotası planlanır. "
            "Mürettebat tahliye hazırlığı yapılır."
        ),
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-LOJISTIK-SOP-002",
    },

    # ── COMMUNICATIONS & EW Rules ────────────────────────────────────
    {
        "context": (
            "KURAL: Telsiz sessizliği (EMCON) prosedürü — düşman SIGINT tehdidi "
            "altında tüm RF emisyonları kesilir. İletişim yalnızca önceden "
            "belirlenmiş zaman pencerelerinde frekans atlamalı modda yapılır. "
            "Acil durum haricinde telsiz kullanımı yasaktır. "
            "Siber saldırı/karıştırma tespit edilirse yedek kanal aktifleştirilir."
        ),
        "category": "SOP",
        "source": "TSK-MUHABERE-SOP-001",
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
        "category": "ENGAGEMENT_RULE",
        "source": "TSK-SINIR-SOP-001",
    },
]


def main():
    print("=" * 70)
    print("  C4ISR — SEED DOCTRINE (Tactical Memory Population)")
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

    # Step 3: Check existing rows
    try:
        stats = rag_engine.get_memory_stats()
        existing = stats.get("total_rows", 0)
        print(f"\n📊 Current tactical_memory: {existing} rows")
        if existing > 0:
            print("   ⚠️  Table already has data. Appending new doctrine...")
    except Exception as e:
        print(f"   ⚠️  Could not read stats: {e}")

    # Step 4: Seed each rule
    print(f"\n📝 Seeding {len(DOCTRINE)} engagement rules...\n")
    t0 = time.time()

    for i, rule in enumerate(DOCTRINE, 1):
        try:
            row_id = rag_engine.ingest(
                context=rule["context"],
                category=rule["category"],
                source=rule["source"],
            )
            # Truncate display
            preview = rule["context"][:75].replace("\n", " ") + "..."
            print(f"   [{i:2d}/{len(DOCTRINE)}] id={row_id:3d}  {rule['category']:<18s}  {preview}")
        except Exception as e:
            print(f"   [{i:2d}/{len(DOCTRINE)}] ❌ FAILED: {e}")

    elapsed = time.time() - t0
    print(f"\n✅ Doctrine seeded in {elapsed:.2f}s")

    # Step 5: Verify with a sample search
    print("\n🔍 Verification — sample cosine similarity search:")
    print("   Query: 'drone battery low altitude anomaly'")
    results = rag_engine.search("drone battery low altitude anomaly", top_k=3)
    for j, r in enumerate(results, 1):
        preview = r["context"][:90].replace("\n", " ")
        print(f"   #{j}  score={r['score']:.4f}  [{r['category']}]  {preview}...")

    # Cleanup
    close_database()
    print("\n" + "=" * 70)
    print("  DONE — Tactical memory is ready for RAG retrieval")
    print("=" * 70)


if __name__ == "__main__":
    main()
