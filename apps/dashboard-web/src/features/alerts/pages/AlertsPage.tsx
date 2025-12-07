import { mockAlerts } from '@/services/mockData';
import type { AlertItem } from '@/services/mockData';

interface AlertsPageProps {}

const getSeverityColor = (severity: AlertItem['severity']): string => {
  switch (severity) {
    case 'HIGH':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'MEDIUM':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'LOW':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  }
};

export function AlertsPage({}: AlertsPageProps) {
  const alerts = mockAlerts;
  const detectionsCount = alerts.filter(a => a.severity === 'HIGH' || a.severity === 'MEDIUM').length;
  const assessmentsCount = alerts.filter(a => a.severity === 'LOW').length;

  return (
    <div className="h-full overflow-y-auto bg-slate-900/50 p-6 pt-20">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-200 mb-2">Uyarılar & Değerlendirmeler</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              <span className="font-semibold text-slate-300">{detectionsCount}</span> tespit
            </span>
            <span className="text-sm text-slate-400">
              <span className="font-semibold text-slate-300">{assessmentsCount}</span> değerlendirme
            </span>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Severity Badge */}
                <div className="flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded border ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-200 mb-1">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    {alert.description}
                  </p>
                  {alert.relatedAssets.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-500">İlgili Birlikler:</span>
                      {alert.relatedAssets.map((assetId, idx) => (
                        <span
                          key={assetId}
                          className="text-[10px] px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded border border-slate-600/30"
                        >
                          {assetId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {alert.timeAgo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

