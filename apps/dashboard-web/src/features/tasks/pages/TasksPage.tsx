import { useState } from 'react';
import { mockAssets } from '@/services/mockData';

interface Task {
    id: string;
    name: string;
    description: string;
    assignedUnitId: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    createdAt: string;
}

const INITIAL_TASKS: Task[] = [
    {
        id: 'TSK-001',
        name: 'Bölge Keşfi - Kuzey',
        description: 'Kuzey sektöründe şüpheli hareketlilik tespiti için İHA keşfi.',
        assignedUnitId: 'UAV-01',
        status: 'IN_PROGRESS',
        createdAt: '10:45',
    },
    {
        id: 'TSK-002',
        name: 'Mühimmat İkmali',
        description: 'Piyade-01 birliğine mühimmat desteği sağlanması.',
        assignedUnitId: null,
        status: 'PENDING',
        createdAt: '11:20',
    },
];

export function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

    // Form State
    const [taskName, setTaskName] = useState('');
    const [taskDesc, setTaskDesc] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const handleCreateTask = () => {
        if (!taskName || !taskDesc) return;

        const newTask: Task = {
            id: `TSK-${Math.floor(Math.random() * 9000) + 1000}`,
            name: taskName,
            description: taskDesc,
            assignedUnitId: selectedUnit || null,
            status: 'PENDING',
            createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        };

        setTasks([newTask, ...tasks]);

        // Reset form
        setTaskName('');
        setTaskDesc('');
        setSelectedUnit('');
        setActiveTab('LIST');
    };

    const handleAiAssist = () => {
        setIsAiGenerating(true);
        // Simulate AI delay
        setTimeout(() => {
            const aiSuggestions = [
                "Sınır hattı boyunca devriye atılarak olası sızma girişimlerinin tespit edilmesi ve raporlanması.",
                "Belirlenen koordinatlarda şüpheli hareketlilik gözlemlenen bölgenin termal kameralarla taraması.",
                "Dost birliklerin intikali sırasında güvenlik koridoru oluşturulması ve havadan gözetleme desteği.",
                "Kritik mühimmat ve yaşam malzemelerinin ileri hat birliklerine güvenli bir şekilde ulaştırılması."
            ];
            const randomSuggestion = aiSuggestions[Math.floor(Math.random() * aiSuggestions.length)];
            setTaskDesc(randomSuggestion);
            setIsAiGenerating(false);
        }, 1500);
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-900/80 p-8 pt-24 custom-scrollbar font-sans relative">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between border-b border-slate-700/50 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-sky-500"></div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-[0.2em] font-sans italic">GÖREV YÖNETİMİ</h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-800/50 p-1 rounded-sm border border-slate-700">
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'LIST' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            GÖREV LİSTESİ
                        </button>
                        <button
                            onClick={() => setActiveTab('CREATE')}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeTab === 'CREATE' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                            YENİ GÖREV
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-[#0f172a]/95 border border-slate-700/50 shadow-2xl p-6 relative min-h-[500px]">
                    {/* Corner Brackets */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-sky-500"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-sky-500"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-sky-500"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-sky-500"></div>

                    {/* TASK LIST VIEW */}
                    {activeTab === 'LIST' && (
                        <div className="space-y-4">
                            {tasks.map(task => {
                                const assignedAsset = mockAssets.find(a => a.id === task.assignedUnitId);

                                return (
                                    <div key={task.id} className="bg-slate-800/30 border border-slate-700/50 p-4 hover:bg-slate-800/50 transition-colors group relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-sky-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-slate-100 tracking-wider font-sans uppercase">{task.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold tracking-widest border ${task.status === 'IN_PROGRESS' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                                                        task.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                                                            'border-slate-500/30 bg-slate-500/10 text-slate-400'
                                                        }`}>
                                                        {task.status === 'IN_PROGRESS' ? 'SÜRÜYOR' : task.status === 'COMPLETED' ? 'TAMAMLANDI' : 'BEKLİYOR'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 font-sans">{task.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">OLUŞTURULMA</div>
                                                <div className="text-sm font-mono text-slate-300">{task.createdAt}</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-700/30 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ATANAN BİRİM:</span>
                                                {assignedAsset ? (
                                                    <div className="flex items-center gap-2 text-xs font-bold text-sky-400 bg-sky-900/20 px-2 py-1 rounded-sm border border-sky-500/20">
                                                        <i className={`fa-solid ${assignedAsset.type === 'UAV' ? 'fa-plane' : assignedAsset.type === 'SOLDIER' ? 'fa-person-rifle' : 'fa-truck-pickup'}`}></i>
                                                        {assignedAsset.name}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">Atama Bekliyor</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-600 font-mono tracking-widest">{task.id}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* CREATE TASK VIEW */}
                    {activeTab === 'CREATE' && (
                        <div className="max-w-xl mx-auto py-4 font-sans">
                            <div className="space-y-6">

                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">GÖREV ADI</label>
                                    <input
                                        type="text"
                                        value={taskName}
                                        onChange={(e) => setTaskName(e.target.value)}
                                        className="w-full bg-[#0b1120] border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600"
                                        placeholder="Örn: Sınır Güvenliği Devriyesi"
                                    />
                                </div>

                                {/* Description Input */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">AÇIKLAMA</label>
                                    <div className="relative">
                                        <textarea
                                            value={taskDesc}
                                            onChange={(e) => setTaskDesc(e.target.value)}
                                            rows={4}
                                            className="w-full bg-[#0b1120] border border-slate-700 text-slate-200 p-3 text-sm focus:outline-none focus:border-sky-500/50 transition-colors rounded-sm shadow-inner placeholder:text-slate-600 resize-none pb-10"
                                            placeholder="Görev detaylarını ve hedeflerini belirtiniz..."
                                        />
                                        <button
                                            onClick={handleAiAssist}
                                            disabled={isAiGenerating}
                                            className="absolute bottom-2 right-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-[10px] font-bold px-3 py-1.5 border border-purple-500/50 rounded-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {isAiGenerating ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                            AI DESTEĞİ İLE OLUŞTUR
                                        </button>
                                    </div>
                                </div>

                                {/* Assignment Dropdown */}
                                <div>
                                    <label className="block text-xs font-bold text-sky-500 uppercase tracking-widest mb-2">BİRİM ATA (İSTEĞE BAĞLI)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {mockAssets.map(asset => (
                                            <button
                                                key={asset.id}
                                                onClick={() => setSelectedUnit(selectedUnit === asset.id ? '' : asset.id)}
                                                className={`
                                  flex items-center gap-3 p-3 border transition-all rounded-sm text-left
                                  ${selectedUnit === asset.id
                                                        ? 'bg-sky-500/20 border-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                                                        : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700/40'}
                               `}
                                            >
                                                <div className={`w-8 h-8 flex items-center justify-center rounded-sm bg-black/20 text-lg`}>
                                                    <i className={`fa-solid ${asset.type === 'UAV' ? 'fa-plane' : asset.type === 'SOLDIER' ? 'fa-person-rifle' : 'fa-truck-pickup'}`}></i>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold uppercase tracking-wider">{asset.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-mono">{asset.type}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-6 flex items-center justify-end gap-4 border-t border-slate-700/50 mt-8">
                                    <button
                                        onClick={() => setActiveTab('LIST')}
                                        className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
                                    >
                                        İPTAL
                                    </button>
                                    <button
                                        onClick={handleCreateTask}
                                        disabled={!taskName || !taskDesc}
                                        className={`
                            px-8 py-2.5 text-xs font-bold text-white uppercase tracking-widest transition-all shadow-lg flex items-center gap-2
                            ${(!taskName || !taskDesc)
                                                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                                                : 'bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_15px_rgba(14,165,233,0.4)]'}
                         `}
                                    >
                                        <i className="fa-solid fa-plus"></i>
                                        OLUŞTUR
                                    </button>
                                </div>

                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
