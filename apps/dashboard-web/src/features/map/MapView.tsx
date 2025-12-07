import { MapContainer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { RadarRings } from './components/RadarRings';
import { AssetBoundsCircle } from './components/AssetBoundsCircle';
import { GeofencePolygon } from './components/GeofencePolygon';
import { ThreatMarkers } from './components/ThreatMarkers';
import { useMockAssets, type AssetType } from './hooks/useMockAssets';
import './MapView.css';

// Map center (Ankara coordinates)
const MAP_CENTER: [number, number] = [39.93, 32.85];

// Asset type colors
const ASSET_COLORS: Record<AssetType, string> = {
  UAV: '#06b6d4', // cyan
  SOLDIER: '#eab308', // yellow
  GROUND_VEHICLE: '#f97316', // orange
  WEARABLE: '#a855f7', // purple
};

// Create custom marker icon with optional label
function createAssetIcon(type: AssetType, name?: string): ReturnType<typeof divIcon> {
  const color = ASSET_COLORS[type];
  
  if (name) {
    // Combined marker with label
    return divIcon({
      className: 'custom-asset-marker',
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        ">
          <div style="
            width: 16px;
            height: 16px;
            background-color: ${color};
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 0 8px ${color}88, 0 0 12px ${color}44;
          "></div>
          <div style="
            padding: 2px 6px;
            background-color: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 4px;
            color: #e2e8f0;
            font-size: 10px;
            font-weight: 500;
            white-space: nowrap;
            backdrop-filter: blur(8px);
            margin-top: 2px;
          ">${name}</div>
        </div>
      `,
      iconSize: [60, 40],
      iconAnchor: [30, 8],
    });
  }
  
  // Marker without label
  return divIcon({
    className: 'custom-asset-marker',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background-color: ${color};
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        box-shadow: 0 0 8px ${color}88, 0 0 12px ${color}44;
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Component to set map background style
function MapStyleSetter() {
  const map = useMap();
  
  useEffect(() => {
    const container = map.getContainer();
    container.style.backgroundColor = '#080d12';
  }, [map]);
  
  return null;
}

export function MapView() {
  const assets = useMockAssets();

  return (
    <div className="map-view-container">
      <MapContainer
        center={MAP_CENTER}
        zoom={14}
        zoomControl={false}
        className="radar-map"
        style={{ height: '100%', width: '100%', backgroundColor: '#080d12' }}
      >
        <MapStyleSetter />
        
        {/* Radar Rings */}
        <RadarRings center={MAP_CENTER} />
        
        {/* Asset Bounds Circle - Tüm birimleri çevreleyen büyük daire */}
        <AssetBoundsCircle assets={assets} />
        
        {/* Mission Geofence */}
        <GeofencePolygon />
        
        {/* Threat Markers - Tahrip kutusundaki tehditler */}
        <ThreatMarkers />
        
        {/* Asset Markers */}
        {assets.map((asset) => (
          <Marker
            key={asset.id}
            position={asset.position}
            icon={createAssetIcon(asset.type, asset.name)}
            interactive={false}
          />
        ))}
      </MapContainer>
    </div>
  );
}

