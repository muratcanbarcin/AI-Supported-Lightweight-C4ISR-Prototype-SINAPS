import { useState, useEffect } from 'react';

type Mode = 'MANUEL' | 'YARI OTOMATİK' | 'TAM OTOMATİK';
type Tab = 'KONTROL' | 'LOGLAR';

// Mock Log Data
const mockLogs = [
  { id: 1, time: '21:48:12', type: 'INFO', message: 'Sistem başlatıldı.' },
  { id: 2, time: '21:49:05', type: 'WARN', message: 'UAV-1 yakıt seviyesi <%20.' },
  { id: 3, time: '21:50:30', type: 'INFO', message: 'Asker-3 A Bölgesine intikal etti.' },
  { id: 4, time: '21:51:15', type: 'SUCCESS', message: 'Görüntü aktarımı stabil.' },
  { id: 5, time: '21:52:00', type: 'INFO', message: 'Birlik 2 pozisyon güncelledi.' },
  { id: 6, time: '21:53:22', type: 'WARN', message: 'Bağlantı gecikmesi >50ms.' },
  { id: 7, time: '21:54:10', type: 'INFO', message: 'Yeni hedef tanımlandı: T-72.' },
];

// Helper for Corner Brackets
const CornerBrackets = () => (
  <>
    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-sky-400/60"></div>
    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-sky-400/60"></div>
    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-sky-400/60"></div>
    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-sky-400/60"></div>
  </>
);

