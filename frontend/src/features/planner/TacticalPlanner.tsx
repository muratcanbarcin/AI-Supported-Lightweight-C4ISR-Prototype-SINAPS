import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchLatestTelemetry, fetchZones, deployAsset } from '@/services/api';
import type { Telemetry, TacticalZone } from '@/types';

const POLL_INTERVAL_MS = 5_000;

// ─── Asset type icon/color mapping ──────────────────────────────────
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  DRONE:   { icon: 'fa-jet-fighter',    color: '#38bdf8', label: 'HAVA'  },
  VEHICLE: { icon: 'fa-truck-pickup',   color: '#f97316', label: 'KARA'  },
  SOLDIER: { icon: 'fa-person-rifle',   color: '#4ade80', label: 'PİYADE'},
  SENSOR:  { icon: 'fa-satellite-dish', color: '#a855f7', label: 'SENSÖR'},
};

function getTypeMeta(type: string) {
  return TYPE_META[type] || TYPE_META.DRONE;
}

// ─── Status helpers ─────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  EN_ROUTE:   { text: 'İNTİKAL', color: '#fbbf24' },
  IN_MISSION: { text: 'GÖREVDE', color: '#ef4444' },
  IDLE:       { text: 'HAZIR',   color: '#4ade80' },
};

function getPayloadField<T>(telemetry: Telemetry, key: string): T | undefined {
  if (!telemetry.payload || typeof telemetry.payload !== 'object') return undefined;
  return (telemetry.payload as Record<string, unknown>)[key] as T | undefined;
}

function getStatus(t: Telemetry): string {
  return getPayloadField<string>(t, 'status') ?? '';
}

function getDeploymentZoneId(t: Telemetry): string {
  return getPayloadField<string>(t, 'deployment_zone_id') ?? '';
}

function getDistanceRemainingKm(t: Telemetry): number | null {
  const meters = getPayloadField<number>(t, 'distance_remaining_m');
  if (meters == null) return null;
  return meters / 1000;
}

