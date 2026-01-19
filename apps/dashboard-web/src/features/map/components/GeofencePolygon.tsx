import { Polygon } from 'react-leaflet';

interface GeofencePolygonProps {
  coordinates?: [number, number][];
  label?: string;
}

// Mock geofence coordinates (simple trapezoid shape)
const DEFAULT_COORDINATES: [number, number][] = [
  [39.936, 32.854],
  [39.938, 32.862],
  [39.942, 32.860],
  [39.940, 32.852],
];

export function GeofencePolygon({
  coordinates = DEFAULT_COORDINATES,
  label = "TAHRIP KUTUSU"
}: GeofencePolygonProps) {
  return (
    <>
      <Polygon
        positions={coordinates}
        pathOptions={{
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.6,
        }}
        interactive={false}
      />
    </>
  );
}

