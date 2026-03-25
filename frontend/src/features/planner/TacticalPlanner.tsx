import { useEffect, useState, useCallback, useRef } from 'react';
import { fetchLatestTelemetry, fetchZones, deployAsset } from '@/services/api';
import type { TelemetryDTO, TacticalZone } from '@/types';

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

// ═════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════

export function TacticalPlanner() {
  const [assets, setAssets] = useState<TelemetryDTO[]>([]);
  const [zones, setZones] = useState<TacticalZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deployedIds, setDeployedIds] = useState<Set<string>>(new Set());
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [telemetry, zoneData] = await Promise.all([fetchLatestTelemetry(), fetchZones()]);
      setAssets(telemetry);
      setZones(zoneData);
    } catch (err) {
      console.error('[TacticalPlanner] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter available assets (exclude already deployed in this session)
  const availableAssets = assets.filter((a) => {
    if (deployedIds.has(a.sourceId)) return false;
    if (filterType !== 'ALL' && a.sourceType !== filterType) return false;
    return true;
  });

  const operationZones = zones.filter((z) => z.zoneType === 'OPERATION_AREA');
  const baseZones = zones.filter((z) => z.zoneType === 'BASE');

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

    const asset = assets.find((a) => a.sourceId === assetId);
    if (!asset) return;

    try {
      await deployAsset(assetId, zone.id);
      setDeployedIds((prev) => new Set([...prev, assetId]));
      addToast(`${assetId} → ${zone.name} bölgesine sevk edildi!`, 'success');
    } catch (err) {
      console.error('[TacticalPlanner] Deploy failed:', err);
      addToast(`Sevk başarısız: ${assetId}`, 'error');
    }
  };

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
                Birlik sürükle → Operasyon bölgesine bırak
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
              <div className="text-xl font-black text-red-400">{operationZones.length}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Harekat Alanı</div>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="text-center px-3">
              <div className="text-xl font-black text-emerald-400">{deployedIds.size}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wider">Sevk Edilen</div>
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
                    {/* Type icon */}
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-none"
                      style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                    >
                      <i className={`fa-solid ${meta.icon} text-xs`} style={{ color: meta.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-slate-200 font-mono truncate">
                        {asset.sourceId}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider"
                              style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        {asset.batteryLevel !== null && (
                          <span className={`text-[9px] font-mono ${
                            asset.batteryLevel < 30 ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            <i className="fa-solid fa-battery-half mr-0.5" />
                            {asset.batteryLevel}%
                          </span>
                        )}
                        {asset.speed !== null && asset.speed > 0 && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            {asset.speed.toFixed(0)} m/s
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Drag handle */}
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
              {operationZones.map((zone) => {
                const isHovered = hoveredZoneId === zone.id;
                return (
                  <div
                    key={zone.id}
                    onDragOver={(e) => handleDragOver(e, zone.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, zone)}
                    className={`relative rounded-xl border-2 border-dashed p-5 transition-all
                      min-h-[140px] flex flex-col justify-center items-center text-center
                      ${isHovered
                        ? 'border-red-400 bg-red-500/10 scale-[1.02] shadow-lg shadow-red-500/10'
                        : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                      }`}
                  >
                    {/* Zone icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                      ${isHovered ? 'bg-red-500/20' : 'bg-slate-800'}`}>
                      <i className={`fa-solid fa-crosshairs text-lg
                        ${isHovered ? 'text-red-400 animate-pulse' : 'text-slate-600'}`} />
                    </div>

                    <h3 className={`text-sm font-bold mb-1 transition-colors
                      ${isHovered ? 'text-red-300' : 'text-slate-300'}`}>
                      {zone.name}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-mono">
                      {zone.latitude.toFixed(4)}°N, {zone.longitude.toFixed(4)}°E
                    </p>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5">
                      Yarıçap: {(zone.radiusMeters / 1000).toFixed(0)} km
                    </p>

                    {/* Drop hint */}
                    {isHovered && draggedAssetId && (
                      <div className="absolute inset-0 flex items-center justify-center
                        bg-red-500/5 rounded-xl pointer-events-none">
                        <div className="bg-red-900/80 backdrop-blur-sm border border-red-500/50
                          px-4 py-2 rounded-lg">
                          <span className="text-xs font-bold text-red-300">
                            <i className="fa-solid fa-arrow-right mr-2" />
                            {draggedAssetId} → SEVK ET
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Base Zones (non-droppable, info only) */}
          {baseZones.length > 0 && (
            <div className="flex-none border-t border-slate-700/50">
              <div className="px-5 py-2 border-b border-slate-800">
                <h2 className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">
                  <i className="fa-solid fa-shield-halved mr-2" />
                  Üsler / Karargahlar
                </h2>
              </div>
              <div className="p-3 flex gap-2 overflow-x-auto">
                {baseZones.map((zone) => (
                  <div
                    key={zone.id}
                    onDragOver={(e) => handleDragOver(e, zone.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, zone)}
                    className={`flex-none w-48 rounded-lg border p-3 transition-all
                      ${hoveredZoneId === zone.id
                        ? 'border-blue-400 bg-blue-500/10'
                        : 'border-slate-700/40 bg-slate-800/40'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`fa-solid fa-shield-halved text-[10px]
                        ${hoveredZoneId === zone.id ? 'text-blue-400' : 'text-slate-600'}`} />
                      <span className="text-[10px] font-bold text-slate-300 truncate">{zone.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono">
                      {(zone.radiusMeters / 1000).toFixed(0)} km
                    </span>

                    {hoveredZoneId === zone.id && draggedAssetId && (
                      <div className="mt-1.5 text-[9px] font-bold text-blue-400">
                        <i className="fa-solid fa-arrow-right mr-1" />
                        Konuşlandır
                      </div>
                    )}
                  </div>
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
