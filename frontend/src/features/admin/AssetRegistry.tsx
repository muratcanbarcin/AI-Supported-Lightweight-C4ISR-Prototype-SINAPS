import { useState, useEffect } from 'react';
import api from '@/services/api';

interface InventoryAsset {
    id: number;
    name: string;
    type: 'DRONE' | 'VEHICLE' | 'SOLDIER' | 'SENSOR';
    serialNumber: string;
    inventoryStatus: string;
    description: string;
    commissionDate: string;
}

export function AssetRegistry() {
    const [assets, setAssets] = useState<InventoryAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [assetToDelete, setAssetToDelete] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'DRONE',
        serialNumber: '',
        description: ''
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const res = await api.get<InventoryAsset[]>('/assets');
            // Note: api base is /api/v1, so this calls /api/v1/assets
            setAssets(res.data);
        } catch (err) {
            console.error('Failed to fetch assets', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/assets', formData);
            setShowModal(false);
            setFormData({ name: '', type: 'DRONE', serialNumber: '', description: '' });
            fetchAssets();
        } catch (err) {
            console.error('Failed to create asset', err);
            alert('Failed to create asset');
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex gap-4">
                    <div className="relative">
                        <i className="fa-solid fa-search absolute left-3 top-3 text-slate-500"></i>
                        <input
                            type="text"
                            placeholder="Envanterde ara..."
                            className="bg-slate-900 border border-slate-700 rounded pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500 w-64"
                        />
                    </div>
                    <select className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500">
                        <option value="ALL">Tüm Tipler</option>
                        <option value="DRONE">İHA</option>
                        <option value="VEHICLE">Araçlar</option>
                    </select>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded text-sm font-bold tracking-wide transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus"></i>
                    VARLIK EKLE
                </button>
            </div>

            {/* Data Grid */}
            <div className="bg-[#1e293b]/50 border border-slate-700/50 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-xs">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">ID / Seri No</th>
                            <th className="px-6 py-4 font-bold tracking-wider">İsim</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Tip</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Durum</th>
                            <th className="px-6 py-4 font-bold tracking-wider">Kayıt Tarihi</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Envanter yükleniyor...</td></tr>
                        ) : assets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-mono text-sky-400">#{asset.id}</div>
                                    <div className="text-xs text-slate-500">{asset.serialNumber || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{asset.name}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-800 border border-slate-600">
                                        {asset.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${asset.inventoryStatus === 'ACTIVE' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' :
                                        'bg-slate-700 text-slate-300'
                                        }`}>
                                        {asset.inventoryStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">
                                    {new Date(asset.commissionDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => {
                                            setAssetToDelete(asset.id);
                                            setShowDeleteModal(true);
                                        }}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && assets.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Kayıtlı varlık bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Asset Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-sky-900 w-full max-w-lg rounded-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white">Yeni Varlık Kaydı</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Varlık İsmi (Çağrı Kodu)</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                                    placeholder="e.g. TB2-055"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Tip</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                                    >
                                        <option value="DRONE">DRONE</option>
                                        <option value="VEHICLE">VEHICLE</option>
                                        <option value="SOLDIER">SOLDIER</option>
                                        <option value="SENSOR">SENSOR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Seri Numarası</label>
                                    <input
                                        value={formData.serialNumber}
                                        onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-sky-500 focus:outline-none"
                                        placeholder="SN-2026-X"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Açıklama / Konfigürasyon</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-sky-500 focus:outline-none h-24"
                                    placeholder="Technical specs..."
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
                                <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded font-bold">KAYDET</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-red-900/50 w-full max-w-sm rounded-lg shadow-2xl p-6 relative overflow-hidden">
                        {/* Background warning pattern */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <i className="fa-solid fa-triangle-exclamation text-9xl text-red-500"></i>
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/50">
                                <i className="fa-solid fa-trash-can text-red-500 text-xl"></i>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">Varlığı Sil</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                <strong>#{assetToDelete}</strong> ID'li varlığı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setAssetToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={async () => {
                                        if (assetToDelete) {
                                            try {
                                                await api.delete(`/assets/${assetToDelete}`);
                                                fetchAssets();
                                                setShowDeleteModal(false);
                                                setAssetToDelete(null);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Silme işlemi başarısız');
                                            }
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition-colors font-bold text-sm shadow-lg shadow-red-900/20"
                                >
                                    SİL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
