"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Key, Ban, UserCheck, X } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

export function AdminUsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [msg, setMsg] = useState({ text: '', isError: false });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (targetUser: User) => {
        if (targetUser.id === currentUser?.id) {
            Swal.fire('Oops...', 'Anda tidak bisa menonaktifkan akun sendiri', 'warning');
            return;
        }

        const action = targetUser.is_active ? 'nonaktifkan' : 'aktifkan';

        const result = await Swal.fire({
            title: `Apakah Anda yakin ingin men-${action} user ${targetUser.username}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Ya, ${action}`,
            cancelButtonText: 'Batal',
            confirmButtonColor: targetUser.is_active ? '#ef4444' : '#10b981'
        });

        if (!result.isConfirmed) return;

        try {
            await api.patch(`/admin/users/${targetUser.id}/toggle-status`);
            toast.success(`Berhasil me-${action} user ${targetUser.username}`);
            loadUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Gagal me-${action} user`);
        }
    };

    const handleOpenPasswordModal = (targetUser: User) => {
        setMsg({ text: '', isError: false });
        setSelectedUser(targetUser);
        setNewPassword('');
        setPasswordModalOpen(true);
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        if (newPassword.length < 6) {
            toast.warning('Password minimal 6 karakter');
            return;
        }

        try {
            await api.post(`/admin/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
            toast.success('Password berhasil direset');
            setNewPassword('');
            setTimeout(() => setPasswordModalOpen(false), 1500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mereset password');
        }
    };

    return (
        <div className="px-4 pt-6 pb-24">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">Manajemen Pengguna</h1>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {users.map((u, i) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                'bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border',
                                u.is_active ? 'border-gray-100 dark:border-gray-800' : 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10'
                            )}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden flex items-center justify-center text-white text-lg font-bold shrink-0">
                                    {u.avatar ? (
                                        <img src={u.avatar.startsWith('http') || u.avatar.startsWith('blob:') || u.avatar.startsWith('data:') ? u.avatar : `http://localhost:5000${u.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        u.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {u.full_name || u.username}
                                        </h3>
                                        {u.role === 'admin' && (
                                            <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 rounded-md text-[10px] font-semibold">
                                                Admin
                                            </span>
                                        )}
                                        {!u.is_active && (
                                            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 rounded-md text-[10px] font-semibold">
                                                Nonaktif
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                                        {u.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                    u.is_active
                                                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                                                        : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400"
                                                )}
                                            >
                                                {u.is_active ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleOpenPasswordModal(u)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50 transition-colors"
                                        >
                                            <Key className="w-3.5 h-3.5" />
                                            Reset Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Reset Password Modal */}
            <AnimatePresence>
                {passwordModalOpen && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setPasswordModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-24 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Password User</h3>
                                <button onClick={() => setPasswordModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Masukkan password baru untuk pengguna <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedUser.username}</span> ({selectedUser.email}).
                            </p>

                            {msg.text && (
                                <div className={cn("p-3 rounded-lg text-sm mb-4", msg.isError ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                                    {msg.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Password Baru</label>
                                    <input
                                        type="text" // Use text so admin can see what they're typing
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Min 6 karakter"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleResetPassword}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors mt-2"
                                >
                                    Reset Password
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
