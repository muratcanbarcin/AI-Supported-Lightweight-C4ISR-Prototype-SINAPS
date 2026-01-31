import { useAlerts } from '@/hooks/useAlerts';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';
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

  return (
    <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans">
      {/* Connection Warning */}
      <ConnectionWarning connectionStatus={connectionStatus} />
      
      <div className="max-w-[1600px] mx-auto">

        <div className="mb-8 flex items-center gap-2 border-b border-slate-700/50 pb-2">
          <div className="w-1 h-5 bg-red-500"></div>
          <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">SİSTEM UYARILARI</h2>
        </div>

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
      </div>
    </div>
  );
}
