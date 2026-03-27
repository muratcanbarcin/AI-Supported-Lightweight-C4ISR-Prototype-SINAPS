import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTasks, fetchAllSystemLogs } from '@/services/api';
import type { TaskDTO, SystemLogDTO } from '@/services/api';

type Tab = 'GÖREVLER' | 'LOGLAR';

const POLL_MS = 8_000;

// ─── Task status styling ─────────────────────────────────────────────
const TASK_STATUS: Record<string, { color: string; label: string; icon: string }> = {
  IN_PROGRESS: { color: '#fbbf24', label: 'DEVAM EDİYOR', icon: 'fa-spinner fa-spin' },
  PENDING:     { color: '#94a3b8', label: 'BEKLEMEDE',     icon: 'fa-clock' },
  COMPLETED:   { color: '#4ade80', label: 'TAMAMLANDI',    icon: 'fa-circle-check' },
  CANCELLED:   { color: '#64748b', label: 'İPTAL',         icon: 'fa-ban' },
};

const TASK_TYPE_ICON: Record<string, string> = {
  DEPLOYMENT: 'fa-location-arrow',
  RTB:        'fa-house-flag',
};

// ─── Log event type styling ──────────────────────────────────────────
function getLogStyle(eventType: string): { border: string; text: string; icon: string } {
  const et = eventType?.toUpperCase() || '';
  if (et.includes('ARRIVAL'))     return { border: 'border-l-emerald-500', text: 'text-emerald-300', icon: 'fa-flag-checkered' };
  if (et.includes('RTB'))         return { border: 'border-l-blue-500',    text: 'text-blue-300',    icon: 'fa-house-flag' };
  if (et.includes('EMERGENCY'))   return { border: 'border-l-red-500',     text: 'text-red-300',     icon: 'fa-triangle-exclamation' };
  if (et.includes('WARN'))        return { border: 'border-l-amber-500',   text: 'text-amber-300',   icon: 'fa-circle-exclamation' };
  return { border: 'border-l-slate-600', text: 'text-slate-300', icon: 'fa-circle-info' };
}

function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return ''; }
}

function formatTimeAgo(iso: string): string {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}sn`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}dk`;
    const hr = Math.floor(min / 60);
    return `${hr}sa`;
  } catch { return ''; }
}

// ─── Corner Brackets ─────────────────────────────────────────────────
const CornerBrackets = () => (
  <>
    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-sky-400/60" />
    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-sky-400/60" />
    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-sky-400/60" />
    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-sky-400/60" />
  </>
);

// ═════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════

