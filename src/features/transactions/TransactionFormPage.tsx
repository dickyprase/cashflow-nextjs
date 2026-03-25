"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Trash2, Calendar, Wallet as WalletIcon, FileText, Tag } from 'lucide-react';
import api from '@/services/api';
import { cn, formatDate, formatCurrency, getLocalTodayStr } from '@/lib/utils';
import type { Category, Wallet } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';

export function TransactionFormPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { theme } = useTheme();
    const params = useParams();
    const id = (params as any)?.id;
    const isEdit = !!id;

    const [form, setForm] = useState({
        type: 'expense' as 'income' | 'expense',
        amount: '',
        description: '',
        category_id: '',
        wallet_id: '',
        date: getLocalTodayStr(),
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadOptions();
        if (isEdit) loadTransaction();
    }, []);

    const loadOptions = async () => {
        try {
            const [catRes, walRes] = await Promise.all([
                api.get('/categories'),
                api.get('/wallets'),
            ]);
            setCategories(catRes.data.data || []);
            setWallets(walRes.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadTransaction = async () => {
        try {
            const res = await api.get(`/transactions/${id}`);
            const tx = res.data.data;
            setForm({
                type: tx.type,
                amount: String(tx.amount),
                description: tx.description || '',
                category_id: String(tx.category_id),
                wallet_id: String(tx.wallet_id),
                date: tx.date?.split('T')[0] || '',
            });
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCategories = categories.filter(c => c.type === form.type);

    const quickCategories = filteredCategories.filter(c => ['Makanan', 'Transport', 'Transportasi', 'Jajan', 'Gaji', 'Bonus', 'Freelance'].includes(c.name)).slice(0, 3);
    if (quickCategories.length < 3) {
        const remaining = filteredCategories.filter(c => !quickCategories.includes(c)).slice(0, 3 - quickCategories.length);
        quickCategories.push(...remaining);
    }

    const quickWallets = wallets.filter(w => ['Dompet Utama', 'Tunai', 'Cash', 'BCA', 'Bank', 'Mandiri'].includes(w.name)).slice(0, 3);
    if (quickWallets.length < 3) {
        const remaining = wallets.filter(w => !quickWallets.includes(w)).slice(0, 3 - quickWallets.length);
        quickWallets.push(...remaining);
    }

    // Currency input formatting helpers
    const handleAmountInput = (rawValue: string) => {
        const numericStr = rawValue.replace(/[^0-9]/g, '');
        update('amount', numericStr);
    };

    const formatAmountDisplay = (val: string) => {
        const num = parseInt(val, 10);
        if (!val || isNaN(num) || num === 0) return '';
        return num.toLocaleString('id-ID');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const parsedAmount = parseFloat(form.amount) || 0;
            const payload = {
                ...form,
                amount: parsedAmount,
                category_id: parseInt(form.category_id),
                wallet_id: parseInt(form.wallet_id),
                is_excluded_from_budget: false // Default to false
            };



            // Budget Check only on create and expense type
            if (!isEdit && form.type === 'expense') {
                try {
                    const budgetRes = await api.get('/daily-budget');
                    const budgetData = budgetRes.data.data;

                    if (budgetData?.is_active) {
                        const dailyAllowance = budgetData.debug_info?.dailyAllowance || 0;

                        if (dailyAllowance === 0) {
                            setLoading(false);
                            const setupResult = await Swal.fire({
                                title: 'Budget Belum Diatur',
                                text: 'Anda mengaktifkan budget harian namun belum di setting, ingin setting terlebih dahulu?',
                                icon: 'info',
                                showCancelButton: true,
                                confirmButtonColor: '#4361ee',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: 'Ya, Setting Budget',
                                cancelButtonText: 'Nanti Saja',
                                reverseButtons: true
                            });

                            if (setupResult.isConfirmed) {
                                router.push('/budget');
                                return;
                            }
                            setLoading(true);
                        } else {
                            // Only alert if the added expense pushes today's total spending OVER today's adjusted budget
                            const adjustedDailyBudget = budgetData.debug_info?.adjustedDailyBudget || dailyAllowance;
                            const todayExpenseOnly = budgetData.debug_info?.todayExpenseOnly || 0;

                            if ((todayExpenseOnly + parsedAmount) > adjustedDailyBudget) {
                                setLoading(false);
                                const result = await Swal.fire({
                                    title: 'Warning: Over Budget!',
                                    text: `Pengeluaran hari ini (${formatCurrency(todayExpenseOnly + parsedAmount)}) telah melebihi batas budget yang ditentukan (${formatCurrency(adjustedDailyBudget)}).`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#4361ee', // Ya, kecualikan
                                    cancelButtonColor: '#ef4444', // Tidak, tetap masukkan budget
                                    confirmButtonText: 'Ya, Kecualikan',
                                    cancelButtonText: 'Tetap Masukkan Budget',
                                    reverseButtons: true
                                });

                                if (result.isConfirmed) {
                                    payload.is_excluded_from_budget = true;
                                } else if (result.dismiss === Swal.DismissReason.backdrop || result.dismiss === Swal.DismissReason.esc) {
                                    // User closed the dialog without selecting
                                    return;
                                }
                                setLoading(true);
                            }
                        }
                    }
                } catch (budgetErr) {
                    console.error('Failed to fetch budget for checking, proceeding with default', budgetErr);
                }
            }

            if (isEdit) {
                await api.put(`/transactions/${id}`, payload);
            } else {
                await api.post('/transactions', payload);
            }

            // Invalidate queries to ensure history page gets the freshest data
            await queryClient.invalidateQueries();

            // Show success feedback
            toast.success(isEdit ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil ditambahkan');

            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menyimpan transaksi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Hapus transaksi ini?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/transactions/${id}`);

            // Invalidate queries
            await queryClient.invalidateQueries();

            toast.success('Transaksi berhasil dihapus');

            router.push('/transactions/history');
        } catch (err) {
            console.error(err);
        }
    };

    const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <div className="px-4 pt-6 pb-safe">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/')}
                    className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h1>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 text-red-600 text-sm rounded-xl"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
                {/* Type Toggle */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex">
                    {(['expense', 'income'] as const).map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => update('type', t)}
                            className={cn(
                                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                                form.type === t
                                    ? t === 'income'
                                        ? 'bg-income text-white shadow-sm'
                                        : 'bg-expense text-white shadow-sm'
                                    : 'text-gray-500'
                            )}
                        >
                            {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                    ))}
                </div>

                {/* Amount */}
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Jumlah</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rp</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatAmountDisplay(form.amount)}
                            onChange={e => handleAmountInput(e.target.value)}
                            placeholder="0"
                            required
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-lg font-semibold"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Deskripsi</label>
                    <div className="relative">
                        <FileText className="absolute left-3.5 top-3 w-4.5 h-4.5 text-gray-400" />
                        <input
                            type="text"
                            value={form.description}
                            onChange={e => update('description', e.target.value)}
                            placeholder="Catatan transaksi (opsional)"
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                </div>

                {/* Category */}
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Kategori</label>
                    <div className="relative">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <select
                            value={form.category_id}
                            onChange={e => update('category_id', e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                        >
                            <option value="">Pilih kategori</option>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Category Quick Chips */}
                    {quickCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {quickCategories.map(cat => (
                                <button
                                    key={`chip-${cat.id}`}
                                    type="button"
                                    onClick={() => update('category_id', String(cat.id))}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-full transition-all",
                                        theme === 'neo-brutalism' ? "border-2 border-black" : "border border-gray-200 dark:border-gray-700",
                                        form.category_id === String(cat.id)
                                            ? (theme === 'neo-brutalism'
                                                ? "bg-[#FFE81A] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105"
                                                : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border-primary-300 dark:border-primary-700 scale-105")
                                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                                    )}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Wallet */}
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Wallet</label>
                    <div className="relative">
                        <WalletIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <select
                            value={form.wallet_id}
                            onChange={e => update('wallet_id', e.target.value)}
                            required
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all appearance-none"
                        >
                            <option value="">Pilih wallet</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.icon} {w.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Wallet Quick Chips */}
                    {quickWallets.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {quickWallets.map(w => (
                                <button
                                    key={`chip-w-${w.id}`}
                                    type="button"
                                    onClick={() => update('wallet_id', String(w.id))}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-bold rounded-full transition-all",
                                        theme === 'neo-brutalism' ? "border-2 border-black" : "border border-gray-200 dark:border-gray-700",
                                        form.wallet_id === String(w.id)
                                            ? (theme === 'neo-brutalism'
                                                ? "bg-[#C4E4D3] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-105"
                                                : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border-primary-300 dark:border-primary-700 scale-105")
                                            : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                                    )}
                                >
                                    {w.icon} {w.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Tanggal</label>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 z-10" />

                        {/* Custom Date Display */}
                        <div className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {form.date ? formatDate(form.date, 'EEEE, dd MMMM yyyy') : 'Pilih Tanggal'}
                        </div>

                        {/* Hidden Native Input */}
                        <input
                            type="date"
                            value={form.date}
                            onChange={e => update('date', e.target.value)}
                            required
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    {isEdit && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={handleDelete}
                            className="px-5 py-3 bg-red-50 dark:bg-red-950/50 text-red-600 rounded-xl font-medium text-sm flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                        </motion.button>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </motion.button>
                </div>
            </form>
        </div>
    );
}
