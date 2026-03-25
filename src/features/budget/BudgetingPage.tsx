"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Save, Info, X } from 'lucide-react';
import api from '@/services/api';
import { cn, formatCurrency } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface BudgetSettings {
    is_active: boolean;
    mode: 'manual' | 'formula';
    reset_day: number;
    manual_daily_amount: number;
    formula_income: number;
    formula_fixed_expenses: number;
    formula_savings_target: number;
    wallet_id?: number | null;
    is_interactive?: boolean;
    calculated_daily_budget?: number;
    available_balance?: number | null;
    debug_info?: any;
}

export function BudgetingPage() {
    const { theme } = useTheme();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<BudgetSettings>({
        is_active: true,
        mode: 'manual',
        reset_day: 25,
        manual_daily_amount: 0,
        formula_income: 0,
        formula_fixed_expenses: 0,
        formula_savings_target: 0,
        is_interactive: true
    });
    const [wallets, setWallets] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [budgetRes, walletsRes] = await Promise.all([
                    api.get('/daily-budget'),
                    api.get('/wallets').catch(() => ({ data: { data: [] } }))
                ]);

                if (budgetRes.data?.data) {
                    setSettings(budgetRes.data.data);
                }
                if (walletsRes.data?.data) setWallets(walletsRes.data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleChange = (field: keyof BudgetSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleToggleActive = async () => {
        const newValue = !settings.is_active;
        setSettings(prev => ({ ...prev, is_active: newValue }));

        try {
            await api.put('/daily-budget', { ...settings, is_active: newValue });
            // Re-fetch to ensure sync
            const freshRes = await api.get('/daily-budget');
            if (freshRes.data?.data) {
                setSettings(freshRes.data.data);
            }
        } catch (error) {
            console.error('Failed to toggle budget status', error);
            // Revert on failure
            setSettings(prev => ({ ...prev, is_active: !newValue }));
            Swal.fire('Error', 'Gagal mengubah status budget', 'error');
        }
    };

    const handleCurrencyInput = (field: keyof BudgetSettings, rawValue: string) => {
        const numericStr = rawValue.replace(/[^0-9]/g, '');
        const numericVal = numericStr === '' ? 0 : parseInt(numericStr, 10);
        setSettings(prev => ({ ...prev, [field]: numericVal }));
    };

    const formatInputValue = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (!num || isNaN(num)) return '';
        return num.toLocaleString('id-ID');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/daily-budget', settings);
            // Re-fetch full budget data so hero card updates immediately
            const freshRes = await api.get('/daily-budget');
            if (freshRes.data?.data) {
                setSettings(freshRes.data.data);
            }
            Swal.fire('Sukses', 'Pengaturan budget berhasil disimpan', 'success');
        } catch (error) {
            Swal.fire('Error', 'Gagal menyimpan pengaturan', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Derived values from debug_info ──
    const dbg = settings.debug_info || {};
    const sisaBudget = settings.calculated_daily_budget || 0;
    const todayExpenseOnly = dbg.todayExpenseOnly || 0;
    const dailyAllowance = dbg.dailyAllowance || 0;
    const adjustedDailyBudget = dbg.adjustedDailyBudget || dailyAllowance;
    // Availability today = adjusted daily budget (what you had available today before spending)
    const todayAvailability = adjustedDailyBudget;
    const progressPercent = todayAvailability > 0 ? Math.min((todayExpenseOnly / todayAvailability) * 100, 100) : 0;
    const isNegative = sisaBudget < 0;

    // Format helpers
    const fmt = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    const fmtShortDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const fmtDayDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/settings')}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Budget Harian</h1>
                </div>
            </div>

            {loading ? (
                <div className="p-4 space-y-4">
                    <div className="skeleton h-40 rounded-3xl w-full" />
                    <div className="skeleton h-64 rounded-3xl w-full" />
                </div>
            ) : (
                <div className="p-4 pb-32 space-y-5 flex-1 relative z-10">

                    {/* ═══════════ HERO STATUS CARD ═══════════ */}
                    <div className={cn(
                        "rounded-3xl p-6 text-white overflow-hidden relative",
                        theme === 'neo-brutalism'
                            ? "bg-[#C4E4D3] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]"
                            : "bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 shadow-lg"
                    )}>
                        {/* Decorative */}
                        {theme !== 'neo-brutalism' && (
                            <>
                                <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                            </>
                        )}

                        <div className="relative z-10 space-y-3">
                            {/* Row 1: Label + Badge */}
                            <div className="flex items-center justify-between">
                                <p className={cn("text-sm font-medium", theme === 'neo-brutalism' ? "text-gray-800" : "text-gray-300")}>Sisa Budget Hari Ini</p>
                                <span className={cn(
                                    "text-[10px] font-bold px-2.5 py-1 rounded-full",
                                    settings.mode === 'formula' ? "bg-blue-500/30 text-blue-300" : "bg-amber-500/30 text-amber-300",
                                    theme === 'neo-brutalism' && (settings.mode === 'formula' ? "bg-blue-200 text-blue-800 border border-blue-800" : "bg-amber-200 text-amber-800 border border-amber-800")
                                )}>
                                    {settings.mode === 'formula' ? 'Pintar' : 'Manual'}
                                </span>
                            </div>

                            {/* Row 2: Big Number */}
                            <h2 className={cn(
                                "text-4xl font-extrabold tracking-tight tabular-nums",
                                isNegative ? "text-red-500" : (theme === 'neo-brutalism' ? "text-gray-900" : "text-white")
                            )}>
                                {fmt(sisaBudget)}
                            </h2>

                            {/* Row 3: Subtitle — Period + Daily Allowance */}
                            {dbg.startDate && (
                                <p className={cn("text-xs", theme === 'neo-brutalism' ? "text-gray-600 font-medium" : "text-gray-400")}>
                                    Periode: {fmtShortDate(dbg.startDate)} – {fmtShortDate(dbg.endDate)} &nbsp;|&nbsp; Jatah Hari Ini: {fmt(adjustedDailyBudget)}/hari
                                </p>
                            )}

                            {/* Row 4: Progress bar — Today's expense */}
                            <div className="space-y-1.5 pt-1">
                                <div className={cn("flex justify-between text-xs", theme === 'neo-brutalism' ? "text-gray-700 font-medium" : "text-gray-400")}>
                                    <span>Terpakai Hari Ini: {fmt(todayExpenseOnly)}</span>
                                    <span>{progressPercent.toFixed(0)}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-black/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ delay: 0.3, duration: 0.8, type: 'spring' }}
                                        className={cn(
                                            "h-full rounded-full",
                                            progressPercent >= 90 ? "bg-red-400" : progressPercent >= 70 ? "bg-yellow-400" : "bg-emerald-400"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════ SETTINGS CARD ═══════════ */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-0">Pengaturan Budget</h3>
                            <button
                                onClick={handleToggleActive}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent focus:ring-primary-500/50",
                                    settings.is_active ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                                    settings.is_active ? "translate-x-6" : "translate-x-1"
                                )} />
                            </button>
                        </div>

                        {!settings.is_active && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl text-center mb-5">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Fitur budget harian saat ini dinonaktifkan.
                                </p>
                            </div>
                        )}

                        <AnimatePresence>
                            {settings.is_active && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-5"
                                >
                                    {/* Mode Selection */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Metode Budget</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                            <button
                                                onClick={() => handleChange('mode', 'manual')}
                                                className={cn(
                                                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                                                    settings.mode === 'manual' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" : "text-gray-500"
                                                )}
                                            >
                                                Manual
                                            </button>
                                            <button
                                                onClick={() => handleChange('mode', 'formula')}
                                                className={cn(
                                                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
                                                    settings.mode === 'formula' ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" : "text-gray-500"
                                                )}
                                            >
                                                Formula Pintar
                                            </button>
                                        </div>
                                    </div>

                                    {settings.mode === 'manual' ? (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Limit Harian</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">Rp</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="0"
                                                    value={formatInputValue(settings.manual_daily_amount)}
                                                    onChange={e => handleCurrencyInput('manual_daily_amount', e.target.value)}
                                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl flex gap-3 text-blue-700 dark:text-blue-400">
                                                <Info className="w-5 h-5 shrink-0" />
                                                <p className="text-xs">
                                                    Formula menghitung sisa dana (Pendapatan - Beban Tetap - Tabungan) dibagi jumlah hari dalam siklus.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Pendapatan Bulanan</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">Rp</span>
                                                    <input type="text" inputMode="numeric" placeholder="0"
                                                        value={formatInputValue(settings.formula_income)}
                                                        onChange={e => handleCurrencyInput('formula_income', e.target.value)}
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Beban Tetap (Cicilan, dll)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">Rp</span>
                                                    <input type="text" inputMode="numeric" placeholder="0"
                                                        value={formatInputValue(settings.formula_fixed_expenses)}
                                                        onChange={e => handleCurrencyInput('formula_fixed_expenses', e.target.value)}
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Target Tabungan</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">Rp</span>
                                                    <input type="text" inputMode="numeric" placeholder="0"
                                                        value={formatInputValue(settings.formula_savings_target)}
                                                        onChange={e => handleCurrencyInput('formula_savings_target', e.target.value)}
                                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 mt-4 block">Tanggal Reset / Gajian</label>
                                        <input
                                            type="number" min="1" max="31"
                                            value={settings.reset_day}
                                            onChange={e => handleChange('reset_day', Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Live Preview */}
                                    <div className="pt-4 mt-5">
                                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-3">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                <Info className="w-4 h-4 text-primary-600" />
                                                Live Preview Hitungan
                                            </h4>
                                            {dbg.error ? (
                                                <p className="text-sm text-red-500">{dbg.error}</p>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs">Siklus</span>
                                                        <span className="font-semibold text-xs">{dbg.startDate ? `${fmtShortDate(dbg.startDate)} - ${fmtShortDate(dbg.endDate)}` : '-'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs">Total Hari Siklus</span>
                                                        <span className="font-semibold">{dbg.totalDaysInCycle || 0} Hari</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs">Hari Berjalan (Hari ke-)</span>
                                                        <span className="font-semibold">{dbg.daysPassedInCycle || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs">Subtotal Budget Siklus</span>
                                                        <span className="font-semibold">{fmt(dbg.monthlySubtotal || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs">Total Pengeluaran Siklus</span>
                                                        <span className="font-semibold text-red-500">{fmt(dbg.totalExpenses || 0)}</span>
                                                    </div>
                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs font-semibold">Jatah Default Per Hari</span>
                                                        <span className="font-bold text-primary-600">{fmt(dbg.dailyAllowance || 0)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500 text-xs font-semibold">Jatah Hari Ini (Redistribusi)</span>
                                                        <span className="font-bold text-emerald-600">{fmt(dbg.adjustedDailyBudget || 0)}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={cn(
                                            "w-full py-3.5 font-bold rounded-xl flex items-center justify-center gap-2 mt-4 transition-all duration-200",
                                            theme === 'neo-brutalism'
                                                ? "bg-[#C4E4D3] text-gray-900 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:bg-[#a9d9bf] disabled:opacity-50"
                                                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-50"
                                        )}
                                    >
                                        <Save className="w-5 h-5" />
                                        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                </div>
            )}
        </div>
    );
}
