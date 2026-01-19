import { useMemo } from 'react';

export type AssetType = "UAV" | "SOLDIER" | "GROUND_VEHICLE" | "WEARABLE";

export interface MockAsset {
  id: string;
  type: AssetType;
  position: [number, number]; // [lat, lon]
  name?: string;
}

export function useMockAssets(): MockAsset[] {
  return useMemo(() => [
    {
      id: "UAV-01",
      type: "UAV",
      position: [39.935, 32.852],
      name: "HS-01",
    },
    {
      id: "UAV-02",
      type: "UAV",
      position: [39.938, 32.858],
      name: "HS-02",
    },
    {
      id: "SOLDIER-01",
      type: "SOLDIER",
      position: [39.932, 32.855],
      name: "Piyade-01",
    },
    {
      id: "SOLDIER-02",
      type: "SOLDIER",
      position: [39.934, 32.860],
      name: "Piyade-02",
    },
    {
      id: "VEHICLE-01",
      type: "GROUND_VEHICLE",
      position: [39.930, 32.853],
      name: "Araç-01",
    },
    {
      id: "SOLDIER-03", // Changed from WEARABLE-01
      type: "SOLDIER",  // Changed from WEARABLE
      position: [39.933, 32.857],
      name: "Piyade-03", // Changed form Akıllı Saat-01
    },
  ], []);
}

