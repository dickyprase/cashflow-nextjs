"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Search, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { CardSkeleton } from '@/components/Skeleton';
import type { Transaction } from '@/types';
import { useTheme } from '@/context/ThemeContext';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const MONTHS = ['Semua Bulan', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function ReportsPage() {
    const { theme } = useTheme();
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Default to current month
    const [pieType, setPieType] = useState<'expense' | 'income'>('expense');

    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    useEffect(() => {
        setPage(1); // Reset page on filter change
        loadReport();
    }, [year, month, pieType]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const promises = [
                api.get(`/reports/monthly?year=${year}`),
                api.get(`/reports/category-breakdown?year=${year}${month > 0 ? `&month=${month}` : ''}&type=${pieType}`)
            ];

            if (month > 0) {
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
                promises.push(api.get('/transactions', { params: { limit: 1000, startDate, endDate } }));
            }

            const [monthRes, catRes, txRes] = await Promise.all(promises);
            setMonthlyData(monthRes.data.data || []);
            setCategoryData(catRes.data.data || []);
            if (month > 0 && txRes) {
                const txList = txRes.data.data.transactions || [];
                setTransactions(txList);
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalIncome = monthlyData.reduce((sum, m) => sum + (m.income || 0), 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + (m.expense || 0), 0);

    // To calculate exactly how much of the expense was incidental vs budget, we can sum it up from category data or backend
    const totalIncidental = categoryData.reduce((sum, cat) => sum + (Number(cat.total_incidental) || 0), 0);
    const totalBudgetExpense = totalExpense - totalIncidental;

    // Group transactions by date
    const groupedTx = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
        const key = tx.date?.split('T')[0] || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(tx);
        return acc;
    }, {});
    const sortedDates = Object.keys(groupedTx).sort((a, b) => b.localeCompare(a));
    const selectedTx = selectedDate ? groupedTx[selectedDate] : [];

    // Pagination logic
    const totalPages = Math.ceil(sortedDates.length / ITEMS_PER_PAGE);
    const paginatedDates = sortedDates.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="px-4 pt-6 pb-32">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">Laporan & Analitik</h1>

            {/* Year filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                {[year - 2, year - 1, year, year + 1].map(y => (
                    <motion.button
                        key={y}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setYear(y)}
                        className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                            year === y
                                ? (theme === 'neo-brutalism' ? 'bg-[#FFDCA8] text-gray-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-primary-600 text-white shadow-sm')
                                : (theme === 'neo-brutalism' ? 'bg-white text-gray-600 border-2 border-transparent' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')
                        )}
                    >
                        {y}
                    </motion.button>
                ))}
            </div>

            {/* Month filter */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 hide-scrollbar">
                {MONTHS.map((m, i) => (
                    <motion.button
                        key={i}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMonth(i)}
                        className={cn(
                            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap',
                            month === i
                                ? (theme === 'neo-brutalism' ? 'bg-[#C4E4D3] text-gray-900 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm')
                                : (theme === 'neo-brutalism' ? 'bg-white text-gray-600 border-2 border-transparent' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')
                        )}
                    >
                        {m}
                    </motion.button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-xs text-gray-500">Pemasukan</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums truncate">
                                {formatCurrency(totalIncome)}
                            </p>
                            {pieType === 'income' && <p className="text-[10px] text-gray-400 mt-1 opacity-0">spacer</p>}
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                </div>
                                <span className="text-xs text-gray-500">Pengeluaran</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums truncate">
                                {formatCurrency(totalExpense)}
                            </p>
                            {pieType === 'expense' && totalIncidental > 0 && (
                                <p className="text-[10px] text-orange-500 mt-1 font-medium leading-tight">
                                    Termasuk {formatCurrency(totalIncidental)} insidental
                                </p>
                            )}
                        </div>
                        <div className={cn(
                            "col-span-2 rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between",
                            theme === 'neo-brutalism'
                                ? "bg-gray-900 text-white border-[3px] border-black"
                                : "bg-gradient-to-br from-gray-900 to-gray-800 shadow-sm text-white"
                        )}>
                            {theme !== 'neo-brutalism' && (
                                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            )}
                            <div className="flex items-center justify-between relative z-10">
                                <div>
                                    <span className="text-xs text-gray-400">Sisa Saldo Bersih</span>
                                    <p className="text-xl font-bold tabular-nums">
                                        {formatCurrency(totalIncome - totalExpense)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                    <span className="text-lg shrink-0">📈</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart (Always shows full year trend) */}
                    {monthlyData.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Tren Bulanan {year}</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => value && typeof value === 'string' ? value.substring(0, 3) : value} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(255,255,255,0.95)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        }}
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} stackId="incomeStack" />
                                    <Bar dataKey="budget_expense" name="Pengeluaran (Budget)" fill="#ef4444" stackId="expenseStack" />
                                    <Bar dataKey="incidental_expense" name="Pengeluaran (Insidental)" fill="#fca5a5" radius={[4, 4, 0, 0]} stackId="expenseStack" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Category Breakdown */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Kategori {month > 0 ? MONTHS[month] : ''}</h3>
                            <select
                                value={pieType}
                                onChange={(e) => setPieType(e.target.value as 'expense' | 'income')}
                                className="bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none"
                            >
                                <option value="expense">Pengeluaran</option>
                                <option value="income">Pemasukan</option>
                            </select>
                        </div>

                        {categoryData.length > 0 ? (
                            <>
                                <div className="flex justify-center mb-4">
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                dataKey="total"
                                                nameKey="category_name"
                                            >
                                                {categoryData.map((_: any, index: number) => (
                                                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mt-6">
                                    {categoryData.map((cat: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                                                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                                />
                                                <div className="flex-1 min-w-0 flex justify-between items-start">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">{cat.category_name}</span>
                                                    <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(cat.total)}
                                                    </span>
                                                </div>
                                            </div>
                                            {pieType === 'expense' && Number(cat.total_incidental) > 0 && (
                                                <div className="flex justify-between items-center pl-6 text-[11px]">
                                                    <span className="text-gray-500">Budget: {formatCurrency(cat.total_budget)}</span>
                                                    <span className="text-orange-500 font-medium whitespace-nowrap bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded">
                                                        Insidental: {formatCurrency(cat.total_incidental)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-10">Belum ada data</p>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
