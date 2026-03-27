import { useState, useEffect } from 'react';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';

interface SystemStatusResponse {
    status: 'ONLINE' | 'OFFLINE' | string;
    activeUsers: number;
    totalAssets: number;
    activeTasks: number;
    totalZones: number;
}

export function AdminDashboard() {
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const navigate = useNavigate();
    const [stats, setStats] = useState<SystemStatusResponse>({
        status: 'OFFLINE',
        activeUsers: 0,
        totalAssets: 0,
        activeTasks: 0,
        totalZones: 0
    });
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, FIVE_MINUTES_MS);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        setIsRefreshing(true);
        try {
            const statusRes = await api.get<SystemStatusResponse>('/admin/system-status');
            setStats(statusRes.data);
            setLastUpdate(new Date());
        } catch (err) {
            console.error('Failed to fetch dashboard stats', err);
            setStats(prev => ({ ...prev, status: 'OFFLINE' }));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const StatCard = ({ title, value, icon, color, onClick }: { title: string; value: string | number; icon: string; color: string; onClick: () => void }) => (
        <div
            onClick={onClick}
            className="bg-[#1e293b]/50 border border-slate-700/50 p-6 rounded-xl hover:border-sky-500/50 hover:bg-[#1e293b]/80 transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">{title}</h3>
                    <div className="text-3xl font-black text-white group-hover:text-sky-400 transition-colors">
                        {isLoading ? '...' : value}
                    </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800/50 border border-slate-700/50 group-hover:bg-${color}-900/20 group-hover:text-${color}-400 transition-colors`}>
                    <i className={`fa-solid ${icon} text-xl text-slate-500 group-hover:text-${color}-500`}></i>
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
                {lastUpdate ? (
                    <span className="text-slate-500">Son güncelleme: {lastUpdate.toLocaleTimeString()}</span>
                ) : (
                    <span className="text-slate-500">Henüz güncelleme yok</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-sky-900/20 to-transparent border-l-4 border-sky-500 p-6 rounded-r-lg">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-white mb-2">Hoşgeldiniz, Komutanım.</h2>
                    <button
                        onClick={fetchStats}
                        type="button"
                        disabled={isRefreshing}
                        className="px-3 py-1.5 text-xs font-bold rounded border border-sky-700 text-sky-300 hover:bg-sky-900/30 disabled:opacity-50"
                    >
                        {isRefreshing ? 'YENILENIYOR...' : 'MANUEL YENILE'}
                    </button>
                </div>
                <p className="text-slate-400 max-w-2xl">
                    SINAPS Komuta Kontrol Sistemi v2.4 hazır. Sistemler tam kapasite çalışıyor.
                    Aşağıdaki panellerden detaylı durum raporlarına erişebilirsiniz.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam Varlık"
                    value={stats.totalAssets}
                    icon="fa-plane"
                    color="sky"
                    onClick={() => navigate('/admin/assets')}
                />
                <StatCard
                    title="Personel Sayısı"
                    value={stats.activeUsers}
                    icon="fa-users"
                    color="indigo"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Aktif Görev"
                    value={stats.activeTasks}
                    icon="fa-list-check"
                    color="amber"
                    onClick={() => navigate('/tasks')}
                />
                <StatCard
                    title="Sistem Durumu"
                    value={stats.status}
                    icon="fa-server"
                    color="emerald"
                    onClick={() => navigate('/admin/system')}
                />
            </div>

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e293b]/30 border border-slate-800 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-bolt text-amber-500"></i>
                        Son Aktiviteler
                    </h3>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-800/50 rounded transition-colors">
                                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                <span className="text-slate-400">03:3{i}:00</span>
                                <span className="text-slate-300">Sistem otomatik tarama tamamlandı.</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#1e293b]/30 border border-slate-800 rounded-lg p-6 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                        <i className="fa-solid fa-satellite-dish text-2xl text-slate-500"></i>
                    </div>
                    <h3 className="text-white font-bold mb-2">Canlı Telemetri Akışı</h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Sahadaki birimlerden anlık veri akışı normal seviyede.
                    </p>
                    <button
                        onClick={() => navigate('/telemetry')}
                        className="px-4 py-2 bg-sky-600/20 text-sky-400 border border-sky-500/50 rounded hover:bg-sky-600/40 transition-colors text-sm font-bold"
                    >
                        CANLI İZLE
                    </button>
                </div>
            </div>
        </div>
    );
}
