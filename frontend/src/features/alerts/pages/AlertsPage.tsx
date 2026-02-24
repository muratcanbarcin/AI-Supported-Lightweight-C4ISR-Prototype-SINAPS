import { useState, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';
import { fetchAlertAnalyses, type AiAnalysisDTO } from '@/services/api';
import type { AlertItem } from '@/types';
interface AlertsPageProps { }

// Helper for Corner Brackets
const CornerBrackets = ({ colorClass }: { colorClass: string }) => {
  let borderColor = "border-sky-500/50";
  if (colorClass === 'red') borderColor = "border-red-500/50";
  if (colorClass === 'amber') borderColor = "border-amber-500/50";
  if (colorClass === 'cyan') borderColor = "border-cyan-500/50";

  return (
    <>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${borderColor}`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${borderColor}`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${borderColor}`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${borderColor}`}></div>
    </>
  );
};

export function AlertsPage({ }: AlertsPageProps) {
  const { alerts, connectionStatus, isLoading } = useAlerts();

  // AI-based alerts from /api/v1/ai-analyses?isAlert=true
  const [aiAlerts, setAiAlerts] = useState<AiAnalysisDTO[]>([]);
  const [aiAlertsLoading, setAiAlertsLoading] = useState(true);

  useEffect(() => {
    fetchAlertAnalyses()
      .then(data => {
        // Filter out failed/error analyses (middleware failures)
        const validAlerts = data.filter(a =>
          a.threatLevel &&
          a.threatLevel !== '' &&
          a.recommendation &&
          !a.recommendation.startsWith('ERROR')
        );
        setAiAlerts(validAlerts);
      })
      .catch(err => console.warn('[AlertsPage] AI alert fetch failed:', err))
      .finally(() => setAiAlertsLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  const getThreatIcon = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': case 'HIGH': return 'fa-triangle-exclamation';
      case 'MEDIUM': return 'fa-exclamation-circle';
      default: return 'fa-info-circle';
    }
  };

  const getThreatColors = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return { bg: 'bg-red-950/30', border: 'border-red-500/30', text: 'text-red-500', badge: 'bg-red-500/20' };
      case 'HIGH': return { bg: 'bg-rose-950/30', border: 'border-rose-500/30', text: 'text-rose-500', badge: 'bg-rose-500/20' };
      case 'MEDIUM': return { bg: 'bg-amber-950/30', border: 'border-amber-500/30', text: 'text-amber-500', badge: 'bg-amber-500/20' };
      default: return { bg: 'bg-cyan-950/30', border: 'border-cyan-500/30', text: 'text-cyan-500', badge: 'bg-cyan-500/20' };
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans">
      {/* Connection Warning */}
      <ConnectionWarning connectionStatus={connectionStatus} />
      
      <div className="max-w-[1600px] mx-auto">

        <div className="mb-8 flex items-center gap-2 border-b border-slate-700/50 pb-2">
          <div className="w-1 h-5 bg-red-500"></div>
          <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">SİSTEM UYARILARI</h2>
        </div>

        {/* AI Analysis Alerts Section */}
        {aiAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-brain text-sky-500"></i>
              <h3 className="text-sm font-bold text-sky-400 uppercase tracking-widest">AI ANALİZ UYARILARI</h3>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">{aiAlerts.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {aiAlerts.slice(0, 8).map(analysis => {
                const colors = getThreatColors(analysis.threatLevel);
                return (
                  <div key={analysis.id} className={`${colors.bg} backdrop-blur-md p-5 border ${colors.border} relative flex gap-4 group hover:bg-opacity-50 transition-all`}>
                    <CornerBrackets colorClass={analysis.threatLevel?.toUpperCase() === 'HIGH' || analysis.threatLevel?.toUpperCase() === 'CRITICAL' ? 'red' : analysis.threatLevel?.toUpperCase() === 'MEDIUM' ? 'amber' : 'cyan'} />

                    <div className={`w-12 h-12 ${colors.badge} flex items-center justify-center flex-shrink-0 border ${colors.border}`}>
                      <i className={`fa-solid ${getThreatIcon(analysis.threatLevel)} ${colors.text} animate-pulse`}></i>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest border rounded-sm ${colors.border} ${colors.text} ${colors.badge}`}>
                            {analysis.threatLevel}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{analysis.assetId}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{formatDate(analysis.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">{analysis.recommendation}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-slate-700/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${colors.text} bg-current`}></div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                          AI ANALYSIS ID: <span className="text-slate-400">#AI-{String(analysis.id).padStart(3, '0')}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* System-Level Alerts (from useAlerts hook / alarmService) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map((alert) => {
            // Determine styles based on severity
            let bgClass = "bg-slate-800/80";
            let borderClass = "border-slate-700/50";
            let iconColor = "text-slate-400";
            let iconBg = "bg-slate-700/50";
            let bracketColor = "sky";
            let icon = (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            );

            if (alert.severity === 'HIGH') {
              bgClass = "bg-red-950/30";
              borderClass = "border-red-500/30";
              iconColor = "text-red-500";
              iconBg = "bg-red-900/20";
              bracketColor = "red";
              icon = (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              );
            } else if (alert.severity === 'MEDIUM') {
              bgClass = "bg-amber-950/30";
              borderClass = "border-amber-500/30";
              iconColor = "text-amber-500";
              iconBg = "bg-amber-900/20";
              bracketColor = "amber";
              icon = (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              );
            } else if (alert.severity === 'LOW') {
              bgClass = "bg-cyan-950/30";
              borderClass = "border-cyan-500/30";
              iconColor = "text-cyan-500";
              iconBg = "bg-cyan-900/20";
              bracketColor = "cyan";
              icon = (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              );
            }

            return (
              <div
                key={alert.id}
                className={`${bgClass} backdrop-blur-md p-6 border ${borderClass} relative flex gap-5 group hover:bg-opacity-50 transition-all`}
              >
                <CornerBrackets colorClass={bracketColor} />

                {/* Icon Box */}
                <div className={`w-12 h-12 ${iconBg} flex items-center justify-center flex-shrink-0 border border-${bracketColor}-500/30`}>
                  <span className={`${iconColor} animate-pulse`}>
                    {icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-sm font-bold ${iconColor} uppercase tracking-widest font-sans`}>
                      {alert.severity === 'HIGH' ? 'CRITICAL ALERT' : alert.severity === 'MEDIUM' ? 'WARNING' : 'INFO'}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 py-0.5">{alert.timeAgo}</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed mb-3 font-medium tracking-wide">
                    <span className="text-slate-400 font-bold mr-2 uppercase text-xs">{alert.title}:</span>
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-700/50">
                    <div className={`w-1.5 h-1.5 rounded-full ${iconColor} bg-current`}></div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                      AI EVALUATION ID: <span className="text-slate-400">#EVAL-00{alert.id}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state when no alerts at all */}
        {alerts.length === 0 && aiAlerts.length === 0 && !isLoading && !aiAlertsLoading && (
          <div className="text-center py-20">
            <i className="fa-solid fa-shield-check text-4xl text-emerald-500/40 mb-4"></i>
            <p className="text-slate-500 text-sm">Aktif uyarı bulunmuyor. Sistem normal çalışıyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
