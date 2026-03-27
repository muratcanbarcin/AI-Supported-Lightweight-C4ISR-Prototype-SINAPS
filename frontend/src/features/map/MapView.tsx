import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { RadarRings } from './components/RadarRings';
import { AssetBoundsCircle } from './components/AssetBoundsCircle';
import { GeofencePolygon } from './components/GeofencePolygon';
import { ThreatMarkers } from './components/ThreatMarkers';
import { TacticalZones } from './components/TacticalZones';
import { UnitDetailsModal } from './components/UnitDetailsModal';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/features/auth/AuthContext';
import type { AssetSummary, MapAsset, DisplayAssetType, MiddlewareClassification } from '@/types';
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

// Default map center (Turkey overview — country-wide view)
const DEFAULT_CENTER: [number, number] = [39.0, 35.0];
const DEFAULT_ZOOM = 6;

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
  const { user } = useAuth();
  const roleValue = user?.role as string | undefined;
  const canDrawZone = roleValue === 'KARARGAH_ADMIN' || roleValue === 'ROLE_KARARGAH_ADMIN';
  const { userLocation, locationError } = useUserLocation();
  const mapCenter = userLocation || DEFAULT_CENTER;

  // Get real-time assets from API (with fallback to mock data)
  const { assets: assetSummaries, mapAssets, connectionStatus } = useAssets();

  // AI Analysis Panel state
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  // Zone draw mode
  const [zoneDrawMode, setZoneDrawMode] = useState(false);

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

  // Handle focus from both external prop and AI panel
  const activeFocusId = focusTarget || focusedAssetId || null;
  const targetPosition = activeFocusId ? assets.find(a => a.id === activeFocusId)?.position : null;

  // Clear focus target after navigation
  useEffect(() => {
    if (focusTarget) {
      const timer = setTimeout(() => setFocusTarget(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [focusTarget]);

  const handleFocusAsset = (assetId: string) => {
    setFocusTarget(assetId);
  };

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

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        onFocusAsset={handleFocusAsset}
        isOpen={isAnalysisPanelOpen}
        onToggle={() => setIsAnalysisPanelOpen(!isAnalysisPanelOpen)}
      />

      {/* Zone Draw Mode Toggle (Admin only) */}
      {canDrawZone && (
        <>
          <button
            onClick={() => setZoneDrawMode(!zoneDrawMode)}
            className={`absolute top-4 left-4 z-[1000] flex items-center gap-2 px-3 py-2
              rounded-lg text-[11px] font-bold border shadow-lg backdrop-blur-sm transition-all
              ${zoneDrawMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-slate-900/80 border-slate-700/50 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
          >
            <i className={`fa-solid ${zoneDrawMode ? 'fa-xmark' : 'fa-draw-polygon'} text-xs`} />
            {zoneDrawMode ? 'Çizim Modundan Çık' : 'Alan Çizim Modu'}
          </button>

          {zoneDrawMode && (
            <div className="absolute top-14 left-4 z-[1000] bg-slate-900/90 backdrop-blur-sm
              border border-amber-500/30 rounded-lg px-3 py-1.5 shadow-lg">
              <span className="text-[10px] text-amber-400 font-mono">
                <i className="fa-solid fa-crosshairs mr-1.5" />
                Haritada bir noktaya tıklayın
              </span>
            </div>
          )}
        </>
      )}

      {/* Classification Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] flex flex-col gap-1.5
        bg-slate-900/90 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 shadow-lg">
        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">
          Durum Sınıfı
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 classification-pulse-normal" />
          <span className="text-[10px] text-slate-300">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 classification-pulse-suspicious" />
          <span className="text-[10px] text-slate-300">Şüpheli</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 classification-pulse-critical" />
          <span className="text-[10px] text-slate-300">Kritik</span>
        </div>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="radar-map h-full w-full bg-[#080d12]"
      >
        <MapStyleSetter />

        {/* Fly to target only (NOT user location on initial load) */}
        <FlyToLocation position={targetPosition || null} />

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

        {/* Tactical Zones (Bases & Operation Areas) */}
        <TacticalZones
          drawMode={zoneDrawMode}
          onDrawComplete={() => setZoneDrawMode(false)}
        />

        {/* Asset Markers - with classification-based styling */}
        {assets.map((asset) => (
          <Marker
            key={asset.id}
            position={asset.position}
            icon={createAssetIcon(asset.type, asset.name, asset.classification)}
            interactive={true}
            zIndexOffset={
              asset.classification === 'CRITICAL' ? 300
                : asset.classification === 'SUSPICIOUS' ? 200
                : 100
            }
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

// =============================================================================
// CLASSIFICATION-AWARE MARKER ICON
// =============================================================================

/**
 * Color scheme per classification:
 *   NORMAL     → asset's default color, steady glow
 *   SUSPICIOUS → amber/orange, slow pulse (~2s)
 *   CRITICAL   → red, fast pulse (~0.8s)
 */
function getClassificationStyle(classification?: MiddlewareClassification) {
  switch (classification) {
    case 'CRITICAL':
      return {
        ringColor: '#ef4444',    // red-500
        ringClass: 'classification-pulse-critical',
        outerSize: 28,
        glowOpacity: 0.5,
      };
    case 'SUSPICIOUS':
      return {
        ringColor: '#f59e0b',    // amber-500
        ringClass: 'classification-pulse-suspicious',
        outerSize: 24,
        glowOpacity: 0.35,
      };
    default:
      return {
        ringColor: '',
        ringClass: '',
        outerSize: 0,
        glowOpacity: 0,
      };
  }
}

// Helper: Create custom marker icon with classification-based styling
function createAssetIcon(
  type: DisplayAssetType,
  name?: string,
  classification?: MiddlewareClassification,
): ReturnType<typeof divIcon> {
  // Determine base color by asset type
  let baseColor = '#38bdf8'; // sky
  let iconClass = 'fa-plane';

  if (type === 'SOLDIER') {
    baseColor = '#4ade80'; // green
    iconClass = 'fa-person-rifle';
  } else if (type === 'GROUND_VEHICLE') {
    baseColor = '#f97316'; // orange
    iconClass = 'fa-truck-pickup';
  } else if (type === 'WEARABLE') {
    baseColor = '#a855f7'; // purple
    iconClass = 'fa-stopwatch';
  }

  // Classification styling
  const cs = getClassificationStyle(classification);
  const dotColor = classification === 'CRITICAL' ? '#ef4444'
    : classification === 'SUSPICIOUS' ? '#f59e0b'
    : baseColor;

  // Build outer ring HTML for SUSPICIOUS / CRITICAL
  const outerRingHtml = (classification === 'CRITICAL' || classification === 'SUSPICIOUS') ? `
    <!-- Classification Pulse Ring -->
    <div class="absolute ${cs.ringClass}"
         style="width: ${cs.outerSize}px; height: ${cs.outerSize}px; 
                border-radius: 50%;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                border: 2px solid ${cs.ringColor};
                opacity: ${cs.glowOpacity};
                ">
    </div>
    <!-- Static Glow Ring -->
    <div class="absolute" 
         style="width: ${cs.outerSize - 6}px; height: ${cs.outerSize - 6}px;
                border-radius: 50%;
                left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                background: ${cs.ringColor};
                opacity: 0.12;
                ">
    </div>
  ` : '';

  // Classification badge for CRITICAL/SUSPICIOUS
  const badgeHtml = classification === 'CRITICAL' ? `
    <div class="absolute -top-3 -right-2 flex items-center justify-center 
                w-4 h-4 rounded-full bg-red-500 text-white text-[7px] font-black
                classification-pulse-critical shadow-lg shadow-red-500/50">!</div>
  ` : classification === 'SUSPICIOUS' ? `
    <div class="absolute -top-2.5 -right-1.5 flex items-center justify-center
                w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[7px] font-black
                classification-pulse-suspicious shadow-lg shadow-amber-500/50">?</div>
  ` : '';

  // Label border tint  
  const labelBorderColor = classification === 'CRITICAL'
    ? 'border-red-500/50'
    : classification === 'SUSPICIOUS'
    ? 'border-amber-500/50'
    : 'border-slate-700/50';

  const iconHtml = `
    <div class="relative group cursor-pointer flex items-center justify-center" style="width: 10px; height: 10px;">
        ${outerRingHtml}
        
        <!-- Center Dot -->
        <div class="absolute w-2.5 h-2.5 rounded-full" 
             style="background-color: ${dotColor}; box-shadow: 0 0 10px ${dotColor}, 0 0 20px ${dotColor}40;">
        </div>

        ${badgeHtml}

        <!-- Floating Label (Right) -->
        <div class="absolute left-[14px] flex items-center gap-1.5 bg-[#0f172a]/80 backdrop-blur-sm border ${labelBorderColor} px-1.5 py-0.5 rounded-sm shadow-sm whitespace-nowrap transition-all hover:bg-[#0f172a] hover:border-slate-500">
             <i class="fa-solid ${iconClass} text-[9px]" style="color: ${dotColor};"></i>
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
