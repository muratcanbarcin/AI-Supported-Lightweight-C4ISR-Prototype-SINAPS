import { Polygon } from 'react-leaflet';

// Helper to offset coordinates
function createPolygonFromCenter(center: [number, number]): [number, number][] {
  const [lat, lon] = center;
  return [
    [lat + 0.006, lon + 0.004],
    [lat + 0.008, lon + 0.012],
    [lat + 0.012, lon + 0.010],
    [lat + 0.010, lon + 0.002],
  ];
}

interface GeofencePolygonProps {
  center?: [number, number];
  label?: string;
}

export function GeofencePolygon({
  center,
  label = "TAHRIP KUTUSU"
}: GeofencePolygonProps) {
  // Use dynamic center if provided, otherwise default (Ankara)
  const polygonCoords = center
    ? createPolygonFromCenter(center)
    : [
      [39.936, 32.854],
      [39.938, 32.862],
      [39.942, 32.860],
      [39.940, 32.852],
    ];

  return (
    <>
      <Polygon
        positions={polygonCoords as [number, number][]}
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

