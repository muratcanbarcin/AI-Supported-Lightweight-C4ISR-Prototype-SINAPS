================================================================================
SINAPS - AI-Supported Lightweight C4ISR Dashboard (Frontend)
================================================================================

PROJE AÇIKLAMASI
----------------
Bu proje, SINAPS (AI-Supported Lightweight C4ISR) sisteminin web dashboard 
frontend uygulamasıdır. React 18 + TypeScript + Vite ile geliştirilmiştir.

TEKNOLOJİLER
------------
- React 18.3.1
- TypeScript 5.5.4
- Vite 5.4.2 (bundler)
- Tailwind CSS 3.4.13 (styling)
- React Leaflet 4.2.1 (harita görünümü)
- Leaflet 1.9.4 (harita kütüphanesi)

KURULUM
-------
1. Proje dizinine gidin:
   cd apps/dashboard-web

2. Bağımlılıkları yükleyin:
   npm install

3. Geliştirme sunucusunu başlatın:
   npm run dev

4. Tarayıcıda açın:
   http://localhost:5173 (veya Vite'ın gösterdiği port)

PROJE YAPISI
------------
apps/dashboard-web/
├── src/
│   ├── app/
│   │   └── App.tsx              # Ana uygulama bileşeni
│   │
│   ├── features/
│   │   ├── alerts/
│   │   │   └── pages/
│   │   │       └── AlertsPage.tsx        # Uyarılar sayfası
│   │   │
│   │   ├── assets/
│   │   │   └── pages/
│   │   │       └── AssetStatusPage.tsx   # Birim durumu sayfası
│   │   │
│   │   ├── control/
│   │   │   ├── components/
│   │   │   │   ├── ModeSelector.tsx      # Çalışma modu seçici
│   │   │   │   ├── SwitchRow.tsx         # Switch satırı
│   │   │   │   └── ToggleButton.tsx     # Toggle butonu
│   │   │   └── RightControlPanel.tsx     # Sağ kontrol paneli
│   │   │
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── GeofencePolygon.tsx   # Geofence polygon
│   │   │   │   └── RadarRings.tsx        # Radar halkaları
│   │   │   ├── hooks/
│   │   │   │   └── useMockAssets.ts      # Mock asset hook
│   │   │   ├── pages/
│   │   │   │   └── MapPlaceholder.tsx    # Placeholder harita
│   │   │   ├── MapView.tsx               # Ana harita bileşeni
│   │   │   ├── MapView.css               # Harita stilleri
│   │   │   └── index.ts                  # Export dosyası
│   │   │
│   │   └── navigation/
│   │       └── TopNavBar.tsx             # Üst navigasyon bar
│   │
│   ├── services/
│   │   └── mockData.ts                   # Mock veri servisi
│   │
│   ├── index.css                         # Global CSS
│   └── main.tsx                          # React entry point
│
├── public/
│   └── images/                           # PNG görselleri
│       ├── drone.png
│       ├── soldier.png
│       └── tank.png
│
├── package.json                          # Bağımlılıklar
├── vite.config.ts                        # Vite yapılandırması
├── tailwind.config.js                    # Tailwind yapılandırması
└── tsconfig.json                          # TypeScript yapılandırması

ÖZELLİKLER
----------
1. HARİTA GÖRÜNÜMÜ
   - Radar stilinde minimal harita (TileLayer yok)
   - Konsantrik radar halkaları (300m, 600m, 900m)
   - Mission geofence polygon'ları (kırmızı)
   - Asset marker'ları (UAV, SOLDIER, VEHICLE, WEARABLE)
   - Tip bazlı renkli marker'lar ve label'lar

2. BİRİM DURUMU SAYFASI
   - Tüm birliklerin grid görünümü
   - Asset kartları (ikon, isim, durum, detaylar)
   - Responsive tasarım (1-2-3 kolon)

3. UYARILAR SAYFASI
   - Tespit ve değerlendirme sayacı
   - Severity bazlı alert kartları
   - İlgili birlikler gösterimi

4. SAĞ KONTROL PANELİ
   - Çalışma modu seçimi (MANUEL, YARI OTOMATİK, TAM OTOMATİK)
   - Edge processing toggle
   - Simülasyon/Live toggle
   - Sistem durumu göstergesi

5. ÜST NAVİGASYON BAR
   - SINAPS logosu ve marka
   - 3 sekme: Harita, Birim Durumu, Uyarılar
   - Aktif sekme vurgulama

KULLANIM
--------
1. Geliştirme Modu:
   npm run dev
   
   Tarayıcıda http://localhost:5173 adresini açın.

2. Production Build:
   npm run build
   
   Build çıktısı dist/ klasörüne oluşturulur.

3. Build Önizleme:
   npm run preview
   
   Production build'i yerel olarak test edin.

MOCK VERİ
---------
Şu anda tüm veriler mockData.ts dosyasından gelmektedir:
- 6 mock asset (UAV, SOLDIER, GROUND_VEHICLE, WEARABLE)
- 5 mock alert (HIGH, MEDIUM, LOW severity)

Backend entegrasyonu için services/mockData.ts dosyasını API çağrılarıyla 
değiştirmeniz gerekecektir.

HARİTA KULLANIMI
----------------
MapView bileşenini kullanmak için:

1. MapPlaceholder yerine MapView kullanın:
   import { MapView } from '@/features/map';
   
   // App.tsx içinde:
   <MapView />

2. Harita özellikleri:
   - Merkez: Ankara (39.93, 32.85)
   - Zoom: 14
   - Radar stilinde koyu arka plan
   - Asset marker'ları otomatik render edilir

STİL VE TASARIM
---------------
- Dark tema (slate-900, slate-800 tonları)
- Glassmorphism efektleri (backdrop-blur)
- Cyan/emerald accent renkler
- Minimal, endüstriyel görünüm
- Responsive tasarım

GELİŞTİRME NOTLARI
------------------
- TypeScript strict mode kapalı (esnek geliştirme için)
- Path alias kullanımı: @/ ile src/ klasörüne erişim
- Component'ler feature-based organizasyon
- Mock data ile çalışma (backend entegrasyonu bekleniyor)

SORUN GİDERME
-------------
1. Port zaten kullanılıyor:
   vite.config.ts içinde port değiştirin veya
   başka bir terminalde çalışan process'i kapatın.

2. Leaflet marker'ları görünmüyor:
   MapView.css dosyasının import edildiğinden emin olun.

3. Tailwind stilleri çalışmıyor:
   postcss.config.js ve tailwind.config.js dosyalarını kontrol edin.

4. TypeScript hataları:
   tsconfig.json ayarlarını kontrol edin.

İLERİYE DÖNÜK PLANLAR
---------------------
- Backend API entegrasyonu
- Gerçek zamanlı telemetry güncellemeleri
- Harita etkileşimleri (zoom, pan, marker tıklama)
- Electron desktop paketleme
- WebSocket bağlantısı için hazırlık

================================================================================
Son Güncelleme: 2024
================================================================================

