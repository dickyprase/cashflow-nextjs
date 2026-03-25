"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Lock, RefreshCw, User as UserIcon } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Generate avatar URLs from DiceBear API (free, no auth needed)
function generateAvatars(gender: 'male' | 'female', count: number, seed?: number): string[] {
    const style = gender === 'male' ? 'adventurer' : 'adventurer';
    const prefix = gender === 'male' ? 'male' : 'female';
    const baseSeed = seed ?? Math.floor(Math.random() * 10000);
    return Array.from({ length: count }, (_, i) =>
        `https://api.dicebear.com/9.x/${style}/svg?seed=${prefix}${baseSeed + i}`
    );
}

export function ProfileEditModal({ isOpen, onClose }: Props) {
    const { user, updateUser } = useAuth();

    // Profile State
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || '');

    // Avatar grid state
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
    const [avatarSeed, setAvatarSeed] = useState(Math.floor(Math.random() * 10000));

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', isError: false });

    // Generate avatars on mount and when gender/seed changes
    useEffect(() => {
        setAvatarOptions(generateAvatars(gender, 8, avatarSeed));
    }, [gender, avatarSeed]);

    const shuffleAvatars = () => {
        setAvatarSeed(Math.floor(Math.random() * 10000));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMsg({ text: '', isError: false });
        try {
            // Update Profile Info + avatar URL
            await api.put('/auth/profile', { username, email, avatar: selectedAvatar });

            // Fetch updated profile and update AuthContext + localStorage
            const profileRes = await api.get('/auth/profile');
            if (profileRes.data?.data) {
                updateUser(profileRes.data.data);
            }

            setMsg({ text: 'Profil berhasil diperbarui!', isError: false });
            setTimeout(() => {
                onClose();
            }, 1000);

        } catch (err: any) {
            setMsg({ text: err.response?.data?.message || 'Gagal menyimpan profil', isError: true });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword) {
            setMsg({ text: 'Harap isi semua kolom password', isError: true });
            return;
        }

        setLoading(true);
        setMsg({ text: '', isError: false });
        try {
            await api.put('/auth/password', { currentPassword, newPassword });
            setMsg({ text: 'Password berhasil diubah', isError: false });
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            setMsg({ text: err.response?.data?.message || 'Gagal mengubah password', isError: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-32 max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Profil</h3>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex mb-5">
                            <button
                                onClick={() => { setActiveTab('profile'); setMsg({ text: '', isError: false }); }}
                                className={cn(
                                    'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                                    activeTab === 'profile' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'
                                )}
                            >
                                Informasi Profil
                            </button>
                            <button
                                onClick={() => { setActiveTab('password'); setMsg({ text: '', isError: false }); }}
                                className={cn(
                                    'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                                    activeTab === 'password' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'
                                )}
                            >
                                Ubah Password
                            </button>
                        </div>

                        {msg.text && (
                            <div className={cn("p-3 rounded-lg text-sm mb-4", msg.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                                {msg.text}
                            </div>
                        )}

                        {activeTab === 'profile' ? (
                            <div className="space-y-4 text-gray-900 dark:text-gray-100">
                                {/* Avatar Selection */}
                                <div className="flex flex-col items-center mb-2">
                                    {/* Current selected avatar */}
                                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md mb-3">
                                        {selectedAvatar ? (
                                            <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Gender Toggle */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Pilih Avatar</label>
                                        <button
                                            onClick={shuffleAvatars}
                                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            <RefreshCw className="w-3 h-3" /> Acak Lagi
                                        </button>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex mb-3">
                                        <button
                                            onClick={() => setGender('male')}
                                            className={cn(
                                                'flex-1 py-1.5 rounded-md text-xs font-semibold transition-all',
                                                gender === 'male' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'
                                            )}
                                        >
                                            👨 Laki-laki
                                        </button>
                                        <button
                                            onClick={() => setGender('female')}
                                            className={cn(
                                                'flex-1 py-1.5 rounded-md text-xs font-semibold transition-all',
                                                gender === 'female' ? 'bg-white dark:bg-gray-700 shadow-sm text-pink-600' : 'text-gray-500'
                                            )}
                                        >
                                            👩 Perempuan
                                        </button>
                                    </div>

                                    {/* Avatar Grid */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {avatarOptions.map((url, i) => (
                                            <button
                                                key={url}
                                                onClick={() => setSelectedAvatar(url)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl overflow-hidden border-2 transition-all bg-gray-50 dark:bg-gray-800 p-1",
                                                    selectedAvatar === url
                                                        ? "border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800 scale-105"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                                                )}
                                            >
                                                <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-contain" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Nama / Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {loading ? 'Menyimpan...' : 'Simpan Profil'}
                                </motion.button>
                            </div>
                        ) : (
                            <div className="space-y-4 text-gray-900 dark:text-gray-100">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Password Saat Ini</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Password Baru</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSavePassword}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-4 h-4" />
                                    {loading ? 'Menyimpan...' : 'Ubah Password'}
                                </motion.button>
                            </div>
                        )}

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
