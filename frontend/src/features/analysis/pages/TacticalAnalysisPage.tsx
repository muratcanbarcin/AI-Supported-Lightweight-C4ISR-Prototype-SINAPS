import { useState, useEffect } from 'react';
import { useAssets } from '@/hooks/useAssets';
import type { AssetSummary, UAVDetails, SoldierDetails, VehicleDetails } from '@/types';
import { fetchTacticalAnalyses, type AiAnalysisDTO } from '@/services/api';

export function TacticalAnalysisPage() {
    const { assets } = useAssets();
    const [selectedItem, setSelectedItem] = useState<AssetSummary | null>(null);
    const [tacticalAnalyses, setTacticalAnalyses] = useState<AiAnalysisDTO[]>([]);
    const [analysesLoading, setAnalysesLoading] = useState(true);

    useEffect(() => {
        fetchTacticalAnalyses()
            .then(data => {
                // Filter out failed/error analyses (middleware failures)
                const validAnalyses = data.filter(a =>
                    a.threatLevel &&
                    a.threatLevel !== '' &&
                    a.recommendation &&
                    !a.recommendation.startsWith('ERROR')
                );
                setTacticalAnalyses(validAnalyses);
            })
            .catch(err => console.error('[TacticalAnalysis] Failed to fetch:', err))
            .finally(() => setAnalysesLoading(false));
    }, []);

    // Helper to generate simulated local threats for the demo, since it's not in the base model yet
    const getLocalThreats = (asset: AssetSummary) => {
        if (asset.type === 'UAV') return ['Radar Lock Detected (SA-8)', 'GPS Spoofing Signal'];
        if (asset.type === 'SOLDIER') return ['Sniper Activity (Sector 4)', 'Unidentified Movement 200m'];
        if (asset.type === 'GROUND_VEHICLE') return ['IED Risk on Route', 'Convoy Ambush Risk'];
        return [];
    };

    const threats = selectedItem ? getLocalThreats(selectedItem) : [];

    const getThreatColor = (level: string) => {
        switch (level?.toUpperCase()) {
            case 'CRITICAL': return 'border-red-500 bg-red-500/10 text-red-400';
            case 'HIGH': return 'border-rose-500 bg-rose-500/10 text-rose-400';
            case 'MEDIUM': return 'border-amber-500 bg-amber-500/10 text-amber-400';
            default: return 'border-slate-500 bg-slate-500/10 text-slate-400';
        }
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    };

    const renderStats = (asset: AssetSummary) => {
        if (asset.type === 'SOLDIER') {
            const details = asset.details as SoldierDetails;
            return (
                <>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">NABIZ</span>
                            <i className="fa-solid fa-heart-pulse text-rose-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">{details.heartRate} <span className="text-sm text-slate-500">bpm</span></div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.heartRate > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(details.heartRate, 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">SpO2 (OKSİJEN)</span>
                            <i className="fa-solid fa-lungs text-sky-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">%{details.spo2}</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.spo2 < 95 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${details.spo2}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">STRES SEVİYESİ</span>
                            <i className="fa-solid fa-brain text-amber-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">{(details.stressScore * 10).toFixed(1)} <span className="text-sm text-slate-500">/ 10</span></div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.stressScore > 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${details.stressScore * 100}%` }}></div>
                        </div>
                    </div>
                </>
            );
        } else if (asset.type === 'UAV') {
            const details = asset.details as UAVDetails;
            return (
                <>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">İRTİFA (AGL)</span>
                            <i className="fa-solid fa-plane-departure text-sky-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">{details.altitude} <span className="text-sm text-slate-500">m</span></div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${Math.min((details.altitude / 1000) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">BATARYA</span>
                            <i className="fa-solid fa-battery-full text-emerald-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">%{details.batteryLevel}</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.batteryLevel && details.batteryLevel < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${details.batteryLevel}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">SİNYAL KALİTESİ</span>
                            <i className="fa-solid fa-signal text-white"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">%{details.signalQuality}</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.signalQuality && details.signalQuality < 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${details.signalQuality}%` }}></div>
                        </div>
                    </div>
                </>
            );
        } else {
            // Vehicle
            const details = asset.details as VehicleDetails;
            return (
                <>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">YAKIT</span>
                            <i className="fa-solid fa-gas-pump text-amber-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">%{details.fuelLevel}</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.fuelLevel < 30 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${details.fuelLevel}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">MOTOR SICAKLIĞI</span>
                            <i className="fa-solid fa-temperature-high text-rose-500"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">{details.engineTemp}°C</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.engineTemp > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(details.engineTemp, 120)}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs text-slate-400 font-bold uppercase">ARAÇ SAĞLIĞI</span>
                            <i className="fa-solid fa-wrench text-slate-400"></i>
                        </div>
                        <div className="text-2xl font-mono text-white mb-2">%{details.health}</div>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${details.health < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${details.health}%` }}></div>
                        </div>
                    </div>
                </>
            );
        }
    };

    // Modal State
    const [showTargetModal, setShowTargetModal] = useState(false);

    return (
        <div className="h-full flex bg-slate-900/95 font-sans relative pt-16">

            {/* Sidebar: Unit Selection */}
            <div className="w-80 border-r border-slate-700/50 bg-slate-900/50 flex flex-col">
                <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <i className="fa-solid fa-crosshairs text-rose-500"></i>
                        AKTİF BİRİMLER
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {assets.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={`w-full text-left p-3 rounded-sm border transition-all ${selectedItem?.id === item.id
                                ? 'bg-rose-500/10 border-rose-500/50'
                                : 'bg-slate-800/30 border-slate-700/30 hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-300">{item.name}</span>
                                {item.status === 'WARNING' && <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xs"></i>}
                                {item.status === 'ONLINE' && <i className="fa-solid fa-circle text-emerald-500 text-[8px]"></i>}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-[10px] text-slate-500 uppercase">{item.type}</div>
                                <div className="text-[10px] text-slate-600 font-mono">{item.id}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content: Detailed Analysis */}
            <div className="flex-1 p-8 overflow-y-auto relative">
                {/* AI Analyses from Backend - Always visible at top */}
                {tacticalAnalyses.length > 0 && (
                    <div className="max-w-4xl mx-auto mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-5 bg-rose-500"></div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-[0.2em]">AI TAKTİKSEL ANALİZ GEÇMİŞİ</h3>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold tracking-wider ml-2">{tacticalAnalyses.length} KAYIT</span>
                        </div>
                        <div className="space-y-3">
                            {tacticalAnalyses.slice(0, 10).map(analysis => (
                                <div key={analysis.id} className={`bg-slate-800/40 border p-4 rounded-sm ${getThreatColor(analysis.threatLevel)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest border rounded-sm ${getThreatColor(analysis.threatLevel)}`}>
                                                {analysis.threatLevel}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">{analysis.assetId}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-mono">{formatDate(analysis.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.recommendation}</p>
                                    {analysis.isAlert && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                                            <i className="fa-solid fa-triangle-exclamation"></i> UYARI OLARAK İŞARETLENDİ
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!selectedItem ? (
                    <div className={`h-${tacticalAnalyses.length > 0 ? 'auto py-12' : 'full'} flex flex-col items-center justify-center text-slate-600 opacity-50`}>
                        <i className="fa-solid fa-satellite-dish text-6xl mb-4"></i>
                        <p className="text-lg font-mono">Veri analizi için sol panelden birim seçin</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header Details */}
                        <div className="flex items-center justify-between border-b border-rose-500/30 pb-4">
                            <div>
                                <div className="text-xs text-rose-400 font-bold uppercase tracking-widest mb-1">TAKTİKSEL DURUM RAPORU</div>
                                <h2 className="text-3xl text-white font-mono font-bold uppercase">{selectedItem.name}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${selectedItem.status === 'WARNING' ? 'bg-amber-500 text-black' :
                                        selectedItem.status === 'OFFLINE' ? 'bg-slate-700 text-slate-400' :
                                            'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {selectedItem.status}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">ID: {selectedItem.id.toUpperCase()}</span>
                                    {/* Show Operator For UAV/Vehicle if exists */}
                                    {(selectedItem.details as UAVDetails).operator && (
                                        <span className="text-xs text-sky-400 ml-2 border-l border-slate-700 pl-2">
                                            OP: {(selectedItem.details as UAVDetails).operator?.name}
                                        </span>
                                    )}
                                    {/* Show Real Name Only For Soldiers */}
                                    {(selectedItem.type === 'SOLDIER') && (selectedItem.details as SoldierDetails).realName && (
                                        <span className="text-xs text-amber-400 ml-2 border-l border-slate-700 pl-2 font-bold uppercase">
                                            {(selectedItem.details as SoldierDetails).realName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowTargetModal(true)}
                                    className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all">
                                    <i className="fa-solid fa-crosshairs mr-2"></i>
                                    HEDEF YÖNETİMİ
                                </button>
                                <button className="bg-slate-800 border border-slate-600 text-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-all">
                                    <i className="fa-solid fa-file-export mr-2"></i>
                                    RAPOR AL
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid - Dynamic based on Type */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {renderStats(selectedItem)}
                        </div>

                        {/* Local Threats (Simulated) */}
                        <div className="bg-rose-950/10 border border-rose-500/30 p-6">
                            <h3 className="text-rose-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-radar animate-pulse"></i>
                                YEREL TEHDİT VE RİSKLER
                            </h3>
                            {threats.length > 0 ? (
                                <div className="space-y-3">
                                    {threats.map((threat, idx) => (
                                        <div key={idx} className="bg-slate-900/80 p-3 border-l-2 border-rose-500 flex justify-between items-center">
                                            <span className="text-sm text-slate-200">{threat}</span>
                                            <span className="text-[10px] text-rose-500 font-bold uppercase border border-rose-500/30 px-2 py-0.5 bg-rose-500/10">ACİL</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm italic">Bölgede aktif tehdit unsuru tespit edilmedi.</div>
                            )}
                        </div>

                        {/* AI Recommendation (Restored) */}
                        <div className="col-span-full bg-slate-800/30 border border-slate-700 p-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-slate-900 border border-slate-600 p-3 h-20 w-20 flex items-center justify-center shrink-0">
                                    <i className="fa-solid fa-robot text-3xl text-sky-500"></i>
                                </div>
                                <div>
                                    <h3 className="text-sky-400 font-bold mb-1">YAPAY ZEKA TAKTİKSEL ANALİZİ</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-3">
                                        <strong>{selectedItem.name}</strong> birimi için analiz tamamlandı.
                                        {threats.length > 0 ? ' Yüksek öncelikli tehditler tespit edildi, dikkatli olunması önerilir.' : ' Devriye ve görev icrası için ortam güvenli görünüyor.'}
                                        {selectedItem.status === 'WARNING' && ' Operasyonel limitler zorlanıyor, dinlenme veya ikmal tavsiye edilir.'}
                                    </p>
                                    <button className="text-[10px] bg-sky-500/20 text-sky-400 px-3 py-1.5 border border-sky-500/50 hover:bg-sky-500 hover:text-white transition-colors uppercase font-bold tracking-wider">
                                        ÖNERİLEN AKSİYONU UYGULA
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Target Management Modal */}
                {showTargetModal && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                        <div className="bg-slate-900 border border-rose-500 w-full max-w-2xl shadow-[0_0_50px_rgba(225,29,72,0.3)]">
                            <div className="bg-rose-900/20 p-4 border-b border-rose-500/30 flex justify-between items-center">
                                <h3 className="text-rose-400 font-bold text-lg flex items-center gap-2">
                                    <i className="fa-solid fa-crosshairs animate-pulse"></i>
                                    HEDEF YÖNETİMİ VE ATAMA
                                </h3>
                                <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                    <i className="fa-solid fa-xmark text-xl"></i>
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-300 text-sm mb-4">
                                    Aşağıdaki hedefler <strong>{selectedItem?.name}</strong> birimi için menzil içerisinde tespit edilmiştir. Atama yapmak için hedef seçiniz.
                                </p>
                                <div className="space-y-3 mb-6">
                                    {/* Mock Target 1 */}
                                    <div className="bg-slate-800/50 p-4 border border-slate-700 hover:border-rose-500/50 transition-colors flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-500/10 rounded flex items-center justify-center border border-rose-500/30 text-rose-500">
                                                <i className="fa-solid fa-person-rifle"></i>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-sm">TH-HOSTILE-01 (Kuzey Yamacı)</div>
                                                <div className="text-xs text-slate-400">Mesafe: 450m | Olasılık: %92</div>
                                            </div>
                                        </div>
                                        <button className="bg-rose-500 text-white px-4 py-1.5 text-xs font-bold uppercase rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600">
                                            ATEŞ SERBEST
                                        </button>
                                    </div>
                                    {/* Mock Target 2 */}
                                    <div className="bg-slate-800/50 p-4 border border-slate-700 hover:border-amber-500/50 transition-colors flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded flex items-center justify-center border border-amber-500/30 text-amber-500">
                                                <i className="fa-solid fa-truck-field"></i>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-sm">TH-CONVOY-04 (Vadi Yolu)</div>
                                                <div className="text-xs text-slate-400">Mesafe: 1.2km | Hareket Halinde</div>
                                            </div>
                                        </div>
                                        <button className="bg-amber-500 text-amber-900 px-4 py-1.5 text-xs font-bold uppercase rounded-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-600">
                                            TAKİBE AL
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4 border-t border-slate-700/50">
                                    <button onClick={() => setShowTargetModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 text-xs font-bold uppercase rounded-sm transition-colors">
                                        KAPAT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
