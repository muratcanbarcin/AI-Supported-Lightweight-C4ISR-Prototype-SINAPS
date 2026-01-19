import { MapContainer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { RadarRings } from './components/RadarRings';
import { AssetBoundsCircle } from './components/AssetBoundsCircle';
import { GeofencePolygon } from './components/GeofencePolygon';
import { ThreatMarkers } from './components/ThreatMarkers';
import { UnitDetailsModal } from './components/UnitDetailsModal';
import { useMockAssets, type AssetType } from './hooks/useMockAssets';
import { mockAssets, type AssetSummary } from '@/services/mockData';
import './MapView.css';

// Map center (Ankara coordinates)
const MAP_CENTER: [number, number] = [39.93, 32.85];

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
  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);

  const handleMarkerClick = (assetId: string) => {
    // Find full details from mockAssets service
    const fullAsset = mockAssets.find(a => a.id === assetId);
    if (fullAsset) {
      setSelectedAsset(fullAsset);
    } else {
      // Fallback if not found in detailed list (should not happen with consistent data)
      const basicAsset = assets.find(a => a.id === assetId);
      if (basicAsset) {
        // Construct a temporary AssetSummary for display
        setSelectedAsset({
          id: basicAsset.id,
          name: basicAsset.name || basicAsset.id,
          type: basicAsset.type,
          status: 'ONLINE',
          lastSeen: 'Şimdi',
          details: {}
        });
      }
    }
  };

  return (
    <div className="map-view-container h-full w-full relative">
      <MapContainer
        center={MAP_CENTER}
        zoom={14}
        zoomControl={false}
        className="radar-map h-full w-full bg-[#080d12]"
      >
        <MapStyleSetter />

        {/* Radar Rings */}
        <RadarRings center={MAP_CENTER} />

        {/* Asset Bounds Circle */}
        <AssetBoundsCircle assets={assets} />

        {/* Mission Geofence */}
        <GeofencePolygon />

        {/* Threat Markers */}
        <ThreatMarkers />

        {/* Asset Markers */}
        {assets.map((asset) => (
          <Marker
            key={asset.id}
            position={asset.position}
            icon={createAssetIcon(asset.type, asset.name)}
            interactive={true}
            zIndexOffset={100}
            eventHandlers={{
              click: () => handleMarkerClick(asset.id),
            }}
          />
        ))}

        {/* Zoom Controls (Custom Position) */}
        <div className="leaflet-bottom leaflet-right !bottom-8 !right-8 flex flex-col gap-2">
          {/* We can add custom zoom buttons here if needed, or rely on defaults if enabled */}
        </div>
      </MapContainer>

      {/* Unit Details Modal Overlay */}
      {selectedAsset && (
        <UnitDetailsModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}

// Helper: Create custom marker icon
function createAssetIcon(type: AssetType, name?: string): ReturnType<typeof divIcon> {
  // Determine specific styles based on type
  let color = '#38bdf8'; // sky
  let iconClass = 'fa-plane';

  if (type === 'SOLDIER') {
    color = '#4ade80'; // green
    iconClass = 'fa-person-rifle';
  } else if (type === 'GROUND_VEHICLE') {
    color = '#f97316'; // orange
    iconClass = 'fa-truck-pickup';
  } else if (type === 'WEARABLE') {
    color = '#a855f7'; // purple
    iconClass = 'fa-stopwatch';
  }

  // Minimalist HUD Marker
  // Just a dot and a very small label
  const iconHtml = `
    <div class="relative group cursor-pointer flex items-center justify-center" style="width: 10px; height: 10px;">
        
        <!-- Center Dot with Pulse -->
        <div class="absolute w-2.5 h-2.5 rounded-full" 
             style="background-color: ${color}; box-shadow: 0 0 8px ${color};">
        </div>

        <!-- Floating Label (Right) - Only visible on hover or if needed, but keeping it visible but tiny for now -->
        <div class="absolute left-[14px] flex items-center gap-1.5 bg-[#0f172a]/80 backdrop-blur-sm border border-slate-700/50 px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap transition-all hover:bg-[#0f172a] hover:border-slate-500">
             <i class="fa-solid ${iconClass} text-[9px]" style="color: ${color};"></i>
             <span class="text-[9px] font-bold text-slate-200 font-mono tracking-tight uppercase">${name || type}</span>
        </div>
    </div>
  `;

  return divIcon({
    className: 'custom-hud-marker',
    html: iconHtml,
    iconSize: [10, 10],
    iconAnchor: [5, 5], // Center of the 10x10 dot
  });
}
