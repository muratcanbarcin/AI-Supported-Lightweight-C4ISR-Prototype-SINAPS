export type AssetType = "UAV" | "SOLDIER" | "GROUND_VEHICLE" | "WEARABLE";
export type AssetStatus = "ONLINE" | "WARNING" | "OFFLINE";

export interface AssetSummary {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  lastSeen: string;
  details?: {
    speedMps?: number;
    headingDeg?: number;
    heartRateBpm?: number;
    steps?: number;
  };
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
    lastSeen: "12 sn önce",
    details: {
      speedMps: 12.5,
      headingDeg: 45,
    },
  },
  {
    id: "UAV-02",
    name: "HS-02",
    type: "UAV",
    status: "ONLINE",
    lastSeen: "34 sn önce",
    details: {
      speedMps: 8.3,
      headingDeg: 120,
    },
  },
  {
    id: "SOLDIER-01",
    name: "Piyade-01",
    type: "SOLDIER",
    status: "ONLINE",
    lastSeen: "8 sn önce",
    details: {
      heartRateBpm: 72,
      steps: 1240,
    },
  },
  {
    id: "SOLDIER-02",
    name: "Piyade-02",
    type: "SOLDIER",
    status: "WARNING",
    lastSeen: "2 dk önce",
    details: {
      heartRateBpm: 95,
      steps: 890,
    },
  },
  {
    id: "VEHICLE-01",
    name: "Araç-01",
    type: "GROUND_VEHICLE",
    status: "ONLINE",
    lastSeen: "5 sn önce",
    details: {
      speedMps: 15.8,
      headingDeg: 90,
    },
  },
  {
    id: "WEARABLE-01",
    name: "Akıllı Saat-01",
    type: "WEARABLE",
    status: "ONLINE",
    lastSeen: "3 sn önce",
    details: {
      heartRateBpm: 68,
      steps: 2100,
    },
  },
];

// Mock Alerts
export const mockAlerts: AlertItem[] = [
  {
    id: "ALERT-001",
    severity: "HIGH",
    title: "Bilinmeyen UAV tespit edildi",
    description: "Koordinat 39.9360 N, 32.8620 E. Yaklaşma rotası analiz ediliyor.",
    timeAgo: "2 dk önce",
    relatedAssets: ["UAV-01", "UAV-02"],
  },
  {
    id: "ALERT-002",
    severity: "MEDIUM",
    title: "Araç tespiti yapıldı",
    description: "Araç tipi: Binek araç. Güven seviyesi: %92.",
    timeAgo: "5 dk önce",
    relatedAssets: ["UAV-01"],
  },
  {
    id: "ALERT-003",
    severity: "LOW",
    title: "Piyade birliği normal operasyonel durumda",
    description: "Tüm sensörler çalışıyor, sağlık durumu iyi.",
    timeAgo: "8 dk önce",
    relatedAssets: ["SOLDIER-01"],
  },
  {
    id: "ALERT-004",
    severity: "HIGH",
    title: "Piyade birliği sinyal kaybı",
    description: "SOLDIER-02 birliği uzun süredir sinyal vermiyor.",
    timeAgo: "12 dk önce",
    relatedAssets: ["SOLDIER-02"],
  },
  {
    id: "ALERT-005",
    severity: "MEDIUM",
    title: "Yüksek kalp atış hızı",
    description: "Piyade-02 birliğinde anormal kalp atış hızı tespit edildi.",
    timeAgo: "15 dk önce",
    relatedAssets: ["SOLDIER-02", "WEARABLE-01"],
  },
];

