import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/admin/dashboard', icon: 'fa-chart-line', label: 'Panel' },
        { path: '/admin/assets', icon: 'fa-layer-group', label: 'Envanter Yönetimi' },
        { path: '/admin/users', icon: 'fa-users-gear', label: 'Personel' },
        { path: '/admin/system', icon: 'fa-server', label: 'Sistem Sağlığı' },
    ];

    return (
        <div className="flex h-screen bg-[#0b1120] text-slate-300 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`
                    relative z-20 bg-[#0f172a]/90 backdrop-blur-xl border-r border-sky-900/30 transition-all duration-300 flex flex-col
                    ${isSidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-center border-b border-sky-900/30">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-shield-halved text-sky-500 text-xl"></i>
                        {isSidebarOpen && (
                            <span className="font-bold text-lg tracking-wider text-white">
                                SINAPS <span className="text-sky-500 text-xs align-top">ADMIN</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all group
                                    ${isActive
                                        ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]'
                                        : 'hover:bg-slate-800/50 hover:text-white text-slate-400'}
                                `}
                            >
                                <div className={`w-8 h-8 flex items-center justify-center rounded bg-slate-800/50 group-hover:bg-sky-900/30 transition-colors ${isActive ? 'bg-sky-900/50 text-sky-300' : ''}`}>
                                    <i className={`fa-solid ${item.icon}`}></i>
                                </div>
                                {isSidebarOpen && (
                                    <span className="font-medium text-sm tracking-wide">{item.label}</span>
                                )}
                                {isActive && isSidebarOpen && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-sky-900/30 space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-sky-900/30 bg-sky-950/10 hover:bg-sky-900/20 text-sky-400 transition-all group
                            ${!isSidebarOpen ? 'justify-center' : ''}
                        `}
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        {isSidebarOpen && <span className="text-sm font-bold">ANA EKRAN</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-900/20 text-red-400 transition-all group
                            ${!isSidebarOpen ? 'justify-center' : ''}
                        `}
                    >
                        <i className="fa-solid fa-power-off"></i>
                        {isSidebarOpen && <span className="text-sm font-bold">OTURUMU KAPAT</span>}
                    </button>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-20 bg-slate-800 border border-slate-600 text-slate-400 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:text-white"
                >
                    <i className={`fa-solid ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-auto bg-[url('/grid-pattern.png')]">
                {/* Top Bar */}
                <header className="h-16 bg-[#0f172a]/80 backdrop-blur-md border-b border-sky-900/20 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            {menuItems.find(m => location.pathname.startsWith(m.path))?.label || 'Genel Bakış'}
                        </h2>
                        <p className="text-[10px] text-sky-500/60 font-mono uppercase tracking-[0.2em]">
                            Güvenli Komuta Ortamı v2.4
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-900/50">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-mono text-emerald-500">SİSTEM ÇEVRİMİÇİ</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
