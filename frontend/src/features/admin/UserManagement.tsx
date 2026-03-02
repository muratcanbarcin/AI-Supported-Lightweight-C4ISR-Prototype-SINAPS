import { useState, useEffect } from 'react';
import api from '@/services/api';

interface User {
    id: number;
    username: string;
    fullName: string;
    rank: string;
    role: 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_COMMANDER';
    active: boolean;
    lastLogin: string;
}

export function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        rank: 'Private',
        role: 'ROLE_USER'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get<User[]>('/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', formData);
            setShowModal(false);
            setFormData({ username: '', password: '', fullName: '', rank: 'Private', role: 'ROLE_USER' });
            fetchUsers();
        } catch (err) {
            console.error('Failed to create user', err);
            alert('Failed to register user');
        }
    };

    const handleDeleteClick = (id: number) => {
        setUserToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete}`);
            fetchUsers();
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err) {
            alert('Kullanıcı silinemedi');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#1e293b]/50 p-4 rounded-lg border border-slate-700/50">
                <div className="flex gap-4">
                    {/* Search placeholder */}
                    <span className="text-slate-500 font-mono text-xs pt-2">PERSONEL VERİTABANI ERİŞİMİ // KISITLI</span>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded text-sm font-bold tracking-wide transition-colors flex items-center gap-2"
                >
                    <i className="fa-solid fa-user-plus"></i>
                    YENİ OPERATÖR
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-3 text-center text-slate-500 py-10">Personel kayıtları yükleniyor...</div>
                ) : users.map(user => (
                    <div key={user.id} className="bg-slate-900/50 border border-slate-700 p-4 rounded-lg flex items-start gap-4 hover:border-sky-500/50 transition-colors group">
                        <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-sky-500 border border-slate-700">
                            <i className="fa-solid fa-user-astronaut text-xl"></i>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{user.fullName || user.username}</h4>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{user.rank}</div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border ${user.role === 'ROLE_ADMIN' ? 'border-amber-500/50 text-amber-500' : 'border-sky-500/50 text-sky-500'
                                    }`}>
                                    {user.role.replace('ROLE_', '')}
                                </span>
                            </div>
                            <div className="mt-3 flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-mono">
                                    ID: {user.username}
                                </span>
                                <button
                                    onClick={() => handleDeleteClick(user.id)}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <i className="fa-solid fa-ban"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-sky-900 w-full max-w-md rounded-lg shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Yeni Personel Yetkilendirme</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Ad Soyad</label>
                                <input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="input-field w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Kullanıcı Adı (Sicil No)</label>
                                    <input required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="input-field w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Rütbe</label>
                                    <input required value={formData.rank} onChange={e => setFormData({ ...formData, rank: e.target.value })} className="input-field w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Başlangıç Şifresi</label>
                                <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="input-field w-full bg-slate-800 border border-slate-600 rounded p-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Sistem Rolü</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white">
                                    <option value="ROLE_USER">OPERATÖR (Standart)</option>
                                    <option value="ROLE_ADMIN">YÖNETİCİ (Tam Erişim)</option>
                                    <option value="ROLE_COMMANDER">KOMUTAN (Sadece Okuma)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
                                <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white px-6 py-2 rounded font-bold">YETKİLENDİR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-red-900/50 w-full max-w-sm rounded-lg shadow-2xl p-6 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center mb-4 border border-red-900/50">
                                <i className="fa-solid fa-user-xmark text-red-500 text-xl"></i>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">Yetkiyi Kaldır</h3>
                            <p className="text-slate-400 text-sm mb-6">
                                Bu kullanıcının sistem erişimini kaldırmak üzeresiniz. Bu işlem sonrası kullanıcı sisteme giriş yapamayacak.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setUserToDelete(null);
                                    }}
                                    className="flex-1 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors font-medium text-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition-colors font-bold text-sm shadow-lg shadow-red-900/20"
                                >
                                    YETKİYİ KALDIR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
