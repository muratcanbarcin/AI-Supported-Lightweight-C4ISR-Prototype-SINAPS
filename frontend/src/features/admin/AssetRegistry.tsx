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

interface TacticalZone {
    id: string;
    name: string;
    zoneType: 'BASE' | 'OPERATION_AREA';
}

export function AssetRegistry() {
    const [assets, setAssets] = useState<InventoryAsset[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [zones, setZones] = useState<TacticalZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteInProgressId, setDeleteInProgressId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        type: 'DRONE' as InventoryAsset['type'],
        isSimulated: true,
        latitude: '',
        longitude: '',
        assignedZoneId: '',
    });

    useEffect(() => {
        fetchAssets();
        fetchZones();
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

    const fetchZones = async () => {
        try {
            const zonesRes = await api.get<TacticalZone[]>('/zones');
            setZones(zonesRes.data);
        } catch (err) {
            console.error('Failed to fetch zones', err);
            setZones([]);
        }
    };

    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/assets', {
                id: formData.id.trim(),
                type: formData.type,
                isSimulated: formData.isSimulated,
                latitude: Number(formData.latitude),
                longitude: Number(formData.longitude),
                initialLatitude: Number(formData.latitude),
                initialLongitude: Number(formData.longitude),
                assignedZoneId: formData.assignedZoneId || null,
            });
            setShowCreateModal(false);
            setFormData({
                id: '',
                type: 'DRONE',
                isSimulated: true,
                latitude: '',
                longitude: '',
                assignedZoneId: '',
            });
            await fetchAssets();
            setToast({ type: 'success', message: 'Birlik başarıyla eklendi.' });
        } catch (err) {
            console.error('Failed to create asset', err);
            setToast({ type: 'error', message: 'Kayıt Başarısız' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAsset = async (asset: InventoryAsset) => {
        const identifier = String(asset.name || asset.id);
        if (!window.confirm(`${identifier} birimini silmek istiyor musunuz?`)) {
            return;
        }
        setDeleteInProgressId(identifier);
        try {
            await api.delete(`/assets/${encodeURIComponent(identifier)}`);
            setAssets(prev => prev.filter(a => String(a.name || a.id) !== identifier));
            setToast({ type: 'success', message: `${identifier} silindi.` });
        } catch (err) {
            console.error('Failed to delete asset', err);
            setToast({ type: 'error', message: 'Silme işlemi başarısız' });
        } finally {
            setDeleteInProgressId(null);
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
            {toast && (
                <div className={`rounded border px-3 py-2 text-sm font-semibold ${toast.type === 'success'
                    ? 'bg-emerald-900/30 border-emerald-600/50 text-emerald-300'
                    : 'bg-red-900/30 border-red-600/50 text-red-300'
                    }`}>
                    {toast.message}
                </div>
            )}
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

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-bold"
                >
                    <i className="fa-solid fa-plus mr-2" />
                    Yeni Birlik Ekle
                </button>
            </div>

            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Asset ID</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Tip</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Durum</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Simulasyon</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Varliklar yukleniyor...</td></tr>
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
                                <td className="px-6 py-4 text-right">
                                    <button
                                        type="button"
                                        disabled={deleteInProgressId === String(asset.name || asset.id)}
                                        onClick={() => handleDeleteAsset(asset)}
                                        className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                        title="Sil"
                                    >
                                        <i className="fa-solid fa-trash" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && assets.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Kayitli varlik bulunamadi.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold text-lg">Yeni Birlik Ekle</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAsset} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-400 mb-1">ID</label>
                                <input
                                    required
                                    value={formData.id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                                    placeholder="ANKA-01"
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InventoryAsset['type'] }))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                    >
                                        <option value="DRONE">DRONE</option>
                                        <option value="VEHICLE">VEHICLE</option>
                                        <option value="SENSOR">SENSOR</option>
                                        <option value="SOLDIER">SOLDIER</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 text-sm text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={formData.isSimulated}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isSimulated: e.target.checked }))}
                                        />
                                        Simülasyon (varsayılan)
                                    </label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 mb-1">Latitude</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.000001"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-400 mb-1">Longitude</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.000001"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-400 mb-1">Base Zone</label>
                                <select
                                    value={formData.assignedZoneId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, assignedZoneId: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                >
                                    <option value="">Seçiniz</option>
                                    {zones.map(zone => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-3 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-300">
                                    İptal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold">
                                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
