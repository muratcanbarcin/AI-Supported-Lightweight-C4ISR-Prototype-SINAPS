import { useMemo } from 'react';
import { Circle } from 'react-leaflet';
import type { MockAsset } from '../hooks/useMockAssets';

interface AssetBoundsCircleProps {
  assets: MockAsset[];
}

export function AssetBoundsCircle({ assets }: AssetBoundsCircleProps) {
  const bounds = useMemo(() => {
    if (assets.length === 0) return null;

    let minLat = assets[0].position[0];
    let maxLat = assets[0].position[0];
    let minLon = assets[0].position[1];
    let maxLon = assets[0].position[1];

    assets.forEach((asset) => {
      const [lat, lon] = asset.position;
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    });

    // Calculate center
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Calculate radius to cover all assets with padding
    // Convert lat/lon difference to approximate meters
    // 1 degree lat ≈ 111km, 1 degree lon ≈ 111km * cos(lat)
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const latMeters = latDiff * 111000;
    const lonMeters = lonDiff * 111000 * Math.cos((centerLat * Math.PI) / 180);
    
    // Use diagonal distance + much larger padding for bigger circle
    const diagonal = Math.sqrt(latMeters * latMeters + lonMeters * lonMeters);
    const radius = diagonal / 2 + 800; // 800m padding - çok daha büyük alan

    return {
      center: [centerLat, centerLon] as [number, number],
      radius,
    };
  }, [assets]);

  if (!bounds) return null;

  return (
    <Circle
      center={bounds.center}
      radius={bounds.radius}
      pathOptions={{
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.03,
        weight: 2,
        opacity: 0.6,
        dashArray: '15, 10',
      }}
      interactive={false}
    />
  );
}

