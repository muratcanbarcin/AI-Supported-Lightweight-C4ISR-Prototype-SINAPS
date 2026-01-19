import { useState } from 'react';
import { mockAssets } from '@/services/mockData';
import type { AssetSummary } from '@/services/mockData';
import { UnitDetailsModal } from '@/features/map/components/UnitDetailsModal';

interface AssetStatusPageProps { }

// Helper for Corner Brackets
const CornerBrackets = ({ colorClass }: { colorClass: string }) => {
  let borderColor = "border-sky-500/50";
  if (colorClass === 'orange') borderColor = "border-orange-500/50";
  if (colorClass === 'amber') borderColor = "border-amber-500/50";

  return (
    <>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${borderColor}`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${borderColor}`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${borderColor}`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${borderColor}`}></div>
    </>
  );
};

export function AssetStatusPage({ }: AssetStatusPageProps) {
  const assets = mockAssets;
  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-700/50 pb-2">
          <div className="w-1 h-5 bg-sky-500"></div>
          <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">BİRİM DURUMLARI</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {assets.map((asset) => {
            // Determine color based on type for the glow/border
            let colorName = "blue";
            let borderColor = "border-sky-500/30";
            let glowColor = "shadow-[0_0_15px_rgba(14,165,233,0.15)]";
            let titleColor = "text-sky-400";
            let barColor = "bg-sky-500";
            let iconBg = "bg-sky-500/10";
            let iconBorder = "border-sky-500/30";

            if (asset.type === 'SOLDIER') {
              colorName = "orange"; // Using orange for soldier/alert look as per map
              borderColor = "border-orange-500/30";
              glowColor = "shadow-[0_0_15px_rgba(249,115,22,0.15)]";
              titleColor = "text-orange-400";
              barColor = "bg-orange-500";
              iconBg = "bg-orange-500/10";
              iconBorder = "border-orange-500/30";
            } else if (asset.type === 'GROUND_VEHICLE') {
              colorName = "amber";
              borderColor = "border-amber-500/30";
              glowColor = "shadow-[0_0_15px_rgba(245,158,11,0.15)]";
              titleColor = "text-amber-400";
              barColor = "bg-amber-500";
              iconBg = "bg-amber-500/10";
              iconBorder = "border-amber-500/30";
            }

            return (
              <div
                key={asset.id}
                className={`relative bg-[#0f172a]/90 backdrop-blur-xl border ${borderColor} p-6 shadow-lg ${glowColor} group hover:-translate-y-1 transition-all duration-300`}
              >
                <CornerBrackets colorClass={colorName} />

                {/* Top Row: Icon + Name + Menu */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${iconBg} border ${iconBorder} flex items-center justify-center shadow-inner relative overflow-hidden`}>
                      {/* Scanline effect in icon */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent animate-scan"></div>
                      <span className="text-2xl relative z-10">
                        {asset.type === 'UAV' ? <i className="fa-solid fa-plane text-2xl"></i> :
                          asset.type === 'SOLDIER' ? <i className="fa-solid fa-person-rifle text-2xl"></i> :
                            asset.type === 'GROUND_VEHICLE' ? <i className="fa-solid fa-truck-pickup text-xl"></i> :
                              <i className="fa-solid fa-stopwatch text-2xl"></i>}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 tracking-widest font-sans uppercase">{asset.name}</h3>
                      <div className={`text-[10px] font-bold ${titleColor} tracking-[0.2em] mt-0.5 border border-${colorName}-500/20 px-1 py-0.5 inline-block bg-${colorName}-900/10`}>{asset.type}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAsset(asset)}
                    className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-sm"
                  >
                    <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                  </button>
                </div>

                {/* Coordinates HUD */}
                <div className="bg-[#0b1120] p-3 mb-6 border-l-2 border-slate-700 relative font-mono text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">LATITUDE</span>
                    <span className="text-slate-300 tracking-wider">4339.93700 N</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">LONGITUDE</span>
                    <span className="text-slate-300 tracking-wider">32.85700 E</span>
                  </div>
                </div>

                {/* Status Bars */}
                <div className="space-y-4">
                  {/* Health */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SAĞLIK</span>
                      <span className="text-xs text-slate-200 font-bold font-mono">100%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 relative">
                      <div className={`absolute top-0 left-0 h-full ${barColor} w-full shadow-[0_0_8px_currentColor] opacity-100`}></div>
                    </div>
                  </div>

                  {/* Fuel */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">YAKIT</span>
                      <span className="text-xs text-slate-200 font-bold font-mono">{asset.type === 'UAV' ? '72%' : '85%'}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 relative">
                      {/* Segmented bar effect manually or simple */}
                      <div className={`absolute top-0 left-0 h-full bg-slate-400 w-[72%] opacity-80`}></div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-dashed border-slate-700/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">GÖREV ID</span>
                    <span className="text-xs text-slate-300 font-bold font-mono">MSN-{Math.floor(Math.random() * 900) + 100}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">DURUM</span>
                    <span className={`text-xs font-bold tracking-wider ${asset.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {asset.status === 'ONLINE' ? 'ONLINE' : 'WARNING'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Unit Details Modal Overlay */}
      {selectedAsset && (
        <UnitDetailsModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
