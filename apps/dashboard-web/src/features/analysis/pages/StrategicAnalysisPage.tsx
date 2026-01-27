import { useState } from 'react';

interface AnalysisContext {
    id: string;
    name: string;
    type: 'REGION' | 'OPERATION';
    status: 'SAFE' | 'RISKY' | 'CRITICAL';
    weather: {
        condition: string;
        temp: number;
        windSpeed: number;
        visibility: number;
    };
    details: {
        logistics: number; // percentage
        personnel: number;
        threats: number;
    };
}

const mockContexts: AnalysisContext[] = [
    {
        id: 'reg-01', name: 'KUZEY SEKTÖRÜ', type: 'REGION', status: 'SAFE',
        weather: { condition: 'Açık', temp: 12, windSpeed: 15, visibility: 12 },
        details: { logistics: 95, personnel: 450, threats: 2 }
    },
    {
        id: 'op-alpha', name: 'OP-ALPHA ÖNCÜ', type: 'OPERATION', status: 'RISKY',
        weather: { condition: 'Kum Fırtınası', temp: 34, windSpeed: 45, visibility: 2 },
        details: { logistics: 65, personnel: 120, threats: 8 }
    },
    {
        id: 'reg-02', name: 'DOĞU SINIRI', type: 'REGION', status: 'CRITICAL',
        weather: { condition: 'Yağmurlu', temp: 8, windSpeed: 10, visibility: 8 },
        details: { logistics: 80, personnel: 300, threats: 15 }
    },
];

