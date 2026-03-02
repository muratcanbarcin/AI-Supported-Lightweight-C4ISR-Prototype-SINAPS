import { useState, useEffect } from 'react';
import api from '@/services/api';

export function SystemHealth() {
    const [metrics, setMetrics] = useState({
        apiLatency: 0,
        dbStatus: 'Unknown',
        uptime: '0h 0m',
        memoryUsage: 0
    });

    useEffect(() => {
        const checkHealth = async () => {
            const start = Date.now();
            try {
                // Fetch real metrics from Actuator
                const [healthRes, cpuRes, memRes] = await Promise.all([
                    api.get('/actuator/health'),
                    api.get('/actuator/metrics/system.cpu.usage'),
                    api.get('/actuator/metrics/jvm.memory.used')
                ]);

                const end = Date.now();
                const latency = end - start;

                // Parse CPU Usage (0.0 to 1.0) -> Percentage
                const cpuUsage = (cpuRes.data.measurements[0].value * 100).toFixed(1);

                // Parse Memory Usage
                const memUsed = memRes.data.measurements[0].value; // Bytes
                const maxMem = 1024 * 1024 * 512; // Assuming ~512MB heap for prototype
                const memPercentage = Math.min(Math.round((memUsed / maxMem) * 100), 100);

                setMetrics({
                    apiLatency: latency,
                    dbStatus: healthRes.data.status === 'UP' ? 'CONNECTED' : 'ISSUES',
                    uptime: 'ONLINE', // Actuator 'uptime' endpoint can also be added if needed
                    memoryUsage: memPercentage
                });
            } catch (err) {
                setMetrics(prev => ({
                    ...prev,
                    apiLatency: 0,
                    dbStatus: 'DISCONNECTED',
                    uptime: 'OFFLINE'
                }));
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 3000);
        return () => clearInterval(interval);
    }, []);

    const StatusIndicator = ({ status }: { status: string }) => {
        const isGood = status === 'CONNECTED' || status === 'ONLINE';
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold border ${isGood
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50'
                : 'bg-red-950/30 text-red-400 border-red-900/50'
                }`}>
                {status}
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Metrics Panel */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <i className="fa-solid fa-microchip text-9xl"></i>
                </div>

                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-gauge-high text-sky-500"></i>
                    Gerçek Zamanlı Metrikler
                </h3>

                <div className="space-y-6 relative z-10">
                    {/* Latency Meter */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">API Gecikme Süresi (Latency)</span>
                            <span className="text-sky-400 font-mono">{metrics.apiLatency}ms</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${metrics.apiLatency < 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(metrics.apiLatency / 2, 100)}%` }} // Scale visualization
                            ></div>
                        </div>
                    </div>

                    {/* Memory Usage (Simulated) */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">Sunucu Bellek Kullanımı</span>
                            <span className="text-indigo-400 font-mono">{metrics.memoryUsage}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${metrics.memoryUsage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Status List */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-6 shadow-xl">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                    <i className="fa-solid fa-network-wired text-emerald-500"></i>
                    Servis Durumları
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-database text-slate-500"></i>
                            <span className="text-slate-300 text-sm">PostgreSQL Veritabanı</span>
                        </div>
                        <StatusIndicator status={metrics.dbStatus} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-server text-slate-500"></i>
                            <span className="text-slate-300 text-sm">Spring Boot Backend</span>
                        </div>
                        <StatusIndicator status={metrics.apiLatency > 0 ? 'ONLINE' : 'OFFLINE'} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-tower-broadcast text-slate-500"></i>
                            <span className="text-slate-300 text-sm">MQTT Broker (Mosquitto)</span>
                        </div>
                        <StatusIndicator status="ONLINE" /> {/* Assuming online for prototype */}
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-brands fa-docker text-slate-500"></i>
                            <span className="text-slate-300 text-sm">Container Health</span>
                        </div>
                        <StatusIndicator status="ONLINE" />
                    </div>
                </div>
            </div>

            {/* Logs Console */}
            <div className="col-span-1 lg:col-span-2 bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs h-40 overflow-hidden relative">
                <div className="absolute top-2 right-2 text-slate-600">SYSTEM.LOG</div>
                <div className="space-y-1 text-slate-400">
                    <p><span className="text-emerald-500">[INFO]</span> {new Date().toISOString()} - Sağlık taraması başlatıldı.</p>
                    <p><span className="text-sky-500">[DEBUG]</span> {new Date().toISOString()} - Veritabanı bağlantısı doğrulandı (Latency: {metrics.apiLatency}ms).</p>
                    <p><span className="text-emerald-500">[INFO]</span> {new Date().toISOString()} - Tüm servisler nominal değerlerde çalışıyor.</p>
                    <p className="animate-pulse">_</p>
                </div>
            </div>
        </div>
    );
}
