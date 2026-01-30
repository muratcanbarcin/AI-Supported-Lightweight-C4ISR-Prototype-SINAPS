interface SwitchRowProps {
  label: string;
  isOn: boolean;
  onToggle: () => void;
  onLabel?: string;
  offLabel?: string;
}

export function SwitchRow({ label, isOn, onToggle, onLabel = 'ON', offLabel = 'OFF' }: SwitchRowProps) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs font-medium text-slate-300">{label}</span>}
      <button
        onClick={onToggle}
        className={`relative h-6 w-14 rounded-full transition-all duration-300 flex items-center shadow-inner
          ${isOn ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700'}
        `}
      >
        <div className={`absolute w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300
          ${isOn ? 'translate-x-[34px]' : 'translate-x-[4px]'}
        `} />

        <span className={`absolute w-full text-[9px] font-bold text-center transition-opacity duration-300 ${isOn ? 'opacity-100 text-white pr-4' : 'opacity-0'}`}>
          {onLabel}
        </span>
        <span className={`absolute w-full text-[9px] font-bold text-center transition-opacity duration-300 ${!isOn ? 'opacity-100 text-slate-400 pl-4' : 'opacity-0'}`}>
          {offLabel}
        </span>
      </button>
    </div>
  );
}

