import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface Threat {
  id: string;
  position: [number, number]; // [lat, lon]
  label: string;
  coordinates: string;
  type: 'AIR' | 'SWARM';
}

// Helper to offset position
function offset(center: [number, number], latOffset: number, lngOffset: number): [number, number] {
  return [center[0] + latOffset, center[1] + lngOffset];
}

interface ThreatMarkersProps {
  center?: [number, number];
}

// Create threat marker icon (yellow diamond) - Sade ve kompakt
function createThreatIcon(threat: Threat): ReturnType<typeof divIcon> {
  return divIcon({
    className: 'custom-threat-marker',
    html: `
      <div style="
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
      ">
        <svg width="14" height="14" viewBox="0 0 16 16" style="flex-shrink: 0; filter: drop-shadow(0 0 3px rgba(234, 179, 8, 0.8));">
          <path
            d="M 8 0 L 16 8 L 8 16 L 0 8 Z"
            fill="#eab308"
            stroke="#fbbf24"
            stroke-width="1"
          />
        </svg>
        <div style="
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1px;
        ">
          <div style="
            color: #fb923c;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            line-height: 1.2;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          ">${threat.label} - BİLİNMEYEN</div>
          <div style="
            color: #e2e8f0;
            font-size: 9px;
            font-family: monospace;
            white-space: nowrap;
            line-height: 1.2;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          ">${threat.coordinates}</div>
        </div>
      </div>
    `,
    iconSize: [200, 34],
    iconAnchor: [0, 15],
  });
}

export function ThreatMarkers({ center }: ThreatMarkersProps) {
  // Use dynamic center if provided, default to Ankara
  const baseCenter: [number, number] = center || [39.93, 32.85];

  // Dynamic threat data centered around the base location
  const threats: Threat[] = [
    {
      id: 'THREAT-01',
      position: offset(baseCenter, 0.007, 0.007), // Tahrip kutusu içinde
      label: '01-HAVA',
      coordinates: `${offset(baseCenter, 0.007, 0.007)[0].toFixed(5)} N ${offset(baseCenter, 0.007, 0.007)[1].toFixed(5)} E`,
      type: 'AIR',
    },
  ];

  return (
    <>
      {threats.map((threat) => (
        <Marker
          key={threat.id}
          position={threat.position}
          icon={createThreatIcon(threat)}
          interactive={false}
          zIndexOffset={2000}
        />
      ))}
    </>
  );
}

