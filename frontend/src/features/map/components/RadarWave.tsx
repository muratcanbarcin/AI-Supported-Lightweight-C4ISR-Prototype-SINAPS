import { useEffect, useState } from 'react';
import { Circle } from 'react-leaflet';

interface RadarWaveProps {
  center: [number, number];
}

export function RadarWave({ center }: RadarWaveProps) {
  const [radius, setRadius] = useState(0);
  const maxRadius = 1500; // meters
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRadius((prev) => {
        if (prev >= maxRadius) {
          return 0;
        }
        return prev + 20;
      });
    }, 50); // Update every 50ms for smooth animation
    
    return () => clearInterval(interval);
  }, [maxRadius]);

  const opacity = Math.max(0, 1 - radius / maxRadius);

  return (
    <Circle
      center={center}
      radius={radius}
      pathOptions={{
        color: '#1affbb',
        fillColor: '#1affbb',
        fillOpacity: 0,
        weight: 2,
        opacity: opacity * 0.6,
      }}
      interactive={false}
    />
  );
}

