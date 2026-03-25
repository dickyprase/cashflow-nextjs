"use client";

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Calendar, Wallet, Tag, Utensils, Car, House, ShoppingBag, Briefcase, CircleDollarSign, Smartphone, Plane, HeartPulse, Tv, Film, Gift, HelpCircle, type LucideIcon } from 'lucide-react';
import api from '@/services/api';
import { formatCurrency, formatDate, cn, formatTime } from '@/lib/utils';
import type { Transaction } from '@/types';
import { ListSkeleton } from '@/components/Skeleton';
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
    if (!candidate) return <span>{fallback}</span>;
    if (isEmojiIcon(candidate)) return <span>{candidate}</span>;
    const IconComponent = ICON_COMPONENTS[normalizeIconName(candidate)] || HelpCircle;
    return <IconComponent className={className} />;
}

type TransactionListParams = {
    limit: number;
    offset: number;
    type?: 'income' | 'expense';
};

export function TransactionsPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

    const loadTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params: TransactionListParams = { limit: 50, offset: 0 };
            if (typeFilter !== 'all') params.type = typeFilter;
            const res = await api.get('/transactions', { params });
            const resData = res.data.data;
            // Backend returns { transactions: [...], pagination: {...} }
            const txList = resData?.transactions || (Array.isArray(resData) ? resData : []);
            setTransactions(txList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [typeFilter]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const filtered = transactions.filter(tx => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            tx.description?.toLowerCase().includes(q) ||
            tx.category_name?.toLowerCase().includes(q)
        );
    });

    // Group by date
    const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
        const key = tx.date?.split('T')[0] || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(tx);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <div className="px-4 pt-6 pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Transaksi</h1>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => router.push('/transactions/add')}
                    className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30"
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari transaksi..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-5">
                    {(['all', 'income', 'expense'] as const).map(t => (
                        <motion.button
                            key={t}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTypeFilter(t)}
                            className={cn(
                                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                                typeFilter === t
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            )}
                        >
                            {t === 'all' ? 'Semua' : t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </motion.button>
                    ))}
                </div>

                {/* Transactions List */}
                {loading ? (
                    <ListSkeleton count={6} />
                ) : sortedDates.length > 0 ? (
                    <div className="space-y-5">
                        {sortedDates.map(date => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {formatDate(date, 'EEEE, dd MMMM yyyy')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {grouped[date].map((tx, i) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3 border border-gray-100 dark:border-gray-700 card-hover cursor-pointer"
                                            onClick={() => router.push(`/transactions/edit/${String(tx.id)}`)}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                                style={{ backgroundColor: `${tx.category_color || tx.wallet_color || '#e5e7eb'}20` }}
                                            >
                                                <DynamicTxIcon icon={resolveIconCandidate(tx.category_icon, tx.wallet_icon)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {tx.description || tx.category_name || 'Transaksi'}
                                                </p>
                                                <p className="text-xs text-gray-400 inline-flex items-center gap-1">
                                                    <DynamicTxIcon icon={tx.wallet_icon} fallback="💼" className="w-3.5 h-3.5" />
                                                    <span>{tx.wallet_name || 'Wallet'} • {tx.category_name}</span>
                                                    {tx.created_at && (
                                                        <>
                                                            <span> • </span>
                                                            <span>{formatTime(tx.created_at)}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                            <span className={cn(
                                                'text-sm font-semibold tabular-nums whitespace-nowrap',
                                                tx.type === 'income' ? 'text-income' : 'text-expense'
                                            )}>
                                                {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Filter className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada transaksi</p>
                    </div>
                )}
            </div>
        </div>
    );
}
