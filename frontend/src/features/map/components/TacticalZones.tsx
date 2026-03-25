import { useEffect, useState, useCallback } from 'react';
import { Circle, Tooltip, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { fetchZones, createZone, deleteZone } from '@/services/api';
import type { TacticalZone, ZoneType } from '@/types';

const ZONE_STYLES: Record<ZoneType, { color: string; fillColor: string; fillOpacity: number }> = {
  BASE: {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.12,
  },
  OPERATION_AREA: {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.10,
  },
};

interface TacticalZonesProps {
  drawMode: boolean;
  onDrawComplete: () => void;
}

export function TacticalZones({ drawMode, onDrawComplete }: TacticalZonesProps) {
  const [zones, setZones] = useState<TacticalZone[]>([]);
  const [pendingClick, setPendingClick] = useState<{ lat: number; lng: number } | null>(null);

  const loadZones = useCallback(async () => {
    try {
      const data = await fetchZones();
      setZones(data);
    } catch (err) {
      console.error('[TacticalZones] Failed to fetch zones:', err);
    }
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (drawMode) {
        setPendingClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  const handleCreateZone = async (name: string, zoneType: ZoneType, radiusMeters: number) => {
    if (!pendingClick) return;
    try {
      await createZone({
        name,
        zoneType,
        latitude: pendingClick.lat,
        longitude: pendingClick.lng,
        radiusMeters,
      });
      setPendingClick(null);
      onDrawComplete();
      await loadZones();
    } catch (err) {
      console.error('[TacticalZones] Failed to create zone:', err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
    } catch (err) {
      console.error('[TacticalZones] Failed to delete zone:', err);
    }
  };

  return (
    <>
      {zones.map((zone) => {
        const style = ZONE_STYLES[zone.zoneType];
        return (
          <Circle
            key={zone.id}
            center={[zone.latitude, zone.longitude]}
            radius={zone.radiusMeters}
            pathOptions={{
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: style.fillOpacity,
              weight: 1.5,
              dashArray: zone.zoneType === 'OPERATION_AREA' ? '8 4' : undefined,
            }}
            eventHandlers={{
              contextmenu: (e) => {
                e.originalEvent.preventDefault();
                if (confirm(`"${zone.name}" bölgesini silmek istiyor musunuz?`)) {
                  handleDeleteZone(zone.id);
                }
              },
            }}
          >
            <Tooltip direction="center" permanent className="zone-label">
              <span className={zone.zoneType === 'BASE' ? 'zone-base' : 'zone-oparea'}>
                {zone.name}
              </span>
            </Tooltip>
          </Circle>
        );
      })}

      {pendingClick && (
        <ZoneCreationModal
          lat={pendingClick.lat}
          lng={pendingClick.lng}
          onConfirm={handleCreateZone}
          onCancel={() => setPendingClick(null)}
        />
      )}
    </>
  );
}

// ─── Zone Creation Modal ─────────────────────────────────────────────

interface ZoneCreationModalProps {
  lat: number;
  lng: number;
  onConfirm: (name: string, zoneType: ZoneType, radius: number) => void;
  onCancel: () => void;
}

function ZoneCreationModal({ lat, lng, onConfirm, onCancel }: ZoneCreationModalProps) {
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('BASE');
  const [radius, setRadius] = useState(50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), zoneType, radius);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-[420px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <i className="fa-solid fa-draw-polygon text-blue-400 text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Yeni Taktik Bölge</h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
            Bölge Adı
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ör: 2. Ordu Komutanlığı"
            autoFocus
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2
                       text-sm text-slate-200 placeholder-slate-500
                       focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
          />
        </div>

        {/* Zone Type */}
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
            Bölge Türü
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setZoneType('BASE')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                zoneType === 'BASE'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              <i className="fa-solid fa-shield-halved mr-1.5" />
              Üs / Karargah
            </button>
            <button
              type="button"
              onClick={() => setZoneType('OPERATION_AREA')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                zoneType === 'OPERATION_AREA'
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              <i className="fa-solid fa-crosshairs mr-1.5" />
              Operasyon Alanı
            </button>
          </div>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
            Yarıçap — <span className="text-slate-200">{(radius / 1000).toFixed(0)} km</span>
          </label>
          <input
            type="range"
            min={2000}
            max={100000}
            step={1000}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-blue-500
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900
                       [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-600 mt-1">
            <span>2 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg text-xs font-bold
                       bg-slate-800 border border-slate-600 text-slate-400
                       hover:bg-slate-700 hover:text-slate-300 transition-all"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 py-2 px-4 rounded-lg text-xs font-bold
                       bg-blue-600 border border-blue-500 text-white
                       hover:bg-blue-500 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="fa-solid fa-plus mr-1.5" />
            Bölge Oluştur
          </button>
        </div>
      </form>
    </div>
  );
}
