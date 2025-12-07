# SINAPS Dashboard Web

C4ISR kontrol paneli - Sağ kontrol paneli component'i

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılacaktır.

## Build

```bash
npm run build
```

## Yapı

- `src/features/control/RightControlPanel.tsx` - Ana kontrol paneli
- `src/features/control/components/` - Yardımcı componentler
  - `ToggleButton.tsx` - İletişim kanalları toggle butonları
  - `ModeSelector.tsx` - Çalışma modu seçici
  - `SwitchRow.tsx` - Edge & Senaryo switch'leri


