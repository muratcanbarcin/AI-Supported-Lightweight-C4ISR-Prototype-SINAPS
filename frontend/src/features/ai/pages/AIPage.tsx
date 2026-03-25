import { useState, useRef, useEffect, useCallback } from 'react';
import {
    createChatSession,
    fetchChatSessions,
    fetchSessionMessages,
    sendSessionMessage,
    deleteChatSession,
    type ChatSessionDTO,
    type ChatMessageDTO,
} from '@/services/api';

// ─── Local UI message type (adapts DB ChatMessageDTO for rendering) ──────────
interface UIMessage {
    id: string;
    sender: 'USER' | 'AI';
    text: string;
    timestamp: string;
    citedRule?: string;
}

function formatTime(isoString?: string): string {
    if (!isoString) return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const d = new Date(isoString);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function dbToUI(msg: ChatMessageDTO): UIMessage {
    return {
        id: String(msg.id),
        sender: msg.role === 'user' ? 'USER' : 'AI',
        text: msg.content,
        timestamp: formatTime(msg.createdAt),
        citedRule: msg.citedRule || undefined,
    };
}

// ========================= SIDEBAR COMPONENT =================================

interface SidebarProps {
    sessions: ChatSessionDTO[];
    activeId: number | null;
    onSelect: (id: number) => void;
    onNew: () => void;
    onDelete: (id: number) => void;
    collapsed: boolean;
    onToggle: () => void;
}

function Sidebar({ sessions, activeId, onSelect, onNew, onDelete, collapsed, onToggle }: SidebarProps) {
    return (
        <div
            className={`shrink-0 flex flex-col bg-[#0b1120] border-r border-slate-700/50 transition-all duration-300 ${collapsed ? 'w-14' : 'w-72'
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50 shrink-0">
                {!collapsed && (
                    <span className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">
                        Sohbet Geçmişi
                    </span>
                )}
                <button
                    onClick={onToggle}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-700/50 text-slate-400 transition-colors"
                    title={collapsed ? 'Menüyü Aç' : 'Menüyü Kapat'}
                >
                    <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'} text-xs`}></i>
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-2 shrink-0">
                <button
                    onClick={onNew}
                    className={`w-full flex items-center gap-2 p-2.5 rounded border border-dashed border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/50 transition-all text-sm ${collapsed ? 'justify-center' : ''
                        }`}
                    title="Yeni Sohbet"
                >
                    <i className="fa-solid fa-plus text-xs"></i>
                    {!collapsed && <span className="font-medium">Yeni Sohbet</span>}
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-1">
                {sessions.map((s) => (
                    <div
                        key={s.id}
                        onClick={() => onSelect(s.id)}
                        className={`group flex items-center gap-2 p-2.5 rounded cursor-pointer transition-all text-sm ${s.id === activeId
                            ? 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                            : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                            }`}
                    >
                        <i className="fa-regular fa-comment-dots text-xs shrink-0 opacity-60"></i>
                        {!collapsed && (
                            <>
                                <span className="flex-1 truncate text-[13px]">
                                    {s.title || 'Yeni Sohbet'}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(s.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400 transition-all"
                                    title="Sohbeti Sil"
                                >
                                    <i className="fa-solid fa-trash-can text-[10px]"></i>
                                </button>
                            </>
                        )}
                    </div>
                ))}

                {sessions.length === 0 && !collapsed && (
                    <div className="text-center py-8 text-slate-600 text-xs">
                        <i className="fa-solid fa-inbox text-2xl mb-2 block opacity-40"></i>
                        Henüz sohbet yok
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================ MAIN PAGE ======================================

export function AIPage() {
    // ── State ────────────────────────────────────────────────────
    const [sessions, setSessions] = useState<ChatSessionDTO[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isSendingRef = useRef(false);  // Guards useEffect from clobbering during send

    // ── Scroll to bottom ─────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, scrollToBottom]);

    // ── Load sessions on mount ───────────────────────────────────
    const loadSessions = useCallback(async () => {
        try {
            const data = await fetchChatSessions();
            setSessions(data);
        } catch (err) {
            console.error('[AIPage] Failed to fetch sessions:', err);
        }
    }, []);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // ── Load messages when active session changes ────────────────
    useEffect(() => {
        if (activeSessionId === null) {
            setMessages([]);
            return;
        }

        // Skip re-fetch if we're in the middle of sending
        // (handleSend will reload messages itself after the round-trip)
        if (isSendingRef.current) return;

        let cancelled = false;
        (async () => {
            try {
                const dbMessages = await fetchSessionMessages(activeSessionId);
                if (!cancelled) {
                    setMessages(dbMessages.map(dbToUI));
                }
            } catch (err) {
                console.error('[AIPage] Failed to fetch messages:', err);
                if (!cancelled) setMessages([]);
            }
        })();

        return () => { cancelled = true; };
    }, [activeSessionId]);

    // ── Create new session ───────────────────────────────────────
    const handleNewSession = async () => {
        try {
            const session = await createChatSession();
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setMessages([]);
        } catch (err) {
            console.error('[AIPage] Failed to create session:', err);
        }
    };

    // ── Delete session ───────────────────────────────────────────
    const handleDeleteSession = async (id: number) => {
        try {
            await deleteChatSession(id);
            setSessions((prev) => prev.filter((s) => s.id !== id));
            if (activeSessionId === id) {
                setActiveSessionId(null);
                setMessages([]);
            }
        } catch (err) {
            console.error('[AIPage] Failed to delete session:', err);
        }
    };

    // ── Send message ─────────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        isSendingRef.current = true;  // Prevent useEffect from clobbering

        // Auto-create session if none selected
        let sessionId = activeSessionId;
        if (sessionId === null) {
            try {
                const session = await createChatSession();
                setSessions((prev) => [session, ...prev]);
                setActiveSessionId(session.id);
                sessionId = session.id;
            } catch (err) {
                console.error('[AIPage] Auto-create session failed:', err);
                isSendingRef.current = false;
                return;
            }
        }

        // Optimistic UI: add user message immediately
        const userMsg: UIMessage = {
            id: 'temp-' + Date.now(),
            sender: 'USER',
            text: input,
            timestamp: formatTime(),
        };
        setMessages((prev) => [...prev, userMsg]);
        const query = input;
        setInput('');
        setIsTyping(true);

        try {
            await sendSessionMessage(sessionId, query);

            // Reload ALL messages from DB (single source of truth)
            // This prevents any mismatch between optimistic and real state
            const dbMessages = await fetchSessionMessages(sessionId);
            setMessages(dbMessages.map(dbToUI));

            // Refresh session list to update title & ordering
            loadSessions();
        } catch (err) {
            const errorMsg: UIMessage = {
                id: 'err-' + Date.now(),
                sender: 'AI',
                text: 'Bağlantı hatası. AI servisi şu an yanıt veremiyor. Lütfen daha sonra tekrar deneyin.',
                timestamp: formatTime(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
            isSendingRef.current = false;  // Re-enable useEffect
        }
    };

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="h-full bg-slate-900/80 pt-24 font-sans relative flex">

            {/* ═══ Sidebar ═══ */}
            <Sidebar
                sessions={sessions}
                activeId={activeSessionId}
                onSelect={setActiveSessionId}
                onNew={handleNewSession}
                onDelete={handleDeleteSession}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((c) => !c)}
            />

            {/* ═══ Main Chat Area ═══ */}
            <div className="flex-1 flex flex-col p-6 min-w-0">

                {/* Header */}
                <div className="mb-4 flex items-center gap-3 border-b border-slate-700/50 pb-4 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/50 flex items-center justify-center relative">
                        <i className="fa-solid fa-brain text-sky-400 text-xl"></i>
                        <div className="absolute inset-0 rounded-full border border-sky-500/30 animate-ping opacity-20"></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">YAPAY ZEKA ASİSTANI</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-slate-400 font-mono tracking-wider">ÇEVRİMİÇİ — LLAMA-3.1 + RAG AKTİF</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-[#0f172a]/80 border border-slate-700/50 rounded-lg overflow-hidden flex flex-col relative shadow-2xl backdrop-blur-sm">
                    {/* Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>

                    {/* Messages or Empty State */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {activeSessionId === null && messages.length === 0 ? (
                            /* Empty state — no session selected */
                            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-sky-500/5 border border-sky-500/20 flex items-center justify-center">
                                    <i className="fa-solid fa-satellite-dish text-sky-500/40 text-3xl"></i>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm font-medium mb-1">SINAPS Kurmay Asistanı</p>
                                    <p className="text-slate-600 text-xs max-w-md">
                                        Yeni bir sohbet başlatın veya sol panelden mevcut bir sohbeti seçin.
                                        Taktiksel sorular, doktrin bilgileri ve operasyonel öneriler için hazırım.
                                    </p>
                                </div>
                                <button
                                    onClick={handleNewSession}
                                    className="mt-2 px-5 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 rounded text-sm transition-colors flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                    Yeni Sohbet Başlat
                                </button>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] ${msg.sender === 'USER' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

                                            {/* Sender Name */}
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                                                {msg.sender === 'USER' ? 'KOMUTAN' : 'SINAPS AI'}
                                            </span>

                                            {/* Bubble */}
                                            <div className={`
                                                p-4 rounded-sm text-sm leading-relaxed border
                                                ${msg.sender === 'USER'
                                                    ? 'bg-sky-600/20 border-sky-500/30 text-slate-100 rounded-tr-none'
                                                    : 'bg-slate-800/60 border-slate-700/50 text-slate-200 rounded-tl-none relative'}
                                            `}>
                                                {/* AI Icon Decor */}
                                                {msg.sender === 'AI' && (
                                                    <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center">
                                                        <i className="fa-solid fa-microchip text-sky-500 text-[10px]"></i>
                                                    </div>
                                                )}

                                                {msg.text}

                                                {/* RAG Cited Rule */}
                                                {msg.citedRule && (
                                                    <div className="mt-3 pt-3 border-t border-slate-700/30">
                                                        <blockquote className="text-xs text-slate-400 italic border-l-2 border-sky-500/40 pl-3 leading-relaxed">
                                                            <span className="text-sky-400/70 font-bold not-italic text-[10px] uppercase tracking-wider">Referans Kural:</span>
                                                            <br />
                                                            {msg.citedRule}
                                                        </blockquote>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <span className="text-[10px] text-slate-600 font-mono px-1">{msg.timestamp}</span>
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">SINAPS AI</span>
                                            <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-sm rounded-tl-none flex items-center gap-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono animate-pulse">RAG sorgulanıyor & model yanıt üretiyor...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-900/90 border-t border-slate-700/50 shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Komut veya soru giriniz..."
                                disabled={isTyping}
                                className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600 font-mono disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isTyping || !input.trim()}
                                className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white w-12 flex items-center justify-center rounded-sm transition-colors shadow-lg"
                            >
                                {isTyping ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
