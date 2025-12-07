import { useState } from 'react';
import { ModeSelector } from './components/ModeSelector';
import { SwitchRow } from './components/SwitchRow';

type Mode = 'MANUEL' | 'YARI OTOMATİK' | 'TAM OTOMATİK';

export function RightControlPanel() {
  const [selectedMode, setSelectedMode] = useState<Mode>('TAM OTOMATİK');
  const [edgeOn, setEdgeOn] = useState(true);
  const [isSim, setIsSim] = useState(false);

  const currentTime = new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="w-80 h-full bg-slate-800/95 backdrop-blur-xl border-l border-slate-700/50 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex-1 overflow-y-auto px-5 py-7 space-y-8">
        {/* Çalışma Modu */}
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-5">
            ÇALIŞMA MODU
          </h3>
          <ModeSelector
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
          />
        </div>

        {/* Edge & Senaryo */}
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-5">
            EDGE & SENARYO
          </h3>
          <div className="space-y-4 bg-slate-700/40 backdrop-blur-sm rounded-lg p-4 border border-slate-600/30">
            <SwitchRow
              label="EDGE PROCESSING"
              isOn={edgeOn}
              onToggle={() => setEdgeOn(!edgeOn)}
            />
            <SwitchRow
              label="SİMÜLASYON"
              isOn={isSim}
              onToggle={() => setIsSim(!isSim)}
              onLabel="SIM"
              offLabel="LIVE"
            />
          </div>
          <div className="mt-4 px-4 py-2.5 bg-slate-700/30 rounded-lg border border-slate-600/20">
            <p className="text-[11px] text-slate-300 font-mono">
              EDGE: <span className="text-cyan-400">{edgeOn ? 'ON' : 'OFF'}</span> · 
              MOD: <span className="text-cyan-400">{selectedMode}</span> · 
              DURUM: <span className="text-cyan-400">{isSim ? 'SIM' : 'LIVE'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sistem Durumu */}
      <div className="px-5 py-4 border-t border-slate-700/50 bg-slate-800/60">
        <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em] mb-3">
          SİSTEM DURUMU
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Bağlantı Kalitesi:</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              MÜKEMMEL
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {currentTime}
          </p>
        </div>
      </div>
    </div>
  );
}


