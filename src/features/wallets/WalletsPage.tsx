"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Wallet, CreditCard, Landmark, Smartphone, X, ArrowRightLeft, FileText, Clock } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, cn, formatDate, formatTime } from '@/lib/utils';
import type { Wallet as WalletType, Transaction } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

const WALLET_ICONS = ['💰', '💳', '🏦', '📱', '💵', '🪙', '💎', '🏧'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

export function WalletsPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
    const [form, setForm] = useState({ name: '', type: 'cash', icon: '💰', color: '#10b981', balance: 0 });
    const [transferForm, setTransferForm] = useState({ from_wallet_id: 0, to_wallet_id: 0, amount: 0, fee: 0, description: '' });
    const [transferring, setTransferring] = useState(false);
    const [transferHistory, setTransferHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<Transaction | null>(null);

    useEffect(() => {
        loadWallets();
        loadTransferHistory();
    }, []);

    const loadTransferHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await api.get('/wallets/transfer/history?limit=20');
            setTransferHistory(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const loadWallets = async () => {
        try {
            const res = await api.get('/wallets');
            setWallets(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance as any) || 0), 0);

    const openAdd = () => {
        setEditingWallet(null);
        setForm({ name: '', type: 'cash', icon: '💰', color: '#10b981', balance: 0 });
        setShowModal(true);
    };

    const openEdit = (w: WalletType) => {
        setEditingWallet(w);
        setForm({ name: w.name, type: w.type, icon: w.icon, color: w.color, balance: parseFloat(w.balance as any) || 0 });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = { ...form, balance: form.balance };
            if (editingWallet) {
                await api.put(`/wallets/${editingWallet.id}`, payload);
                toast.success('Wallet berhasil diperbarui');
            } else {
                await api.post('/wallets', payload);
                toast.success('Wallet berhasil ditambahkan');
            }
            setShowModal(false);
            loadWallets();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan wallet');
            console.error(err);
        }
    };

    const handleCurrencyInput = (rawValue: string) => {
        const numericStr = rawValue.replace(/[^0-9]/g, '');
        const numericVal = numericStr === '' ? 0 : parseInt(numericStr, 10);
        setForm(p => ({ ...p, balance: numericVal }));
    };

    const formatInputValue = (val: number) => {
        if (val === 0) return '';
        return val.toLocaleString('id-ID');
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus wallet ini?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/wallets/${id}`);
            toast.success('Wallet berhasil dihapus');
            loadWallets();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus wallet');
            console.error(err);
        }
    };

    const handleTransfer = async () => {
        if (!transferForm.from_wallet_id || !transferForm.to_wallet_id || transferForm.amount <= 0) {
            toast.error('Lengkapi semua field transfer');
            return;
        }
        if (transferForm.from_wallet_id === transferForm.to_wallet_id) {
            toast.error('Wallet sumber dan tujuan tidak boleh sama');
            return;
        }
        setTransferring(true);
        try {
            await api.post('/wallets/transfer', transferForm);
            toast.success('Transfer saldo berhasil');
            setShowTransfer(false);
            loadWallets();
            loadTransferHistory();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal transfer');
        } finally {
            setTransferring(false);
        }
    };

    const handleTransferCurrencyInput = (rawValue: string, field: 'amount' | 'fee' = 'amount') => {
        const numericStr = rawValue.replace(/[^0-9]/g, '');
        const numericVal = numericStr === '' ? 0 : parseInt(numericStr, 10);
        setTransferForm(p => ({ ...p, [field]: numericVal }));
    };

    return (
        <div className="px-4 pt-6 pb-safe">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Wallet</h1>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setTransferForm({ from_wallet_id: 0, to_wallet_id: 0, amount: 0, fee: 0, description: '' }); setShowTransfer(true); }}
                        className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                    >
                        <ArrowRightLeft className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={openAdd}
                        className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30"
                    >
                        <Plus className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>

            {/* Total Balance */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "rounded-2xl p-5 mb-5",
                    theme === 'neo-brutalism'
                        ? "bg-[#FFE81A] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]"
                        : "bg-gradient-to-br from-accent-600 to-accent-700 text-white"
                )}
            >
                <p className={cn("text-sm", theme === 'neo-brutalism' ? "font-medium text-gray-800" : "opacity-80 mb-1")}>Total Saldo Semua Wallet</p>
                <p className={cn("text-2xl font-bold tabular-nums", theme === 'neo-brutalism' ? "text-gray-900" : "")}>{formatCurrency(totalBalance)}</p>
            </motion.div>

            {/* Wallet List */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                    </div>
                ) : wallets.length > 0 ? (
                    <div className="space-y-3">
                        {wallets.map((w, i) => (
                            <motion.div
                                key={w.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 card-hover"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                                        style={{ backgroundColor: `${w.color}20` }}
                                    >
                                        {w.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{w.name}</p>
                                        <p className="text-xs text-gray-400 capitalize">{w.type}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(parseFloat(w.balance as any) || 0)}</p>
                                        <div className="flex gap-1 mt-1 justify-end">
                                            <button onClick={() => openEdit(w)} className="p-1"><Edit2 className="w-3.5 h-3.5 text-gray-400" /></button>
                                            <button onClick={() => handleDelete(w.id)} className="p-1"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Wallet className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">Belum ada wallet</p>
                    </div>
                )}
            </div>

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
                                <h3 className="text-lg font-semibold">{editingWallet ? 'Edit Wallet' : 'Tambah Wallet'}</h3>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Nama wallet"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <select
                                    value={form.type}
                                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="bank">Bank</option>
                                    <option value="e-wallet">E-Wallet</option>
                                    <option value="credit-card">Credit Card</option>
                                </select>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatInputValue(form.balance)}
                                    onChange={e => handleCurrencyInput(e.target.value)}
                                    placeholder="Nominal saldo awal"
                                    disabled={!!editingWallet}
                                    title={editingWallet ? "Saldo wallet tidak dapat diubah setelah dibuat" : ""}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100 disabled:dark:bg-gray-900 disabled:cursor-not-allowed"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {WALLET_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, icon }))}
                                            className={cn(
                                                'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all',
                                                form.icon === icon ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-800'
                                            )}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setForm(p => ({ ...p, color }))}
                                            className={cn('w-8 h-8 rounded-full transition-all', form.color === color ? 'ring-2 ring-offset-2 ring-primary-500' : '')}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
                                >
                                    Simpan
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transfer History */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 mt-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        Riwayat Transfer
                    </h3>
                    {transferHistory.length > 0 && (
                        <button
                            onClick={() => router.push('/wallets/transfers')}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                            Lihat Semua
                        </button>
                    )}
                </div>
                {historyLoading ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                    </div>
                ) : transferHistory.length > 0 ? (
                    <div className="space-y-2">
                        {transferHistory.map((tx: any) => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedTransfer(tx)}
                                className={cn(
                                    "rounded-xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all",
                                    theme === 'neo-brutalism'
                                        ? "bg-white dark:bg-gray-900 border-2 border-black shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a]"
                                        : "bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                            >
                                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                                    <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {tx.wallet_name || 'Wallet'} → {tx.target_wallet_name || 'Wallet'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {tx.description || 'Transfer'} · {formatDate(tx.date, 'dd MMM yyyy')}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                    {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-6">Belum ada riwayat transfer</p>
                )}
            </div>

            {/* Transfer Modal */}
            <AnimatePresence>
                {showTransfer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowTransfer(false)}
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
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transfer Saldo</h3>
                                <button onClick={() => setShowTransfer(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Dari Wallet</label>
                                    <select
                                        value={transferForm.from_wallet_id}
                                        onChange={e => setTransferForm(p => ({ ...p, from_wallet_id: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value={0}>Pilih wallet sumber</option>
                                        {wallets.map(w => (
                                            <option key={w.id} value={w.id}>{w.icon} {w.name} ({formatCurrency(parseFloat(w.balance as any) || 0)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Ke Wallet</label>
                                    <select
                                        value={transferForm.to_wallet_id}
                                        onChange={e => setTransferForm(p => ({ ...p, to_wallet_id: Number(e.target.value) }))}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value={0}>Pilih wallet tujuan</option>
                                        {wallets.filter(w => w.id !== transferForm.from_wallet_id).map(w => (
                                            <option key={w.id} value={w.id}>{w.icon} {w.name} ({formatCurrency(parseFloat(w.balance as any) || 0)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Deskripsi (opsional)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Contoh: Isi saldo GoPay"
                                            value={transferForm.description}
                                            onChange={e => setTransferForm(p => ({ ...p, description: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Jumlah Transfer</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={formatInputValue(transferForm.amount)}
                                        onChange={e => handleTransferCurrencyInput(e.target.value, 'amount')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Biaya Admin (opsional)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={formatInputValue(transferForm.fee)}
                                        onChange={e => handleTransferCurrencyInput(e.target.value, 'fee')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleTransfer}
                                    disabled={transferring}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {transferring ? 'Memproses...' : 'Transfer Sekarang'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Detail Transfer */}
            <AnimatePresence>
                {selectedTransfer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTransfer(null)}
                            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={cn(
                                "fixed bottom-0 left-0 right-0 z-50 p-6 pb-safe max-h-[85vh] overflow-y-auto",
                                theme === 'neo-brutalism'
                                    ? "bg-white dark:bg-gray-900 border-t-4 border-l-4 border-r-4 border-black rounded-t-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                                    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
                            )}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Detail Transfer</h2>
                                <button
                                    onClick={() => setSelectedTransfer(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center justify-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                                    <ArrowRightLeft className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                                    {formatCurrency(Number(selectedTransfer.amount))}
                                </h3>
                                <p className="text-sm font-semibold text-gray-500 mt-1">
                                    Transfer Dana
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Dari</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{selectedTransfer.wallet_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Ke</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{selectedTransfer.target_wallet_name || '-'}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                            {formatDate(selectedTransfer.date, 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Waktu</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                            {selectedTransfer.created_at ? `${formatTime(selectedTransfer.created_at)} WIB` : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Biaya Admin</p>
                                    <p className="text-sm font-bold mt-0.5">
                                        {Number(selectedTransfer.admin_fee) > 0 ? (
                                            <span className="text-red-500">{formatCurrency(Number(selectedTransfer.admin_fee))}</span>
                                        ) : (
                                            <span className="text-green-500">Gratis (Rp 0)</span>
                                        )}
                                    </p>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Catatan</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                                        {selectedTransfer.description && !selectedTransfer.description.startsWith('Transfer ke')
                                            ? selectedTransfer.description
                                            : <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedTransfer(null)}
                                    className={cn(
                                        "flex-1 py-3.5 flex items-center justify-center gap-2 transition-all",
                                        theme === 'neo-brutalism'
                                            ? "bg-white text-gray-900 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium shadow-sm active:scale-95 border-none focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={async () => {
                                        const id = selectedTransfer.id;
                                        const transferAmount = selectedTransfer.amount;
                                        const transferAdminFee = selectedTransfer.admin_fee;
                                        const adminFeeTxId = selectedTransfer.admin_fee_transaction_id;
                                        const walletName = selectedTransfer.wallet_name;
                                        setSelectedTransfer(null);

                                        // Step 1: Main confirmation
                                        const result = await Swal.fire({
                                            title: 'Batalkan Transfer?',
                                            text: `Dana sebesar Rp ${formatCurrency(Number(transferAmount))} akan otomatis dikembalikan ke dompet asal (${walletName}).`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#ef4444',
                                            confirmButtonText: 'Ya, Batalkan!'
                                        });

                                        if (result.isConfirmed) {
                                            let deleteFee = false;

                                            // Step 2 & 3: Fee Checking Confirmation
                                            if (Number(transferAdminFee) > 0 && adminFeeTxId) {
                                                const feeResult = await Swal.fire({
                                                    title: 'Transfer dibatalkan.',
                                                    text: `Apakah Anda juga ingin menghapus catatan pengeluaran Biaya Admin sebesar Rp ${formatCurrency(Number(transferAdminFee))} dan mengembalikannya ke dompet asal?`,
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#ef4444',
                                                    cancelButtonColor: '#6b7280',
                                                    confirmButtonText: 'Ya, Hapus Fee',
                                                    cancelButtonText: 'Biarkan Saja'
                                                });

                                                if (feeResult.isConfirmed) {
                                                    deleteFee = true;
                                                }
                                            }

                                            // Step 4: Execute API Deletion
                                            try {
                                                await api.delete(`/wallets/transfer/${id}?deleteFee=${deleteFee}`);
                                                loadTransferHistory();
                                                loadWallets(); // Refresh total balances
                                                toast.success('Transfer berhasil dibatalkan dan saldo dikembalikan');
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Gagal membatalkan transfer');
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 py-3.5 flex items-center justify-center gap-2 transition-all",
                                        theme === 'neo-brutalism'
                                            ? "bg-red-500 text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none"
                                            : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-xl font-medium active:scale-95 border-none focus:outline-none"
                                    )}
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
