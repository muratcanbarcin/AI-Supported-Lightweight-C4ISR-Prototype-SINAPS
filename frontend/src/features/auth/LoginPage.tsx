import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            await login({ username, password });
            navigate('/', { replace: true });
        } catch (err) {
            console.error('[LoginPage] Authentication error:', err);
            setError('Kimlik doğrulama başarısız. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

            {/* Radar Scanline Animation Background */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-sky-900/20 to-transparent opacity-50"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8">

                {/* Tactical Border Container */}
                <div className="relative bg-[#0b1120]/80 backdrop-blur-xl border border-sky-900/50 p-10 shadow-2xl overflow-hidden">
                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sky-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sky-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sky-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sky-500"></div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-5xl font-black italic text-white tracking-wider mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">SINAPS</h1>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-sky-500/50"></div>
                            <span className="text-xs font-bold text-sky-400 monitoring-text tracking-[0.3em] uppercase">Secure Access Terminal</span>
                            <div className="h-px w-8 bg-sky-500/50"></div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Operator ID</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-sky-300 px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all font-mono tracking-wider placeholder:text-slate-600"
                                    placeholder="ENTER ID..."
                                />
                                <div className="absolute right-3 top-3.5 text-slate-600 group-focus-within:text-sky-500">
                                    <i className="fa-solid fa-user-shield"></i>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest pl-1">Access Key</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-sky-300 px-4 py-3 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 transition-all font-mono tracking-wider placeholder:text-slate-600"
                                    placeholder="••••••••••••"
                                />
                                <div className="absolute right-3 top-3.5 text-slate-600 group-focus-within:text-sky-500">
                                    <i className="fa-solid fa-key"></i>
                                </div>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-950/50 border border-red-500/30 px-4 py-2 flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation text-red-500 text-sm"></i>
                                <span className="text-xs text-red-400 font-mono tracking-wide">{error}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`
                            w-full relative overflow-hidden group bg-sky-600 hover:bg-sky-500 text-white font-bold py-3.5 px-4 transition-all uppercase tracking-[0.2em] text-sm
                            ${isLoading ? 'cursor-not-allowed opacity-80' : ''}
                        `}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        <span>Authenticating...</span>
                                    </div>
                                ) : (
                                    <span className="relative z-10 flex items-center justify-center gap-2 group-hover:gap-4 transition-all">
                                        INITIATE SYSTEM
                                        <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                    </span>
                                )}
                                {/* Button Glow Effect */}
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            </button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest">
                            Restricted Area • C4ISR Protocol v2.4
                        </p>
                        <div className="mt-2 flex justify-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] text-emerald-500/80 font-mono">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
