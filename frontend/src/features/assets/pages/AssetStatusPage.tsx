import { useState } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { ConnectionWarning } from '@/features/control/ConnectionWarning';
import type { AssetSummary, UAVDetails, SoldierDetails, VehicleDetails } from '@/types';
import { UnitDetailsModal } from '@/features/map/components/UnitDetailsModal';

interface AssetStatusPageProps {
  onOpenProfile?: (assetId: string) => void;
}

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

export function AssetStatusPage({ onOpenProfile }: AssetStatusPageProps) {
  const { assets, connectionStatus, isLoading } = useAssets();
  const [selectedAsset, setSelectedAsset] = useState<AssetSummary | null>(null);

  return (
    <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">
      {/* Connection Warning */}
      <ConnectionWarning connectionStatus={connectionStatus} />
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

            // Type Guard Helpers
            const isUAV = asset.type === 'UAV';
            const isSoldier = asset.type === 'SOLDIER';
            const isVehicle = asset.type === 'GROUND_VEHICLE';

            const uavDetails = isUAV ? asset.details as UAVDetails : null;
            const soldierDetails = isSoldier ? asset.details as SoldierDetails : null;
            const vehicleDetails = isVehicle ? asset.details as VehicleDetails : null;

            // Common Battery Level (default to random if missing for some reason)
            const batteryLevel = asset.details.batteryLevel || 85;

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
                        {isUAV ? <i className="fa-solid fa-plane text-2xl"></i> :
                          isSoldier ? <i className="fa-solid fa-person-rifle text-2xl"></i> :
                            isVehicle ? <i className="fa-solid fa-truck-pickup text-xl"></i> :
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
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">SON GÖRÜLME</span>
                    <span className="text-slate-300 tracking-wider">{asset.lastSeen || 'VERİ YOK'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 uppercase tracking-wider text-[9px]">KONUM</span>
                    <span className="text-slate-300 tracking-wider truncate ml-2" title={asset.coordinates}>
                      {asset.coordinates || "VERİ YOK"}
                    </span>
                  </div>
                </div>

                {/* Dynamic Status Bars / Grid */}
                <div className="space-y-4">

                  {/* UAV Specifics */}
                  {isUAV && uavDetails && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">İRTİFA</div>
                        <div className="text-sm font-bold text-white font-mono">{uavDetails.altitude} <span className="text-[10px] text-slate-400">FT</span></div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">HIZ</div>
                        <div className="text-sm font-bold text-white font-mono">{uavDetails.speed} <span className="text-[10px] text-slate-400">KM/H</span></div>
                      </div>
                    </div>
                  )}

                  {/* Soldier Specifics */}
                  {isSoldier && soldierDetails && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">NABIZ</div>
                        <div className={`text-sm font-bold font-mono ${soldierDetails.heartRate > 100 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                          {soldierDetails.heartRate} <span className="text-[10px] text-slate-400">BPM</span>
                        </div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">SPO2</div>
                        <div className="text-sm font-bold text-white font-mono">%{soldierDetails.spo2}</div>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Specifics */}
                  {isVehicle && vehicleDetails && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">MOTOR</div>
                        <div className="text-sm font-bold text-white font-mono">{vehicleDetails.engineTemp}°C</div>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-700/50">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider">HIZ</div>
                        <div className="text-sm font-bold text-white font-mono">{vehicleDetails.speed} <span className="text-[10px] text-slate-400">KM/H</span></div>
                      </div>
                    </div>
                  )}

                  {/* Common: Battery / Fuel */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {isVehicle ? "YAKIT SEVİYESİ" : "BATARYA DURUMU"}
                      </span>
                      <span className="text-xs text-slate-200 font-bold font-mono">
                        {isVehicle && vehicleDetails ? vehicleDetails.fuelLevel : batteryLevel}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 relative overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full ${barColor} shadow-[0_0_8px_currentColor] transition-all duration-1000`}
                        style={{ width: `${isVehicle && vehicleDetails ? vehicleDetails.fuelLevel : batteryLevel}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-dashed border-slate-700/50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">BİRİM ID</span>
                    <span className="text-xs text-slate-300 font-bold font-mono">{asset.id}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">DURUM</span>
                    <span className={`text-xs font-bold tracking-wider ${
                      asset.status === 'ONLINE' ? 'text-emerald-400' :
                      asset.status === 'WARNING' ? 'text-amber-400' :
                      'text-sky-400'
                    }`}>
                      {asset.status}
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
          onOpenProfile={onOpenProfile}
        />
      )}
    </div>
  );
}
