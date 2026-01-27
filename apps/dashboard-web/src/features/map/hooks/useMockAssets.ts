import { useMemo } from 'react';

export type AssetType = "UAV" | "SOLDIER" | "GROUND_VEHICLE" | "WEARABLE";

export interface MockAsset {
  id: string;
  type: AssetType;
  position: [number, number]; // [lat, lon]
  name?: string;
}

// Helper to add small random offsets to a center point
function offset(center: [number, number], latOffset: number, lngOffset: number): [number, number] {
  return [center[0] + latOffset, center[1] + lngOffset];
}

export function useMockAssets(center: [number, number] | null = null): MockAsset[] {
  // Default to Ankara if no center provided
  const baseCenter: [number, number] = center || [39.93, 32.85];

  return useMemo(() => [
    {
      id: "UAV-01",
      type: "UAV",
      position: offset(baseCenter, 0.005, 0.002),
      name: "HS-01",
    },
    {
      id: "UAV-02",
      type: "UAV",
      position: offset(baseCenter, 0.008, 0.008),
      name: "HS-02",
    },
    {
      id: "SOLDIER-01",
      type: "SOLDIER",
      position: offset(baseCenter, 0.002, 0.005),
      name: "Piyade-01",
    },
    {
      id: "SOLDIER-02",
      type: "SOLDIER",
      position: offset(baseCenter, 0.004, 0.010),
      name: "Piyade-02",
    },
    {
      id: "VEHICLE-01",
      type: "GROUND_VEHICLE",
      position: offset(baseCenter, -0.003, 0.003), // South-West
      name: "Araç-01",
    },
    {
      id: "SOLDIER-03",
      type: "SOLDIER",
      position: offset(baseCenter, 0.003, 0.007),
      name: "Piyade-03",
    },
  ], [baseCenter]);
}

