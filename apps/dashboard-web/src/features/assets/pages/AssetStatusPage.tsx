import { mockAssets } from '@/services/mockData';
import type { AssetSummary } from '@/services/mockData';

interface AssetStatusPageProps {}

const getAssetIcon = (type: AssetSummary['type']): string => {
  switch (type) {
    case 'UAV':
      return '/images/drone.png';
    case 'SOLDIER':
      return '/images/soldier.png';
    case 'GROUND_VEHICLE':
      return '/images/tank.png';
    case 'WEARABLE':
      return '/images/soldier.png';
    default:
      return '';
  }
};

const getStatusColor = (status: AssetSummary['status']): string => {
  switch (status) {
    case 'ONLINE':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'WARNING':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'OFFLINE':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
};

export function AssetStatusPage({}: AssetStatusPageProps) {
  const assets = mockAssets;

  return (
    <div className="h-full overflow-y-auto bg-slate-900/50 p-6 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-200 mb-1">Birim Durumu</h1>
          <p className="text-sm text-slate-400">{assets.length} aktif birlik</p>
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-700/50 rounded-lg flex-shrink-0">
                  <img
                    src={getAssetIcon(asset.type)}
                    alt={asset.type}
                    className="w-10 h-10 object-contain opacity-90"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-slate-200 truncate">
                      {asset.name}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{asset.type}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-700/30">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Son Görülme:</span>
                  <span className="text-slate-300 font-medium">{asset.lastSeen}</span>
                </div>

                {asset.details?.speedMps !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Hız:</span>
                    <span className="text-slate-300 font-medium">{asset.details.speedMps.toFixed(1)} m/s</span>
                  </div>
                )}

                {asset.details?.headingDeg !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Yön:</span>
                    <span className="text-slate-300 font-medium">{asset.details.headingDeg}°</span>
                  </div>
                )}

                {asset.details?.heartRateBpm !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Kalp Atışı:</span>
                    <span className="text-slate-300 font-medium">{asset.details.heartRateBpm} bpm</span>
                  </div>
                )}

                {asset.details?.steps !== undefined && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Adım:</span>
                    <span className="text-slate-300 font-medium">{asset.details.steps.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

