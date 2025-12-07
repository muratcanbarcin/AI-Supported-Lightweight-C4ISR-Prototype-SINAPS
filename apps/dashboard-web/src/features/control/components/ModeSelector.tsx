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
  const modes: Mode[] = ['MANUEL', 'YARI OTOMATİK', 'TAM OTOMATİK'];

  return (
    <div className="space-y-2.5">
      {modes.map((mode) => {
        const isActive = selectedMode === mode;
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`w-full px-4 py-3.5 rounded-lg text-left transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                : 'bg-slate-700/30 text-slate-400 border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/40'
            }`}
          >
            <div className={`text-sm font-semibold ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
              {mode}
            </div>
            {isActive && (
              <div className="text-[10px] text-slate-400 mt-1 font-medium">
                {modeDescriptions[mode]}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}


