export type AssetType = "UAV" | "SOLDIER" | "GROUND_VEHICLE" | "WEARABLE";
export type AssetStatus = "ONLINE" | "WARNING" | "OFFLINE";

// Specific Details Interfaces
export interface BaseAssetDetails {
  batteryLevel?: number; // Common (soc_pct)
  signalQuality?: number; // rssi mapped to 0-100
  latency?: number; // ms
}

export interface Operator {
  name: string;
  rank: string;
  id: string;
}

export interface UAVDetails extends BaseAssetDetails {
  altitude: number; // m (alt_m)
  speed: number;   // km/h (ground_speed_mps * 3.6)
  heading: number; // degrees (yaw_deg)
  // New extended fields
  verticalSpeed: number; // m/s
  pitch: number; // deg
  roll: number; // deg
  voltage: number; // v
  mode: string; // "AUTO", "LOITER", etc.
  operator?: Operator;
}

export interface SoldierDetails extends BaseAssetDetails {
  heartRate: number; // bpm
  spo2: number;      // percentage
  status: string;    // "Moving", "Stationary"
  steps: number;
  // New extended fields
  respirationRate: number; // bpm
  skinTemp: number; // celsius
  stressScore: number; // 0-1
  bodyPosture: "STANDING" | "PRONE" | "RUNNING";
  // Personal Info
  realName?: string;
  rank?: string;
}

// ... existing vehicle interface ...

export interface VehicleDetails extends BaseAssetDetails {
  fuelLevel: number;    // percentage
  engineTemp: number;   // celsius
  speed: number;        // km/h
  odometer: number;     // km
  // New extended fields
  health: number; // pct
  oilPressure: number; // psi
  transmissionTemp: number; // celsius
  vehicleModel: "KIRPI" | "COBRA" | "AMBULANCE";
  operator?: Operator;
}

// ... existing AssetSummary ...

export interface AssetTask {
  id: string;
  title: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
}

export interface AssetSummary {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  lastSeen: string;
  coordinates?: string; // e.g. "39.937 N 32.857 E"
  details: UAVDetails | SoldierDetails | VehicleDetails;
  tasks?: AssetTask[];
}

export type Severity = "HIGH" | "MEDIUM" | "LOW";

export interface AlertItem {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  timeAgo: string;
  relatedAssets: string[];
}