export function RightControlPanel() {
  const [currentTime, setCurrentTime] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('GÖREVLER');

  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [logs, setLogs] = useState<SystemLogDTO[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  // Clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Data fetchers
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    try { setTasks(await fetchTasks()); } catch (e) { console.warn('[RCP] tasks fail', e); }
    finally { setLoadingTasks(false); }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try { setLogs(await fetchAllSystemLogs()); } catch (e) { console.warn('[RCP] logs fail', e); }
    finally { setLoadingLogs(false); }
  }, []);

  // Load + poll when open
  useEffect(() => {
    if (!isOpen) return;
    loadTasks();
    loadLogs();
    pollRef.current = setInterval(() => {
      loadTasks();
      loadLogs();
    }, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, loadTasks, loadLogs]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsOpen(true);
  };

  // Derived counts
  const activeTasks = tasks.filter(t => t.status === 'IN_PROGRESS');

  return (
    <aside
      className={`
        bg-[#0f172a]/95 border-l border-slate-700/50 flex flex-col overflow-hidden z-40
        shadow-2xl pointer-events-auto h-full font-sans transition-all duration-300 relative
        ${isOpen ? 'w-[340px] pt-16' : 'w-16 pt-20'}
      `}
    >
      {/* Collapse toggle */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2
            bg-sky-600 text-white rounded-full p-1 shadow-lg hover:bg-sky-500
            transition-colors z-50 border border-sky-400/50 w-6 h-6
            flex items-center justify-center"
          aria-label="Paneli Kapat"
        >
          <i className="fa-solid fa-chevron-right text-[10px]" />
        </button>
      )}

      {/* ══ OPEN STATE ══ */}
      <div className={`flex flex-col h-full w-full ${!isOpen ? 'hidden' : ''}`}>

        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 shrink-0">
          {(['GÖREVLER', 'LOGLAR'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold tracking-widest relative transition-all
                ${activeTab === tab
                  ? 'text-sky-400 bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                }`}
            >
              {tab === 'GÖREVLER' ? 'AKTİF GÖREVLER' : 'LOGLAR'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500
                  shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── TAB: AKTİF GÖREVLER ── */}
          {activeTab === 'GÖREVLER' && (
            <div className="flex flex-col h-full">
              {/* Summary bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                  {activeTasks.length} aktif görev
                </span>
                {loadingTasks && (
                  <i className="fa-solid fa-circle-notch fa-spin text-[9px] text-sky-500" />
                )}
              </div>

              {/* Tasks list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-600">
                    <i className="fa-solid fa-clipboard-list text-2xl mb-2" />
                    <span className="text-[10px]">Henüz görev kaydı yok</span>
                  </div>
                ) : (
                  tasks.slice(0, 50).map((task) => {
                    const si = TASK_STATUS[task.status] || TASK_STATUS.PENDING;
                    const typeIcon = TASK_TYPE_ICON[task.taskType || ''] || 'fa-tasks';

                    return (
                      <div key={task.id} className="relative bg-slate-800/40 border border-slate-700/40 p-3 rounded-lg">
                        <CornerBrackets />
                        {/* Header row */}
                        <div className="flex items-start gap-2 mb-1.5">
                          <div className="w-6 h-6 rounded flex items-center justify-center flex-none mt-0.5"
                               style={{ background: `${si.color}18`, border: `1px solid ${si.color}30` }}>
                            <i className={`fa-solid ${typeIcon} text-[9px]`} style={{ color: si.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                              {task.title}
                            </h3>
                            {task.assetId && (
                              <span className="text-[9px] font-mono text-sky-400/70">{task.assetId}</span>
                            )}
                          </div>
                          <span className="flex-none flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded"
                                style={{ color: si.color, background: `${si.color}15` }}>
                            <i className={`fa-solid ${si.icon}`} style={{ fontSize: '7px' }} />
                            {si.label}
                          </span>
                        </div>

                        {/* Details row */}
                        <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono">
                          {task.zoneName && (
                            <span className="truncate">
                              <i className="fa-solid fa-location-dot mr-1" />
                              {task.zoneName}
                            </span>
                          )}
                          <span className="ml-auto flex-none">
                            {formatTimeAgo(task.createdAt)} önce
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── TAB: LOGLAR (Real System Logs) ── */}
          {activeTab === 'LOGLAR' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest">
                  {logs.length} kayıt
                </span>
                {loadingLogs && (
                  <i className="fa-solid fa-circle-notch fa-spin text-[9px] text-sky-500" />
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-600">
                    <i className="fa-solid fa-scroll text-2xl mb-2" />
                    <span className="text-[10px]">Henüz sistem logu yok</span>
                  </div>
                ) : (
                  logs.slice(0, 100).map((log) => {
                    const style = getLogStyle(log.eventType);
                    return (
                      <div
                        key={log.id}
                        className={`bg-slate-800/30 p-2.5 border-l-2 ${style.border}
                          border-t border-r border-b border-slate-700/30 rounded-r`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <i className={`fa-solid ${style.icon} text-[8px]`}
                               style={{ color: style.border.includes('emerald') ? '#34d399'
                                 : style.border.includes('blue') ? '#60a5fa'
                                 : style.border.includes('red') ? '#f87171'
                                 : style.border.includes('amber') ? '#fbbf24'
                                 : '#64748b' }} />
                            <span className="text-[10px] font-mono text-slate-500">
                              [{formatTime(log.createdAt)}]
                            </span>
                          </div>
                          {log.assetId && (
                            <span className="text-[9px] font-mono font-bold text-sky-400/60">
                              {log.assetId}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-medium leading-snug ${style.text}`}>
                          {log.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">
                            {log.eventType}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {logs.length > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-[9px] text-emerald-500/50 animate-pulse tracking-widest">
                      CANLI VERİ AKIŞI...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom status bar */}
        <div className="flex-none border-t border-slate-700/50 p-3">
          <div className="bg-[#0f172a] border border-slate-700/50 p-3 relative">
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider">LINK</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1">BAĞLANTI DURUMU</div>
            <div className="text-lg font-bold text-emerald-400 tracking-wider font-mono">NORMAL</div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-2 mt-2">
              <div>
                <div className="text-[8px] text-slate-600 uppercase tracking-widest">SYSTEM TIME</div>
                <div className="text-[11px] font-mono text-sky-400 mt-0.5">{currentTime}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-slate-600 uppercase tracking-widest">GÖREV</div>
                <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                  {activeTasks.length} aktif
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MINIMIZED STATE ══ */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-6 w-full h-full pt-6">
          <button
            onClick={() => handleTabClick('GÖREVLER')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50
              text-slate-400 hover:text-sky-400 hover:bg-sky-900/20 hover:border
              border-transparent hover:border-sky-500/50 transition-all group relative"
            title="Aktif Görevler"
          >
            <i className="fa-solid fa-list-check text-lg" />
            {activeTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500
                text-[8px] font-bold text-white flex items-center justify-center">
                {activeTasks.length}
              </span>
            )}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button
            onClick={() => handleTabClick('LOGLAR')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800/50
              text-slate-400 hover:text-sky-400 hover:bg-sky-900/20 hover:border
              border-transparent hover:border-sky-500/50 transition-all group relative"
            title="Sistem Logları"
          >
            <i className="fa-solid fa-scroll text-lg" />
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500
              opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="mt-auto mb-6 flex flex-col items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      )}
    </aside>
  );
}
