interface ToggleButtonProps {
  label: string;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
}

export function ToggleButton({ label, icon, isActive, onClick }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
        isActive
          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-5 h-5 flex items-center justify-center text-sm">
            {icon}
          </div>
        )}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`w-8 h-4 rounded-full transition-all relative ${
        isActive ? 'bg-emerald-500' : 'bg-slate-600'
      }`}>
        <div className={`absolute w-3 h-3 rounded-full bg-white transition-all top-0.5 ${
          isActive ? 'left-[18px]' : 'left-0.5'
        }`} />
      </div>
    </button>
  );
}


