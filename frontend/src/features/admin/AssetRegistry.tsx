import { useState, useEffect } from 'react';
import api from '@/services/api';

interface InventoryAsset {
    id: number | string;
    name: string;
    type: 'DRONE' | 'VEHICLE' | 'SOLDIER' | 'SENSOR';
    isSimulated: boolean;
}

interface TaskItem {
    id: number;
    assetId: string | null;
    status: string;
}

interface TelemetryLatestItem {
    sourceId: string;
    sourceType: 'DRONE' | 'VEHICLE' | 'SOLDIER' | 'SENSOR';
}

export function AssetRegistry() {
    const [assets, setAssets] = useState<InventoryAsset[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        setIsRefreshing(true);
        setIsLoading(true);
        try {
            const assetsRes = await api.get<InventoryAsset[]>('/assets');
            setAssets(assetsRes.data);
        } catch (err) {
            // Fallback: build list from telemetry if inventory endpoint is blocked/unavailable.
            console.warn('Inventory endpoint failed, falling back to telemetry/latest', err);
            try {
                const telemetryRes = await api.get<TelemetryLatestItem[]>('/telemetry/latest');
                const mappedAssets: InventoryAsset[] = telemetryRes.data.map((t) => ({
                    id: t.sourceId,
                    name: t.sourceId,
                    type: t.sourceType,
                    isSimulated: true
                }));
                setAssets(mappedAssets);
            } catch (fallbackErr) {
                console.error('Fallback telemetry fetch failed', fallbackErr);
                setAssets([]);
            }
        }

        try {
            const tasksRes = await api.get<TaskItem[]>('/tasks');
            setTasks(tasksRes.data);
        } catch (err) {
            // Tasks endpoint failsafe: assets list should still render.
            console.warn('Tasks could not be fetched, defaulting statuses to IDLE', err);
            setTasks([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setLastRefresh(new Date());
        }
    };

    const getOperationalStatus = (asset: InventoryAsset): 'IDLE' | 'EN_ROUTE' => {
        const hasActiveTask = tasks.some(
            t =>
                (t.assetId === asset.name || t.assetId === String(asset.id)) &&
                (t.status === 'EN_ROUTE' || t.status === 'IN_PROGRESS')
        );
        return hasActiveTask ? 'EN_ROUTE' : 'IDLE';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-lg border border-slate-700/50">
                <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                    VARLIKLAR / GERCEK ZAMANLI BACKEND VERISI
                </span>
                <div className="flex items-center gap-3">
                    {lastRefresh && (
                        <span className="text-slate-500 text-xs font-mono">
                            Son yenileme: {lastRefresh.toLocaleTimeString('tr-TR')}
                        </span>
                    )}
                    <button type="button" onClick={fetchAssets} disabled={isRefreshing} className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-bold">
                        {isRefreshing ? 'YENILENIYOR...' : 'YENILE'}
                    </button>
                </div>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Asset ID</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Tip</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Durum</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Simulasyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Varliklar yukleniyor...</td></tr>
                        ) : assets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono text-sky-400">{asset.name}</div>
                                    <div className="text-xs text-slate-500">#{asset.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 border border-slate-600">
                                        {asset.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getOperationalStatus(asset) === 'EN_ROUTE' ? 'bg-amber-950/50 text-amber-400 border border-amber-900' :
                                        'bg-emerald-950/50 text-emerald-400 border border-emerald-900'
                                        }`}>
                                        {getOperationalStatus(asset)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border ${asset.isSimulated ? 'bg-indigo-950/50 text-indigo-300 border-indigo-900' : 'bg-cyan-950/50 text-cyan-300 border-cyan-900'}`}>
                                        {asset.isSimulated ? 'SIMULASYON' : 'GERCEK'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && assets.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Kayitli varlik bulunamadi.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
