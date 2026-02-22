import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask, fetchAssets } from '@/services/api';
import type { TaskDTO } from '@/services/api';
import type { Asset } from '@/types';

export function TasksPage() {
    const [tasks, setTasks] = useState<TaskDTO[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

    // Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        try {
            const data = await fetchTasks();
            setTasks(data);
        } catch (err) {
            console.error('[TasksPage] Failed to fetch tasks:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadAssets = useCallback(async () => {
        try {
            const data = await fetchAssets();
            setAssets(data);
        } catch (err) {
            console.error('[TasksPage] Failed to fetch assets:', err);
        }
    }, []);

    useEffect(() => {
        loadTasks();
        loadAssets();
    }, [loadTasks, loadAssets]);

    const handleCreateTask = async () => {
        if (!taskTitle || !taskDesc) return;

        setIsSubmitting(true);
        try {
            await createTask({
                assetId: selectedAssetId || undefined,
                title: taskTitle,
                description: taskDesc,
            });
            setToast('Görev başarıyla oluşturuldu.');
            setTimeout(() => setToast(null), 3000);

            // Reset form
            setTaskTitle('');
            setTaskDesc('');
            setSelectedAssetId('');
            setActiveTab('LIST');

            // Reload tasks
            await loadTasks();
        } catch (err) {
            console.error('[TasksPage] Failed to create task:', err);
            setToast('Görev oluşturulamadı.');
            setTimeout(() => setToast(null), 3000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return 'SÜRÜYOR';
            case 'COMPLETED': return 'TAMAMLANDI';
            case 'CANCELLED': return 'İPTAL';
            default: return 'BEKLİYOR';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_PROGRESS': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
            case 'COMPLETED': return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
            case 'CANCELLED': return 'border-red-500/30 bg-red-500/10 text-red-400';
            default: return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
        }
    };

    const formatCreatedAt = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch {
            return iso;
        }
    };

    const getAssetIcon = (assetId: string) => {
        if (assetId.toUpperCase().includes('DRONE') || assetId.toUpperCase().includes('UAV')) return 'fa-plane';
        if (assetId.toUpperCase().includes('SOLDIER') || assetId.toUpperCase().includes('PER')) return 'fa-person-rifle';
        if (assetId.toUpperCase().includes('VEHICLE') || assetId.toUpperCase().includes('VEH')) return 'fa-truck-pickup';
        return 'fa-circle-dot';
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">

            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-sm shadow-lg text-sm font-bold tracking-wider flex items-center gap-2 animate-pulse">
                    <i className="fa-solid fa-check-circle"></i> {toast}
                </div>
            )}

            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between border-b border-slate-700/50 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-sky-500"></div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">GÖREV YÖNETİMİ</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-800/50 p-1 rounded-sm border border-slate-700">
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'LIST' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            GÖREV LİSTESİ
                        </button>
                        <button
                            onClick={() => setActiveTab('CREATE')}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'CREATE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            YENİ GÖREV
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#0f172a]/95 border border-slate-700/50 shadow-2xl p-6 relative min-h-[500px]">
                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sky-500"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sky-500"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sky-500"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sky-500"></div>

                    {/* TASK LIST VIEW */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <i className="fa-solid fa-spinner fa-spin text-sky-500 text-2xl mr-3"></i>
                                    <span className="text-slate-400 font-mono">Görevler yükleniyor...</span>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-20">
                                    <i className="fa-solid fa-clipboard-list text-4xl text-slate-600 mb-4"></i>
                                    <p className="text-slate-500 text-sm">Henüz görev bulunmuyor.</p>
                                </div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="bg-slate-800/30 border border-slate-700/50 p-4 hover:bg-slate-800/50 transition-colors group relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-100 tracking-wider font-sans uppercase">{task.title}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold tracking-widest border ${getStatusColor(task.status)}`}>
                                                        {getStatusLabel(task.status)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 font-sans">{task.description || '—'}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OLUŞTURULMA</div>
                                                <div className="text-sm font-mono text-slate-300">{formatCreatedAt(task.createdAt)}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ATANAN BİRİM:</span>
                                                {task.assetId ? (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-900/20 px-2 py-1 rounded-sm border border-sky-500/20">
                                                        <i className={`fa-solid ${getAssetIcon(task.assetId)}`}></i>
                                                        {task.assetId}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">Atama Bekliyor</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-600 font-mono tracking-widest">TSK-{String(task.id).padStart(3, '0')}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* CREATE TASK VIEW */}
                    {activeTab === 'CREATE' && (
                        <div className="max-w-xl mx-auto py-4 font-sans">
                            <div className="space-y-6">

                                {/* Asset ID Input */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">VARLIK ID (İSTEĞE BAĞLI)</label>
                                    <input
                                        type="text"
                                        value={selectedAssetId}
                                        onChange={(e) => setSelectedAssetId(e.target.value)}
                                        className="w-full bg-[#0b1120] border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600"
                                        placeholder="Örn: TB2-ALFA-01"
                                    />
                                    {assets.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {assets.map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => setSelectedAssetId(selectedAssetId === a.id ? '' : a.id)}
                                                    className={`text-[10px] px-2 py-1 rounded-sm border transition-all ${selectedAssetId === a.id
                                                        ? 'bg-sky-500/20 border-sky-500 text-sky-400'
                                                        : 'bg-slate-800/40 border-slate-700 text-slate-500 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {a.id}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">GÖREV ADI</label>
                                    <input
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        className="w-full bg-[#0b1120] border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600"
                                        placeholder="Örn: Sınır Güvenliği Devriyesi"
                                    />
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">AÇIKLAMA</label>
                                    <textarea
                                        value={taskDesc}
                                        onChange={(e) => setTaskDesc(e.target.value)}
                                        rows={4}
                                        className="w-full bg-[#0b1120] border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600 resize-none"
                                        placeholder="Görev detaylarını ve hedeflerini belirtiniz..."
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-700/50 mt-8">
                                    <button
                                        onClick={() => setActiveTab('LIST')}
                                        className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={handleCreateTask}
                                        disabled={!taskTitle || !taskDesc || isSubmitting}
                                        className={`
                            px-8 py-2.5 text-xs font-bold text-white uppercase tracking-widest transition-all shadow-lg flex items-center gap-2
                            ${(!taskTitle || !taskDesc || isSubmitting)
                                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                                : 'bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]'}
                         `}
                                    >
                                        {isSubmitting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-plus"></i>}
                                        OLUŞTUR
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
