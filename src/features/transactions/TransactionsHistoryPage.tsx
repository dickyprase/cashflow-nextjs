"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertTriangle, X, Edit, Trash2, Bot, Wallet, Tag, Utensils, Car, House, ShoppingBag, Briefcase, CircleDollarSign, Smartphone, Plane, HeartPulse, Tv, Film, Gift, HelpCircle, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { formatCurrency, formatDate, cn, formatTime } from '@/lib/utils';
import { CardSkeleton } from '@/components/Skeleton';
import type { Transaction } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';

const ICON_COMPONENTS: Record<string, LucideIcon> = {
    wallet: Wallet,
    tag: Tag,
    food: Utensils,
    utensils: Utensils,
    car: Car,
    home: House,
    house: House,
    shoppingbag: ShoppingBag,
    shopping: ShoppingBag,
    briefcase: Briefcase,
    salary: CircleDollarSign,
    money: CircleDollarSign,
    smartphone: Smartphone,
    plane: Plane,
    health: HeartPulse,
    tv: Tv,
    film: Film,
    gift: Gift
};

function normalizeIconName(icon: string) {
    return icon.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function isEmojiIcon(icon: string) {
    return /[\p{Extended_Pictographic}\uFE0F]/u.test(icon);
}

function resolveIconCandidate(...icons: Array<string | null | undefined>) {
    return icons.find((icon) => typeof icon === 'string' && icon.trim().length > 0)?.trim() || '';
}

function DynamicTxIcon({ icon, fallback = '💰', className = 'w-5 h-5' }: { icon?: string | null; fallback?: string; className?: string }) {
    const candidate = icon?.trim();
    if (!candidate) {
        return <span>{fallback}</span>;
    }

    if (isEmojiIcon(candidate)) {
        return <span>{candidate}</span>;
    }

    const IconComponent = ICON_COMPONENTS[normalizeIconName(candidate)] || HelpCircle;
    return <IconComponent className={className} />;
}

type TransactionHistoryParams = {
    limit: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    type?: 'income' | 'expense';
};

export function TransactionsHistoryPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { theme } = useTheme();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const handleClose = () => setSelectedTransaction(null);

    const MONTHS = ['Semua Bulan', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const { data, isLoading } = useQuery({
        queryKey: ['transactions-history', month, year, search, typeFilter],
        queryFn: async () => {
            const params: TransactionHistoryParams = { limit: 500 };

            if (month > 0) {
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
                params.startDate = startDate;
                params.endDate = endDate;
            } else {
                // If "Semua Bulan" is selected, just limit to the year broadly
                params.startDate = `${year}-01-01`;
                params.endDate = `${year}-12-31`;
            }

            if (search) params.search = search;
            if (typeFilter !== 'all') {
                params.type = typeFilter;
            } else {
                // To prevent transfers from showing up in 'all' view
                // The backend type filter is single value right now, 
                // but since frontend receives all, we can filter it client-side 
                // or just rely on the backend sending non-transfers.
                // For safety, we will filter 'transfer' on the client side below.
            }

            const res = await api.get('/transactions', { params });
            const allTx = res.data.data.transactions as Transaction[];
            // Ensure no 'transfer' type bleeds into this page
            return allTx.filter(tx => tx.type !== 'transfer' && tx.transaction_type !== 'transfer');
        }
    });

    const { data: budgetData } = useQuery({
        queryKey: ['daily-budget-status'],
        queryFn: async () => {
            try {
                const res = await api.get('/daily-budget');
                return res.data.data;
            } catch { return null; }
        }
    });

    const updateExclusionMutation = useMutation({
        mutationFn: async ({ id, is_excluded }: { id: number, is_excluded: boolean }) => {
            return await api.put(`/transactions/${id}`, { is_excluded_from_budget: is_excluded });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
            queryClient.invalidateQueries({ queryKey: ['daily-budget'] });
            toast.success(variables.is_excluded ? 'Transaksi dikecualikan dari budget' : 'Transaksi dimasukkan ke budget');
        },
        onError: () => {
            toast.error('Gagal memperbarui status budget');
        }
    });

    const handleToggleExclusion = async (tx: Transaction) => {
        const action = tx.is_excluded_from_budget ? 'memasukkan kembali ke kalkulasi' : 'mengecualikan dari';

        const result = await Swal.fire({
            title: 'Konfirmasi',
            text: `Apakah Anda yakin ingin ${action} budget harian?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4361ee',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Ya',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            updateExclusionMutation.mutate({ id: tx.id, is_excluded: !tx.is_excluded_from_budget });
        }
    };

    const isWithinLast7Days = (dateStr: string) => {
        const txDate = new Date(dateStr);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return txDate >= sevenDaysAgo;
    };




    const transactions = data || [];

    return (
        <div className="px-4 pt-6 pb-32 min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">History Transaksi</h1>

            <div className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 mb-4",
                theme === 'neo-brutalism'
                    ? "bg-white dark:bg-gray-900 border-2 border-black shadow-[4px_4px_0px_#1a1a1a]"
                    : "bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800"
            )}>
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                    type="text"
                    placeholder="Cari nama atau catatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full !bg-transparent !border-none !shadow-none !outline-none focus:!ring-0 text-sm font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-500 p-0 m-0"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={cn(
                        "text-sm font-medium rounded-full px-3 py-1 outline-none appearance-none cursor-pointer",
                        theme === 'neo-brutalism'
                            ? "bg-white dark:bg-gray-900 border-2 border-black !shadow-none"
                            : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                >
                    {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className={cn(
                        "text-sm font-medium rounded-full px-3 py-1 outline-none appearance-none cursor-pointer",
                        theme === 'neo-brutalism'
                            ? "bg-white dark:bg-gray-900 border-2 border-black !shadow-none"
                            : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                >
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                    className={cn(
                        "text-sm font-medium rounded-full px-3 py-1 outline-none appearance-none cursor-pointer",
                        theme === 'neo-brutalism'
                            ? "bg-white dark:bg-gray-900 border-2 border-black !shadow-none"
                            : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                >
                    <option value="all">Semua Tipe</option>
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                </select>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-sm">Tidak ada transaksi ditemukan.</p>
                    </div>
                ) : (
                    Object.entries(
                        transactions.reduce((acc, tx) => {
                            const d = tx.date.split('T')[0];
                            if (!acc[d]) acc[d] = [];
                            acc[d].push(tx);
                            return acc;
                        }, {} as Record<string, Transaction[]>)
                    )
                        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                        .map(([dateKey, dayTransactions]) => {
                            const dailySubtotal = dayTransactions.reduce((sum, tx) => {
                                return tx.type === 'income' ? sum + Number(tx.amount) : sum - Number(tx.amount);
                            }, 0);

                            return (
                                <div key={dateKey} className="mt-8 mb-4 first:mt-2">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {formatDate(dateKey, 'EEEE, dd MMM yyyy')}
                                        </h3>
                                        <span className={cn(
                                            'text-xs font-bold tabular-nums',
                                            dailySubtotal > 0 ? 'text-income' : dailySubtotal < 0 ? 'text-expense' : 'text-gray-500'
                                        )}>
                                            {dailySubtotal > 0 ? '+' : dailySubtotal < 0 ? '-' : ''}{formatCurrency(Math.abs(dailySubtotal))}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {dayTransactions.map((tx) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={tx.id}
                                                onClick={() => setSelectedTransaction(tx)}
                                                className={cn(
                                                    "p-3 cursor-pointer active:scale-[0.98] transition-all",
                                                    theme === 'neo-brutalism'
                                                        ? "bg-white dark:bg-gray-900 rounded-xl border-2 border-black shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a]"
                                                        : "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* KIRI: Ikon Kategori */}
                                                    <div
                                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                                        style={{ backgroundColor: `${tx.category_color || tx.wallet_color || '#e5e7eb'}30` }}
                                                    >
                                                        <DynamicTxIcon icon={resolveIconCandidate(tx.category_icon, tx.wallet_icon)} />
                                                    </div>

                                                    {/* TENGAH: Judul, Wallet, Badges */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                                            {tx.description || tx.category_name}
                                                            {tx.is_system_generated && (
                                                                <Bot className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                                            )}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                            <span className="text-xs text-gray-500 truncate inline-flex items-center gap-1">
                                                                <DynamicTxIcon icon={tx.wallet_icon} fallback="💼" className="w-3.5 h-3.5" />
                                                                <span>{tx.wallet_name} • {tx.category_name}</span>
                                                            </span>
                                                            {tx.is_excluded_from_budget && tx.type === 'expense' && (
                                                                <span className="flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 dark:bg-orange-950/30 text-orange-600 px-1.5 py-0.5 rounded">
                                                                    <AlertTriangle className="w-2.5 h-2.5" /> Insidental
                                                                </span>
                                                            )}
                                                            {tx.type === 'expense' && budgetData?.is_active && isWithinLast7Days(tx.date) && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleExclusion(tx);
                                                                    }}
                                                                    disabled={updateExclusionMutation.isPending}
                                                                    className={cn(
                                                                        "cursor-pointer transition-all",
                                                                        theme === 'neo-brutalism'
                                                                            ? tx.is_excluded_from_budget
                                                                                ? "bg-green-300 border-2 border-black text-black text-xs font-bold px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-px"
                                                                                : "bg-orange-100 border-2 border-black text-black text-xs font-bold px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-px"
                                                                            : tx.is_excluded_from_budget
                                                                                ? "bg-green-50 text-green-600 border border-green-200 rounded-full text-xs font-medium px-3 py-1 active:scale-95"
                                                                                : "bg-orange-50 text-orange-600 border border-orange-200 rounded-full text-xs font-medium px-3 py-1 active:scale-95"
                                                                    )}
                                                                >
                                                                    {tx.is_excluded_from_budget ? 'Masuk Budget Harian' : 'Abaikan dari Budget'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* KANAN: Nominal, Waktu */}
                                                    <div className="text-right shrink-0 flex flex-col justify-center">
                                                        <span className={cn(
                                                            'text-sm font-bold whitespace-nowrap tabular-nums leading-tight',
                                                            tx.type === 'income' ? 'text-income' : 'text-expense'
                                                        )}>
                                                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                                                        </span>
                                                        {tx.created_at && (
                                                            <span className="text-xs text-gray-400 mt-0.5 tabular-nums inline-block">
                                                                {formatTime(tx.created_at)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>

            {/* Modal Bottom Sheet Detail Transaksi */}
            <AnimatePresence>
                {selectedTransaction && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 backdrop-blur-sm"
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={cn(
                                "fixed bottom-0 left-0 right-0 z-50 p-6 pb-safe max-h-[85vh] overflow-y-auto",
                                theme === 'neo-brutalism'
                                    ? "bg-white dark:bg-gray-900 border-t-4 border-l-4 border-r-4 border-black rounded-t-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                                    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border outline-none border-gray-200 dark:border-gray-800 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detail Transaksi</h2>
                                <button
                                    onClick={handleClose}
                                    className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col items-center text-center mb-6">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                                    style={{ backgroundColor: `${selectedTransaction.category_color || selectedTransaction.wallet_color || '#e5e7eb'}30` }}
                                >
                                    <DynamicTxIcon icon={resolveIconCandidate(selectedTransaction.category_icon, selectedTransaction.wallet_icon)} className="w-7 h-7" />
                                </div>
                                <h3
                                    className={cn(
                                        "text-3xl font-bold mb-2 break-all",
                                        selectedTransaction.type === 'income' ? 'text-income' : 'text-expense'
                                    )}
                                >
                                    {selectedTransaction.type === 'income' ? '+' : '-'} {formatCurrency(Number(selectedTransaction.amount))}
                                </h3>
                                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                                    {selectedTransaction.description || selectedTransaction.category_name}
                                </p>
                                {selectedTransaction.is_excluded_from_budget && selectedTransaction.type === 'expense' && (
                                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-orange-100 dark:bg-orange-950/30 text-orange-600 px-2.5 py-1 rounded-md">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Insidental / Di Luar Budget
                                    </span>
                                )}
                                {selectedTransaction.is_system_generated && (
                                    <div className="mt-4 p-3 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-left w-full">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed flex items-start gap-2">
                                            <Bot className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                Transaksi ini otomatis dicatat oleh sistem sebagai <strong>Biaya Admin Transfer</strong>. Anda tidak dapat mengubah atau menghapus catatan ini secara manual. Batalkan transfer asli melalui menu <em>Riwayat Transfer</em> jika Anda ingin menarik kembali biaya ini.
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 mb-8">
                                {!selectedTransaction.is_system_generated && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Kategori</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedTransaction.category_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Wallet</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedTransaction.wallet_name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Tanggal</span>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(selectedTransaction.date, 'EEEE, dd MMMM yyyy')}</span>
                                </div>
                                {selectedTransaction.created_at && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Waktu</span>
                                        <span className="text-sm font-semibold font-mono text-gray-900 dark:text-gray-100">{formatTime(selectedTransaction.created_at)} WIB</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Actions - Hidden for system generated records */}
                            {!selectedTransaction.is_system_generated && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            router.push(`/transactions/edit/${selectedTransaction.id.toString()}`);
                                            handleClose();
                                        }}
                                        className={cn(
                                            "flex-1 py-3.5 flex items-center justify-center gap-2 transition-all",
                                            theme === 'neo-brutalism'
                                                ? "bg-white text-gray-900 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none"
                                                : "bg-primary-600 text-white rounded-xl font-medium shadow-sm active:scale-95 border-none focus:outline-none hover:bg-primary-700"
                                        )}
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                    <button
                                        onClick={async () => {
                                            handleClose();
                                            const result = await Swal.fire({
                                                title: 'Hapus transaksi?',
                                                text: "Data yang dihapus tidak dapat dikembalikan!",
                                                icon: 'warning',
                                                showCancelButton: true,
                                                confirmButtonColor: '#ef4444',
                                                confirmButtonText: 'Ya, hapus!'
                                            });

                                            if (result.isConfirmed) {
                                                try {
                                                    await api.delete(`/transactions/${selectedTransaction.id}`);
                                                    queryClient.invalidateQueries({ queryKey: ['transactions-history'] });
                                                    toast.success('Transaksi berhasil dihapus');
                                                } catch (err) {
                                                    console.error(err);
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
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
