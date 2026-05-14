import { useMemo, useState } from 'react';

type ContextStatus = 'SAFE' | 'RISKY' | 'CRITICAL';
type ContextType = 'BASE' | 'OPERATION';

interface ThreatEntry {
    label: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detail: string;
}

interface Recommendation {
    id: string;
    domain: 'AIR' | 'LOGISTICS' | 'EW' | 'INTEL' | 'NAVAL' | 'GROUND';
    title: string;
    body: string;
    priority: 'BİLGİ' | 'STABİL' | 'ÖNCELİKLİ' | 'KRİTİK';
}

interface AnalysisContext {
    id: string;
    name: string;
    shortName: string;
    type: ContextType;
    status: ContextStatus;
    coordinates: string;
    commandingUnit: string;
    weather: {
        condition: string;
        temp: number;
        windSpeed: number;
        visibility: number;
        humidity: number;
    };
    logistics: {
        ammoPct: number;
        fuelPct: number;
        medicalPct: number;
        rationPct: number;
    };
    forces: {
        personnel: number;
        airAssets: number;
        groundAssets: number;
        navalAssets: number;
    };
    threats: ThreatEntry[];
    successRatePct: number;
    moraleIndex: number; // 0-100
    recommendations: Recommendation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock data — aligned with backend DatabaseSeeder zones (Türkçe Silahlı Kuvvetler).
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CONTEXTS: AnalysisContext[] = [
    {
        id: 'op-pence-kilit',
        name: 'PENÇE-KİLİT HAREKAT BÖLGESİ',
        shortName: 'PENÇE-KİLİT',
        type: 'OPERATION',
        status: 'CRITICAL',
        coordinates: '37.15° K — 43.50° D (Kuzey Irak)',
        commandingUnit: '23. PİYADE TÜMENİ + 2. KOMD. TUGAYI',
        weather: {
            condition: 'Parçalı bulutlu, dağlık koşullar',
            temp: 9,
            windSpeed: 22,
            visibility: 14,
            humidity: 48,
        },
        logistics: { ammoPct: 78, fuelPct: 56, medicalPct: 92, rationPct: 81 },
        forces: { personnel: 1850, airAssets: 12, groundAssets: 38, navalAssets: 0 },
        threats: [
            { label: 'PKK sızma girişimi', severity: 'HIGH', detail: 'Üs bölgesi kuzeydoğu yamacında 6-8 kişilik unsur izlenmektedir.' },
            { label: 'IED hattı (Zap vadisi)', severity: 'CRITICAL', detail: 'Son 72 saatte 3 ayrı EYP imha edildi; ana ikmal yolu geçici kapalı.' },
            { label: 'Kısa menzil havan ateşi', severity: 'MEDIUM', detail: '82mm havan kalıntıları tespit edildi, menzil 4-6 km.' },
        ],
        successRatePct: 91,
        moraleIndex: 82,
        recommendations: [
            {
                id: 'pence-1',
                domain: 'AIR',
                title: 'YOĞUN SİHA DESTEĞİ',
                body: 'TB2 ve AKINCI unsurlarının vadi sırtları boyunca 24 saatlik rotasyonu sürdürülmeli; ısı imzası yüksek noktalar için HÜRKUŞ-C atış desteği sıraya alınmalıdır.',
                priority: 'KRİTİK',
            },
            {
                id: 'pence-2',
                domain: 'GROUND',
                title: 'KARA İKMAL ROTASI',
                body: 'Ana ikmal hattı yerine Çukurca-Şemdinli alternatif güzergahı aktive edilmeli; Kırpı-II konvoyları KARGU sürü himayesi altında ilerletilmelidir.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'pence-3',
                domain: 'INTEL',
                title: 'TERMAL KEŞİF DERİNLİĞİ',
                body: 'ANKA-S unsurları gece kuşağında 18.000 ft irtifada konuşlandırılmalı; sınır ötesi 25 km derinliğe kadar otomatik hedef tespit beslemesi aktive edilsin.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'pence-4',
                domain: 'EW',
                title: 'HABERLEŞME KARARTMASI',
                body: 'KORAL elektronik harp sistemleri kuzeybatı sırtında konuşlandırılarak düşman komuta-kontrol frekansları üzerinde seçici bastırma uygulanmalıdır.',
                priority: 'ÖNCELİKLİ',
            },
        ],
    },
    {
        id: 'op-bahar-kalkani',
        name: 'BAHAR KALKANI HAREKAT BÖLGESİ',
        shortName: 'BAHAR KALKANI',
        type: 'OPERATION',
        status: 'RISKY',
        coordinates: '35.93° K — 36.62° D (Suriye / İdlib)',
        commandingUnit: '20. ZIRHLI TUGAY + ÖZEL KUVVETLER',
        weather: {
            condition: 'Parçalı bulutlu, hafif toz',
            temp: 18,
            windSpeed: 28,
            visibility: 9,
            humidity: 41,
        },
        logistics: { ammoPct: 84, fuelPct: 47, medicalPct: 88, rationPct: 76 },
        forces: { personnel: 2400, airAssets: 16, groundAssets: 62, navalAssets: 0 },
        threats: [
            { label: 'Drone sürü riski', severity: 'HIGH', detail: 'Düşman tarafında ticari quadcopter aktivitesinde %38 artış kaydedildi.' },
            { label: 'Kısa menzilli ATGM', severity: 'HIGH', detail: 'Vuran konvoyları için 2-3 km menzilde tanksavar tehdidi izlenmektedir.' },
            { label: 'GPS spoofing', severity: 'MEDIUM', detail: 'Bayraktar TB2 unsurlarında 4 vakada konum sapması rapor edildi.' },
            { label: 'Topçu ateşi', severity: 'MEDIUM', detail: 'BM-21 menzilinde rastgele atış belirtileri.' },
        ],
        successRatePct: 87,
        moraleIndex: 78,
        recommendations: [
            {
                id: 'bahar-1',
                domain: 'EW',
                title: 'ANTİ-DRONE KALKANI',
                body: 'KORAL ve İHTAR sistemleri Vuran konvoylarının önünde mobil olarak ilerletilmeli, sürü saldırılarına karşı yumuşak öldürme protokolü etkinleştirilmelidir.',
                priority: 'KRİTİK',
            },
            {
                id: 'bahar-2',
                domain: 'GROUND',
                title: 'ZIRHLI MUHAFAZA',
                body: 'Kırpı-II MRAP konvoyları çift kademeli düzende ilerletilmeli; ATGM tehlikesi olan 2-3 km bantta dron öncüsü zorunlu hale getirilmelidir.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'bahar-3',
                domain: 'INTEL',
                title: 'JÖH/BORDO BERELİ ATAMASI',
                body: 'Özel Kuvvetler timleri, hassas hedef tespiti için ileri gözlemci olarak konuşlanmalı; gerçek zamanlı AI hedef füzyonu komuta merkezine aktarılmalıdır.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'bahar-4',
                domain: 'AIR',
                title: 'AKINCI YOĞUN ATIŞ',
                body: 'AKINCI TİHA unsurları MAM-L ile silahlandırılarak topçu mevzilerine yönelik SEAD görevleri için hazır bekletilsin.',
                priority: 'ÖNCELİKLİ',
            },
        ],
    },
    {
        id: 'op-mavi-vatan',
        name: 'MAVİ VATAN — DOĞU AKDENİZ',
        shortName: 'MAVİ VATAN',
        type: 'OPERATION',
        status: 'RISKY',
        coordinates: '34.50° K — 30.00° D (Doğu Akdeniz)',
        commandingUnit: 'DENİZ KUVVETLERİ KOMUTANLIĞI — GÖREV GRUBU',
        weather: {
            condition: 'Açık, hafif lodos',
            temp: 22,
            windSpeed: 18,
            visibility: 30,
            humidity: 64,
        },
        logistics: { ammoPct: 92, fuelPct: 71, medicalPct: 95, rationPct: 88 },
        forces: { personnel: 1320, airAssets: 9, groundAssets: 0, navalAssets: 14 },
        threats: [
            { label: 'Yabancı sismik araştırma', severity: 'MEDIUM', detail: 'MÜNHASIR ekonomik bölgemize 18 nm yaklaşan iki gemi izlenmektedir.' },
            { label: 'Su altı sensör hattı', severity: 'LOW', detail: 'Bilinmeyen kaynaklı pasif sonar şamandıraları tespit edildi.' },
            { label: 'Hava sahası ihlali riski', severity: 'MEDIUM', detail: 'Yabancı keşif uçağı doğu kuşağında periyodik geçiş yapıyor.' },
        ],
        successRatePct: 96,
        moraleIndex: 89,
        recommendations: [
            {
                id: 'mavi-1',
                domain: 'NAVAL',
                title: 'MİLGEM YAYILIM',
                body: 'TCG İSTANBUL ve TCG KINALIADA arasında 60 nm menzilli yelpaze yayılım kurulmalı; AKSUNGUR İHA gece kuşağında üst gözetlemeyi sürdürmelidir.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'mavi-2',
                domain: 'AIR',
                title: 'TB3 GÖREV ROTASYONU',
                body: 'TCG ANADOLU LHD üzerinden TB3 görev dönüşleri 4 saatlik periyotlarla planlanmalı; AKSAZ kıyısı 250 nm derinliğine kadar elektro-optik tarama sürdürülmelidir.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'mavi-3',
                domain: 'EW',
                title: 'EMİSYON KONTROLÜ',
                body: 'Görev grubunun radyo emisyonu 12 saatlik aralıklarla EMCON-3 seviyesine düşürülerek pasif gözetlemeye geçilmelidir.',
                priority: 'BİLGİ',
            },
            {
                id: 'mavi-4',
                domain: 'INTEL',
                title: 'SAT TİMİ HAZIRDA',
                body: 'TCG ANADOLU üzerindeki SAT timi gemiye binme (VBSS) senaryolarına yönelik olarak 30 dakika tepki süresinde hazır bekletilsin.',
                priority: 'BİLGİ',
            },
        ],
    },
    {
        id: 'base-batman',
        name: 'BATMAN 14. İHA ÜS KOMUTANLIĞI',
        shortName: 'BATMAN 14. İHA',
        type: 'BASE',
        status: 'SAFE',
        coordinates: '37.89° K — 41.11° D (Batman)',
        commandingUnit: '14. İHA ÜS KOMUTANLIĞI',
        weather: {
            condition: 'Açık, sıcak',
            temp: 27,
            windSpeed: 12,
            visibility: 35,
            humidity: 30,
        },
        logistics: { ammoPct: 96, fuelPct: 88, medicalPct: 98, rationPct: 94 },
        forces: { personnel: 980, airAssets: 28, groundAssets: 14, navalAssets: 0 },
        threats: [
            { label: 'Düşük seviye İHA aktivitesi', severity: 'LOW', detail: 'Üs çevresinde günde ortalama 2-3 ticari drone teması; otomatik tepki sürüyor.' },
            { label: 'İç güvenlik tatbikatı', severity: 'LOW', detail: 'Çevre güvenliği için kuşatma tatbikatı planlanmıştır (rutin).' },
        ],
        successRatePct: 99,
        moraleIndex: 94,
        recommendations: [
            {
                id: 'batman-1',
                domain: 'AIR',
                title: 'FİLO ROTASYONU',
                body: '161. Filo (Yarasa) TB2 unsurlarının ⅓ kontenjanı Pençe-Kilit destek görevlerine kaydırılmalı; AKINCI rotasyonu 8 saatte bir tazelenmelidir.',
                priority: 'STABİL',
            },
            {
                id: 'batman-2',
                domain: 'LOGISTICS',
                title: 'MAM-L STOK TAZELEME',
                body: 'Mevcut stok seviyesi %96, ancak harekat tempo bandı için MAM-L ikmali Eskişehir BHHM üzerinden 72 saat içinde planlanmalıdır.',
                priority: 'STABİL',
            },
            {
                id: 'batman-3',
                domain: 'EW',
                title: 'KARGU SÜRÜ TESTİ',
                body: 'STM KARGU sürü algoritma güncellemesi (v3.4) için kapalı bölgede 24 saatlik test penceresi açılması önerilir.',
                priority: 'BİLGİ',
            },
            {
                id: 'batman-4',
                domain: 'INTEL',
                title: 'ANKA-S VERİ AKTARIMI',
                body: 'ANKA-S unsurlarının görev sonu istihbarat çıktıları 4 saat içinde Eskişehir BHHM füzyon merkezine eşitlenmelidir.',
                priority: 'STABİL',
            },
        ],
    },
    {
        id: 'base-eskisehir',
        name: 'ESKİŞEHİR 1. BİRLEŞTİRİLMİŞ HAVA HAREKAT MERKEZİ',
        shortName: 'ESKİŞEHİR BHHM',
        type: 'BASE',
        status: 'SAFE',
        coordinates: '39.78° K — 30.54° D (Eskişehir)',
        commandingUnit: '1. BİRLEŞTİRİLMİŞ HAVA HAREKAT MERKEZİ',
        weather: {
            condition: 'Açık, serin',
            temp: 14,
            windSpeed: 17,
            visibility: 28,
            humidity: 55,
        },
        logistics: { ammoPct: 91, fuelPct: 93, medicalPct: 97, rationPct: 95 },
        forces: { personnel: 1450, airAssets: 22, groundAssets: 18, navalAssets: 0 },
        threats: [
            { label: 'Yok denecek düzey', severity: 'LOW', detail: 'Stratejik derinlikte; doğrudan kinetik tehdit izlenmemektedir.' },
        ],
        successRatePct: 98,
        moraleIndex: 91,
        recommendations: [
            {
                id: 'esk-1',
                domain: 'AIR',
                title: 'KIZILELMA TEST GÖREVİ',
                body: 'Bayraktar KIZILELMA MİUS prototipi, kontrollü hava sahasında supersonic test penceresi için planlanmalıdır.',
                priority: 'BİLGİ',
            },
            {
                id: 'esk-2',
                domain: 'INTEL',
                title: 'AWACS GÖREV PLANI',
                body: 'Barış Kartalı HİK unsuru, Mavi Vatan görev grubunu desteklemek üzere doğu Akdeniz devriyesine 8 saatlik rotasyonla kaldırılmalıdır.',
                priority: 'STABİL',
            },
            {
                id: 'esk-3',
                domain: 'LOGISTICS',
                title: 'YEDEK PARÇA YEDEKLEMESİ',
                body: 'HÜRKUŞ-C filosu için kritik avionik yedek parça stoklaması %91; 90 günlük tedarik takvimi onaylanmalıdır.',
                priority: 'STABİL',
            },
            {
                id: 'esk-4',
                domain: 'EW',
                title: 'EH FÜZYON MERKEZİ',
                body: 'Pençe-Kilit ve Bahar Kalkanı bölgelerinden gelen EH emare hatları, BHHM füzyon merkezinde 30 dakikalık tazeleme döngüsüne alınmalıdır.',
                priority: 'STABİL',
            },
        ],
    },
    {
        id: 'base-izmir',
        name: 'İZMİR ÇİĞLİ 2. ANA JET ÜS KOMUTANLIĞI',
        shortName: 'İZMİR ÇİĞLİ',
        type: 'BASE',
        status: 'SAFE',
        coordinates: '38.51° K — 27.01° D (İzmir)',
        commandingUnit: '2. ANA JET ÜS KOMUTANLIĞI',
        weather: {
            condition: 'Açık, ılık',
            temp: 19,
            windSpeed: 14,
            visibility: 32,
            humidity: 60,
        },
        logistics: { ammoPct: 89, fuelPct: 85, medicalPct: 96, rationPct: 92 },
        forces: { personnel: 870, airAssets: 6, groundAssets: 12, navalAssets: 0 },
        threats: [
            { label: 'Düşük seviye sızma testi', severity: 'LOW', detail: 'Çevre güvenliği rutin test ve denetim sürecinde.' },
        ],
        successRatePct: 97,
        moraleIndex: 88,
        recommendations: [
            {
                id: 'izm-1',
                domain: 'INTEL',
                title: 'DONANIM PROTOTİP DEĞERLENDİRME',
                body: 'IZMIR-HW-DRONE-01 ve giyilebilir sensör (IZMIR-HW-WATCH-01) verileri 24 saatlik dönemde AI füzyon hattına bağlanarak performans raporu alınmalıdır.',
                priority: 'BİLGİ',
            },
            {
                id: 'izm-2',
                domain: 'AIR',
                title: 'EGE DEVRİYESİ',
                body: 'Ege hava sahasında haftalık planlı keşif uçuşu programı, donanma görev grubu ile koordineli olarak revize edilmelidir.',
                priority: 'STABİL',
            },
            {
                id: 'izm-3',
                domain: 'LOGISTICS',
                title: 'YAKIT İKMALİ',
                body: 'Yakıt stok seviyesi %85; Aliağa rafineri hattından 30 günlük rezerv yenilenmesi planlanmalıdır.',
                priority: 'STABİL',
            },
            {
                id: 'izm-4',
                domain: 'EW',
                title: 'SENSÖR HAT TAZELEME',
                body: 'Çevresel algılayıcılar için anti-spoofing firmware (v2.1) sıralı dağıtıma alınsın.',
                priority: 'BİLGİ',
            },
        ],
    },
    {
        id: 'base-golcuk',
        name: 'GÖLCÜK DENİZ ANA ÜSSÜ',
        shortName: 'GÖLCÜK',
        type: 'BASE',
        status: 'SAFE',
        coordinates: '40.72° K — 29.82° D (Kocaeli)',
        commandingUnit: 'KUZEY DENİZ SAHA KOMUTANLIĞI',
        weather: {
            condition: 'Parçalı bulutlu',
            temp: 15,
            windSpeed: 19,
            visibility: 22,
            humidity: 68,
        },
        logistics: { ammoPct: 94, fuelPct: 90, medicalPct: 98, rationPct: 96 },
        forces: { personnel: 2100, airAssets: 8, groundAssets: 6, navalAssets: 9 },
        threats: [
            { label: 'Su altı sondaj aktivitesi', severity: 'LOW', detail: 'Rutin sivil aktivite, yakın takipte.' },
            { label: 'Marmara hava trafiği', severity: 'LOW', detail: 'Sivil koridor yoğunluğu normal seviyenin %12 üstünde.' },
        ],
        successRatePct: 98,
        moraleIndex: 90,
        recommendations: [
            {
                id: 'gol-1',
                domain: 'NAVAL',
                title: 'TCG ANADOLU GÖREV HAZIRLIĞI',
                body: 'TCG ANADOLU LHD için TB3 ve AKSUNGUR entegrasyonu 12 saatlik fonksiyonel test penceresine alınmalıdır.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'gol-2',
                domain: 'NAVAL',
                title: 'MİLGEM ROTASYONU',
                body: 'TCG İSTANBUL F-515 görev rotasyonu Mavi Vatan görev grubuna katılmak üzere 72 saat içinde hazır olmalıdır.',
                priority: 'ÖNCELİKLİ',
            },
            {
                id: 'gol-3',
                domain: 'INTEL',
                title: 'SAT TİMİ EĞİTİMİ',
                body: 'SAT-Komando-Tim-1 için VBSS canlı atış senaryosu Aksaz koordinasyonu ile planlanmalıdır.',
                priority: 'STABİL',
            },
            {
                id: 'gol-4',
                domain: 'LOGISTICS',
                title: 'BAKIM TAKVİMİ',
                body: 'TCG ANADOLU 90 günlük bakım kapısı için yedek parça ön siparişi tamamlanmalıdır.',
                priority: 'STABİL',
            },
        ],
    },
];

const STATUS_LABEL: Record<ContextStatus, string> = {
    SAFE: 'GÜVENLİ',
    RISKY: 'RİSKLİ',
    CRITICAL: 'KRİTİK',
};

const STATUS_COLOR: Record<ContextStatus, string> = {
    SAFE: 'bg-emerald-500',
    RISKY: 'bg-amber-500',
    CRITICAL: 'bg-rose-500',
};

const PRIORITY_STYLES: Record<Recommendation['priority'], { dot: string; chip: string; ping: boolean }> = {
    KRİTİK: { dot: 'bg-rose-500', chip: 'text-rose-300 bg-rose-500/10', ping: true },
    ÖNCELİKLİ: { dot: 'bg-indigo-500', chip: 'text-indigo-300 bg-indigo-500/10', ping: true },
    STABİL: { dot: 'bg-emerald-500', chip: 'text-emerald-300 bg-emerald-500/10', ping: false },
    BİLGİ: { dot: 'bg-sky-500', chip: 'text-sky-300 bg-sky-500/10', ping: false },
};

const DOMAIN_STYLES: Record<Recommendation['domain'], { color: string; border: string; icon: string; title: string }> = {
    AIR: { color: 'text-indigo-400', border: 'border-indigo-500/30', icon: 'fa-jet-fighter', title: 'HAVA UNSURLARI' },
    LOGISTICS: { color: 'text-emerald-400', border: 'border-emerald-500/30', icon: 'fa-truck-moving', title: 'LOJİSTİK' },
    EW: { color: 'text-amber-400', border: 'border-amber-500/30', icon: 'fa-tower-broadcast', title: 'ELEKTRONİK HARP' },
    INTEL: { color: 'text-sky-400', border: 'border-sky-500/30', icon: 'fa-eye', title: 'İSTİHBARAT' },
    NAVAL: { color: 'text-cyan-400', border: 'border-cyan-500/30', icon: 'fa-ship', title: 'DENİZ UNSURLARI' },
    GROUND: { color: 'text-rose-400', border: 'border-rose-500/30', icon: 'fa-truck-field', title: 'KARA UNSURLARI' },
};

const SEVERITY_STYLES: Record<ThreatEntry['severity'], string> = {
    LOW: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/5',
    MEDIUM: 'text-amber-300 border-amber-500/30 bg-amber-500/5',
    HIGH: 'text-rose-300 border-rose-500/30 bg-rose-500/5',
    CRITICAL: 'text-red-300 border-red-500/40 bg-red-500/10',
};

export function StrategicAnalysisPage() {
    const [selectedContext, setSelectedContext] = useState<AnalysisContext>(MOCK_CONTEXTS[0]);

    // Aggregate KPIs across all contexts (so cards feel realistic and dynamic).
    const aggregates = useMemo(() => {
        const totalPersonnel = MOCK_CONTEXTS.reduce((sum, c) => sum + c.forces.personnel, 0);
        const totalThreats = MOCK_CONTEXTS.reduce((sum, c) => sum + c.threats.length, 0);
        const criticalThreats = MOCK_CONTEXTS.reduce(
            (sum, c) => sum + c.threats.filter(t => t.severity === 'CRITICAL' || t.severity === 'HIGH').length,
            0,
        );
        const avgLogistics =
            MOCK_CONTEXTS.reduce((sum, c) => {
                const avg =
                    (c.logistics.ammoPct + c.logistics.fuelPct + c.logistics.medicalPct + c.logistics.rationPct) / 4;
                return sum + avg;
            }, 0) / MOCK_CONTEXTS.length;
        const avgSuccess =
            MOCK_CONTEXTS.reduce((sum, c) => sum + c.successRatePct, 0) / MOCK_CONTEXTS.length;

        return {
            totalPersonnel,
            totalThreats,
            criticalThreats,
            avgLogistics,
            avgSuccess,
            activeOperations: MOCK_CONTEXTS.filter(c => c.type === 'OPERATION').length,
        };
    }, []);

    const formatNumber = (value: number) =>
        value.toLocaleString('tr-TR', { maximumFractionDigits: 0 });

    return (
        <div className="h-full overflow-y-auto bg-slate-900/95 p-8 pb-24 custom-scrollbar font-sans relative">
            <div className="max-w-[1800px] mx-auto">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-indigo-500/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500"></div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] font-sans italic leading-none">
                                STRATEJİK ANALİZ
                            </h2>
                            <div className="text-xs text-indigo-400 tracking-widest mt-1">
                                GENEL HAREKAT RESMİ — {MOCK_CONTEXTS.length} BÖLGE / {aggregates.activeOperations} AKTİF OPERASYON
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-slate-500 tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        CANLI BESLEME — SİMÜLE
                    </div>
                </div>

                {/* KPI Cards (Aggregated) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard
                        accent="indigo"
                        icon="fa-users"
                        label="AKTİF PERSONEL"
                        value={formatNumber(aggregates.totalPersonnel)}
                        hint={`${MOCK_CONTEXTS.length} bölge genelinde`}
                    />
                    <KpiCard
                        accent="emerald"
                        icon="fa-boxes-stacked"
                        label="LOJİSTİK ORANI"
                        value={`%${aggregates.avgLogistics.toFixed(1)}`}
                        hint="Mühimmat + yakıt + sağlık + erzak"
                    />
                    <KpiCard
                        accent="amber"
                        icon="fa-chart-line"
                        label="BAŞARI ORANI"
                        value={`%${aggregates.avgSuccess.toFixed(1)}`}
                        hint="Son 30 günün ortalaması"
                    />
                    <KpiCard
                        accent="rose"
                        icon="fa-triangle-exclamation"
                        label="YÜKSEK/KRİTİK TEHDİT"
                        value={`${aggregates.criticalThreats}`}
                        hint={`Toplam ${aggregates.totalThreats} izlenen unsur`}
                    />
                </div>

                {/* Main Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Context Selector */}
                    <div className="lg:col-span-4 bg-slate-800/20 border border-slate-700/50 flex flex-col h-[640px]">
                        <div className="bg-slate-800/50 p-3 border-b border-slate-700/50 text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                            <span>
                                <i className="fa-solid fa-map mr-2 text-indigo-400"></i>
                                BÖLGE & OPERASYON
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{MOCK_CONTEXTS.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {MOCK_CONTEXTS.map(ctx => {
                                const isActive = selectedContext.id === ctx.id;
                                return (
                                    <button
                                        key={ctx.id}
                                        onClick={() => setSelectedContext(ctx)}
                                        className={`
                                            w-full text-left p-4 border transition-all relative group
                                            ${isActive
                                                ? 'bg-indigo-500/10 border-indigo-500/50'
                                                : 'bg-slate-900/40 border-slate-700/30 hover:bg-slate-800'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span
                                                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${
                                                    ctx.type === 'BASE'
                                                        ? 'bg-slate-700 text-slate-300'
                                                        : 'bg-sky-900/30 text-sky-400'
                                                }`}
                                            >
                                                {ctx.type === 'BASE' ? 'ÜSSÜ' : 'OPERASYON'}
                                            </span>
                                            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[ctx.status]}`}></span>
                                        </div>
                                        <h3 className={`font-bold text-sm leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                            {ctx.shortName}
                                        </h3>
                                        <div className="text-[10px] text-slate-500 font-mono mt-1 truncate">
                                            {ctx.commandingUnit}
                                        </div>
                                        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                            <span>
                                                <i className="fa-solid fa-user mr-1"></i>
                                                {formatNumber(ctx.forces.personnel)}
                                            </span>
                                            <span>
                                                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                                {ctx.threats.length}
                                            </span>
                                            <span className="ml-auto text-[9px] uppercase tracking-widest">
                                                {STATUS_LABEL[ctx.status]}
                                            </span>
                                        </div>
                                        {isActive && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Selected Context Detail */}
                    <div className="lg:col-span-8 space-y-4">

                        {/* Context Header */}
                        <div className="bg-slate-900/60 border border-slate-700/50 p-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[10px] text-indigo-400 uppercase tracking-widest">
                                    {selectedContext.type === 'BASE' ? 'ÜS KOMUTANLIĞI' : 'AKTİF HAREKAT'}
                                </div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                                    {selectedContext.name}
                                </h3>
                                <div className="text-xs text-slate-500 font-mono mt-1">
                                    {selectedContext.coordinates} · {selectedContext.commandingUnit}
                                </div>
                            </div>
                            <div className={`text-xs font-bold tracking-widest px-3 py-1.5 rounded-sm border ${
                                selectedContext.status === 'CRITICAL'
                                    ? 'border-rose-500/40 text-rose-300 bg-rose-500/10'
                                    : selectedContext.status === 'RISKY'
                                        ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                        : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                            }`}>
                                <i className={`fa-solid mr-2 ${
                                    selectedContext.status === 'CRITICAL'
                                        ? 'fa-circle-exclamation'
                                        : selectedContext.status === 'RISKY'
                                            ? 'fa-triangle-exclamation'
                                            : 'fa-shield-halved'
                                }`}></i>
                                DURUM: {STATUS_LABEL[selectedContext.status]}
                            </div>
                        </div>

                        {/* Weather + Forces + Logistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* Weather */}
                            <div className="bg-slate-900/50 border border-slate-700/50 p-4 flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <i className="fa-solid fa-cloud-sun text-3xl text-sky-400"></i>
                                    <div>
                                        <div className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">HAVA</div>
                                        <div className="text-lg text-white font-bold leading-none">
                                            {selectedContext.weather.temp}°C
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-300">{selectedContext.weather.condition}</div>
                                <div className="text-[10px] text-slate-500 font-mono grid grid-cols-2 gap-x-2 gap-y-0.5">
                                    <span>RÜZ: {selectedContext.weather.windSpeed} km/s</span>
                                    <span>GÖR: {selectedContext.weather.visibility} km</span>
                                    <span>NEM: %{selectedContext.weather.humidity}</span>
                                    <span className="text-emerald-400">UÇUŞ: AÇIK</span>
                                </div>
                            </div>

                            {/* Forces */}
                            <div className="bg-slate-900/50 border border-slate-700/50 p-4">
                                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-3">KUVVET DURUMU</div>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <ForceStat icon="fa-users" label="Personel" value={formatNumber(selectedContext.forces.personnel)} accent="text-white" />
                                    <ForceStat icon="fa-plane" label="Hava" value={selectedContext.forces.airAssets.toString()} accent="text-indigo-400" />
                                    <ForceStat icon="fa-truck-pickup" label="Kara" value={selectedContext.forces.groundAssets.toString()} accent="text-amber-400" />
                                    <ForceStat icon="fa-ship" label="Deniz" value={selectedContext.forces.navalAssets.toString()} accent="text-cyan-400" />
                                </div>
                            </div>

                            {/* Logistics */}
                            <div className="bg-slate-900/50 border border-slate-700/50 p-4">
                                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-3">LOJİSTİK SEVİYESİ</div>
                                <div className="space-y-2">
                                    <LogisticsBar label="Mühimmat" value={selectedContext.logistics.ammoPct} />
                                    <LogisticsBar label="Yakıt" value={selectedContext.logistics.fuelPct} />
                                    <LogisticsBar label="Sağlık" value={selectedContext.logistics.medicalPct} />
                                    <LogisticsBar label="Erzak" value={selectedContext.logistics.rationPct} />
                                </div>
                            </div>
                        </div>

                        {/* Threats */}
                        <div className="bg-slate-900/50 border border-slate-700/50 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-sm text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <i className="fa-solid fa-radar animate-pulse"></i>
                                    BÖLGESEL TEHDİT TABLOSU
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 tracking-widest">
                                    {selectedContext.threats.length} unsur · {selectedContext.threats.filter(t => t.severity === 'HIGH' || t.severity === 'CRITICAL').length} öncelikli
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {selectedContext.threats.map((threat, idx) => (
                                    <div
                                        key={idx}
                                        className={`border p-3 rounded-sm flex flex-col gap-1 ${SEVERITY_STYLES[threat.severity]}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold tracking-wider uppercase">{threat.label}</span>
                                            <span className="text-[10px] font-mono tracking-widest border border-current px-1.5 py-0.5">
                                                {threat.severity}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-300/90">{threat.detail}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-slate-900/50 border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                                <div className="text-sm text-rose-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <i className="fa-solid fa-chess-board text-lg"></i>
                                    STRATEJİK HAMLE TAVSİYELERİ
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                                    <span>BAŞARI: <span className="text-emerald-400">%{selectedContext.successRatePct}</span></span>
                                    <span>MORAL: <span className={selectedContext.moraleIndex > 80 ? 'text-emerald-400' : selectedContext.moraleIndex > 60 ? 'text-amber-400' : 'text-rose-400'}>{selectedContext.moraleIndex}</span></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedContext.recommendations.map(rec => (
                                    <RecommendationCard key={rec.id} rec={rec} />
                                ))}
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
    accent: 'indigo' | 'emerald' | 'amber' | 'rose';
    icon: string;
    label: string;
    value: string;
    hint: string;
}

function KpiCard({ accent, icon, label, value, hint }: KpiCardProps) {
    const palette = {
        indigo: { border: 'border-indigo-500/20', icon: 'text-indigo-500/20', label: 'text-indigo-400' },
        emerald: { border: 'border-emerald-500/20', icon: 'text-emerald-500/20', label: 'text-emerald-500' },
        amber: { border: 'border-amber-500/20', icon: 'text-amber-500/20', label: 'text-amber-500' },
        rose: { border: 'border-rose-500/20', icon: 'text-rose-500/20', label: 'text-rose-500' },
    }[accent];
    return (
        <div className={`bg-slate-800/40 border p-4 relative group hover:bg-slate-800/60 transition-colors ${palette.border}`}>
            <i className={`fa-solid ${icon} absolute top-4 right-4 ${palette.icon} text-3xl`}></i>
            <div className={`text-[10px] uppercase tracking-widest mb-1 ${palette.label}`}>{label}</div>
            <div className="text-3xl font-mono text-white font-bold">{value}</div>
            <div className="text-[10px] text-slate-500">{hint}</div>
        </div>
    );
}

interface ForceStatProps {
    icon: string;
    label: string;
    value: string;
    accent: string;
}

function ForceStat({ icon, label, value, accent }: ForceStatProps) {
    return (
        <div className="flex items-center gap-2">
            <i className={`fa-solid ${icon} ${accent} w-4 text-center`}></i>
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{label}</span>
                <span className={`font-mono font-bold ${accent}`}>{value}</span>
            </div>
        </div>
    );
}

interface LogisticsBarProps {
    label: string;
    value: number;
}

function LogisticsBar({ label, value }: LogisticsBarProps) {
    const color = value > 75 ? 'bg-emerald-500' : value > 50 ? 'bg-amber-500' : 'bg-rose-500';
    return (
        <div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                <span>{label}</span>
                <span className="text-slate-200">%{value}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
}

interface RecommendationCardProps {
    rec: Recommendation;
}

function RecommendationCard({ rec }: RecommendationCardProps) {
    const domain = DOMAIN_STYLES[rec.domain];
    const priority = PRIORITY_STYLES[rec.priority];

    return (
        <div className={`bg-slate-950/50 border border-slate-800 p-5 rounded-sm flex flex-col relative overflow-hidden group hover:${domain.border} transition-all`}>
            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                <i className={`fa-solid ${domain.icon} text-6xl`}></i>
            </div>
            <h4 className={`${domain.color} font-bold text-sm mb-3 uppercase tracking-wider border-b ${domain.border} pb-2 flex items-center justify-between`}>
                <span>
                    <i className={`fa-solid ${domain.icon} mr-2`}></i>
                    {rec.title}
                </span>
                <span className="text-[9px] font-mono text-slate-500 tracking-widest">{domain.title}</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">{rec.body}</p>
            <div className={`flex items-center gap-2 text-[10px] font-mono p-2 rounded ${priority.chip}`}>
                <span className={`w-2 h-2 rounded-full ${priority.dot} ${priority.ping ? 'animate-pulse' : ''}`}></span>
                ÖNCELİK: {rec.priority}
            </div>
        </div>
    );
}
