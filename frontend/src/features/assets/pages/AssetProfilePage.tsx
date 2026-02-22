import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAssets } from "@/hooks/useAssets";
import { fetchSystemLogs, postEmergencyStop, createTask, type SystemLogDTO } from "@/services/api";
import type { UAVDetails, SoldierDetails, VehicleDetails } from "@/types";

interface AssetProfilePageProps {
    assetId: string;
    onBack: () => void;
    onFocusAsset?: (assetId: string) => void;
}

export function AssetProfilePage({ assetId, onBack, onFocusAsset }: AssetProfilePageProps) {
    const navigate = useNavigate();
    const { assets } = useAssets();
    const asset = assets.find((a) => a.id === assetId);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    // Message & Emergency States
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [isEmergencySending, setIsEmergencySending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // System logs from backend
    const [systemLogs, setSystemLogs] = useState<SystemLogDTO[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);

    useEffect(() => {
        if (assetId) {
            setLogsLoading(true);
            fetchSystemLogs(assetId)
                .then(data => setSystemLogs(data))
                .catch(err => console.warn('[AssetProfile] Failed to fetch logs:', err))
                .finally(() => setLogsLoading(false));
        }
    }, [assetId]);

    const handleAssignTask = async () => {
        if (!asset || !newTaskTitle) return;

        try {
            await createTask({
                assetId: assetId,
                title: newTaskTitle,
                description: newTaskDescription,
            });
            setToast('Görev başarıyla atandı.');
            setTimeout(() => setToast(null), 4000);
        } catch (err) {
            console.error('[AssetProfile] Task creation failed:', err);
            setToast('Görev atanamadı. Bağlantı kontrol edin.');
            setTimeout(() => setToast(null), 4000);
        } finally {
            setNewTaskTitle("");
            setNewTaskDescription("");
            setIsTaskModalOpen(false);
        }
    };

    const handleAiAssist = () => {
        setIsAiGenerating(true);
        // Simulate AI delay
        setTimeout(() => {
            const aiSuggestions = [
                "Hedef bölgede 360 derece çevre güvenliğini sağla ve termal kamera ile tarama yap.",
                "Belirlenen koordinatlara intikal et ve dost kuvvetler gelene kadar pozisyonu koru.",
                "Şüpheli araç takibi başlat, görsel temas kur ancak çatışmaya girme.",
                "Yaralı tahliyesi için güvenli koridor oluştur ve ilk yardım ekibine refakat et."
            ];
            const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
            setNewTaskDescription(randomSuggestion);
            setIsAiGenerating(false);
        }, 1500);
    };

    const handleFocusOnMap = () => {
        // Navigate to map page and pass asset coordinates for centering
        navigate(`/map?focus=${assetId}`);
    };

    const handleSendMessage = () => {
        setIsMessageModalOpen(true);
    };

    const handleSendMessageConfirm = () => {
        if (messageText) {
            // Mock send
            setIsMessageModalOpen(false);
            setMessageText("");
        }
    };

    const handleEmergencyStop = () => {
        setIsEmergencyModalOpen(true);
    };

    const handleEmergencyStopConfirm = async () => {
        setIsEmergencySending(true);
        try {
            await postEmergencyStop(assetId);
            setToast('Acil durdurma başarıyla iletildi.');
            setTimeout(() => setToast(null), 4000);
            // Reload system logs to show the new entry
            const newLogs = await fetchSystemLogs(assetId);
            setSystemLogs(newLogs);
        } catch (err) {
            console.error('[AssetProfile] Emergency stop failed:', err);
            setToast('Acil durdurma iletilemiyor. Bağlantı kontrol edin.');
            setTimeout(() => setToast(null), 4000);
        } finally {
            setIsEmergencySending(false);
            setIsEmergencyModalOpen(false);
        }
    };

    if (!asset) {
        return (
            <div className="flex items-center justify-center h-full text-white">
                Asset not found: {assetId}
                <button onClick={onBack} className="ml-4 text-sky-500 underline">
                    Geri Dön
                </button>
            </div>
        );
    }

    // Type Guards & casting
    const isUAV = asset.type === "UAV";
    const isSoldier = asset.type === "SOLDIER";
    const isVehicle = asset.type === "GROUND_VEHICLE";

    const uavParams = isUAV ? (asset.details as UAVDetails) : null;
    const soldierParams = isSoldier ? (asset.details as SoldierDetails) : null;
    const vehicleParams = isVehicle ? (asset.details as VehicleDetails) : null;

    // Determine accent colors based on type
    let accentColor = "text-sky-500";
    let borderColor = "border-sky-500/30";
    let bgGradient = "from-sky-500/10";
    let iconClass = "fa-plane";

    if (isSoldier) {
        accentColor = "text-orange-500";
        borderColor = "border-orange-500/30";
        bgGradient = "from-orange-500/10";
        iconClass = "fa-person-rifle";
    } else if (isVehicle) {
        accentColor = "text-amber-500";
        borderColor = "border-amber-500/30";
        bgGradient = "from-amber-500/10";
        iconClass = "fa-truck-pickup";
    }

    // Helper for metrics card
    const MetricCard = ({ label, value, unit, icon }: { label: string; value: string | number; unit?: string; icon?: string }) => (
        <div className={`bg-slate-900/50 border border-slate-700/50 p-4 relative overflow-hidden group hover:border-${isSoldier ? 'orange' : isVehicle ? 'amber' : 'sky'}-500/50 transition-colors`}>
            <div className="absolute top-0 right-0 p-2 opacity-5">
                <i className={`fa-solid ${icon || 'fa-circle-notch'} text-4xl`}></i>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-bold text-white font-mono tracking-wider">
                {value} <span className="text-sm text-slate-500 ml-1">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto bg-slate-900/95 backdrop-blur-xl pt-20 px-8 pb-8 font-sans custom-scrollbar">

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-sm shadow-lg text-sm font-bold tracking-wider flex items-center gap-2 animate-pulse">
                    <i className="fa-solid fa-check-circle"></i> {toast}
                </div>
            )}

            {/* Header / Top Bar */}
            <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-slate-700/50 pb-6">
                <div className="flex items-center gap-6">

                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="w-12 h-12 flex items-center justify-center border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors rounded-sm"
                    >
                        <i className="fa-solid fa-arrow-left text-xl"></i>
                    </button>

                    {/* Unit Identity */}
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 flex items-center justify-center border-2 ${borderColor} bg-slate-800/50 shadow-[0_0_20px_rgba(0,0,0,0.3)] relative`}>
                            <div className={`absolute inset-0 bg-gradient-to-tr ${bgGradient} to-transparent opacity-50`}></div>
                            <i className={`fa-solid ${iconClass} text-4xl ${accentColor}`}></i>
                        </div>
                        <div>
                            {/* Conditional Display for Soldier Names/Ranks */}
                            {isSoldier && soldierParams?.realName ? (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-lg font-bold ${accentColor} tracking-widest uppercase opacity-80`}>{soldierParams.rank}</span>
                                        <h1 className="text-4xl font-black text-white tracking-widest uppercase font-sans italic">{soldierParams.realName}</h1>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs font-mono text-slate-400 tracking-[0.2em]">{asset.name} / {asset.id}</span>
                                        <span className={`flex items-center gap-2 text-xs font-bold tracking-widest px-3 py-1 bg-slate-800 ${asset.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${asset.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                            {asset.status === 'ONLINE' ? 'BAĞLI' : 'UYARI'}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-black text-white tracking-widest uppercase font-sans italic">{asset.name}</h1>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs font-mono text-slate-400 tracking-[0.2em]">{asset.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 border ${borderColor} ${accentColor} tracking-widest uppercase`}>
                                            {asset.type}
                                        </span>
                                        <span className={`flex items-center gap-2 text-xs font-bold tracking-widest px-3 py-1 bg-slate-800 ${asset.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${asset.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                                            {asset.status === 'ONLINE' ? 'BAĞLI' : 'UYARI'}
                                        </span>
                                    </div>

                                    {/* Operator Info Display */}
                                    {(uavParams?.operator || vehicleParams?.operator) && (
                                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/50">
                                            <i className="fa-solid fa-headset text-slate-500 text-xs"></i>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OPERATÖR:</span>
                                            <span className="text-xs text-white font-bold tracking-wide uppercase">
                                                {uavParams?.operator?.rank || vehicleParams?.operator?.rank} {uavParams?.operator?.name || vehicleParams?.operator?.name}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Global Stats (Battery, Link) */}
                <div className="flex gap-4">
                    <div className="bg-slate-800/30 border border-slate-700/50 p-3 w-40">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{isVehicle ? "YAKIT" : "BATARYA"}</span>
                            <i className={`fa-solid ${isVehicle ? 'fa-gas-pump' : 'fa-battery-half'} text-slate-600`}></i>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-1">
                            <div
                                className={`h-full ${isVehicle ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${isVehicle ? vehicleParams?.fuelLevel : asset.details.batteryLevel}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-xs font-mono text-white">
                            {isVehicle ? vehicleParams?.fuelLevel : asset.details.batteryLevel}%
                        </div>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700/50 p-3 w-40">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">SİNYAL</span>
                            <i className="fa-solid fa-signal text-slate-600"></i>
                        </div>
                        <div className="text-lg font-mono text-white font-bold">
                            {asset.details.signalQuality}% <span className="text-[10px] text-slate-500 font-sans tracking-wide">RSSI (mock)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                            ~{asset.details.latency}ms (mock)
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid Check Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

                {/* Left Column - Primary Metrics (8 cols) */}
                <div className="col-span-8 space-y-6">

                    {/* Context Header */}
                    <div className="flex items-center gap-2 border-b border-slate-700/50 pb-2">
                        <div className={`w-1 h-5 ${isUAV ? 'bg-sky-500' : isSoldier ? 'bg-orange-500' : 'bg-amber-500'}`}></div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">TELEMETRİ VERİLERİ</h2>
                    </div>

                    {/* Generic Details (Location etc) */}
                    <div className="grid grid-cols-3 gap-4">
                        <MetricCard label="ENLEM / BOYLAM" value={asset.coordinates || "N/A"} unit="" icon="fa-map-location-dot" />
                        <MetricCard label="SON GÖRÜLME" value={asset.lastSeen} unit="" icon="fa-clock" />
                        <MetricCard
                            label="HAREKET DURUMU"
                            value={isSoldier ? soldierParams?.status || "N/A" : isVehicle ? "HAREKETLİ" : uavParams?.mode || "MANUAL"}
                            unit=""
                            icon="fa-arrows-up-down-left-right"
                        />
                    </div>

                    {/* Type Specific Big Cards */}
                    {isUAV && uavParams && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Flight Data */}
                            <div className="bg-slate-800/40 p-6 border border-sky-500/20 rounded-sm relative">
                                <h3 className="text-sky-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-plane-up"></i> UÇUŞ VERİLERİ</h3>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">İRTİFA (AGL)</div>
                                        <div className="text-3xl font-bold text-white font-mono">{uavParams.altitude} <span className="text-sm">FT</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">YER HIZI</div>
                                        <div className="text-3xl font-bold text-white font-mono">{uavParams.speed} <span className="text-sm">KM/H</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">DİKEY HIZ</div>
                                        <div className="text-3xl font-bold text-white font-mono">{uavParams.verticalSpeed} <span className="text-sm">M/S</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">PUSULA</div>
                                        <div className="text-3xl font-bold text-white font-mono">{uavParams.heading}°</div>
                                    </div>
                                </div>
                            </div>

                            {/* Attitude Indicators (Textual for now) */}
                            <div className="bg-slate-800/40 p-6 border border-sky-500/20 rounded-sm">
                                <h3 className="text-sky-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-arrows-spin"></i> ORYANTASYON <span className="text-[10px] text-slate-600 font-normal">(mock)</span></h3>
                                <div className="space-y-4">
                                    <div className="bg-black/40 p-3 border border-slate-700 flex justify-between items-center">
                                        <span className="text-xs text-slate-400 font-bold">YUNUSLAMA (mock)</span>
                                        <span className="text-lg font-mono text-white">{uavParams.pitch}°</span>
                                    </div>
                                    <div className="bg-black/40 p-3 border border-slate-700 flex justify-between items-center">
                                        <span className="text-xs text-slate-400 font-bold">YUVARLANMA (mock)</span>
                                        <span className="text-lg font-mono text-white">{uavParams.roll}°</span>
                                    </div>
                                    <div className="bg-black/40 p-3 border border-slate-700 flex justify-between items-center">
                                        <span className="text-xs text-slate-400 font-bold">VOLTAJ DENGESİ (mock)</span>
                                        <span className="text-lg font-mono text-white">{uavParams.voltage}V</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSoldier && soldierParams && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Vitals */}
                            <div className="bg-slate-800/40 p-6 border border-orange-500/20 rounded-sm relative">
                                <h3 className="text-orange-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-heart-pulse"></i> YAŞAMSAL FONKSİYONLAR</h3>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">NABIZ</div>
                                        <div className={`text-3xl font-bold font-mono ${soldierParams.heartRate > 100 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                            {soldierParams.heartRate} <span className="text-sm">BPM</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">SPO2</div>
                                        <div className="text-3xl font-bold text-white font-mono">%{soldierParams.spo2}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">SOLUNUM</div>
                                        <div className="text-3xl font-bold text-white font-mono">{soldierParams.respirationRate} <span className="text-sm">/DK</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">CİLT SICAKLIĞI</div>
                                        <div className="text-3xl font-bold text-white font-mono">{soldierParams.skinTemp}°C</div>
                                    </div>
                                </div>
                            </div>

                            {/* Physical State */}
                            <div className="bg-slate-800/40 p-6 border border-orange-500/20 rounded-sm relative">
                                <h3 className="text-orange-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-person-running"></i> FİZİKSEL DURUM</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-xs text-slate-400">STRES SEVİYESİ (mock)</span>
                                        <div className="w-32 bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${soldierParams.stressScore > 0.5 ? 'bg-red-500' : 'bg-green-500'}`}
                                                style={{ width: `${soldierParams.stressScore * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-prefix mt-2">
                                        <span className="text-xs text-slate-400">POZİSYON (mock)</span>
                                        <span className="text-lg font-bold text-white uppercase">{soldierParams.bodyPosture}</span>
                                    </div>
                                    <div className="flex justify-between items-prefix mt-2">
                                        <span className="text-xs text-slate-400">ADIM SAYISI (mock)</span>
                                        <span className="text-lg font-mono text-white">{soldierParams.steps}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {isVehicle && vehicleParams && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Engine Data */}
                            <div className="bg-slate-800/40 p-6 border border-amber-500/20 rounded-sm relative">
                                <h3 className="text-amber-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-gauge-high"></i> MOTOR VERİLERİ</h3>
                                <div className="grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">HIZ</div>
                                        <div className="text-3xl font-bold text-white font-mono">{vehicleParams.speed} <span className="text-sm">KM/H</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">DEVİR / RPM (mock)</div>
                                        <div className="text-3xl font-bold text-white font-mono">2450 <span className="text-sm text-slate-600">(mock)</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">MOTOR ISISI</div>
                                        <div className="text-3xl font-bold text-white font-mono">{vehicleParams.engineTemp}°C</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase tracking-wider">ŞANZIMAN ISISI</div>
                                        <div className="text-3xl font-bold text-white font-mono">{vehicleParams.transmissionTemp}°C</div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Health */}
                            <div className="bg-slate-800/40 p-6 border border-amber-500/20 rounded-sm relative">
                                <h3 className="text-amber-400 font-bold tracking-widest mb-4 flex items-center gap-2"><i className="fa-solid fa-wrench"></i> ARAÇ SAĞLIĞI</h3>

                                <div className="mb-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-slate-400 font-bold">GENEL SAĞLIK</span>
                                        <span className="text-xs text-white font-bold">{vehicleParams.health}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${vehicleParams.health}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-black/40 p-3 border border-slate-700">
                                        <div className="text-[10px] text-slate-500">YAĞ BASINCI (mock)</div>
                                        <div className="text-xl font-bold text-white font-mono">{vehicleParams.oilPressure} PSI</div>
                                    </div>
                                    <div className="bg-black/40 p-3 border border-slate-700">
                                        <div className="text-[10px] text-slate-500">ODOMETRE (mock)</div>
                                        <div className="text-xl font-bold text-white font-mono">{vehicleParams.odometer} KM</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column - Secondary Actions & Logs (4 cols) */}
                <div className="col-span-4 space-y-6">

                    {/* Pending Tasks / Missions */}
                    <div className="bg-slate-800/30 p-4 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4 opacity-70 flex items-center justify-between">
                            GÖREVLER
                            <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-300">
                                {asset.tasks?.filter(t => t.status !== 'COMPLETED').length || 0} AKTİF
                            </span>
                        </h3>

                        {/* New Task Button */}
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="w-full mb-4 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50 py-2 uppercase text-[10px] font-bold tracking-widest transition-colors flex items-center justify-center gap-2 rounded-sm"
                        >
                            <i className="fa-solid fa-plus"></i> YENİ GÖREV ATA
                        </button>

                        {!asset.tasks || asset.tasks.length === 0 ? (
                            <div className="text-xs text-slate-500 italic text-center py-4">Atanmış görev bulunmuyor.</div>
                        ) : (
                            <div className="space-y-3">
                                {asset.tasks.map(task => (
                                    <div key={task.id} className="bg-slate-900/50 p-3 border-l-2 border-slate-700 hover:bg-slate-800/50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-slate-200">{task.title}</span>
                                            <span className={`text-[9px] px-1.5 py-0.5 font-bold tracking-wider rounded-sm ${task.priority === 'HIGH' ? 'bg-red-900/40 text-red-400 border border-red-500/20' :
                                                task.priority === 'MEDIUM' ? 'bg-amber-900/40 text-amber-400 border border-amber-500/20' :
                                                    'bg-slate-700/40 text-slate-400 border border-slate-500/20'
                                                }`}>
                                                {task.priority === 'HIGH' ? 'KRİTİK' : task.priority === 'MEDIUM' ? 'NORMAL' : 'DÜŞÜK'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {task.status === 'COMPLETED' ? (
                                                <i className="fa-solid fa-check-circle text-emerald-500 text-xs"></i>
                                            ) : task.status === 'IN_PROGRESS' ? (
                                                <i className="fa-solid fa-spinner fa-spin text-sky-500 text-xs"></i>
                                            ) : (
                                                <i className="fa-regular fa-circle text-slate-600 text-xs"></i>
                                            )}
                                            <span className={`text-[10px] font-mono tracking-wide ${task.status === 'COMPLETED' ? 'text-emerald-500' :
                                                task.status === 'IN_PROGRESS' ? 'text-sky-500' : 'text-slate-500'
                                                }`}>
                                                {task.status === 'COMPLETED' ? 'TAMAMLANDI' :
                                                    task.status === 'IN_PROGRESS' ? 'DEVAM EDİYOR' : 'BEKLEMEDE'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-slate-800/30 p-4 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4 opacity-70">KOMUTA AKSİYONLARI</h3>
                        <div className="space-y-2">
                            <button
                                onClick={handleFocusOnMap}
                                className="w-full bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 border border-sky-500/50 py-3 uppercase text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-location-crosshairs"></i> Haritada Odakla
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled
                                title="Mesaj sistemi henüz aktif değil"
                                className="w-full bg-slate-700/30 text-slate-500 border border-slate-600 py-3 uppercase text-xs font-bold tracking-widest flex items-center justify-center gap-2 cursor-not-allowed opacity-50"
                            >
                                <i className="fa-solid fa-envelope"></i> Mesaj Gönder (henüz aktif değil)
                            </button>
                            <button
                                onClick={handleEmergencyStop}
                                className="w-full bg-red-500/10 hover:bg-red-500/30 text-red-500 border border-red-500/50 py-3 uppercase text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-ban"></i> Acil Durdurma
                            </button>
                        </div>
                    </div>

                    {/* System Log from Backend */}
                    <div className="bg-slate-900 border border-slate-700/50 flex flex-col h-[400px]">
                        <div className="p-3 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">SİSTEM GÜNLÜĞÜ</h3>
                            <span className="text-[9px] text-slate-600 font-mono">{systemLogs.length} kayıt</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[10px] custom-scrollbar">
                            {logsLoading ? (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <i className="fa-solid fa-spinner fa-spin"></i> Loglar yükleniyor...
                                </div>
                            ) : systemLogs.length === 0 ? (
                                <div className="text-slate-600 italic">Bu varlık için log kaydı bulunmuyor.</div>
                            ) : (
                                systemLogs.map(log => {
                                    const time = new Date(log.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    const eventColor = log.eventType === 'EMERGENCY_STOP' ? 'text-red-500'
                                        : log.eventType.includes('WARN') ? 'text-amber-500'
                                        : log.eventType.includes('OK') || log.eventType.includes('COMPLETE') ? 'text-emerald-500'
                                        : 'text-sky-500';
                                    return (
                                        <div key={log.id} className="text-slate-500">
                                            [{time}] <span className={eventColor}>{log.eventType}</span> {log.message}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>

            </div>

            {/* Task Assignment Modal */}
            {isTaskModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 max-w-md w-full shadow-2xl relative">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-plus-circle text-emerald-500"></i> YENİ GÖREV ATA
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">GÖREV BAŞLIĞI</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-800 border border-slate-700 text-white p-2 text-sm focus:border-emerald-500 transition-colors outline-none"
                                    placeholder="Görev tanımlayın..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">GÖREV AÇIKLAMASI</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 text-white p-2 text-sm h-24 focus:border-emerald-500 transition-colors outline-none resize-none"
                                        placeholder="Detaylı görev açıklaması..."
                                        value={newTaskDescription}
                                        onChange={(e) => setNewTaskDescription(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAiAssist}
                                        disabled={isAiGenerating}
                                        className="absolute bottom-2 right-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-[10px] font-bold px-2 py-1 border border-purple-500/50 rounded-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                    >
                                        {isAiGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                        AI DESTEĞİ
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">ÖNCELİK SEVİYESİ</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['LOW', 'MEDIUM', 'HIGH'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setNewTaskPriority(p as any)}
                                            className={`py-2 text-xs font-bold border transition-colors ${newTaskPriority === p
                                                ? (p === 'HIGH' ? 'bg-red-900/50 border-red-500 text-red-400'
                                                    : p === 'MEDIUM' ? 'bg-amber-900/50 border-amber-500 text-amber-400'
                                                        : 'bg-slate-700 border-slate-500 text-white')
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                                                }`}
                                        >
                                            {p === 'HIGH' ? 'KRİTİK' : p === 'MEDIUM' ? 'NORMAL' : 'DÜŞÜK'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-700/50">
                                <button
                                    onClick={() => setIsTaskModalOpen(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 text-xs font-bold tracking-widest transition-colors"
                                >
                                    İPTAL
                                </button>
                                <button
                                    onClick={handleAssignTask}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 text-xs font-bold tracking-widest transition-colors"
                                >
                                    GÖREVİ ONAYLA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Message Modal */}
            {isMessageModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-envelope text-sky-500"></i> MESAJ GÖNDER
                        </h3>
                        <textarea
                            className="w-full bg-slate-800 border border-slate-700 text-white p-3 text-sm h-32 mb-4 focus:border-sky-500 transition-colors outline-none resize-none"
                            placeholder="İletmek istediğiniz mesaj..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsMessageModalOpen(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 text-xs font-bold tracking-widest transition-colors"
                            >
                                İPTAL
                            </button>
                            <button
                                onClick={handleSendMessageConfirm}
                                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 text-xs font-bold tracking-widest transition-colors"
                            >
                                GÖNDER
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Emergency Stop Modal */}
            {isEmergencyModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] bg-red-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-black border-2 border-red-600 p-8 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.5)] text-center relative overflow-hidden">
                        {/* Warning Stripes */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-stripes-red"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-stripes-red"></div>

                        <div className="mb-6">
                            <i className="fa-solid fa-triangle-exclamation text-6xl text-red-500 animate-pulse"></i>
                        </div>

                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">ACİL DURDURMA</h2>
                        <p className="text-red-300 text-sm font-mono mb-8">
                            DİKKAT: BU İŞLEM VARLIĞIN TÜM OPERASYONLARINI ANINDA DURDURACAKTIR. BU İŞLEM GERİ ALINAMAZ.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsEmergencyModalOpen(false)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 text-sm font-bold tracking-widest transition-colors border border-slate-700"
                            >
                                İPTAL
                            </button>
                            <button
                                onClick={handleEmergencyStopConfirm}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 text-sm font-bold tracking-widest transition-colors border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse"
                            >
                                DURDUR
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
