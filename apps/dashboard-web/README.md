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
│   ├── ai/
│   │   └── pages/
│   │       └── AIPage.tsx         # Yapay zeka asistanı sayfası
│   ├── alerts/
│   │   └── pages/
│   │       └── AlertsPage.tsx     # Uyarılar sayfası
│   ├── assets/
│   │   └── pages/
│   │       └── AssetStatusPage.tsx # Birim durumu sayfası
│   ├── auth/
│   │   └── LoginPage.tsx          # Giriş sayfası
│   ├── control/
│   │   ├── components/
│   │   │   ├── ModeSelector.tsx   # Çalışma modu seçici
│   │   │   ├── SwitchRow.tsx      # Switch satırı
│   │   │   └── ToggleButton.tsx   # Toggle butonu
│   │   └── RightControlPanel.tsx  # Sağ kontrol paneli
│   ├── map/
│   │   ├── components/
│   │   │   ├── GeofencePolygon.tsx # Geofence polygon
│   │   │   ├── RadarRings.tsx     # Radar halkaları
│   │   │   ├── UnitDetailsModal.tsx # Birim detay ve görev atama
│   │   │   └── AssetMarker.tsx    # Minimalist harita işareti
│   │   ├── hooks/
│   │   │   └── useMockAssets.ts   # Mock asset hook
│   │   ├── pages/
│   │   │   └── MapPlaceholder.tsx # Placeholder harita
│   │   ├── MapView.tsx            # Ana harita bileşeni
│   │   └── MapView.css            # Harita stilleri
│   ├── navigation/
│   │   └── TopNavBar.tsx          # Üst navigasyon bar
│   ├── profile/
│   │   └── pages/
│   │       └── ProfilePage.tsx    # Profil sayfası
│   └── tasks/
│       └── pages/
│           └── TasksPage.tsx      # Görevler sayfası
└── services/
    └── mockData.ts                # Mock veri servisi
```

## Özellikler

### 1. Harita Görünümü
- Radar stilinde minimal harita (TileLayer yok)
- Konsantrik radar halkaları (300m, 600m, 900m)
- Mission geofence polygon'ları
- Minimalist Asset marker'ları (Pulsing dot + Hover Label)
- Marker tıklanınca açılan **Birim Detay & Görev Atama Modalı**

### 2. Birim Durumu Sayfası
- Tüm birliklerin grid görünümü
- Asset kartları (ikon, isim, durum, detaylar)
- Responsive tasarım
- Kart üzerinden Birim Detay Modalına erişim

### 3. Görev Yönetimi (YENİ)
- **Görev Listesi**: Mevcut görevlerin durumu ve atanan birlikler
- **Görev Oluştur**: Yeni operasyonel görevler tanımlama ve birim atama

### 4. Yapay Zeka Asistanı (YENİ)
- **Chat Arayüzü**: SINAPS AI ile durum analizi ve öneriler için sohbet
- Mock öneri sistemi ve aksiyon butonları

### 5. Profil Sayfası (YENİ)
- Komutan kimlik kartı (İsim, Rütbe, Birlik)
- Emrindeki birlikler tablosu
- Aktif operasyonlar listesi

### 6. Sağ Kontrol Paneli
- **Collapsible Yapı**: Varsayılan kapalı, ikon ile açılır
- **Tablı Arayüz**: KONTROL ve LOGLAR sekmeleri
- Çalışma modu seçimi parametreleri
- Canlı olay akışı (Logs)

### 7. Üst Navigasyon
- Sol: SINAPS Logo
- Orta: Harita, Birim Durumu, Görevler, AI Asistan, Uyarılar
- Sağ: Profil İkonu (Profil Sayfası), Bildirimler, Çıkış

## Mock Veri

Şu anda tüm veriler `src/services/mockData.ts` dosyasından gelmektedir. Backend entegrasyonu için bu servis yapısı kullanılabilir.

## Stil ve Tasarım

- **Tema**: Taktiksel Dark Tema (Slate-900 tabanlı)
- **Efektler**: Glassmorphism (backdrop-blur), Neon Glows (Cyan/Emerald/Amber)
- **Font**: Sans-serif, Teknik/Endüstriyel görünüm
- **Layout**: Responsive flex/grid yapısı

## Sorun Giderme

### Port zaten kullanılıyor
`vite.config.ts` içinde port değiştirin veya `package.json` script'ini güncelleyin.

### Leaflet marker'ları görünmüyor
`MapView.css` dosyasının import edildiğinden ve Leaflet CSS'inin yüklendiğinden emin olun.
