import { useState, useRef, useEffect } from 'react';

interface AlertSuggestion {
    id: string;
    title: string;
    action: string;
}

interface Message {
    id: string;
    sender: 'USER' | 'AI';
    text: string;
    timestamp: string;
    suggestions?: AlertSuggestion[];
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        sender: 'AI',
        text: 'Merhaba Komutanım. SINAPS Yapay Zeka Asistanı hizmetinizde. Bölgesel durum analizi, risk değerlendirmesi veya operasyonel öneriler için bana danışabilirsiniz.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    }
];

export function AIPage() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'USER',
            text: input,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Mock AI Response
        setTimeout(() => {
            let aiText = "Anlaşıldı. Veriler analiz ediliyor...";
            let suggestions: AlertSuggestion[] | undefined;

            if (input.toLowerCase().includes('durum') || input.toLowerCase().includes('rapor')) {
                aiText = "Bölgede şu an 3 aktif devriye ve 2 İHA görevi icra ediliyor. Kuzey sektöründe şüpheli hareketlilik tespiti üzerine alarm seviyesi 'SARI' olarak güncellenmiştir.";
                suggestions = [
                    { id: 's1', title: 'İHA Yönlendir', action: 'Kuzey sektörüne ilave İHA' },
                    { id: 's2', title: 'Devriye Artır', action: 'Sınır hattı devriye sıklığı' }
                ];
            } else if (input.toLowerCase().includes('tehdit')) {
                aiText = "Son 1 saat içinde 2 adet tanımlanamayan sivil araç sınır hattına yaklaşmıştır. Görüntü analizi tehdit unsuru taşımadıklarını öngörmektedir (%85 güven).";
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'AI',
                text: aiText,
                timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                suggestions
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="h-full bg-slate-900/80 p-6 pt-24 custom-scrollbar font-sans relative flex flex-col items-center">
            <div className="w-full max-w-4xl h-full flex flex-col">

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
                            <span className="text-xs text-slate-400 font-mono tracking-wider">ÇEVRİMİÇİ - SİSTEME BAĞLI</span>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-[#0f172a]/80 border border-slate-700/50 rounded-lg overflow-hidden flex flex-col relative shadow-2xl backdrop-blur-sm">
                    {/* Decorative Lines */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/20 to-transparent"></div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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

                                        {/* Suggestions */}
                                        {msg.suggestions && (
                                            <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                                                <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-2">ÖNERİLEN AKSİYONLAR:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.suggestions.map(s => (
                                                        <button key={s.id} className="text-xs bg-sky-900/30 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-400 text-sky-100 px-3 py-1.5 rounded-sm transition-all flex items-center gap-2">
                                                            <i className="fa-solid fa-angle-right text-[10px]"></i>
                                                            {s.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Timestamp */}
                                    <span className="text-[10px] text-slate-600 font-mono px-1">{msg.timestamp}</span>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-sm rounded-tl-none flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-0"></div>
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-150"></div>
                                    <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce delay-300"></div>
                                </div>
                            </div>
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
                                className="flex-1 bg-slate-800/50 border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600 font-mono"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-sky-600 hover:bg-sky-500 text-white w-12 flex items-center justify-center rounded-sm transition-colors shadow-lg"
                            >
                                <i className="fa-solid fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
