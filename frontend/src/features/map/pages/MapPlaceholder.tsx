import { mockAssets } from '@/services/mockData';

const getAssetIcon = (type: string): string => {
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

export function MapPlaceholder() {
  const assets = mockAssets.slice(0, 4);

  return (
    <div className="w-full h-full relative bg-[#0a0d12] overflow-hidden">
      {/* Radar Halkaları - Merkezde */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dış halka */}
        <div className="absolute w-[700px] h-[700px] border border-cyan-500/8 rounded-full" />
        {/* Orta halka */}
        <div className="absolute w-[500px] h-[500px] border border-cyan-500/12 rounded-full" />
        {/* İç halka */}
        <div className="absolute w-[300px] h-[300px] border border-cyan-500/15 rounded-full" />
        {/* En iç halka */}
        <div className="absolute w-[150px] h-[150px] border border-cyan-500/20 rounded-full" />
        {/* Merkez nokta */}
        <div className="absolute w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
      </div>

      {/* Mission Geofence (Kırmızı dikdörtgen) */}
      <div
        className="absolute border-2 border-red-500/60 bg-red-500/5 rounded"
        style={{
          left: '60%',
          top: '40%',
          width: '200px',
          height: '120px',
        }}
      >
        <div className="absolute -top-5 left-0 text-[10px] font-medium text-red-400 px-2">
          TAHRIP KUTUSU
        </div>
      </div>

      {/* Asset Noktaları */}
      {assets.map((asset, index) => {
        const positions = [
          { x: 30, y: 35 },
          { x: 65, y: 45 },
          { x: 45, y: 60 },
          { x: 70, y: 30 },
        ];
        const pos = positions[index] || positions[0];

        return (
          <div
            key={asset.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 flex items-center justify-center bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-1.5 shadow-lg">
                <img
                  src={getAssetIcon(asset.type)}
                  alt={asset.type}
                  className="w-full h-full object-contain opacity-90"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="mt-1 px-2 py-0.5 bg-slate-800/90 backdrop-blur-sm rounded border border-slate-700/50">
                <span className="text-[9px] font-medium text-slate-200">{asset.name}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Hedefler */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{
          left: '70%',
          top: '50%',
        }}
      >
        <div className="w-4 h-4 bg-amber-500 transform rotate-45 border border-amber-400 shadow-lg" />
        <div className="mt-1 text-center">
          <div className="px-2 py-1 bg-slate-800/90 backdrop-blur-sm rounded border border-amber-500/30">
            <div className="text-[9px] font-medium text-amber-400">01-HAVA</div>
            <div className="text-[8px] text-slate-400 font-mono">BİLİNMEYEN</div>
          </div>
        </div>
      </div>
    </div>
  );
}