export function StrategicAnalysisPage() {
    const [selectedContext, setSelectedContext] = useState<AnalysisContext | null>(mockContexts[0]);

    return (
        <div className="h-full overflow-y-auto bg-slate-900/95 p-8 pb-24 custom-scrollbar font-sans relative">
            <div className="max-w-[1800px] mx-auto">

                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-indigo-500/30 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-indigo-500"></div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] font-sans italic leading-none">STRATEJİK ANALİZ</h2>
                            <div className="text-xs text-indigo-400 tracking-widest mt-1">GENEL HAREKAT RESMİ VE BÖLGESEL VERİLER</div>
                        </div>
                    </div>
                </div>

                {/* Top KPI Cards (Refined) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/40 border border-indigo-500/20 p-4 relative group hover:bg-slate-800/60 transition-colors">
                        <i className="fa-solid fa-users absolute top-4 right-4 text-indigo-500/20 text-3xl"></i>
                        <div className="text-[10px] text-indigo-400 uppercase tracking-widest mb-1">AKTİF PERSONEL</div>
                        <div className="text-3xl font-mono text-white font-bold">1,240</div>
                        <div className="text-[10px] text-slate-500">24 Saatlik değişim: <span className="text-emerald-400">+12</span></div>
                    </div>

                    <div className="bg-slate-800/40 border border-emerald-500/20 p-4 relative group hover:bg-slate-800/60 transition-colors">
                        <i className="fa-solid fa-boxes-stacked absolute top-4 right-4 text-emerald-500/20 text-3xl"></i>
                        <div className="text-[10px] text-emerald-500 uppercase tracking-widest mb-1">LOJİSTİK ORANI</div>
                        <div className="text-3xl font-mono text-white font-bold">%88.4</div>
                        <div className="text-[10px] text-slate-500">Tedarik zinciri nominal</div>
                    </div>

                    <div className="bg-slate-800/40 border border-amber-500/20 p-4 relative group hover:bg-slate-800/60 transition-colors">
                        <i className="fa-solid fa-chart-line absolute top-4 right-4 text-amber-500/20 text-3xl"></i>
                        <div className="text-[10px] text-amber-500 uppercase tracking-widest mb-1">BAŞARI ORANI</div>
                        <div className="text-3xl font-mono text-white font-bold">%94.1</div>
                        <div className="text-[10px] text-slate-500">Son 30 operasyon</div>
                    </div>

                    <div className="bg-slate-800/40 border border-rose-500/20 p-4 relative group hover:bg-slate-800/60 transition-colors">
                        <i className="fa-solid fa-triangle-exclamation absolute top-4 right-4 text-rose-500/20 text-3xl"></i>
                        <div className="text-[10px] text-rose-500 uppercase tracking-widest mb-1">KRİTİK TEHDİTLER</div>
                        <div className="text-3xl font-mono text-white font-bold">3</div>
                        <div className="text-[10px] text-slate-500">Acil müdahale gerektirir</div>
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">

                    {/* Left: Context Selector (Regions & Operations) */}
                    <div className="lg:col-span-4 bg-slate-800/20 border border-slate-700/50 flex flex-col">
                        <div className="bg-slate-800/50 p-3 border-b border-slate-700/50 text-xs font-bold text-slate-300 uppercase tracking-wider">
                            <i className="fa-solid fa-map mr-2 text-indigo-400"></i>
                            BÖLGE VE OPERASYON SEÇİMİ
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {mockContexts.map(ctx => (
                                <button
                                    key={ctx.id}
                                    onClick={() => setSelectedContext(ctx)}
                                    className={`
                                w-full text-left p-4 border transition-all relative group
                                ${selectedContext?.id === ctx.id
                                            ? 'bg-indigo-500/10 border-indigo-500/50'
                                            : 'bg-slate-900/40 border-slate-700/30 hover:bg-slate-800'}
                            `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${ctx.type === 'REGION' ? 'bg-slate-700 text-slate-300' : 'bg-sky-900/30 text-sky-400'}`}>
                                            {ctx.type === 'REGION' ? 'BÖLGE' : 'OPERASYON'}
                                        </span>
                                        <span className={`w-2 h-2 rounded-full ${ctx.status === 'SAFE' ? 'bg-emerald-500' : ctx.status === 'RISKY' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                    </div>
                                    <h3 className={`font-bold font-mono text-sm ${selectedContext?.id === ctx.id ? 'text-white' : 'text-slate-400'}`}>
                                        {ctx.name}
                                    </h3>
                                    {selectedContext?.id === ctx.id && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Context Details Panel */}
                    <div className="lg:col-span-8 grid grid-cols-1 gap-4">

                        {/* Top Row: Weather & Logistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Compact Weather */}
                            <div className="md:col-span-1 bg-slate-900/50 border border-slate-700/50 p-4 relative overflow-hidden flex flex-col justify-center">
                                <div className="flex items-center gap-3 mb-2">
                                    <i className="fa-solid fa-cloud-sun text-3xl text-sky-500"></i>
                                    <div>
                                        <div className="text-xs text-sky-500 font-bold uppercase tracking-widest">HAVA DURUMU</div>
                                        <div className="text-lg text-white font-bold leading-none">{selectedContext?.weather.temp}°C {selectedContext?.weather.condition}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono space-x-2">
                                    <span>RÜZ: {selectedContext?.weather.windSpeed} km/s</span>
                                    <span>GÖR: {selectedContext?.weather.visibility} km</span>
                                </div>
                            </div>

                            {/* Compact Logistics */}
                            <div className="md:col-span-2 bg-slate-900/50 border border-slate-700/50 p-4 flex items-center justify-around">
                                <div className="text-center">
                                    <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">KAYNAK</div>
                                    <div className="text-xl text-white font-mono">{selectedContext?.details.personnel} <span className="text-xs text-slate-500">PER</span></div>
                                </div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 mb-1">MÜHİMMAT</div>
                                    <div className="text-emerald-400 font-bold font-mono">%85</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 mb-1">YAKIT</div>
                                    <div className="text-amber-400 font-bold font-mono">%42</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-[10px] text-slate-500 mb-1">SAĞLIK</div>
                                    <div className="text-emerald-400 font-bold font-mono">%98</div>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Threat Analysis & Strategic Moves */}
                        <div className="flex-1 bg-slate-900/50 border border-slate-700/50 p-6 relative flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-sm text-rose-500 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <i className="fa-solid fa-chess-board text-lg"></i>
                                    GENEL STRATEJİK HAMLELER VE TEHDİT ANALİZİ
                                </div>
                                <div className="text-xs bg-rose-900/30 text-rose-400 px-3 py-1 rounded border border-rose-500/30">
                                    {selectedContext?.name} İÇİN ÖNERİLER
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                {/* Card 1: Air Defense Strategy */}
                                <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-sm flex flex-col relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <i className="fa-solid fa-jet-fighter text-6xl"></i>
                                    </div>
                                    <h4 className="text-indigo-400 font-bold text-sm mb-3 uppercase tracking-wider border-b border-indigo-500/20 pb-2">
                                        <i className="fa-solid fa-shield-halved mr-2"></i>
                                        HAVA SAHASI HAKİMİYETİ
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                                        Bölgedeki aktif tarama verileri ışığında, orta ve yüksek irtifa hava savunma sistemlerinin kademeli olarak ileri hatlara kaydırılması önerilmektedir. Düşman İHA aktivitelerine karşı elektronik karıştırma (Jamming) şemsiyesi genişletilmelidir.
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-300 bg-indigo-500/10 p-2 rounded">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        ÖNCELİK SEVİYESİ: YÜKSEK
                                    </div>
                                </div>

                                {/* Card 2: Logistics Security */}
                                <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-sm flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <i className="fa-solid fa-truck-moving text-6xl"></i>
                                    </div>
                                    <h4 className="text-emerald-400 font-bold text-sm mb-3 uppercase tracking-wider border-b border-emerald-500/20 pb-2">
                                        <i className="fa-solid fa-route mr-2"></i>
                                        LOJİSTİK HAT GÜVENLİĞİ
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                                        İkmal konvoylarının güzergah güvenliği için otonom devriye araçlarının (UGV) kullanımı artırılmalı. Ana ikmal yolları üzerindeki kör noktalar için sabit gözetleme balonları veya İHA desteği sağlanmalıdır.
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 p-2 rounded">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        DURUM: STABİL
                                    </div>
                                </div>

                                {/* Card 3: Cyber/Electronic Warfare */}
                                <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-sm flex flex-col relative overflow-hidden group hover:border-amber-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <i className="fa-solid fa-tower-broadcast text-6xl"></i>
                                    </div>
                                    <h4 className="text-amber-400 font-bold text-sm mb-3 uppercase tracking-wider border-b border-amber-500/20 pb-2">
                                        <i className="fa-solid fa-wifi mr-2"></i>
                                        ELEKTRONİK HARP & SİBER
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                                        İletişim ağlarında tespit edilen anormallikler sebebiyle kriptolu kanalların anahtar yenileme periyodu sıklaştırılmalı. Dost unsurların sinyal imzalarını gizlemek için 'Emisyon Kontrolü' (EMCON) tedbirleri uygulanmalıdır.
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-amber-300 bg-amber-500/10 p-2 rounded">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                        AKTİF TEHDİT MEVCUT
                                    </div>
                                </div>

                                {/* Card 4: Reconnaissance Strategy */}
                                <div className="bg-slate-950/50 border border-slate-800 p-5 rounded-sm flex flex-col relative overflow-hidden group hover:border-sky-500/30 transition-all">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <i className="fa-solid fa-eye text-6xl"></i>
                                    </div>
                                    <h4 className="text-sky-400 font-bold text-sm mb-3 uppercase tracking-wider border-b border-sky-500/20 pb-2">
                                        <i className="fa-solid fa-binoculars mr-2"></i>
                                        İSTİHBARAT VE KEŞİF
                                    </h4>
                                    <p className="text-sm text-slate-300 leading-relaxed mb-4 flex-1">
                                        Düşman hareketliliğinin arttığı sektörlerde SİHA destekli derinlemesine keşif uçuşları planlanmalı. Elde edilen anlık görüntüler yapay zeka destekli hedef tespit sistemleri ile analiz edilerek komuta merkezine aktarılmalıdır.
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] font-mono text-sky-300 bg-sky-500/10 p-2 rounded">
                                        <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                        OPERASYONEL
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}
