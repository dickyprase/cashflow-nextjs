"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, Wallet, Plus, ArrowRight,
    ChevronRight, Sparkles, Target, PieChart, Eye, EyeOff, AlertCircle, X, CheckCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { formatCurrency, formatDate, getGreeting, cn, formatTime } from '@/lib/utils';
import type { Transaction } from '@/types';
import { CardSkeleton } from '@/components/Skeleton';
import { MonthlyActivityCalendar } from '@/components/MonthlyActivityCalendar';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
};

export function DashboardPage() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [siteName, setSiteName] = useState('Cashflow');
    const [chartData, setChartData] = useState<any[]>([]);
    const [dailyBudget, setDailyBudget] = useState<number>(0);
    const [budgetDebugInfo, setBudgetDebugInfo] = useState<any>(null);
    const [goalsSummary, setGoalsSummary] = useState({ totalTarget: 0, totalCurrent: 0, activeCount: 0 });
    const [achievedGoals, setAchievedGoals] = useState<any[]>([]);
    const [dailyActivity, setDailyActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Alert dismissals
    const [dismissedOverbudget, setDismissedOverbudget] = useState(false);
    const [dismissedGoalIds, setDismissedGoalIds] = useState<Set<number>>(new Set());

    // Slider states
    const [[page, direction], setPage] = useState([0, 0]);

    // Compute active index from continuously moving page value
    const slideIndex = ((page % 3) + 3) % 3;

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    // Initialize showBalance from localStorage
    const [showBalance, setShowBalance] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('cashflow_show_balance');
            return stored !== 'false';
        }
        return true;
    });
    const [showBudget, setShowBudget] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('cashflow_show_budget');
            return stored !== 'false';
        }
        return true;
    });
    const [showGoals, setShowGoals] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('cashflow_show_goals');
            return stored !== 'false';
        }
        return true;
    });

    // Toggle and save preference
    const toggleBalance = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newVal = !showBalance;
        setShowBalance(newVal);
        localStorage.setItem('cashflow_show_balance', newVal.toString());
    };
    const toggleBudget = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newVal = !showBudget;
        setShowBudget(newVal);
        localStorage.setItem('cashflow_show_budget', newVal.toString());
    };
    const toggleGoals = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newVal = !showGoals;
        setShowGoals(newVal);
        localStorage.setItem('cashflow_show_goals', newVal.toString());
    };

    // Format helper for censored text
    const formatCensoredCurrency = (amount: number) => {
        if (!showBalance) return 'Rp •••••••';
        return formatCurrency(amount);
    };
    const formatCensoredBudget = (amount: number) => {
        if (!showBudget) return 'Rp •••••••';
        return formatCurrency(amount);
    };
    const formatCensoredGoals = (amount: number) => {
        if (!showGoals) return 'Rp •••••••';
        return formatCurrency(amount);
    };

    useEffect(() => {
        loadDashboard();

        // Re-fetch when user navigates back to this page or tab
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadDashboard();
            }
        };
        const handleFocus = () => loadDashboard();

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const loadDashboard = async () => {
        try {
            const [dashRes, chartRes, settingsRes, budgetRes, goalsRes, activityRes] = await Promise.all([
                api.get('/dashboard/summary'),
                api.get('/dashboard/chart'),
                api.get('/site/settings').catch(() => ({ data: { data: {} } })),
                api.get('/daily-budget').catch(() => ({ data: { data: { calculated_daily_budget: 0 } } })),
                api.get('/goals').catch(() => ({ data: { data: [] } })),
                api.get('/dashboard/calendar').catch(() => ({ data: { data: [] } }))
            ]);
            setData(dashRes.data.data);
            if (settingsRes.data?.data?.site_name) {
                setSiteName(settingsRes.data.data.site_name);
            }
            if (chartRes.data.data) {
                setChartData(chartRes.data.data.map((d: any) => ({
                    label: d.month,
                    income: d.income,
                    expense: d.expense,
                })));
            }
            if (budgetRes.data?.data) {
                setDailyBudget(budgetRes.data.data.calculated_daily_budget || 0);
                setBudgetDebugInfo(budgetRes.data.data.debug_info || null);
            }
            if (goalsRes.data?.data) {
                const activeGoals = goalsRes.data.data.filter((g: any) => g.status === 'active' && !g.is_locked);
                const totalTarget = activeGoals.reduce((sum: number, g: any) => sum + (Number(g.target_amount) || 0), 0);
                const totalCurrent = activeGoals.reduce((sum: number, g: any) => sum + (Number(g.current_amount) || 0), 0);
                const justAchieved = activeGoals.filter((g: any) => Number(g.current_amount) >= Number(g.target_amount));
                setGoalsSummary({ totalTarget, totalCurrent, activeCount: activeGoals.length });
                setAchievedGoals(justAchieved);
            }
            if (activityRes.data?.data) {
                setDailyActivity(activityRes.data.data);
            }
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="px-4 pt-6 pb-safe space-y-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>
        );
    }

    const balance = data?.allTime?.balance ?? 0;
    const todayIncome = data?.today?.income ?? 0;
    const todayExpenseDisplay = data?.today?.expense ?? 0;
    const recentTransactions: Transaction[] = data?.recentTransactions || [];

    const todayExpense = data?.today?.expense ?? 0;
    const todayBudgetExpense = budgetDebugInfo?.todayExpenseOnly ?? (data?.today?.budget_expense ?? todayExpense);
    const sisaBudgetHariIni = dailyBudget; // backend already returns rollover value
    const dailyAllowance = budgetDebugInfo?.adjustedDailyBudget || budgetDebugInfo?.dailyAllowance || 0;
    // Availability = sisa budget + today's expense (what was available today before spending)
    const todayAvailability = sisaBudgetHariIni + todayBudgetExpense;
    const budgetProgress = todayAvailability > 0 ? Math.min((todayBudgetExpense / todayAvailability) * 100, 100) : 0;
    const budgetIsNegative = sisaBudgetHariIni < 0;
    const goalsProgress = goalsSummary.totalTarget > 0 ? Math.min((goalsSummary.totalCurrent / goalsSummary.totalTarget) * 100, 100) : 0;

    const fmtShortDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const sliderVariants = {
        enter: (dir: number) => ({
            x: dir > 0 ? '100%' : '-100%',
            opacity: 0,
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            zIndex: 0,
            x: dir < 0 ? '100%' : '-100%',
            opacity: 0,
        }),
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="px-4 pt-6 pb-safe"
        >
            {/* Header greeting */}
            <motion.div variants={itemVariants} className="mb-6 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        <p className="text-base text-gray-500 dark:text-gray-400 font-medium">{getGreeting()},</p>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        {user?.full_name || user?.username || 'User'}
                    </h1>
                </div>
                <div className="mt-2">
                    <span
                        className="text-2xl font-extrabold tracking-tighter bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent drop-shadow-sm"
                    >
                        {siteName}
                    </span>
                </div>
            </motion.div>

            {/* Over Budget Alert */}
            {budgetDebugInfo?.is_active !== false && dailyAllowance > 0 && todayBudgetExpense > dailyAllowance && !dismissedOverbudget && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3 relative"
                >
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 pr-6">
                        <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                            Warning: Over Budget!
                        </h4>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                            Pengeluaran hari ini ({formatCurrency(todayBudgetExpense)}) telah melebihi batas budget yang ditentukan ({formatCurrency(dailyAllowance)}).
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissedOverbudget(true)}
                        className="absolute right-2 top-2 p-1 rounded-lg text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}

            {/* Goal Achieved Alerts */}
            {achievedGoals.map((goal) => {
                if (dismissedGoalIds.has(goal.id)) return null;
                return (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-3 relative"
                    >
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div className="flex-1 pr-6">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
                                Goals "{goal.name}" terpenuhi
                            </h4>
                            <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                                Selamat! Target untuk goals ini telah terkumpul 100%. Jangan lupa ubah statusnya di halaman Goals.
                            </p>
                        </div>
                        <button
                            onClick={() => setDismissedGoalIds(prev => new Set([...prev, goal.id]))}
                            className="absolute right-2 top-2 p-1 rounded-lg text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                );
            })}

            {/* Swipeable Hero Cards - Infinite Slider */}
            <motion.div variants={itemVariants} className="relative w-full h-[220px] mb-6 rounded-[24px]" style={{ touchAction: 'pan-y' }}>
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={sliderVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 220, damping: 28, mass: 0.8 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.x < -20 || velocity.x < -200) {
                                paginate(1);
                            } else if (offset.x > 20 || velocity.x > 200) {
                                paginate(-1);
                            }
                        }}
                        className={cn("absolute inset-0 w-full h-full rounded-[24px]", theme !== 'neo-brutalism' && "overflow-hidden")}
                    >
                        {slideIndex === 0 && (
                            <div className={cn(
                                "w-full h-full p-6 relative flex flex-col justify-between",
                                theme === 'neo-brutalism'
                                    ? "bg-[#FFDCA8] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] rounded-[24px]"
                                    : "bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 text-white"
                            )}
                                onClick={() => { /* Do nothing for total balance */ }}
                            >
                                {theme !== 'neo-brutalism' && (
                                    <>
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                                    </>
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 opacity-80" />
                                            <span className={cn("text-sm", theme === 'neo-brutalism' ? "font-medium text-gray-800" : "opacity-80")}>Total Saldo</span>
                                        </div>
                                        <button onClick={toggleBalance} className={cn("p-1.5 -mr-1.5 rounded-full z-20 cursor-pointer transition-colors", theme === 'neo-brutalism' ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20")}>
                                            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className={cn("w-4 h-4", theme === 'neo-brutalism' ? "text-gray-500" : "text-white/60")} />}
                                        </button>
                                    </div>
                                    <p className={cn("text-3xl font-bold tabular-nums mb-2", theme === 'neo-brutalism' ? "text-gray-900" : "")}>{formatCensoredCurrency(balance)}</p>
                                </div>

                                <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
                                    <div className={cn("backdrop-blur-sm rounded-2xl p-3", theme === 'neo-brutalism' ? "bg-black/5 border border-black/10" : "bg-white/15")}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            <span className={cn("text-xs opacity-80", theme === 'neo-brutalism' ? "font-medium text-gray-800 opacity-100" : "")}>Pemasukan Hari Ini</span>
                                        </div>
                                        <p className="text-sm sm:text-lg font-semibold tabular-nums">{formatCensoredCurrency(todayIncome)}</p>
                                    </div>
                                    <div className={cn("backdrop-blur-sm rounded-2xl p-3", theme === 'neo-brutalism' ? "bg-black/5 border border-black/10" : "bg-white/15")}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <TrendingDown className="w-3.5 h-3.5" />
                                            <span className={cn("text-xs opacity-80", theme === 'neo-brutalism' ? "font-medium text-gray-800 opacity-100" : "")}>Pengeluaran Hari Ini</span>
                                        </div>
                                        <p className="text-sm sm:text-lg font-semibold tabular-nums">{formatCensoredCurrency(todayExpenseDisplay)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {slideIndex === 1 && (
                            <div className={cn(
                                "w-full h-full p-6 relative flex flex-col justify-between cursor-pointer",
                                theme === 'neo-brutalism'
                                    ? "bg-[#C4E4D3] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] rounded-[24px]"
                                    : "bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 text-white"
                            )}
                                onClick={() => router.push('/budget')}
                            >
                                {theme !== 'neo-brutalism' && (
                                    <>
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                                    </>
                                )}

                                {budgetDebugInfo?.is_active === false ? (
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full mt-2 text-center">
                                        <Wallet className={cn("w-10 h-10 mb-3", theme === 'neo-brutalism' ? "text-gray-500" : "text-white/30")} />
                                        <p className={cn("text-sm font-semibold", theme === 'neo-brutalism' ? "text-gray-900" : "text-gray-200")}>Fitur Budget Dinonaktifkan</p>
                                        <p className={cn("text-[11px] mt-1 max-w-[200px]", theme === 'neo-brutalism' ? "text-gray-700" : "text-gray-400")}>Aktifkan di menu budget atau klik banner ini.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative z-10">
                                            {/* Row 1: Label + Badge + Eye */}
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn("text-sm", theme === 'neo-brutalism' ? "font-medium text-gray-800" : "text-gray-300")}>Sisa Budget Hari Ini</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                                                        budgetDebugInfo?.mode === 'formula' ? "bg-blue-500/30 text-blue-300" : "bg-amber-500/30 text-amber-300",
                                                        theme === 'neo-brutalism' && (budgetDebugInfo?.mode === 'formula' ? "bg-blue-200 text-blue-800 border border-blue-800" : "bg-amber-200 text-amber-800 border border-amber-800")
                                                    )}>
                                                        {budgetDebugInfo?.mode === 'formula' ? 'Pintar' : 'Manual'}
                                                    </span>
                                                    <button onClick={toggleBudget} className={cn("p-1.5 rounded-full transition-colors z-20 cursor-pointer", theme === 'neo-brutalism' ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20")}>
                                                        {showBudget ? <Eye className="w-4 h-4" /> : <EyeOff className={cn("w-4 h-4", theme === 'neo-brutalism' ? "text-gray-500" : "text-white/60")} />}
                                                    </button>
                                                    <ArrowRight className="w-4 h-4 opacity-70" />
                                                </div>
                                            </div>

                                            {/* Row 2: Big number */}
                                            <p className={cn(
                                                "text-3xl font-extrabold tabular-nums mb-1",
                                                budgetIsNegative ? "text-red-500" : (theme === 'neo-brutalism' ? "text-gray-900" : "text-white")
                                            )}>
                                                {formatCensoredBudget(sisaBudgetHariIni)}
                                            </p>

                                            {/* Row 3: Subtitle */}
                                            {budgetDebugInfo?.startDate && (
                                                <p className={cn("text-[11px] mb-2", theme === 'neo-brutalism' ? "text-gray-700 font-medium" : "text-gray-400")}>
                                                    {fmtShortDate(budgetDebugInfo.startDate)} – {fmtShortDate(budgetDebugInfo.endDate)} &nbsp;|&nbsp; {formatCensoredBudget(dailyAllowance)}/hari (redistribusi)
                                                </p>
                                            )}
                                        </div>

                                        <div className="relative z-10 mt-auto flex flex-col gap-2">
                                            {/* Progress Bar */}
                                            <div className={cn("flex justify-between text-xs mb-0.5", theme === 'neo-brutalism' ? "text-gray-800 font-medium" : "text-gray-400")}>
                                                <span>Terpakai Hari Ini: {formatCensoredBudget(todayBudgetExpense)}</span>
                                                <span>{budgetProgress.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-black/30 rounded-full overflow-hidden shadow-inner flex border border-black/10">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-1000", budgetProgress >= 90 ? "bg-red-500" : budgetProgress >= 70 ? "bg-yellow-400" : "bg-emerald-500", theme === 'neo-brutalism' ? "border-r border-black/20" : "")}
                                                    style={{ width: `${budgetProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {slideIndex === 2 && (
                            <div className={cn(
                                "w-full h-full p-6 relative flex flex-col justify-between cursor-pointer",
                                theme === 'neo-brutalism'
                                    ? "bg-[#E0D8FA] text-gray-900 border-[4px] border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] rounded-[24px]"
                                    : "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 text-white"
                            )}
                                onClick={() => router.push('/goals')}
                            >
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
                                            <span className="text-sm opacity-80">Target Goals ({goalsSummary.activeCount})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={toggleGoals} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer">
                                                {showGoals ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-white/60" />}
                                            </button>
                                            <ArrowRight className="w-4 h-4 opacity-70 ml-1" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold tabular-nums mb-2">{formatCensoredGoals(goalsSummary.totalTarget)}</p>
                                </div>

                                <div className="relative z-10 mt-auto flex flex-col gap-2">
                                    {/* Progress Bar */}
                                    <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-white transition-all duration-1000"
                                            style={{ width: `${goalsProgress}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    <span className="text-xs opacity-80">Terkumpul</span>
                                                </div>
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20">{goalsProgress.toFixed(0)}%</span>
                                            </div>
                                            <p className="text-sm font-semibold tabular-nums">{formatCensoredGoals(goalsSummary.totalCurrent)}</p>
                                        </div>
                                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-2.5">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Target className="w-3.5 h-3.5" />
                                                <span className="text-xs opacity-80">Kekurangan</span>
                                            </div>
                                            <p className="text-sm font-semibold tabular-nums">{formatCensoredGoals(Math.max(0, goalsSummary.totalTarget - goalsSummary.totalCurrent))}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/transactions/add')}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm card-hover border border-gray-100 dark:border-gray-800"
                >
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tambah Transaksi</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/categories')}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm card-hover border border-gray-100 dark:border-gray-800"
                >
                    <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-950/50 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</span>
                </motion.button>
            </motion.div>

            {/* Quick Actions Note: We removed the old Widgets section as they are now hero cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/reports')}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm card-hover border border-gray-100 dark:border-gray-800"
                >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Laporan</span>
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/budget')}
                    className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm card-hover border border-gray-100 dark:border-gray-800"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Budgeting</span>
                </motion.button>
            </motion.div>

            {/* Chart */}
            {chartData.length > 0 && (
                <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Grafik Bulanan</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Ringkasan Pemasukan & Pengeluaran</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] text-gray-500 whitespace-nowrap">Total Pemasukan</p>
                            <p className="text-sm font-bold text-income">{formatCurrency(chartData.reduce((sum, d) => sum + (d.income || 0), 0))}</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis hide />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(255,255,255,0.95)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    fontSize: '12px',
                                }}
                                formatter={(value: any) => formatCurrency(Number(value))}
                            />
                            <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Monthly Activity Calendar */}
            <MonthlyActivityCalendar
                data={dailyActivity}
                year={new Date().getFullYear()}
                month={new Date().getMonth() + 1}
            />

            {/* Recent Transactions */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between p-5 pb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Transaksi Terbaru</h3>
                    <button
                        onClick={() => router.push('/transactions/history')}
                        className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-0.5"
                    >
                        Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {recentTransactions.length > 0 ? (
                    <div className="px-5 pb-5 space-y-2">
                        {recentTransactions.slice(0, 5).map((tx: Transaction, i: number) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-3 py-2"
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                    style={{ backgroundColor: `${tx.category_color || '#e5e7eb'}20` }}
                                >
                                    {tx.category_icon || '💰'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {tx.description || tx.category_name || 'Transaksi'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {formatDate(tx.date)}
                                        {tx.created_at && (
                                            <>
                                                <span> • </span>
                                                <span>{formatTime(tx.created_at)}</span>
                                            </>
                                        )}
                                    </p>
                                </div>
                                <span className={cn(
                                    'text-sm font-semibold tabular-nums',
                                    tx.type === 'income' ? 'text-income' : 'text-expense'
                                )}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="px-5 pb-5 text-center">
                        <p className="text-sm text-gray-400 py-6">Belum ada transaksi</p>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