export function RightControlPanel() {
  const [selectedMode, setSelectedMode] = useState<Mode>('TAM OTOMATİK');
  const [currentTime, setCurrentTime] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Default to CLOSED
  const [activeTab, setActiveTab] = useState<Tab>('KONTROL');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    return () => clearInterval(timer);
  }, []);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  return (
    <aside
      className={`
        bg-[#0f172a]/95 border-l border-slate-700/50 flex flex-col overflow-hidden z-40 shadow-2xl pointer-events-auto h-full font-sans transition-all duration-300 relative
        ${isOpen ? 'w-[320px] pt-16' : 'w-16 pt-20'}
      `}
    >
      {/* Collapse Toggle Button (Only visible when Open to close it) */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-sky-600 text-white rounded-full p-1 shadow-lg hover:bg-sky-500 transition-colors z-50 border border-sky-400/50 w-6 h-6 flex items-center justify-center"
          aria-label="Close Panel"
        >
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      )}

      {/* Content Container - Hide when closed */}
      <div className={`flex flex-col h-full w-full ${!isOpen ? 'hidden' : ''}`}>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 shrink-0">
          <button
            onClick={() => setActiveTab('KONTROL')}
            className={`flex-1 py-3 text-xs font-bold tracking-widest relative transition-all ${activeTab === 'KONTROL' ? 'text-sky-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            KONTROL
            {activeTab === 'KONTROL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>}
          </button>
          <button
            onClick={() => setActiveTab('LOGLAR')}
            className={`flex-1 py-3 text-xs font-bold tracking-widest relative transition-all ${activeTab === 'LOGLAR' ? 'text-sky-400 bg-slate-800/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}`}
          >
            LOGLAR
            {activeTab === 'LOGLAR' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

          {/* TAB 1: KONTROL */}
          {activeTab === 'KONTROL' && (
            <div className="flex flex-col gap-4 h-full">
              {/* Work Mode */}
              <section>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-700/50">
                  <div className="w-1 h-3 bg-sky-500"></div>
                  <h2 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] font-sans">ÇALIŞMA MODU</h2>
                </div>

                <div className="flex flex-col gap-2">
                  {['MANUEL', 'YARI OTOMATİK', 'TAM OTOMATİK'].map((mode) => {
                    const isSel = selectedMode === mode;
                    let icon = 'fa-hand-pointer';
                    if (mode === 'YARI OTOMATİK') icon = 'fa-list-ul';
                    if (mode === 'TAM OTOMATİK') icon = 'fa-gear';

                    return (
                      <div
                        key={mode}
                        onClick={() => setSelectedMode(mode as Mode)}
                        className={`
                                    relative p-3 flex items-center gap-3 cursor-pointer transition-all border
                                    ${isSel
                            ? 'bg-sky-900/20 border-sky-500/30'
                            : 'bg-slate-800/10 border-slate-800 hover:bg-slate-800/30 hover:border-slate-700'}
                                  `}
                      >
                        {isSel && <CornerBrackets />}

                        <div className={`w-8 h-8 flex items-center justify-center rounded-sm border ${isSel ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                          <i className={`fa-solid ${icon} ${mode === 'TAM OTOMATİK' && isSel ? 'fa-spin' : ''}`}></i>
                        </div>
                        <div>
                          <h3 className={`text-xs font-bold tracking-wider ${isSel ? 'text-white' : 'text-slate-400'}`}>{mode}</h3>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                            {mode === 'MANUEL' ? 'OPERATOR CONTROL' : mode === 'YARI OTOMATİK' ? 'HYBRID SYSTEM' : 'FULL AUTONOMY'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* System Status (Botton) */}
              <section className="mt-auto">
                <div className="bg-[#0f172a] border border-slate-700/50 p-4 relative shadow-inner">
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">LINK</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse box-shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  </div>

                  <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1">BAĞLANTI DURUMU</div>
                  <div className="text-xl font-bold text-emerald-400 tracking-wider mb-2 font-mono">NORMAL</div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-3">
                    <div>
                      <div className="text-[9px] text-slate-600 uppercase tracking-widest">LATENCY</div>
                      <div className="text-xs font-mono text-slate-300 mt-0.5">12ms <span className="text-emerald-500">▼</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-600 uppercase tracking-widest">SYSTEM TIME</div>
                      <div className="text-xs font-mono text-sky-400 mt-0.5">{currentTime}</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: LOGLAR */}
          {activeTab === 'LOGLAR' && (
            <div className="flex flex-col gap-2 h-full">
              {mockLogs.map((log) => {
                let borderColor = "border-l-2 border-slate-600";
                let textColor = "text-slate-300";
                if (log.type === 'WARN') { borderColor = "border-l-2 border-amber-500"; textColor = "text-amber-300"; }
                if (log.type === 'SUCCESS') { borderColor = "border-l-2 border-emerald-500"; textColor = "text-emerald-300"; }

                return (
                  <div key={log.id} className={`bg-slate-800/30 p-2.5 ${borderColor} border-t border-r border-b border-slate-700/30`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                      <span className={`text-[9px] font-bold ${log.type === 'WARN' ? 'text-amber-500' : 'text-slate-600'}`}>{log.type}</span>
                    </div>
                    <p className={`text-xs font-medium leading-snug ${textColor}`}>
                      {log.message}
                    </p>
                  </div>
                );
              })}
              <div className="mt-2 text-center">
                <span className="text-[9px] text-slate-600 animate-pulse tracking-widest">RECEIVING LIVE FEED...</span>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Clean minimized state view (Menu Icons) */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-6 w-full h-full pt-6">
          {/* Control Icon */}
          <button
            onClick={() => handleTabClick('KONTROL')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50 text-slate-400 hover:text-sky-400 hover:bg-sky-900/20 hover:border border-transparent hover:border-sky-500/50 transition-all group relative"
            title="Sistem Kontrolü"
          >
            <i className="fa-solid fa-sliders text-lg"></i>
            {/* Tooltip-ish indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Logs Icon */}
          <button
            onClick={() => handleTabClick('LOGLAR')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50 text-slate-400 hover:text-sky-400 hover:bg-sky-900/20 hover:border border-transparent hover:border-sky-500/50 transition-all group relative"
            title="Olay Kayıtları"
          >
            <i className="fa-solid fa-list-ul text-lg"></i>
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Status Indicator at bottom */}
          <div className="mt-auto mb-6 flex flex-col items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse box-shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>
        </div>
      )}

    </aside>
  );
}
