import { useState } from 'react';
import { StrategicAnalysisPage } from './StrategicAnalysisPage';
import { TacticalAnalysisPage } from './TacticalAnalysisPage';

type AnalysisView = 'strategic' | 'tactical';

export function AnalysisPage() {
    const [activeTab, setActiveTab] = useState<AnalysisView>('strategic');

    return (
        <div className="h-full flex flex-col bg-slate-900 absolute inset-0 pt-16 font-sans">

            {/* Sub-Header / Tab Control */}
            <div className="h-12 bg-slate-950/80 border-b border-slate-700 backdrop-blur-sm flex items-center justify-center gap-2 z-20 shrink-0">
                <button
                    onClick={() => setActiveTab('strategic')}
                    className={`
                    px-6 py-1.5 rounded-sm border transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2
                    ${activeTab === 'strategic'
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-sm'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
                `}
                >
                    <i className="fa-solid fa-chess-rook"></i>
                    STRATEJİK
                </button>

                <div className="w-px h-6 bg-slate-800 mx-2"></div>

                <button
                    onClick={() => setActiveTab('tactical')}
                    className={`
                    px-6 py-1.5 rounded-sm border transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2
                    ${activeTab === 'tactical'
                            ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}
                `}
                >
                    <i className="fa-solid fa-crosshairs"></i>
                    TAKTİKSEL
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'strategic' ? (
                    // We wrap in a div to ensure full height and isolation, resetting padding/margins if needed by the inner pages
                    <div className="absolute inset-0">
                        <StrategicAnalysisPage />
                    </div>
                ) : (
                    <div className="absolute inset-0">
                        <TacticalAnalysisPage />
                    </div>
                )}
            </div>

        </div>
    );
}
