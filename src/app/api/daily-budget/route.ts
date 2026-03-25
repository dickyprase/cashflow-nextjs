import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import DailyBudgetSetting from '@/lib/models/DailyBudgetSetting';
import Wallet from '@/lib/models/Wallet';
import { query } from '@/lib/db';
import { getActiveCycleDates } from './utils';

function fmtDate(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function diffDays(a: Date, b: Date) {
    const oneDay = 86400000;
    return Math.round(Math.abs(b.getTime() - a.getTime()) / oneDay);
}

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const userId = auth.userId;
        let settings = await DailyBudgetSetting.findByUserId(userId);

        if (!settings) {
            settings = await DailyBudgetSetting.createOrUpdate(userId, {});
        }

        if (!settings.is_active) {
            return NextResponse.json({
                success: true,
                data: {
                    ...settings,
                    calculated_daily_budget: 0,
                    available_balance: 0,
                    debug_info: { is_active: false }
                }
            });
        }

        // Wallet balance
        let availableBalance = null;
        if (settings.wallet_id !== null && settings.wallet_id !== undefined) {
            if (settings.wallet_id === -1) {
                const wallets = await Wallet.findByUserId(userId);
                availableBalance = wallets.reduce((sum: number, w: any) => sum + parseFloat(w.balance), 0);
            } else {
                const wallet = await Wallet.findByIdAndUser(settings.wallet_id, userId);
                if (wallet) availableBalance = parseFloat(wallet.balance) || 0;
            }
        }

        // ── Cycle calculation ──
        const resetDay = settings.reset_day || 1;
        const { startDate, endDate } = getActiveCycleDates(resetDay);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDaysInCycle = diffDays(startDate, endDate) + 1; // inclusive
        const daysPassedInCycle = diffDays(startDate, today) + 1; // include today
        const remainingDays = diffDays(today, endDate); // days after today

        // ── Expenses queries ──
        const startStr = fmtDate(startDate);
        const endStr = fmtDate(new Date(endDate.getTime() + 86400000)); // endDate + 1 day for < comparison
        const todayStr = fmtDate(today);
        const tomorrowStr = fmtDate(new Date(today.getTime() + 86400000));

        // Total expenses in current cycle (budget-included only)
        const cycleExpResult = await query(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE user_id = $1 
            AND type = 'expense' 
            AND is_excluded_from_budget = FALSE
            AND date >= $2 AND date < $3
        `, [userId, startStr, endStr]);
        const totalExpenses = parseFloat(cycleExpResult.rows[0].total) || 0;

        // Today's expenses only (budget-included only)
        const todayExpResult = await query(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE user_id = $1 
            AND type = 'expense' 
            AND is_excluded_from_budget = FALSE
            AND date >= $2 AND date < $3
        `, [userId, todayStr, tomorrowStr]);
        const todayExpenseOnly = parseFloat(todayExpResult.rows[0].total) || 0;

        // ── Daily allowance & rollover ──
        let dailyAllowance = 0;
        let monthlySubtotal = 0;
        let debugInfo = {};

        if (settings.mode === 'manual') {
            dailyAllowance = parseFloat(settings.manual_daily_amount) || 0;
            monthlySubtotal = dailyAllowance * totalDaysInCycle;
        } else {
            // Formula / Smart Mode
            const disposable = parseFloat(settings.formula_income) - parseFloat(settings.formula_fixed_expenses) - parseFloat(settings.formula_savings_target);
            if (disposable <= 0) {
                return NextResponse.json({
                    success: true,
                    data: {
                        ...settings,
                        calculated_daily_budget: 0,
                        available_balance: availableBalance,
                        debug_info: {
                            mode: 'formula',
                            error: 'Pemasukan dikurangi Beban Tetap & Tabungan menghasilkan angka <= 0.'
                        }
                    }
                });
            }
            monthlySubtotal = disposable;
            dailyAllowance = disposable / totalDaysInCycle;
        }

        // CORE FORMULA: Redistribute surplus/deficit across remaining days
        const expensesBeforeToday = totalExpenses - todayExpenseOnly;
        const remainingDaysIncludingToday = remainingDays + 1; // today + days after today
        const remainingBudgetPool = monthlySubtotal - expensesBeforeToday;
        const adjustedDailyBudget = remainingDaysIncludingToday > 0
            ? remainingBudgetPool / remainingDaysIncludingToday
            : 0;
        const sisaBudgetHariIni = adjustedDailyBudget - todayExpenseOnly;

        debugInfo = {
            mode: settings.mode,
            startDate: fmtDate(startDate),
            endDate: fmtDate(endDate),
            totalDaysInCycle,
            daysPassedInCycle,
            remainingDays,
            monthlySubtotal,
            dailyAllowance,
            adjustedDailyBudget,
            expensesBeforeToday,
            remainingBudgetPool,
            totalExpenses,
            todayExpenseOnly,
        };

        return NextResponse.json({
            success: true,
            data: {
                ...settings,
                calculated_daily_budget: sisaBudgetHariIni,
                available_balance: availableBalance,
                debug_info: debugInfo
            }
        });

    } catch (error: any) {
        console.error('Error fetching daily budget:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const userId = auth.userId;
        const data = await request.json();
        const updatedSettings = await DailyBudgetSetting.createOrUpdate(userId, data);

        return NextResponse.json({
            success: true,
            data: updatedSettings,
            message: 'Budget settings updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating daily budget settings:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
