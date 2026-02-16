/**
 * =============================================================================
 * AI Analysis Panel - Map Overlay
 * =============================================================================
 * 
 * Displays AI tactical analysis logs in a collapsible side panel on the map.
 * Each entry shows threat level, decision, reasoning, and the associated asset.
 * Clicking an entry flies the map to the asset's location.
 * 
 * Data source: GET /api/v1/analysis/latest
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';

// ── Types ─────────────────────────────────────────────────────────────
interface TelemetryInfo {
  id: number;
  sourceId: string;
  sourceType: string;
  timestamp: string;
}

interface AnalysisEntry {
  id: number;
  threatLevel: string;
  decision: string;
  reasoning: string;
  confidence: number | null;
  analyzedAt: string;
  telemetry: TelemetryInfo | null;
}

type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL' | 'UNKNOWN';

interface AIAnalysisPanelProps {
  onFocusAsset?: (assetId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────
const THREAT_CONFIG: Record<string, {
  bg: string;
  text: string;
  border: string;
  glow: string;
  icon: string;
  label: string;
}> = {
  CRITICAL: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/40',
    glow: 'shadow-red-500/20',
    icon: '🔴',
    label: 'KRİTİK',
  },
  HIGH: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    glow: 'shadow-orange-500/20',
    icon: '🟠',
    label: 'YÜKSEK',
  },
  MEDIUM: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/20',
    icon: '🟡',
    label: 'ORTA',
  },
  LOW: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
    icon: '🟢',
    label: 'DÜŞÜK',
  },
  MINIMAL: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/40',
    glow: 'shadow-slate-500/20',
    icon: '⚪',
    label: 'MİNİMAL',
  },
  UNKNOWN: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    border: 'border-slate-500/40',
    glow: 'shadow-slate-500/20',
    icon: '❓',
    label: 'BİLİNMEYEN',
  },
};

function getThreatConfig(level: string) {
  return THREAT_CONFIG[level?.toUpperCase()] || THREAT_CONFIG.UNKNOWN;
}

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'Şimdi';
  if (diffSec < 60) return `${diffSec}sn önce`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}dk önce`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}sa önce`;
  return `${Math.floor(diffHr / 24)}g önce`;
}

function formatAssetLabel(sourceId: string, sourceType: string): string {
  const id = sourceId.replace(/^(DRONE|SOLDIER|VEHICLE)-?/i, '');
  const num = id.padStart(2, '0');
  switch (sourceType?.toUpperCase()) {
    case 'DRONE': return `HS-${num}`;
    case 'SOLDIER': return `Piyade-${num}`;
    case 'VEHICLE': return `Araç-${num}`;
    default: return sourceId;
  }
}

// ── Component ───────────────────────────────────────────────────────
export function AIAnalysisPanel({ onFocusAsset, isOpen, onToggle }: AIAnalysisPanelProps) {
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch analyses
  const fetchAnalyses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<AnalysisEntry[]>('/analysis/latest');
      setAnalyses(response.data);
    } catch (error) {
      console.warn('[AIAnalysisPanel] Fetch failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    if (isOpen) {
      fetchAnalyses();
      const interval = setInterval(fetchAnalyses, 10000); // every 10s
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchAnalyses]);

  // Filter analyses
  const filteredAnalyses = filter === 'ALL'
    ? analyses
    : analyses.filter(a => a.threatLevel?.toUpperCase() === filter);

  const handleEntryClick = (entry: AnalysisEntry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
    } else {
      setExpandedId(entry.id);
    }
  };

  const handleLocateClick = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    onFocusAsset?.(sourceId);
  };

  // Count by level
  const critCount = analyses.filter(a => a.threatLevel?.toUpperCase() === 'CRITICAL').length;
  const highCount = analyses.filter(a => a.threatLevel?.toUpperCase() === 'HIGH').length;

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        onClick={onToggle}
        className={`
          absolute top-4 right-4 z-[1000] flex items-center gap-2 
          px-3 py-2 rounded-lg backdrop-blur-md border transition-all duration-300
          ${isOpen
            ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-400'
            : 'bg-slate-900/80 border-slate-600/40 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400'
          }
        `}
        title="AI Analiz Logları"
      >
        <i className="fa-solid fa-brain text-sm" />
        <span className="text-xs font-semibold tracking-wide">AI ANALİZ</span>
        {(critCount + highCount > 0) && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
            {critCount + highCount}
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        className={`
          absolute top-14 right-4 z-[999] w-[380px] max-h-[calc(100vh-140px)]
          bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 rounded-xl
          shadow-2xl shadow-black/40 flex flex-col
          transition-all duration-300 origin-top-right
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }
        `}
      >
        {/* Panel Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide">
                TAKTİK ANALİZ LOGLARI
              </h3>
            </div>
            <span className="text-xs text-slate-500">{analyses.length} kayıt</span>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1 flex-wrap">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
              const config = level === 'ALL' ? null : getThreatConfig(level);
              const count = level === 'ALL'
                ? analyses.length
                : analyses.filter(a => a.threatLevel?.toUpperCase() === level).length;

              return (
                <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={`
                    px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition-all
                    border
                    ${filter === level
                      ? config
                        ? `${config.bg} ${config.text} ${config.border}`
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-500 border-slate-700/40 hover:border-slate-600/60'
                    }
                  `}
                >
                  {level === 'ALL' ? 'TÜMÜ' : config?.label || level}
                  {count > 0 && ` (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-1.5">
          {isLoading && analyses.length === 0 && (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Yükleniyor...
            </div>
          )}

          {!isLoading && filteredAnalyses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
              <i className="fa-solid fa-inbox text-2xl mb-2" />
              <span>Henüz analiz kaydı yok</span>
            </div>
          )}

          {filteredAnalyses.map(entry => {
            const tc = getThreatConfig(entry.threatLevel);
            const isExpanded = expandedId === entry.id;
            const sourceId = entry.telemetry?.sourceId || 'UNKNOWN';
            const sourceType = entry.telemetry?.sourceType || '';

            return (
              <div
                key={entry.id}
                onClick={() => handleEntryClick(entry)}
                className={`
                  group rounded-lg border transition-all duration-200 cursor-pointer
                  ${isExpanded
                    ? `${tc.bg} ${tc.border} shadow-lg ${tc.glow}`
                    : `bg-slate-800/60 border-slate-700/40 hover:${tc.border} hover:${tc.bg}`
                  }
                `}
              >
                {/* Entry Header */}
                <div className="flex items-start gap-2.5 p-2.5">
                  {/* Threat Indicator */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center 
                    ${tc.bg} ${tc.border} border text-sm
                  `}>
                    {tc.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[11px] font-bold ${tc.text} tracking-wide`}>
                        {tc.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatTimeAgo(entry.analyzedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-white font-semibold">
                        {formatAssetLabel(sourceId, sourceType)}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase">
                        {sourceType}
                      </span>
                    </div>

                    {/* Decision */}
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                      <span className="font-semibold text-slate-300">Karar:</span>{' '}
                      {entry.decision || 'N/A'}
                    </p>
                  </div>

                  {/* Locate Button */}
                  {entry.telemetry?.sourceId && (
                    <button
                      onClick={(e) => handleLocateClick(e, entry.telemetry!.sourceId)}
                      className={`
                        flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center
                        bg-cyan-500/10 border border-cyan-500/30 text-cyan-400
                        hover:bg-cyan-500/30 hover:border-cyan-500/50 transition-all
                        opacity-0 group-hover:opacity-100
                      `}
                      title={`${formatAssetLabel(sourceId, sourceType)}'ı haritada göster`}
                    >
                      <i className="fa-solid fa-crosshairs text-[10px]" />
                    </button>
                  )}
                </div>

                {/* Expanded Reasoning */}
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-0 border-t border-slate-700/30 mt-1">
                    <div className="mt-2 space-y-2">
                      {/* Reasoning */}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                          AI Analiz Detayı
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-1 whitespace-pre-wrap">
                          {entry.reasoning || 'Detaylı analiz mevcut değil.'}
                        </p>
                      </div>

                      {/* Confidence */}
                      {entry.confidence != null && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-500">Güven:</span>
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                entry.confidence > 0.7
                                  ? 'bg-emerald-500'
                                  : entry.confidence > 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(entry.confidence * 100).toFixed(0)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(entry.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}

                      {/* Locate CTA */}
                      {entry.telemetry?.sourceId && (
                        <button
                          onClick={(e) => handleLocateClick(e, entry.telemetry!.sourceId)}
                          className="w-full mt-1 flex items-center justify-center gap-2 py-1.5 rounded-md
                            bg-cyan-500/10 border border-cyan-500/30 text-cyan-400
                            hover:bg-cyan-500/20 transition-all text-[11px] font-semibold"
                        >
                          <i className="fa-solid fa-location-crosshairs text-xs" />
                          Haritada Konumu Göster
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </>
  );
}
