import { useState, useEffect, useRef } from 'react';

interface TelemetryLog {
    id: string;
    timestamp: string;
    source: string;
    type: 'INFO' | 'WARNING' | 'CRITICAL' | 'DEBUG';
    payload: string;
}

export function TelemetryPage() {
    const [logs, setLogs] = useState<TelemetryLog[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [frequency, setFrequency] = useState(50); // ms delay
    const scrollRef = useRef<HTMLDivElement>(null);

    // High-performance data simulator
    useEffect(() => {
        if (isPaused) return;

        const sources = ['UAV-01', 'UAV-02', 'SAT-L1', 'SAT-L2', 'GND-RADAR-A', 'GND-RADAR-B', 'SOC-01', 'SOC-02'];
        const types: TelemetryLog['type'][] = ['INFO', 'INFO', 'INFO', 'WARNING', 'DEBUG', 'CRITICAL'];
        const payloads = [
            'Position update: 34.234, 29.112',
            'Signal strength: -45dBm',
            'Battery: 98%',
            'Target acquisition lock',
            'Handshake acknowledgment',
            'Encryption key rotation',
            'Thermal anomaly detected',
            'Packet loss detected: 0.01%',
            'Latency spike: 120ms',
            'Heartbeat OK'
        ];

        const interval = setInterval(() => {
            const newLog: TelemetryLog = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                source: sources[Math.floor(Math.random() * sources.length)],
                type: types[Math.floor(Math.random() * types.length)],
                payload: payloads[Math.floor(Math.random() * payloads.length)]
            };

            setLogs(prev => {
                // Keep only last 1000 items for performance (Scalable format demo)
                const updated = [...prev, newLog];
                if (updated.length > 200) {
                    return updated.slice(updated.length - 200);
                }
                return updated;
            });
        }, frequency);

        return () => clearInterval(interval);
    }, [isPaused, frequency]);

    // Auto-scroll
    useEffect(() => {
        if (!isPaused && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isPaused]);

    return (
        <div className="h-full bg-slate-900/90 text-slate-200 font-mono flex flex-col pt-16">
            {/* Header Control Panel */}
            <div className="h-14 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between px-6 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h2 className="text-lg font-bold text-sky-400 tracking-wider">CANLI VERİ AKIŞI</h2>
                    <span className="text-xs text-slate-500 border border-slate-600 px-2 py-0.5 rounded">STREAM_ID: {Math.floor(Math.random() * 1000)}</span>
                    <span className="text-xs text-amber-500 border border-amber-900/30 px-2 py-0.5 rounded bg-amber-500/10">
                        <i className="fa-solid fa-bolt mr-1"></i>
                        YÜKSEK TRAFİK
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">YENİLEME HIZI:</span>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-sky-500"
                        >
                            <option value={500}>Yavaş (2Hz)</option>
                            <option value={100}>Orta (10Hz)</option>
                            <option value={50}>Hızlı (20Hz)</option>
                            <option value={10}>Çok Hızlı (100Hz)</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-4 py-1.5 rounded-sm border ${isPaused ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10' : 'border-amber-500 text-amber-400 hover:bg-amber-500/10'} text-xs font-bold transition-all`}
                    >
                        {isPaused ? <><i className="fa-solid fa-play mr-2"></i>DEVAM ET</> : <><i className="fa-solid fa-pause mr-2"></i>DURDUR</>}
                    </button>
                    <button
                        onClick={() => setLogs([])}
                        className="px-4 py-1.5 rounded-sm border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all"
                    >
                        TEMİZLE
                    </button>
                </div>
            </div>

            {/* Data Stream View */}
            <div ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-xs relative">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900/95 z-10 text-slate-500 text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="py-2 px-4 w-48 border-b border-slate-700">Zaman Damgası</th>
                            <th className="py-2 px-4 w-32 border-b border-slate-700">Kaynak</th>
                            <th className="py-2 px-4 w-24 border-b border-slate-700">Tür</th>
                            <th className="py-2 px-4 border-b border-slate-700">Veri Pakedi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {logs.map((log) => {
                            let typeColor = 'text-slate-300';
                            if (log.type === 'WARNING') typeColor = 'text-amber-400';
                            if (log.type === 'CRITICAL') typeColor = 'text-red-400 font-bold';
                            if (log.type === 'DEBUG') typeColor = 'text-sky-700';
                            if (log.type === 'INFO') typeColor = 'text-sky-300';

                            return (
                                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="py-1 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                                    <td className="py-1 px-4 text-slate-300">{log.source}</td>
                                    <td className={`py-1 px-4 ${typeColor}`}>{log.type}</td>
                                    <td className="py-1 px-4 text-slate-400 font-mono tracking-tight opacity-90">{log.payload}</td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-12 text-center text-slate-600 italic">
                                    Veri akışı bekleniyor...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Auto-scroll anchor */}
                <div className="h-4"></div>
            </div>

            {/* Status Footer */}
            <div className="h-8 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-widest">
                <span>Buffer: {logs.length} / 200 items</span>
                <span>Status: {isPaused ? 'PAUSED' : 'LIVE'}</span>
                <span>Connection: SIMULATED (LOW LATENCY)</span>
            </div>
        </div>
    );
}