// ─── Toast notification ─────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-2xl backdrop-blur-sm
            animate-[slideIn_0.3s_ease-out] min-w-[320px] max-w-[480px]
            ${t.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200'
              : 'bg-red-900/90 border-red-500/50 text-red-200'
            }`}
        >
          <i className={`fa-solid ${t.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'} text-lg`} />
          <span className="text-xs font-semibold flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-white ml-2">
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Mini asset chip (inside zone boxes) ────────────────────────────
function AssetChip({
  asset,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  asset: Telemetry;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const meta = getTypeMeta(asset.sourceType);
  const status = getStatus(asset);
  const statusInfo = STATUS_LABELS[status];
  const distKm = getDistanceRemainingKm(asset);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, asset.sourceId)}
      onDragEnd={onDragEnd}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border
        cursor-grab active:cursor-grabbing transition-all text-[9px] font-mono select-none
        ${isDragging
          ? 'opacity-40 scale-95 border-sky-500/50 bg-sky-500/10'
          : 'bg-slate-900/60 border-slate-600/40 hover:border-slate-500'
        }`}
    >
      <i className={`fa-solid ${meta.icon}`} style={{ color: meta.color, fontSize: '8px' }} />
      <span className="font-bold text-slate-300 truncate max-w-[80px]">{asset.sourceId}</span>
      {asset.batteryLevel != null && (
        <span className={asset.batteryLevel < 30 ? 'text-red-400' : 'text-slate-500'}>
          {asset.batteryLevel}%
        </span>
      )}
      {statusInfo && (
        <span className="font-bold" style={{ color: statusInfo.color }}>{statusInfo.text}</span>
      )}
      {status === 'EN_ROUTE' && distKm != null && (
        <span className="text-amber-400/70">{distKm.toFixed(0)}km</span>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════

export function TacticalPlanner() {
  const [assets, setAssets] = useState<Telemetry[]>([]);
  const [zones, setZones] = useState<TacticalZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const toastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [telemetry, zoneData] = await Promise.all([fetchLatestTelemetry(), fetchZones()]);
      setAssets(telemetry);
      setZones(zoneData);
    } catch (err) {
      console.error('[TacticalPlanner] Failed to load data:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    pollRef.current = setInterval(() => loadData(false), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadData]);

  // ─── Derived data ──────────────────────────────────────────────────
  const availableAssets = assets.filter((a) => {
    const status = getStatus(a);
    const isAvailable = !status || status === 'IDLE' || status === 'ONLINE' || status === 'PATROL';
    if (!isAvailable) return false;
    if (filterType !== 'ALL' && a.sourceType !== filterType) return false;
    return true;
  });

  const operationZones = zones.filter((z) => z.zoneType === 'OPERATION_AREA');
  const baseZones = zones.filter((z) => z.zoneType === 'BASE');

  const getAssetsInZone = useCallback((zoneId: string): Telemetry[] => {
    return assets.filter((a) => {
      const deployZoneId = getDeploymentZoneId(a);
      return deployZoneId === zoneId;
    });
  }, [assets]);

  // ─── Count helpers ─────────────────────────────────────────────────
  const deployedCount = assets.filter((a) => {
    const s = getStatus(a);
    return s === 'EN_ROUTE' || s === 'IN_MISSION';
  }).length;

  const idleAtBaseCount = assets.filter((a) => {
    const s = getStatus(a);
    const zId = getDeploymentZoneId(a);
    return s === 'IDLE' && zId;
  }).length;

  // ─── Drag handlers ────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData('text/plain', assetId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedAssetId(assetId);
  };

  const handleDragEnd = () => {
    setDraggedAssetId(null);
    setHoveredZoneId(null);
  };

  const handleDragOver = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredZoneId(zoneId);
  };

  const handleDragLeave = () => {
    setHoveredZoneId(null);
  };

  const handleDrop = async (e: React.DragEvent, zone: TacticalZone) => {
    e.preventDefault();
    setHoveredZoneId(null);
    setDraggedAssetId(null);

    const assetId = e.dataTransfer.getData('text/plain');
    if (!assetId) return;

    const isRtb = zone.zoneType === 'BASE';
    try {
      await deployAsset(assetId, zone.id);
      const verb = isRtb ? 'üssüne geri çağrıldı' : 'bölgesine sevk edildi';
      addToast(`${assetId} → ${zone.name} ${verb}!`, 'success');
      loadData(false);
    } catch (err) {
      console.error('[TacticalPlanner] Deploy failed:', err);
      addToast(`Sevk başarısız: ${assetId}`, 'error');
    }
  };

  // ─── Zone card renderer ────────────────────────────────────────────
  function ZoneCard({ zone, variant }: { zone: TacticalZone; variant: 'operation' | 'base' }) {
    const isOp = variant === 'operation';
    const isHovered = hoveredZoneId === zone.id;
    const zoneAssets = getAssetsInZone(zone.id);
    const accentColor = isOp ? 'red' : 'blue';

    return (
      <div
        onDragOver={(e) => handleDragOver(e, zone.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, zone)}
        className={`relative rounded-xl border-2 border-dashed p-4 transition-all
          min-h-[140px] flex flex-col
          ${isHovered
            ? `border-${accentColor}-400 bg-${accentColor}-500/10 scale-[1.02] shadow-lg shadow-${accentColor}-500/10`
            : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
          }`}
        style={isHovered ? {
          borderColor: isOp ? '#f87171' : '#60a5fa',
          backgroundColor: isOp ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
        } : undefined}
      >
        {/* Zone header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-none
            ${isHovered ? (isOp ? 'bg-red-500/20' : 'bg-blue-500/20') : 'bg-slate-800'}`}>
            <i className={`fa-solid ${isOp ? 'fa-crosshairs' : 'fa-shield-halved'} text-sm
              ${isHovered
                ? (isOp ? 'text-red-400 animate-pulse' : 'text-blue-400 animate-pulse')
                : 'text-slate-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-xs font-bold truncate transition-colors
              ${isHovered ? (isOp ? 'text-red-300' : 'text-blue-300') : 'text-slate-300'}`}>
              {zone.name}
            </h3>
            <p className="text-[8px] text-slate-500 font-mono">
              {zone.latitude.toFixed(2)}°N, {zone.longitude.toFixed(2)}°E · {(zone.radiusMeters / 1000).toFixed(0)} km
            </p>
          </div>
          {zoneAssets.length > 0 && (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded
              ${isOp ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {zoneAssets.length}
            </span>
          )}
        </div>

        {/* Zone occupants */}
        {zoneAssets.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-auto">
            {zoneAssets.map((a) => (
              <AssetChip
                key={a.sourceId}
                asset={a}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedAssetId === a.sourceId}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[9px] text-slate-600 italic">Konuşlanmış birim yok</span>
          </div>
        )}

        {/* Drop hint overlay */}
        {isHovered && draggedAssetId && (
          <div className="absolute inset-0 flex items-center justify-center
            rounded-xl pointer-events-none"
            style={{ backgroundColor: isOp ? 'rgba(239,68,68,0.05)' : 'rgba(59,130,246,0.05)' }}>
            <div className={`backdrop-blur-sm border px-4 py-2 rounded-lg
              ${isOp
                ? 'bg-red-900/80 border-red-500/50'
                : 'bg-blue-900/80 border-blue-500/50'}`}>
              <span className={`text-xs font-bold ${isOp ? 'text-red-300' : 'text-blue-300'}`}>
                <i className="fa-solid fa-arrow-right mr-2" />
                {draggedAssetId} → {isOp ? 'SEVK ET' : 'ÜSSE GERİ ÇAĞ.'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Taktik veriler yükleniyor...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-slate-700/50 bg-slate-900/95 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/30
                            flex items-center justify-center">
              <i className="fa-solid fa-chess-board text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide uppercase">Taktik Planlama</h1>
              <p className="text-[10px] text-slate-500 font-mono">
                Birlik sürükle → Bölgeye veya üsse bırak · Her 5s otomatik güncelleme
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center px-3">
              <div className="text-xl font-black text-sky-400">{availableAssets.length}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Hazır Birim</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-3">
              <div className="text-xl font-black text-amber-400">{deployedCount}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Sevk Edilen</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-3">
              <div className="text-xl font-black text-emerald-400">{idleAtBaseCount}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Üste Hazır</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-3">
              <div className="text-xl font-black text-red-400">{operationZones.length}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Harekat Alanı</div>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT: Available Units ═══ */}
        <div className="w-[380px] flex-none border-r border-slate-700/50 flex flex-col bg-slate-900/50">
          {/* Column header */}
          <div className="flex-none px-4 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                <i className="fa-solid fa-layer-group mr-2 text-sky-500" />
                Hazır Birimler
              </h2>
              <span className="text-[10px] text-slate-600 font-mono">{availableAssets.length} adet</span>
            </div>
            {/* Type filter */}
            <div className="flex gap-1">
              {['ALL', 'DRONE', 'VEHICLE', 'SOLDIER', 'SENSOR'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all
                    ${filterType === t
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {t === 'ALL' ? 'Tümü' : getTypeMeta(t).label}
                </button>
              ))}
            </div>
          </div>

          {/* Asset cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {availableAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                <i className="fa-solid fa-inbox text-2xl mb-2" />
                <span className="text-xs">Uygun birim yok</span>
              </div>
            ) : (
              availableAssets.map((asset) => {
                const meta = getTypeMeta(asset.sourceType);
                const isDragging = draggedAssetId === asset.sourceId;
                return (
                  <div
                    key={asset.sourceId}
                    draggable
                    onDragStart={(e) => handleDragStart(e, asset.sourceId)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border
                      cursor-grab active:cursor-grabbing transition-all select-none
                      ${isDragging
                        ? 'opacity-40 scale-95 border-sky-500/50 bg-sky-500/10'
                        : 'bg-slate-800/60 border-slate-700/40 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-none"
                      style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                    >
                      <i className={`fa-solid ${meta.icon} text-xs`} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-200 font-mono truncate">
                        {asset.sourceId}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        {asset.batteryLevel != null && (
                          <span className={`text-[9px] font-mono ${
                            asset.batteryLevel < 30 ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            <i className="fa-solid fa-battery-half mr-0.5" />
                            {asset.batteryLevel}%
                          </span>
                        )}
                        {asset.speed != null && asset.speed > 0 && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            {asset.speed.toFixed(0)} m/s
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-none text-slate-600 group-hover:text-slate-400 transition-colors">
                      <i className="fa-solid fa-grip-vertical text-xs" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Drop Zones ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Operation Areas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-none px-5 py-3 border-b border-slate-800">
              <h2 className="text-xs font-bold text-red-400/80 uppercase tracking-widest">
                <i className="fa-solid fa-crosshairs mr-2" />
                Harekat Bölgeleri
                <span className="text-slate-600 ml-2 normal-case tracking-normal font-normal">
                  — birimi sürükleyip bırakın
                </span>
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 auto-rows-min">
              {operationZones.map((zone) => (
                <ZoneCard key={zone.id} zone={zone} variant="operation" />
              ))}
            </div>
          </div>

          {/* Base Zones — fully droppable with occupancy */}
          {baseZones.length > 0 && (
            <div className="flex-none border-t border-slate-700/50 max-h-[40%] flex flex-col">
              <div className="flex-none px-5 py-2 border-b border-slate-800">
                <h2 className="text-xs font-bold text-blue-400/80 uppercase tracking-widest">
                  <i className="fa-solid fa-shield-halved mr-2" />
                  Üsler / Karargahlar
                  <span className="text-slate-600 ml-2 normal-case tracking-normal font-normal">
                    — üsse geri çağırmak için bırakın
                  </span>
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2 auto-rows-min">
                {baseZones.map((zone) => (
                  <ZoneCard key={zone.id} zone={zone} variant="base" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
