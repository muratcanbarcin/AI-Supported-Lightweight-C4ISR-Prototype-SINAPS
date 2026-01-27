import { useState } from 'react';
import type { AssetSummary } from '@/services/mockData';

interface UnitDetailsModalProps {
    asset: AssetSummary;
    onClose: () => void;
    onOpenProfile?: (assetId: string) => void;
}

// Mock initial tasks for demo
const INITIAL_TASKS = [
    { id: 1, name: "Bölge Keşfi", status: "PENDING" },
    { id: 2, name: "Rutin Devriye", status: "COMPLETED" },
];

export function UnitDetailsModal({ asset, onClose, onOpenProfile }: UnitDetailsModalProps) {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [newTaskName, setNewTaskName] = useState("");

    const handleAddTask = () => {
        if (!newTaskName.trim()) return;
        const newTask = {
            id: Date.now(),
            name: newTaskName,
            status: "PENDING"
        };
        setTasks([...tasks, newTask]);
        setNewTaskName("");
    };

    // Helper to safely get battery/fuel
    const getBatteryOrFuel = () => {
        if (asset.type === 'GROUND_VEHICLE' && 'fuelLevel' in (asset.details || {})) {
            return { label: 'YAKIT SEVİYESİ', value: `${(asset.details as any).fuelLevel}%` };
        }
        if ('batteryLevel' in (asset.details || {})) {
            return { label: 'BATARYA', value: `${(asset.details as any).batteryLevel}%` };
        }
        return { label: 'BATARYA / YAKIT', value: '87%' }; // Fallback
    };

    const batteryInfo = getBatteryOrFuel();

    return (
        <div className="absolute top-20 left-20 z-[2000] w-[400px] bg-[#0f172a] backdrop-blur-xl border border-sky-500/30 shadow-2xl rounded-lg overflow-hidden font-sans animation-fade-in-up">
            {/* Header */}
            <div className="bg-slate-800/50 p-4 border-b border-sky-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-sm border ${asset.type === 'UAV' ? 'border-sky-500/50 bg-sky-500/10 text-sky-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'}`}>
                        <i className={`fa-solid ${asset.type === 'UAV' ? 'fa-plane' : asset.type === 'GROUND_VEHICLE' ? 'fa-truck' : 'fa-person-rifle'} text-lg`}></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-widest uppercase">{asset.name}</h2>
                        <div className="text-[10px] text-slate-400 font-mono tracking-wider">{asset.id}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {onOpenProfile && (
                        <button
                            onClick={() => onOpenProfile(asset.id)}
                            className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-1 rounded-sm border border-sky-500/30 transition-colors uppercase tracking-wider"
                        >
                            <i className="fa-solid fa-id-card mr-1"></i> PROFİL
                        </button>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors ml-2">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-6">

                {/* Status Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-3 border border-slate-700/50 rounded-sm">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">DURUM</div>
                        <div className={`text-sm font-bold tracking-wider ${asset.status === 'ONLINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {asset.status === 'ONLINE' ? 'AKTİF' : 'UYARI'}
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-3 border border-slate-700/50 rounded-sm">
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">{batteryInfo.label}</div>
                        <div className="text-sm font-bold text-sky-400 tracking-wider">
                            {batteryInfo.value}
                        </div>
                    </div>
                </div>

                {/* Task Assignment Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-700/50">
                        <div className="w-1 h-3 bg-sky-500"></div>
                        <h3 className="text-xs font-bold text-sky-500 uppercase tracking-[0.2em]">GÖREV ATAMA</h3>
                    </div>

                    {/* New Task Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            placeholder="Yeni görev adı giriniz..."
                            className="flex-1 bg-slate-900/50 border border-slate-700 text-xs text-white p-2 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm"
                        />
                        <button
                            onClick={handleAddTask}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2 rounded-sm transition-colors tracking-wider uppercase"
                        >
                            ATA
                        </button>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                        {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between bg-slate-800/20 border border-slate-700/30 p-2 rounded-sm group hover:bg-slate-800/40 transition-colors">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                    <span className="text-xs text-slate-300 font-medium">{task.name}</span>
                                </div>
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider">{task.status === 'PENDING' ? 'BEKLİYOR' : 'TAMAMLANDI'}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
