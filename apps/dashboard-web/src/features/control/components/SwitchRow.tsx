interface SwitchRowProps {
  label: string;
  isOn: boolean;
  onToggle: () => void;
  onLabel?: string;
  offLabel?: string;
}

export function SwitchRow({ label, isOn, onToggle, onLabel = 'ON', offLabel = 'OFF' }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs font-medium text-slate-300">{label}</span>
      <button
        onClick={onToggle}
        className="flex items-center gap-2.5"
      >
        <div className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
          isOn 
            ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
            : 'bg-slate-600'
        }`}>
          <div className={`absolute w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-md top-0.5 ${
            isOn ? 'left-[26px]' : 'left-0.5'
          }`} />
        </div>
        <span className={`text-[10px] font-semibold w-10 text-right ${
          isOn ? 'text-cyan-400' : 'text-slate-500'
        }`}>
          {isOn ? onLabel : offLabel}
        </span>
      </button>
    </div>
  );
}

