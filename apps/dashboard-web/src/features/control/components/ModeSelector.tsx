type Mode = 'MANUEL' | 'YARI OTOMATİK' | 'TAM OTOMATİK';

interface ModeSelectorProps {
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modeDescriptions: Record<Mode, string> = {
  'MANUEL': 'Operatör kontrolünde',
  'YARI OTOMATİK': 'AI destekli',
  'TAM OTOMATİK': 'Tam otomasyon',
};

export function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  // Can add icons for each mode
  const getIcon = (mode: Mode) => {
    switch (mode) {
      case 'MANUEL': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" /></svg>
      );
      case 'YARI OTOMATİK': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      );
      case 'TAM OTOMATİK': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
      );
    }
  };

  const modes: Mode[] = ['MANUEL', 'YARI OTOMATİK', 'TAM OTOMATİK'];

  return (
    <div className="space-y-2">
      {modes.map((mode) => {
        const isActive = selectedMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`w-full p-3 rounded-xl flex items-start gap-3 transition-all duration-300 border text-left group
              ${isActive
                ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/20 border-sky-500/50 shadow-[0_0_12px_rgba(14,165,233,0.3)]'
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'}
            `}
          >
            <div className={`mt-0.5 p-1.5 rounded-lg ${isActive ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-700/50 text-slate-500 group-hover:text-slate-400'}`}>
              {getIcon(mode)}
            </div>
            <div>
              <div className={`text-xs font-bold leading-none mb-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {mode}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                {modeDescriptions[mode]}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


