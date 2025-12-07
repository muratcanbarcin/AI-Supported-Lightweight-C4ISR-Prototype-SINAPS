export type ActiveView = "map" | "assets" | "alerts";

interface TopNavBarProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
}

const navItems: Array<{ id: ActiveView; icon: string; label: string }> = [
  { id: "map", icon: "🗺️", label: "Harita" },
  { id: "assets", icon: "🚁", label: "Birim Durumu" },
  { id: "alerts", icon: "⚠️", label: "Uyarılar" },
];

export function TopNavBar({ activeView, onChangeView }: TopNavBarProps) {
  return (
    <div className="absolute top-4 left-4 z-[100] flex items-center gap-4">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg px-4 py-2.5 shadow-xl">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-800 shadow-sm" />
        </div>
        <span className="text-base font-bold text-slate-100 tracking-tight">SINAPS</span>
      </div>

      {/* Navigation Bar */}
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl">
        <div className="flex items-center gap-1 p-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`relative px-4 py-2.5 rounded-md flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className={`text-xs font-medium ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

