import { Circle } from 'react-leaflet';

interface RadarRingsProps {
  center: [number, number];
}

const RADIUS_METERS = [300, 600, 900];

export function RadarRings({ center }: RadarRingsProps) {
  return (
    <>
      {RADIUS_METERS.map((radius, index) => (
        <Circle
          key={`ring-${radius}`}
          center={center}
          radius={radius}
          pathOptions={{
            color: '#1affbb',
            fillColor: '#1affbb',
            fillOpacity: 0.1 - (index * 0.02),
            weight: 1,
            opacity: 0.3 - (index * 0.05),
          }}
          interactive={false}
        />
      ))}
    </>
  );
}

