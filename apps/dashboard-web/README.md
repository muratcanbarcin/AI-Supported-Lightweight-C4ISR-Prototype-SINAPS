# SINAPS - AI-Supported Lightweight C4ISR Dashboard

C4ISR kontrol paneli frontend uygulaması. React 18 + TypeScript + Vite ile geliştirilmiştir.

## Teknolojiler

- **React** 18.3.1
- **TypeScript** 5.5.4
- **Vite** 5.4.2
- **Tailwind CSS** 3.4.13
- **React Leaflet** 4.2.1
- **Leaflet** 1.9.4

## Kurulum

```bash
cd apps/dashboard-web
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacaktır.

## Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview
```

## Proje Yapısı

```
src/
├── app/
│   └── App.tsx                    # Ana uygulama bileşeni
├── features/
│   ├── alerts/
│   │   └── pages/
│   │       └── AlertsPage.tsx     # Uyarılar sayfası
│   ├── assets/
│   │   └── pages/
│   │       └── AssetStatusPage.tsx # Birim durumu sayfası
│   ├── control/
│   │   ├── components/
│   │   │   ├── ModeSelector.tsx   # Çalışma modu seçici
│   │   │   ├── SwitchRow.tsx      # Switch satırı
│   │   │   └── ToggleButton.tsx   # Toggle butonu
│   │   └── RightControlPanel.tsx  # Sağ kontrol paneli
│   ├── map/
│   │   ├── components/
│   │   │   ├── GeofencePolygon.tsx # Geofence polygon
│   │   │   └── RadarRings.tsx     # Radar halkaları
│   │   ├── hooks/
│   │   │   └── useMockAssets.ts   # Mock asset hook
│   │   ├── pages/
│   │   │   └── MapPlaceholder.tsx # Placeholder harita
│   │   ├── MapView.tsx            # Ana harita bileşeni
│   │   └── MapView.css            # Harita stilleri
│   └── navigation/
│       └── TopNavBar.tsx          # Üst navigasyon bar
└── services/
    └── mockData.ts                # Mock veri servisi
```

## Özellikler

### 1. Harita Görünümü
- Radar stilinde minimal harita (TileLayer yok)
- Konsantrik radar halkaları (300m, 600m, 900m)
- Mission geofence polygon'ları
- Asset marker'ları (UAV, SOLDIER, VEHICLE, WEARABLE)
- Tip bazlı renkli marker'lar ve label'lar

### 2. Birim Durumu Sayfası
- Tüm birliklerin grid görünümü
- Asset kartları (ikon, isim, durum, detaylar)
- Responsive tasarım (1-2-3 kolon)

### 3. Uyarılar Sayfası
- Tespit ve değerlendirme sayacı
- Severity bazlı alert kartları
- İlgili birlikler gösterimi

### 4. Sağ Kontrol Paneli
- Çalışma modu seçimi (MANUEL, YARI OTOMATİK, TAM OTOMATİK)
- Edge processing toggle
- Simülasyon/Live toggle
- Sistem durumu göstergesi

### 5. Üst Navigasyon Bar
- SINAPS logosu ve marka
- 3 sekme: Harita, Birim Durumu, Uyarılar
- Aktif sekme vurgulama

## Harita Kullanımı

MapView bileşenini kullanmak için:

```tsx
import { MapView } from '@/features/map';

// App.tsx içinde:
<MapView />
```

Harita özellikleri:
- Merkez: Ankara (39.93, 32.85)
- Zoom: 14
- Radar stilinde koyu arka plan
- Asset marker'ları otomatik render edilir

## Mock Veri

Şu anda tüm veriler `src/services/mockData.ts` dosyasından gelmektedir:
- 6 mock asset (UAV, SOLDIER, GROUND_VEHICLE, WEARABLE)
- 5 mock alert (HIGH, MEDIUM, LOW severity)

Backend entegrasyonu için `services/mockData.ts` dosyasını API çağrılarıyla değiştirmeniz gerekecektir.

## Stil ve Tasarım

- Dark tema (slate-900, slate-800 tonları)
- Glassmorphism efektleri (backdrop-blur)
- Cyan/emerald accent renkler
- Minimal, endüstriyel görünüm
- Responsive tasarım

## Sorun Giderme

### Port zaten kullanılıyor
`vite.config.ts` içinde port değiştirin veya başka bir terminalde çalışan process'i kapatın.

### Leaflet marker'ları görünmüyor
`MapView.css` dosyasının import edildiğinden emin olun.

### Tailwind stilleri çalışmıyor
`postcss.config.js` ve `tailwind.config.js` dosyalarını kontrol edin.

## Bağımlılıklar

Tüm bağımlılıklar `requirements.txt` dosyasında listelenmiştir. Kurulum için:

```bash
npm install
```

veya peer dependency uyarıları için:

```bash
npm install --legacy-peer-deps
```

## Geliştirme Notları

- TypeScript strict mode kapalı (esnek geliştirme için)
- Path alias kullanımı: `@/` ile `src/` klasörüne erişim
- Component'ler feature-based organizasyon
- Mock data ile çalışma (backend entegrasyonu bekleniyor)

## İleriye Dönük Planlar

- Backend API entegrasyonu
- Gerçek zamanlı telemetry güncellemeleri
- Harita etkileşimleri (zoom, pan, marker tıklama)
- Electron desktop paketleme
- WebSocket bağlantısı için hazırlık
