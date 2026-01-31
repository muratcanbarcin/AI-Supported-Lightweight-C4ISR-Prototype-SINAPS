import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { RadarRings } from './components/RadarRings';
import { AssetBoundsCircle } from './components/AssetBoundsCircle';
import { GeofencePolygon } from './components/GeofencePolygon';
import { ThreatMarkers } from './components/ThreatMarkers';
import { UnitDetailsModal } from './components/UnitDetailsModal';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';
import { useAssets } from '@/hooks/useAssets';
import type { AssetSummary, MapAsset, DisplayAssetType } from '@/types';
import './MapView.css';

// Tile Layer Options
const TILE_LAYERS = {
  // Stamen Terrain (via Stadia) - good terrain visualization
  stamenTerrain: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a>',
  },
  // OpenTopoMap - topographic map with elevation
  openTopo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  // Carto Dark - dark themed map (fallback)
  cartoDark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
  },
  // Satellite imagery
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
  // Thunderforest Landscape (requires API key but has free tier)
  thunderforest: {
    url: 'https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=',
    attribution: '&copy; Thunderforest',
  },
};

// Current active tile layer - Satellite imagery (most reliable)
const ACTIVE_TILE_LAYER = TILE_LAYERS.satellite;

// Default map center (Ankara coordinates - fallback)
const DEFAULT_CENTER: [number, number] = [39.93, 32.85];

// Component to set map background style
function MapStyleSetter() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.backgroundColor = '#080d12';
  }, [map]);

  return null;
}

// Component to fly to user's location when it changes
function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 2 });
    }
  }, [map, position]);

  return null;
}

// Custom hook to get user's real location
function useUserLocation() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum servislerini desteklemiyor');
      return;
    }

    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        console.log('📍 Konum alındı:', latitude, longitude);
      },
      (error) => {
        console.error('Konum hatası:', error);
        setLocationError('Konum alınamadı: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );

    // Watch position for real-time updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
      },
      (error) => {
        console.error('Konum izleme hatası:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { userLocation, locationError };
}

// Create marker for user's current location
function createUserLocationIcon(): ReturnType<typeof divIcon> {
  const iconHtml = `
    <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
      <!-- Outer pulse ring -->
      <div class="absolute w-6 h-6 rounded-full bg-blue-500/30 animate-ping"></div>
      <!-- Inner circle -->
      <div class="absolute w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
    </div>
  `;

  return divIcon({
    className: 'user-location-marker',
    html: iconHtml,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface MapViewProps {
  onOpenProfile?: (assetId: string) => void;
  focusedAssetId?: string | null;
}

export function MapView({ onOpenProfile, focusedAssetId }: MapViewProps) {
  const { userLocation, locationError } = useUserLocation();
  const mapCenter = userLocation || DEFAULT_CENTER;

  // Get real-time assets from API (with fallback to mock data)
  const { assets: assetSummaries, mapAssets, connectionStatus } = useAssets();

  // Transform assets for map display with positions relative to user location
  const assets = useMemo(() => {
    // If we have real positions from API, use them
    if (mapAssets.length > 0) {
      return mapAssets;
    }
    
    // Fallback: generate positions relative to user for mock data
    const baseCenter = mapCenter;
    return assetSummaries.map((asset, index) => {
      // Generate offset positions for fallback
      const latOffset = ((index % 3) - 1) * 0.005 + (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.floor(index / 3) - 1) * 0.005 + (Math.random() - 0.5) * 0.002;
      
      return {
        id: asset.id,
        type: asset.type,
        position: asset.latitude && asset.longitude 
          ? [asset.latitude, asset.longitude] as [number, number]
          : [baseCenter[0] + latOffset, baseCenter[1] + lngOffset] as [number, number],
        name: asset.name,
        alignment: asset.alignment,
        threatLevel: asset.threatLevel
      };
    });
  }, [mapAssets, assetSummaries, mapCenter]);

  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);

  const targetPosition = focusedAssetId ? assets.find(a => a.id === focusedAssetId)?.position : null;

  const handleMarkerClick = (assetId: string) => {
    // Find full details from asset summaries
    const fullAsset = assetSummaries.find(a => a.id === assetId);
    if (fullAsset) {
      setSelectedAsset(fullAsset);
    } else {
      // Fallback if not found in detailed list
      const basicAsset = assets.find(a => a.id === assetId);
      if (basicAsset) {
        // Construct a temporary AssetSummary for display
        setSelectedAsset({
          id: basicAsset.id,
          name: basicAsset.name || basicAsset.id,
          type: basicAsset.type,
          status: 'ONLINE',
          lastSeen: 'Şimdi',
          coordinates: 'N/A',
          details: {} as any
        });
      }
    }
  };

  // Log location error if any
  if (locationError) {
    console.warn('Konum servisi:', locationError);
  }

  return (
    <div className="map-view-container h-full w-full relative">
      {/* Connection Warning */}
      <ConnectionWarning connectionStatus={connectionStatus} />
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={14}
        zoomControl={false}
        className="radar-map h-full w-full bg-[#080d12]"
      >
        <MapStyleSetter />

        {/* Fly to target or user location */}
        <FlyToLocation position={targetPosition || userLocation} />

        {/* Satellite/Terrain Map Background */}
        <TileLayer
          url={ACTIVE_TILE_LAYER.url}
          attribution={ACTIVE_TILE_LAYER.attribution}
        />

        {/* User's Current Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={createUserLocationIcon()}
            zIndexOffset={200}
          />
        )}

        {/* Radar Rings - centered on user location or default */}
        <RadarRings center={mapCenter} />

        {/* Asset Bounds Circle */}
        <AssetBoundsCircle assets={assets} />

        {/* Mission Geofence - centered relative to user */}
        <GeofencePolygon center={mapCenter} />

        {/* Threat Markers - centered relative to user */}
        <ThreatMarkers center={mapCenter} />

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
          onOpenProfile={onOpenProfile}
        />
      )}
    </div>
  );
}

// Helper: Create custom marker icon
function createAssetIcon(type: DisplayAssetType, name?: string): ReturnType<typeof divIcon> {
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
