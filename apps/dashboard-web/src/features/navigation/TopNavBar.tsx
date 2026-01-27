
export type ActiveView = "map" | "assets" | "alerts" | "tasks" | "ai" | "profile" | "asset-profile" | "telemetry" | "analysis";

interface TopNavBarProps {
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
}

const navItems: Array<{ id: ActiveView; label: string }> = [
  { id: "map", label: "HARİTA" },
  { id: "telemetry", label: "CANLI AKIŞ" },
  { id: "analysis", label: "ANALİZ" },
  { id: "assets", label: "BİRİM DURUMU" },
  { id: "tasks", label: "GÖREVLER" },
  { id: "ai", label: "AI ASİSTAN" },
  { id: "alerts", label: "UYARILAR" },
];

export function TopNavBar({ activeView, onChangeView }: TopNavBarProps) {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 border-b border-tactical-border/30 bg-[#0f172a]/95 backdrop-blur-sm z-50 pointer-events-auto flex items-center justify-between px-6 shadow-sm font-sans">
      {/* Left: Logo */}
      <div className="flex items-center gap-3 w-64">

        <div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase leading-none font-sans italic">SINAPS</h1>
        </div>
      </div>

      {/* Center: Navigation - Technical Tabs */}
      <nav className="flex-1 flex justify-center">
        <ul className="flex items-center gap-1 bg-slate-800/30 p-1 rounded-sm border border-slate-700/30 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onChangeView(item.id)}
                  className={`
                     px-6 py-1.5 text-xs font-bold tracking-widest transition-all rounded-sm uppercase
                     ${isActive
                      ? 'bg-sky-600/90 text-white shadow-sm border border-sky-400/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'}
                   `}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 w-60 justify-end">
        {/* Profile */}
        <button
          onClick={() => onChangeView("profile")}
          className={`w-9 h-9 flex items-center justify-center bg-slate-800/30 border border-slate-700 text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors rounded-sm group ${activeView === 'profile' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : ''}`}
          title="Profil"
        >
          <i className="fa-solid fa-user"></i>
        </button>

        {/* Logout */}
        <button
          onClick={() => window.location.reload()}
          className="w-9 h-9 flex items-center justify-center bg-slate-800/30 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all rounded-sm"
          title="Çıkış Yap"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}
