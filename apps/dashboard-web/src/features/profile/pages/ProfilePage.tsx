export function ProfilePage() {
    const commander = {
        name: "EMİRHAN",
        surname: "YILMAZ",
        rank: "YÜZBAŞI",
        role: "OPERASYONEL KOMUTAN",
        unit: "1. TAKTİK İHA FİLOSU",
        activeSince: "2018",
    };

    const responsibleUnits = [
        { id: "UAV-01", name: "HS-01", type: "UAV", status: "ONLINE" },
        { id: "UAV-02", name: "HS-02", type: "UAV", status: "ONLINE" },
        { id: "SOL-01", name: "PİYADE TİMİ A", type: "SOLDIER", status: "ONLINE" },
        { id: "SOL-02", name: "PİYADE TİMİ B", type: "SOLDIER", status: "WARNING" },
        { id: "VEH-01", name: "KİRPİ-01", type: "GROUND_VEHICLE", status: "ONLINE" },
    ];

    const activeOperations = [
        { id: "OP-2024-A", name: "PENÇE-KİLİT DESTEK", region: "KUZEY IRAK", status: "ONGOING" },
        { id: "OP-2024-B", name: "SINIR GÜVENLİĞİ", region: "HATAY", status: "ONGOING" },
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Identity Card */}
                <div className="bg-[#0f172a]/95 border border-slate-700/50 p-8 relative overflow-hidden shadow-2xl group min-h-[250px] flex items-center">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-900/10 to-transparent"></div>

                    <div className="flex items-center gap-10 relative z-10 w-full">
                        {/* Photo Placeholder - Clean Box */}
                        <div className="w-48 h-48 bg-slate-800 border-2 border-sky-500/30 flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg">
                            <div className="text-center">
                                <i className="fa-solid fa-user-astronaut text-6xl text-slate-600 mb-2"></i>
                            </div>
                            <div className="absolute bottom-0 w-full bg-sky-900/80 py-1 text-center text-[10px] font-bold text-white tracking-widest uppercase">
                                TR-AF-2491
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">{commander.rank}</span>
                                <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    AKTİF GÖREVDE
                                </span>
                            </div>

                            <div>
                                <h1 className="text-5xl font-black text-white tracking-wider font-sans italic uppercase leading-none mb-1">
                                    {commander.name} <span className="text-sky-500">{commander.surname}</span>
                                </h1>
                                <div className="text-lg text-slate-400 font-bold tracking-[0.3em] uppercase">
                                    {commander.role}
                                </div>
                            </div>

                            <div className="pt-6 mt-4 border-t border-slate-700/50">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">BAĞLI BİRLİK</div>
                                <div className="text-base font-bold text-slate-200 uppercase tracking-wider">{commander.unit}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Units & Operations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Responsible Units */}
                    <div className="lg:col-span-2 bg-[#0f172a]/80 border border-slate-700/50 p-6 relative">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-2">
                            <div className="w-1 h-5 bg-sky-500"></div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] font-sans italic">EMRİNDEKİ BİRLİKLER</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {responsibleUnits.map(unit => (
                                <div key={unit.id} className="bg-slate-800/30 border border-slate-700/50 p-4 flex items-center justify-between group hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-sm flex items-center justify-center border ${unit.type === 'UAV' ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' : unit.type === 'SOLDIER' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                                            <i className={`fa-solid ${unit.type === 'UAV' ? 'fa-plane' : unit.type === 'SOLDIER' ? 'fa-person-rifle' : 'fa-truck-pickup'}`}></i>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">{unit.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-widest">{unit.id}</div>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${unit.status === 'ONLINE' ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'}`}>
                                        {unit.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Operations - Simplified */}
                    <div className="bg-[#0f172a]/80 border border-slate-700/50 p-6 relative">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-700/50 pb-2">
                            <div className="w-1 h-5 bg-amber-500"></div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-[0.2em] font-sans italic">AKTİF OPERASYONLAR</h2>
                        </div>

                        <div className="space-y-2">
                            {activeOperations.map(op => (
                                <div key={op.id} className="bg-slate-800/20 border-l-2 border-amber-500 p-3 hover:bg-slate-800/40 transition-colors">
                                    <div className="text-sm font-bold text-white uppercase tracking-wider">{op.name}</div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{op.region}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