// Mock Assets
export const mockAssets: AssetSummary[] = [
  {
    id: "UAV-01",
    name: "HS-01",
    type: "UAV",
    status: "ONLINE",
    lastSeen: "Şimdi",
    coordinates: "39.935 N 32.852 E",
    details: {
      altitude: 450, // m
      speed: 120,    // km/h
      heading: 45,
      batteryLevel: 72,
      signalQuality: 95,
      latency: 12,
      verticalSpeed: 0.5,
      pitch: -3.2,
      roll: 2.1,
      voltage: 24.5,
      mode: "LOITER",
      operator: {
        name: "Ahmet Yılmaz",
        rank: "Üsteğmen",
        id: "OP-05"
      }
    } as UAVDetails,
    tasks: [
      { id: "t1", title: "Sektör A Taraması", status: "IN_PROGRESS", priority: "HIGH" },
      { id: "t2", title: "Görüntü Aktarımı", status: "COMPLETED", priority: "MEDIUM" }
    ]
  },
  {
    id: "UAV-02",
    name: "HS-02",
    type: "UAV",
    status: "ONLINE",
    lastSeen: "Şimdi",
    coordinates: "39.938 N 32.858 E",
    details: {
      altitude: 380,
      speed: 98,
      heading: 120,
      batteryLevel: 45,
      signalQuality: 82,
      latency: 18,
      verticalSpeed: -0.2,
      pitch: 1.5,
      roll: -0.8,
      voltage: 23.8,
      mode: "AUTO",
      operator: {
        name: "Mehmet Öz",
        rank: "Teğmen",
        id: "OP-08"
      }
    } as UAVDetails,
    tasks: [
      { id: "t3", title: "Rutin Devriye", status: "COMPLETED", priority: "LOW" },
      { id: "t4", title: "Üsse Dönüş", status: "PENDING", priority: "MEDIUM" }
    ]
  },
  {
    id: "SOLDIER-01",
    name: "Piyade-01",
    type: "SOLDIER",
    status: "ONLINE",
    lastSeen: "Şimdi",
    coordinates: "39.932 N 32.855 E",
    details: {
      realName: "Emirhan Güler",
      rank: "Yüzbaşı",
      heartRate: 72,
      spo2: 98,
      status: "Hareketli",
      steps: 4240,
      batteryLevel: 88,
      respirationRate: 14,
      skinTemp: 36.6,
      stressScore: 0.2,
      bodyPosture: "STANDING",
      signalQuality: 98,
      latency: 50
    } as SoldierDetails,
    tasks: [
      { id: "t5", title: "Bölge Güvenliği", status: "IN_PROGRESS", priority: "HIGH" },
      { id: "t6", title: "Mühimmat Kontrolü", status: "COMPLETED", priority: "LOW" },
      { id: "t7", title: "Tim Koordinasyonu", status: "PENDING", priority: "MEDIUM" }
    ]
  },
  {
    id: "SOLDIER-02",
    name: "Piyade-02",
    type: "SOLDIER",
    status: "WARNING",
    lastSeen: "2 dk önce",
    coordinates: "39.934 N 32.860 E",
    details: {
      realName: "Murat Can Barçin",
      rank: "Üsteğmen",
      heartRate: 110, // High HR -> Warning
      spo2: 94,
      status: "Koşuyor",
      steps: 6890,
      batteryLevel: 65,
      respirationRate: 28,
      skinTemp: 37.2,
      stressScore: 0.8,
      bodyPosture: "RUNNING",
      signalQuality: 70,
      latency: 120
    } as SoldierDetails,
    tasks: [
      { id: "t8", title: "Hedef Gözetleme", status: "IN_PROGRESS", priority: "HIGH" }
    ]
  },
  {
    id: "VEHICLE-01",
    name: "Araç-01",
    type: "GROUND_VEHICLE",
    status: "ONLINE",
    lastSeen: "Şimdi",
    coordinates: "39.930 N 32.853 E",
    details: {
      speed: 45,
      fuelLevel: 85,
      engineTemp: 90,
      odometer: 12540,
      health: 98,
      oilPressure: 45,
      transmissionTemp: 85,
      vehicleModel: "KIRPI",
      signalQuality: 100,
      latency: 20,
      operator: {
        name: "Ali Veli",
        rank: "Uzman Çavuş",
        id: "OP-12"
      }
    } as VehicleDetails,
    tasks: [
      { id: "t9", title: "Lojistik Destek", status: "IN_PROGRESS", priority: "MEDIUM" }
    ]
  },
  {
    id: "SOLDIER-03",
    name: "Piyade-03",
    type: "SOLDIER",
    status: "ONLINE",
    lastSeen: "Şimdi",
    coordinates: "39.933 N 32.857 E",
    details: {
      realName: "Sarp Deniz Topaloğlu",
      rank: "Teğmen",
      heartRate: 68,
      spo2: 99,
      status: "Sabit",
      steps: 2100,
      batteryLevel: 92,
      respirationRate: 12,
      skinTemp: 36.5,
      stressScore: 0.1,
      bodyPosture: "PRONE",
      signalQuality: 95,
      latency: 45
    } as SoldierDetails,
    tasks: [
      { id: "t10", title: "Keskin Nişancı Pozisyonu", status: "IN_PROGRESS", priority: "HIGH" },
      { id: "t11", title: "Radyo Sessizliği", status: "PENDING", priority: "HIGH" }
    ]
  },
];

export const mockAlerts: AlertItem[] = [
  {
    id: "1",
    severity: "HIGH",
    title: "SINIR İHLALİ TESPİTİ",
    description: "Kuzey sektöründe tanımlanamayan hava aracı tespit edildi. İrtifa 1200ft, Hız 85km/s.",
    timeAgo: "2 DK ÖNCE",
    relatedAssets: ["UAV-01"]
  },
  {
    id: "2",
    severity: "MEDIUM",
    title: "DÜŞÜK SİNYAL KALİTESİ",
    description: "Piyade-02 birimi ile iletişimde paket kaybı yaşanıyor (%15).",
    timeAgo: "5 DK ÖNCE",
    relatedAssets: ["SOLDIER-02"]
  },
  {
    id: "3",
    severity: "LOW",
    title: "GÖREV TAMAMLANDI",
    description: "UAV-02 rutin devriye görevini tamamladı ve üsse dönüyor.",
    timeAgo: "15 DK ÖNCE",
    relatedAssets: ["UAV-02"]
  }
];
