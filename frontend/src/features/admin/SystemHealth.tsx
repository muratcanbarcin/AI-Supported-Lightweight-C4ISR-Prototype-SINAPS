import { useState, useEffect } from 'react';
import api from '@/services/api';

interface SystemStatusResponse {
    status: string;
    activeUsers: number;
    totalAssets: number;
    activeTasks: number;
    totalZones: number;
}

interface ServiceStatusResponse {
    backend: string;
    database: string;
    aiService: string;
    mqttBroker: string;
    dockerEngine: string;
    checkedAt: string;
}

interface SystemLogItem {
    id: number;
    assetId: string | null;
    eventType: string | null;
    message: string | null;
    createdAt: string;
}

export function SystemHealth() {
    const [metrics, setMetrics] = useState<SystemStatusResponse>({
        status: 'OFFLINE',
        activeUsers: 0,
        totalAssets: 0,
        activeTasks: 0,
        totalZones: 0
    });
    const [apiLatency, setApiLatency] = useState(0);
    const [services, setServices] = useState<ServiceStatusResponse>({
        backend: 'OFFLINE',
        database: 'OFFLINE',
        aiService: 'OFFLINE',
        mqttBroker: 'OFFLINE',
        dockerEngine: 'UNAVAILABLE',
        checkedAt: new Date().toISOString()
    });
    const [logs, setLogs] = useState<SystemLogItem[]>([]);

    useEffect(() => {
        const checkHealth = async () => {
            const start = Date.now();
            try {
                const [statusRes, servicesRes, logsRes] = await Promise.all([
                    api.get<SystemStatusResponse>('/admin/system-status'),
                    api.get<ServiceStatusResponse>('/admin/service-status'),
                    api.get<SystemLogItem[]>('/system-logs/recent', { params: { limit: 12 } })
                ]);

                setMetrics(statusRes.data);
                setServices(servicesRes.data);
                setLogs(logsRes.data);
                setApiLatency(Date.now() - start);
            } catch (err) {
                setMetrics(prev => ({ ...prev, status: 'OFFLINE' }));
                setApiLatency(0);
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 3000);
        return () => clearInterval(interval);
    }, []);

    const StatusIndicator = ({ status }: { status: string }) => {
        const isGood = status === 'ONLINE';
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
                    {/* API Latency Meter (frontend -> backend round-trip) */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-400">API Gecikme Süresi (Latency)</span>
                            <span className="text-sky-400 font-mono">{apiLatency}ms</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ${apiLatency > 0 && apiLatency < 150 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(apiLatency / 2, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
                            <div className="text-slate-400">Toplam Kullanıcı</div>
                            <div className="text-white font-bold text-lg">{metrics.activeUsers}</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
                            <div className="text-slate-400">Toplam Varlık</div>
                            <div className="text-white font-bold text-lg">{metrics.totalAssets}</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
                            <div className="text-slate-400">Aktif Görev</div>
                            <div className="text-white font-bold text-lg">{metrics.activeTasks}</div>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded p-3">
                            <div className="text-slate-400">Toplam Bölge</div>
                            <div className="text-white font-bold text-lg">{metrics.totalZones}</div>
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
                        <StatusIndicator status={services.database} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-server text-slate-500"></i>
                            <span className="text-slate-300 text-sm">Spring Boot Backend</span>
                        </div>
                        <StatusIndicator status={services.backend} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-brain text-slate-500"></i>
                            <span className="text-slate-300 text-sm">AI Service</span>
                        </div>
                        <StatusIndicator status={services.aiService} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-solid fa-tower-broadcast text-slate-500"></i>
                            <span className="text-slate-300 text-sm">MQTT Broker Akışı</span>
                        </div>
                        <StatusIndicator status={services.mqttBroker} />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-800">
                        <div className="flex items-center gap-3">
                            <i className="fa-brands fa-docker text-slate-500"></i>
                            <span className="text-slate-300 text-sm">Docker Engine</span>
                        </div>
                        <StatusIndicator status={services.dockerEngine} />
                    </div>
                </div>
            </div>

            <div className="col-span-1 lg:col-span-2 bg-black border border-slate-800 rounded-lg p-4 font-mono text-xs h-40 overflow-hidden relative">
                <div className="absolute top-2 right-2 text-slate-600">SYSTEM.LOG</div>
                <div className="space-y-1 text-slate-400">
                    {logs.length > 0 ? logs.map(log => (
                        <p key={log.id}>
                            <span className="text-emerald-500">[{log.eventType || 'INFO'}]</span>{' '}
                            {new Date(log.createdAt).toISOString()} - {log.message || 'Mesaj yok'}
                            {log.assetId ? ` (asset: ${log.assetId})` : ''}
                        </p>
                    )) : (
                        <p><span className="text-slate-500">[INFO]</span> Veritabaninda son sistem logu bulunamadi.</p>
                    )}
                    <p className="animate-pulse">_</p>
                </div>
            </div>
        </div>
    );
}
