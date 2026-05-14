import { useEffect, useState } from 'react';
import { fetchProfile, type ProfileResponse, type ProfileResponsibleUnit } from '@/services/api';

interface ProfilePageProps {
    onOpenProfile?: (id: string) => void;
}

const REFRESH_INTERVAL_MS = 30_000;

export function ProfilePage({ onOpenProfile }: ProfilePageProps) {
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async (showSpinner: boolean) => {
            if (showSpinner) setLoading(true);
            try {
                const data = await fetchProfile();
                if (cancelled) return;
                setProfile(data);
                setError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[ProfilePage] Failed to fetch profile', err);
                setError('Profil bilgileri yüklenemedi. Backend bağlantısını kontrol edin.');
            } finally {
                if (!cancelled && showSpinner) setLoading(false);
            }
        };

        load(true);
        const interval = window.setInterval(() => load(false), REFRESH_INTERVAL_MS);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    if (loading && !profile) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-900/80 text-slate-300 font-sans">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-circle-notch animate-spin text-sky-400 text-xl"></i>
                    <span className="text-sm tracking-widest uppercase">Profil verisi yükleniyor…</span>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-900/80 text-slate-300 font-sans p-8">
                <div className="max-w-md text-center space-y-3 border border-rose-500/40 bg-rose-500/10 p-6">
                    <i className="fa-solid fa-triangle-exclamation text-rose-400 text-3xl"></i>
                    <div className="text-sm font-bold uppercase tracking-widest text-rose-300">Bağlantı Hatası</div>
                    <p className="text-sm text-slate-300">{error}</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const { commander, responsibleUnits, activeOperations } = profile;

    return (
        <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Identity Card */}
                <div className="bg-[#0f172a]/95 border border-slate-700/50 p-8 relative overflow-hidden shadow-2xl group min-h-[250px] flex items-center">
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-900/10 to-transparent"></div>

                    <div className="flex items-center gap-10 relative z-10 w-full">
                        <div className="w-48 h-48 bg-slate-800 border-2 border-sky-500/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg">
                            <div className="text-center">
                                <i className="fa-solid fa-user-astronaut text-6xl text-slate-600 mb-2"></i>
                            </div>
                            <div className="absolute bottom-0 w-full bg-sky-900/80 py-1 text-center text-[10px] font-bold text-white tracking-widest uppercase">
                                {commander.serviceTag}
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
                                    {commander.rank}
                                </span>
                                <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    AKTİF GÖREVDE
                                </span>
                                <span className="text-slate-400 text-[10px] font-mono tracking-widest uppercase border border-slate-700 px-2 py-0.5">
                                    @{commander.username}
                                </span>
                            </div>

                            <div>
                                <h1 className="text-5xl font-black text-white tracking-wider font-sans italic uppercase leading-none mb-1">
                                    {commander.firstName} <span className="text-sky-500">{commander.lastName}</span>
                                </h1>
                                <div className="text-lg text-slate-400 font-bold tracking-[0.3em] uppercase">
                                    {commander.roleLabel}
                                </div>
                            </div>

                            <div className="pt-6 mt-4 border-t border-slate-700/50">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">BAĞLI BİRLİK</div>
                                <div className="text-base font-bold text-slate-200 uppercase tracking-wider">{commander.unitName}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Responsible Units */}
                    <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-700/50 p-6 relative">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-sky-500"></div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] font-sans italic">EMRİNDEKİ BİRLİKLER</h2>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 tracking-widest">
                                {responsibleUnits.length} BİRİM
                            </span>
                        </div>

                        {responsibleUnits.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">
                                <i className="fa-solid fa-folder-open text-2xl mb-2 block"></i>
                                Bu kullanıcıya atanmış birlik bulunmuyor.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {responsibleUnits.map(unit => (
                                    <UnitCard
                                        key={unit.id}
                                        unit={unit}
                                        onClick={() => onOpenProfile?.(unit.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Operations */}
                    <div className="bg-[#0f172a]/80 border border-slate-700/50 p-6 relative">
                        <div className="flex items-center justify-between mb-6 border-b border-slate-700/50 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-5 bg-amber-500"></div>
                                <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] font-sans italic">AKTİF OPERASYONLAR</h2>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 tracking-widest">
                                {activeOperations.length}
                            </span>
                        </div>

                        {activeOperations.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">
                                <i className="fa-solid fa-flag text-2xl mb-2 block"></i>
                                Aktif operasyon yok.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeOperations.map(op => (
                                    <div key={op.id} className="bg-slate-800/20 border-l-2 border-amber-500 p-3 hover:bg-slate-800/40 transition-colors">
                                        <div className="text-sm font-bold text-white uppercase tracking-wider">{op.name}</div>
                                        <div className="flex items-center justify-between mt-1">
                                            <div className="text-xs text-slate-400 font-mono">
                                                {op.region ?? '—'}
                                            </div>
                                            <div className="text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                                                {op.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

interface UnitCardProps {
    unit: ProfileResponsibleUnit;
    onClick: () => void;
}

function UnitCard({ unit, onClick }: UnitCardProps) {
    const palette = typePalette(unit.type);
    const statusClass =
        unit.status === 'WARNING'
            ? 'border-amber-500/30 text-amber-400'
            : unit.status === 'OFFLINE'
                ? 'border-rose-500/30 text-rose-400'
                : 'border-emerald-500/30 text-emerald-400';

    return (
        <div
            onClick={onClick}
            className="bg-slate-800/30 border border-slate-700/50 p-4 flex items-center justify-between group hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${palette.border} ${palette.bg} ${palette.text}`}>
                    <i className={`fa-solid ${palette.icon}`}></i>
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-200 uppercase tracking-wider group-hover:text-sky-400 transition-colors">{unit.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-widest">{unit.id}</div>
                </div>
            </div>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${statusClass}`}>
                {unit.status}
            </div>
        </div>
    );
}

function typePalette(type: string) {
    switch (type) {
        case 'UAV':
            return { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400', icon: 'fa-plane' };
        case 'SOLDIER':
            return { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'fa-person-rifle' };
        case 'GROUND_VEHICLE':
            return { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'fa-truck-pickup' };
        case 'SHIP':
            return { border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', text: 'text-cyan-400', icon: 'fa-ship' };
        case 'SENSOR':
            return { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'fa-satellite-dish' };
        case 'EW':
            return { border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', icon: 'fa-tower-broadcast' };
        default:
            return { border: 'border-slate-500/30', bg: 'bg-slate-500/10', text: 'text-slate-300', icon: 'fa-circle-question' };
    }
}
