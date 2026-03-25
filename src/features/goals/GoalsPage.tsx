"use client";

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Trash2, X, CheckCircle, Edit2, Lock, Unlock, Eye, EyeOff, TrendingUp, TrendingDown, ArrowRight, Calendar } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Goal } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';

export function GoalsPage() {
    const { theme } = useTheme();
    const [goals, setGoals] = useState<(Goal & { is_locked?: boolean })[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [wallets, setWallets] = useState<any[]>([]);
    const deadlineInputRef = useRef<HTMLInputElement>(null);

    // Summary data for hero banner
    const [summary, setSummary] = useState({ totalTarget: 0, totalCurrent: 0, activeCount: 0 });

    const [form, setForm] = useState({
        id: null as number | null,
        name: '',
        target_amount: '',
        deadline: '',
        icon: '🎯',
        color: '#6366f1',
        tracking_method: 'all' as string,
        wallet_ids: [] as number[],
    });

    const [showGoals, setShowGoals] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('cashflow_show_goals');
            return stored !== 'false';
        }
        return true;
    });

    const toggleGoals = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newVal = !showGoals;
        setShowGoals(newVal);
        localStorage.setItem('cashflow_show_goals', newVal.toString());
    };

    const formatCensoredGoals = (amount: number) => {
        if (!showGoals) return 'Rp •••••••';
        return formatCurrency(amount);
    };

    useEffect(() => {
        loadGoals();
        loadWallets();
    }, []);

    const loadGoals = async () => {
        try {
            const res = await api.get('/goals');
            const data = res.data.data || [];
            setGoals(data);

            const activeGoals = data.filter((g: any) => g.status === 'active' && !g.is_locked);
            const totalTarget = activeGoals.reduce((sum: number, g: any) => sum + (Number(g.target_amount) || 0), 0);
            const totalCurrent = activeGoals.reduce((sum: number, g: any) => sum + (Number(g.current_amount) || 0), 0);
            setSummary({ totalTarget, totalCurrent, activeCount: activeGoals.length });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadWallets = async () => {
        try {
            const res = await api.get('/wallets');
            setWallets(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        const rawAmount = form.target_amount.replace(/\D/g, '');
        try {
            if (form.id) {
                await api.put(`/goals/${form.id}`, {
                    name: form.name,
                    target_amount: parseFloat(rawAmount),
                    deadline: form.deadline || undefined,
                    icon: form.icon,
                    color: form.color,
                    tracking_method: form.tracking_method,
                    wallet_ids: form.tracking_method === 'all' ? [] : form.wallet_ids,
                });
            } else {
                await api.post('/goals', {
                    name: form.name,
                    target_amount: parseFloat(rawAmount),
                    deadline: form.deadline || undefined,
                    icon: form.icon,
                    color: form.color,
                    tracking_method: form.tracking_method,
                    wallet_ids: form.tracking_method === 'all' ? [] : form.wallet_ids,
                });
            }
            setShowModal(false);
            resetForm();
            toast.success(form.id ? 'Target berhasil diperbarui' : 'Target berhasil ditambahkan');
            loadGoals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan target');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus target ini?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/goals/${id}`);
            toast.success('Target berhasil dihapus');
            loadGoals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus target');
            console.error(err);
        }
    };

    const handleToggleLock = async (goal: any) => {
        try {
            await api.put(`/goals/${goal.id}/toggle-lock`, {
                is_locked: !goal.is_locked
            });
            toast.success(!goal.is_locked ? 'Lock target berhasil' : 'Unlock target berhasil');
            loadGoals();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Gagal mengubah status lock');
        }
    };

    const handleMarkAchieved = async (id: number) => {
        const result = await Swal.fire({
            title: 'Tandai target ini sebagai terpenuhi?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Ya, tandai!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await api.post(`/goals/${id}/complete`);
            toast.success('Target berhasil ditandai selesai');
            loadGoals();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyelesaikan target');
            console.error(err);
        }
    };

    const openEdit = (goal: any) => {
        setForm({
            id: goal.id,
            name: goal.name,
            target_amount: formatCurrency(goal.target_amount),
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            icon: goal.icon || '🎯',
            color: goal.color || '#6366f1',
            tracking_method: goal.tracking_method,
            wallet_ids: goal.wallet_ids || [],
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({ id: null, name: '', target_amount: '', deadline: '', icon: '🎯', color: '#6366f1', tracking_method: 'all', wallet_ids: [] });
    };

    const goalsProgress = summary.totalTarget > 0 ? Math.min((summary.totalCurrent / summary.totalTarget) * 100, 100) : 0;

    const lockedGoals = goals.filter(g => g.is_locked);
    const unlockedGoals = goals.filter(g => !g.is_locked);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        if (!val) {
            setForm(p => ({ ...p, target_amount: '' }));
            return;
        }
        setForm(p => ({ ...p, target_amount: formatCurrency(parseInt(val, 10)) }));
    };

    return (
        <div className="px-4 pt-6 pb-24">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Goals</h1>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30 shrink-0"
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-[220px] mb-6 rounded-[24px]"
            >
                <div className={cn(
                    "w-full h-full p-6 text-white relative flex flex-col justify-between rounded-[24px]",
                    theme === 'neo-brutalism'
                        ? "bg-[#E0D8FA] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]"
                        : "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 shadow-sm"
                )}>
                    {theme !== 'neo-brutalism' && (
                        <>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                        </>
                    )}

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 opacity-80" />
                                <span className={cn("text-sm", theme === 'neo-brutalism' ? "opacity-100 font-medium text-gray-700" : "opacity-80")}>Target Goals ({summary.activeCount})</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={toggleGoals} className={cn("p-1.5 rounded-full transition-colors z-20 cursor-pointer", theme === 'neo-brutalism' ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20")}>
                                    {showGoals ? <Eye className="w-4 h-4" /> : <EyeOff className={cn("w-4 h-4", theme === 'neo-brutalism' ? "text-gray-500" : "text-white/60")} />}
                                </button>
                            </div>
                        </div>
                        <p className={cn("text-3xl font-bold tabular-nums mb-2", theme === 'neo-brutalism' ? "text-gray-900" : "text-white")}>{formatCensoredGoals(summary.totalTarget)}</p>
                    </div>

                    <div className="relative z-10 mt-auto flex flex-col gap-2">
                        {/* Progress Bar */}
                        <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner border border-black/5">
                            <div
                                className={cn("h-full rounded-full transition-all duration-1000", theme === 'neo-brutalism' ? "bg-gray-900" : "bg-white")}
                                style={{ width: `${goalsProgress}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn("backdrop-blur-sm rounded-2xl p-2.5", theme === 'neo-brutalism' ? "bg-black/5 border border-black/10" : "bg-white/15")}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span className={cn("text-xs", theme === 'neo-brutalism' ? "font-medium text-gray-700" : "opacity-80")}>Terkumpul</span>
                                    </div>
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", theme === 'neo-brutalism' ? "bg-black/10 text-gray-900" : "bg-white/20")}>{goalsProgress.toFixed(0)}%</span>
                                </div>
                                <p className={cn("text-sm font-semibold tabular-nums", theme === 'neo-brutalism' ? "text-gray-900" : "text-white")}>{formatCensoredGoals(summary.totalCurrent)}</p>
                            </div>
                            <div className={cn("backdrop-blur-sm rounded-2xl p-2.5", theme === 'neo-brutalism' ? "bg-black/5 border border-black/10" : "bg-white/15")}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Target className="w-3.5 h-3.5" />
                                    <span className={cn("text-xs", theme === 'neo-brutalism' ? "font-medium text-gray-700" : "opacity-80")}>Kekurangan</span>
                                </div>
                                <p className={cn("text-sm font-semibold tabular-nums", theme === 'neo-brutalism' ? "text-gray-900" : "text-white")}>{formatCensoredGoals(Math.max(0, summary.totalTarget - summary.totalCurrent))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
                </div>
            ) : goals.length > 0 ? (
                <>
                    <div className="space-y-3">
                        {unlockedGoals.map((goal, i) => {
                            const progress = goal.target_amount > 0
                                ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                                : 0;

                            return (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${goal.color}20` }}>
                                                {goal.icon || '🎯'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{goal.name}</p>
                                                {goal.deadline && (
                                                    <p className="text-xs text-gray-400">Target: {formatDate(goal.deadline)}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleToggleLock(goal)} className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <Unlock className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress or Achieved State */}
                                    {goal.status === 'completed' ? (
                                        <div className="mt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 flex items-center justify-center gap-2 border border-green-100 dark:border-green-800">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                                goals terpenuhi pada {goal.completed_at ? formatDate(goal.completed_at, 'EEEE, dd MMMM yyyy') : (goal.updated_at ? formatDate(goal.updated_at, 'EEEE, dd MMMM yyyy') : '')}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-500">{formatCurrency(goal.current_amount)}</span>
                                                    <span className="text-gray-500">{formatCurrency(goal.target_amount)}</span>
                                                </div>
                                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: goal.color || '#6366f1' }}
                                                    />
                                                </div>
                                            </div>

                                            {progress < 100 && progress > 0 && (
                                                <div className="mb-3 mt-1 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-1.5">
                                                    <span className="shrink-0 text-[13px] leading-tight">💡</span>
                                                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-tight block">
                                                        {(() => {
                                                            const createdAt = goal.created_at ? new Date(goal.created_at) : new Date();
                                                            const now = new Date();
                                                            let monthsElapsed = (now.getFullYear() - createdAt.getFullYear()) * 12 + now.getMonth() - createdAt.getMonth();
                                                            const daysElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                                                            if (monthsElapsed === 0) monthsElapsed = Math.max(daysElapsed / 30, 0.5);

                                                            const avgMonthlySaving = goal.current_amount / monthsElapsed;
                                                            if (avgMonthlySaving <= 0) return "Tren tabungan belum terlihat stabil.";

                                                            const monthsLeft = (goal.target_amount - goal.current_amount) / avgMonthlySaving;
                                                            const estDate = new Date();
                                                            estDate.setMonth(estDate.getMonth() + Math.ceil(monthsLeft));

                                                            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                                            return `Berdasarkan tren saat ini, target diprediksi tercapai pada ${monthNames[estDate.getMonth()]} ${estDate.getFullYear()}.`;
                                                        })()}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                {progress >= 100 ? (
                                                    <button
                                                        onClick={() => handleMarkAchieved(goal.id)}
                                                        className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                    >
                                                        Tandai Terpenuhi
                                                    </button>
                                                ) : (
                                                    <span /> // Spacer placeholder
                                                )}
                                                <p className="text-xs font-medium text-right" style={{ color: goal.color || '#6366f1' }}>
                                                    {progress.toFixed(0)}%
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {lockedGoals.length > 0 && (
                        <div className="mt-8 space-y-3">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-1 mb-2">Locked Goals</h3>
                            {lockedGoals.map((goal, i) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white/60 dark:bg-gray-900/60 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between opacity-80 grayscale-[20%]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${goal.color}20` }}>
                                            {goal.icon || '🎯'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{goal.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleToggleLock(goal)} className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                                            <Lock className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <Target className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">Belum ada goals</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-32 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold">{form.id ? 'Edit Target' : 'Tambah Target'}</h3>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Nama Target</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Misal: Dana Darurat"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Target Jumlah</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={form.target_amount}
                                        onChange={handleAmountChange}
                                        placeholder="Rp 0"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 ml-1 mb-1 block">Deadline (Opsional)</label>
                                    <div
                                        className="relative cursor-pointer"
                                        onClick={() => {
                                            try {
                                                deadlineInputRef.current?.showPicker();
                                            } catch {
                                                deadlineInputRef.current?.focus();
                                                deadlineInputRef.current?.click();
                                            }
                                        }}
                                    >
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />

                                        {/* Custom Date Display */}
                                        <div className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-medium pointer-events-none">
                                            {form.deadline ? formatDate(form.deadline, 'EEEE, dd MMMM yyyy') : 'Pilih Tanggal Deadline'}
                                        </div>

                                        {/* Hidden Native Input */}
                                        <input
                                            ref={deadlineInputRef}
                                            type="date"
                                            value={form.deadline}
                                            onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                                            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
                                            tabIndex={-1}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Tracking Wallet</label>
                                    <select
                                        value={form.tracking_method}
                                        onChange={e => setForm(p => ({ ...p, tracking_method: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                    >
                                        <option value="all">Semua Wallet</option>
                                        <option value="single">Pilih Wallet</option>
                                    </select>
                                </div>
                                {form.tracking_method !== 'all' && wallets.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Pilih Wallet</label>
                                        <select
                                            value={form.wallet_ids[0] || ''}
                                            onChange={e => setForm(p => ({ ...p, wallet_ids: [parseInt(e.target.value)] }))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                        >
                                            <option value="">Pilih wallet</option>
                                            {wallets.map(w => (
                                                <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors mt-2"
                                >
                                    Simpan
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
