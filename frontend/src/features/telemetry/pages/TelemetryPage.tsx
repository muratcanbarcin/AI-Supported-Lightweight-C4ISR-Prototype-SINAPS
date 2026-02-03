import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLatestTelemetry } from '@/services/api';
import type { Telemetry } from '@/types';

// ============================================================================
// LIVE TELEMETRY FEED PAGE
// ============================================================================
// Real-time telemetry data from all assets, polling from backend every 2 seconds

interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  sourceId: string;
  sourceType: string;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  speed: number | null;
  batteryLevel: number | null;
  payload: Record<string, unknown> | null;
  isNew?: boolean;
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const timeStr = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  // Add milliseconds manually
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${timeStr}.${ms}`;
}

function getTypeIcon(type: string): string {
  switch (type?.toUpperCase()) {
    case 'DRONE': return '🚁';
    case 'SOLDIER': return '🪖';
    case 'VEHICLE': return '🚛';
    default: return '📡';
  }
}

function getTypeColor(type: string): string {
  switch (type?.toUpperCase()) {
    case 'DRONE': return 'text-sky-400';
    case 'SOLDIER': return 'text-emerald-400';
    case 'VEHICLE': return 'text-amber-400';
    default: return 'text-slate-400';
  }
}

function getBatteryColor(level: number | null): string {
  if (level === null) return 'text-slate-500';
  if (level >= 70) return 'text-emerald-400';
  if (level >= 30) return 'text-amber-400';
  return 'text-red-400';
}

export function TelemetryPage() {
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(2000); // 2 seconds default
  const [isConnected, setIsConnected] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [assetCount, setAssetCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousIdsRef = useRef<Set<string>>(new Set());

  // Fetch real telemetry data from backend
  const fetchData = useCallback(async () => {
    if (isPaused) return;

    try {
      const data = await fetchLatestTelemetry();
      setIsConnected(true);
      setErrorMessage(null);
      setLastFetchTime(new Date());
      setAssetCount(data.length);

      // Convert Telemetry to log entries
      const newLogs: TelemetryLogEntry[] = data.map((t: Telemetry) => ({
        id: `${t.sourceId}-${t.timestamp}`,
        timestamp: t.timestamp,
        sourceId: t.sourceId,
        sourceType: t.sourceType,
        latitude: t.latitude,
        longitude: t.longitude,
        altitude: t.altitude,
        speed: t.speed,
        batteryLevel: t.batteryLevel,
        payload: t.payload,
        isNew: !previousIdsRef.current.has(`${t.sourceId}-${t.timestamp}`)
      }));

      // Track which entries we've seen
      const newIds = new Set(newLogs.map(l => l.id));
      previousIdsRef.current = newIds;

      // Sort by timestamp descending (newest first)
      newLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(prev => {
        // Merge with previous logs, keep last 500
        const merged = [...newLogs];
        
        // Add old logs that aren't in the new batch
        for (const oldLog of prev) {
          if (!newIds.has(oldLog.id)) {
            merged.push({ ...oldLog, isNew: false });
          }
        }

        // Sort and limit
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return merged.slice(0, 500);
      });

    } catch (error) {
      console.error('[TelemetryPage] Fetch error:', error);
      setIsConnected(false);
      setErrorMessage('Backend bağlantısı kurulamadı');
    }
  }, [isPaused]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollingInterval]);

  // Auto-scroll when new data arrives
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Scroll to top since newest is at top
    }
  }, [logs, isPaused]);

  // Stats calculation
  const droneCount = logs.filter(l => l.sourceType?.toUpperCase() === 'DRONE').length;
  const soldierCount = logs.filter(l => l.sourceType?.toUpperCase() === 'SOLDIER').length;
  const vehicleCount = logs.filter(l => l.sourceType?.toUpperCase() === 'VEHICLE').length;

  return (
    <div className="h-full bg-slate-900/90 text-slate-200 font-mono flex flex-col pt-16">
      {/* Header Control Panel */}
      <div className="h-16 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-6 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <h2 className="text-lg font-bold text-sky-400 tracking-wider">CANLI TELEMETRİ AKIŞI</h2>
          <span className={`text-xs border px-2 py-0.5 rounded ${isConnected ? 'text-emerald-400 border-emerald-600' : 'text-red-400 border-red-600'}`}>
            {isConnected ? '● BAĞLI' : '○ BAĞLANTI YOK'}
          </span>
          <span className="text-xs text-slate-500 border border-slate-600 px-2 py-0.5 rounded">
            {assetCount} Aktif Kaynak
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Polling interval selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">YENİLEME:</span>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-sky-500 text-sm"
            >
              <option value={1000}>1 saniye</option>
              <option value={2000}>2 saniye</option>
              <option value={5000}>5 saniye</option>
              <option value={10000}>10 saniye</option>
              <option value={30000}>30 saniye</option>
              <option value={60000}>1 dakika</option>
            </select>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-4 py-1.5 rounded-sm border transition-all text-xs font-bold ${
              isPaused 
                ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10' 
                : 'border-amber-500 text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            {isPaused ? (
              <>
                <span className="mr-2">▶</span>DEVAM ET
              </>
            ) : (
              <>
                <span className="mr-2">⏸</span>DURDUR
              </>
            )}
          </button>

          <button
            onClick={() => { setLogs([]); previousIdsRef.current.clear(); }}
            className="px-4 py-1.5 rounded-sm border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all"
          >
            TEMİZLE
          </button>

          <button
            onClick={fetchData}
            className="px-4 py-1.5 rounded-sm border border-sky-600 text-sky-400 hover:bg-sky-500/10 text-xs font-bold transition-all"
          >
            YENİLE
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="h-10 bg-slate-800/30 border-b border-slate-700/50 flex items-center px-6 gap-8 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-sky-400">🚁 DRONE:</span>
          <span className="text-white font-bold">{droneCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🪖 ASKER:</span>
          <span className="text-white font-bold">{soldierCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400">🚛 ARAÇ:</span>
          <span className="text-white font-bold">{vehicleCount}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto text-slate-500">
          <span>Son güncelleme:</span>
          <span className="text-slate-300">{lastFetchTime?.toLocaleTimeString('tr-TR') || '-'}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-900/30 border-b border-red-700 px-6 py-2 text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
          <button 
            onClick={fetchData}
            className="ml-4 text-xs underline hover:text-red-300"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Data Stream View */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900/98 z-10 text-slate-500 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2 px-3 w-36 border-b border-slate-700">Zaman</th>
              <th className="py-2 px-3 w-14 border-b border-slate-700">Tip</th>
              <th className="py-2 px-3 w-48 border-b border-slate-700">Kaynak ID</th>
              <th className="py-2 px-3 w-40 border-b border-slate-700">Konum (Lat, Lon)</th>
              <th className="py-2 px-3 w-20 border-b border-slate-700">İrtifa</th>
              <th className="py-2 px-3 w-20 border-b border-slate-700">Hız</th>
              <th className="py-2 px-3 w-20 border-b border-slate-700">Batarya</th>
              <th className="py-2 px-3 border-b border-slate-700">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.map((log) => (
              <tr 
                key={log.id} 
                className={`hover:bg-slate-800/30 transition-colors ${
                  log.isNew ? 'bg-sky-900/20 animate-pulse' : ''
                }`}
              >
                <td className="py-1.5 px-3 text-slate-400 whitespace-nowrap font-mono">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className={`py-1.5 px-3 ${getTypeColor(log.sourceType)}`}>
                  {getTypeIcon(log.sourceType)}
                </td>
                <td className="py-1.5 px-3 text-slate-200 font-medium truncate max-w-[200px]" title={log.sourceId}>
                  {log.sourceId}
                </td>
                <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
                  {log.latitude !== null && log.longitude !== null
                    ? `${log.latitude.toFixed(4)}, ${log.longitude.toFixed(4)}`
                    : '-'
                  }
                </td>
                <td className="py-1.5 px-3 text-slate-400">
                  {log.altitude !== null ? `${log.altitude.toFixed(0)}m` : '-'}
                </td>
                <td className="py-1.5 px-3 text-slate-400">
                  {log.speed !== null ? `${log.speed.toFixed(1)} m/s` : '-'}
                </td>
                <td className={`py-1.5 px-3 font-medium ${getBatteryColor(log.batteryLevel)}`}>
                  {log.batteryLevel !== null ? `${log.batteryLevel}%` : '-'}
                </td>
                <td className="py-1.5 px-3 text-slate-500 text-[10px] truncate max-w-[300px]">
                  {log.payload ? JSON.stringify(log.payload).slice(0, 80) + '...' : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-600 italic">
                  {isConnected 
                    ? 'Veri bekleniyor... Simülasyonu başlattığınızdan emin olun.'
                    : 'Backend bağlantısı bekleniyor...'
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Footer */}
      <div className="h-9 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
        <span>Buffer: {logs.length} / 500 kayıt</span>
        <span className={isPaused ? 'text-amber-400' : 'text-emerald-400'}>
          Durum: {isPaused ? 'DURAKLATILDI' : 'CANLI'}
        </span>
        <span>Polling: {pollingInterval / 1000}s | Backend: {isConnected ? 'BAĞLI' : 'BAĞLANTI YOK'}</span>
      </div>
    </div>
  );
}
