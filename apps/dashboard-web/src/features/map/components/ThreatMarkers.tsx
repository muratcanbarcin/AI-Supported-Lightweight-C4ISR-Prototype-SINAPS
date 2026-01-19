import { Marker } from 'react-leaflet';
import { divIcon } from 'leaflet';

interface Threat {
  id: string;
  position: [number, number]; // [lat, lon]
  label: string;
  coordinates: string;
  type: 'AIR' | 'SWARM';
}

// Mock threat data - Tahrip kutusu içinde/yakınında (Demo için sadece 1 adet)
const MOCK_THREATS: Threat[] = [
  {
    id: 'THREAT-01',
    position: [39.937, 32.857], // Tahrip kutusu içinde
    label: '01-HAVA',
    coordinates: '39.93700 N 32.85700 E',
    type: 'AIR',
  },
];

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
          ">${threat.label} - BİLİNMEYEN</div>
          <div style="
            color: #e2e8f0;
            font-size: 9px;
            font-family: monospace;
            white-space: nowrap;
            line-height: 1.2;
          ">${threat.coordinates}</div>
        </div>
      </div>
    `,
    iconSize: [140, 30],
    iconAnchor: [0, 15],
  });
}

export function ThreatMarkers() {
  return (
    <>
      {MOCK_THREATS.map((threat) => (
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

