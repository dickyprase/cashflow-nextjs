import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import DailyBudgetSetting from '@/lib/models/DailyBudgetSetting';
import { query } from '@/lib/db';
import { getActiveCycleDates } from '../utils';

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
        const settings = await DailyBudgetSetting.findByUserId(userId);
        if (!settings || !settings.is_active) return NextResponse.json({ success: true, data: [] });

        const resetDay = settings.reset_day || 1;
        const { startDate, endDate } = getActiveCycleDates(resetDay);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDaysInCycle = diffDays(startDate, endDate) + 1;

        // Daily allowance
        let dailyAllowance = 0;
        if (settings.mode === 'manual') {
            dailyAllowance = parseFloat(settings.manual_daily_amount) || 0;
        } else {
            const disposable = parseFloat(settings.formula_income) - parseFloat(settings.formula_fixed_expenses) - parseFloat(settings.formula_savings_target);
            dailyAllowance = disposable > 0 ? disposable / totalDaysInCycle : 0;
        }

        // Total expenses up to today
        const startStr = fmtDate(startDate);
        const tomorrowStr = fmtDate(new Date(today.getTime() + 86400000));

        const expResult = await query(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE user_id = $1 
            AND type = 'expense' 
            AND is_excluded_from_budget = FALSE
            AND date >= $2 AND date < $3
        `, [userId, startStr, tomorrowStr]);
        const totalExpensesToday = parseFloat(expResult.rows[0].total) || 0;

        const daysPassedInCycle = diffDays(startDate, today) + 1;

        // Build forecast array for each day from today to endDate
        const forecast = [];
        for (let dayIndex = daysPassedInCycle; dayIndex <= totalDaysInCycle; dayIndex++) {
            const forecastDate = new Date(startDate.getTime() + (dayIndex - 1) * 86400000);
            const limitUpToDay = dailyAllowance * dayIndex;
            const projected = limitUpToDay - totalExpensesToday; // assuming no more spending

            forecast.push({
                date: fmtDate(forecastDate),
                day_number: dayIndex,
                projected_remaining: Math.round(projected),
                daily_allowance: Math.round(dailyAllowance),
                is_today: dayIndex === daysPassedInCycle
            });
        }

        return NextResponse.json({ success: true, data: forecast });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
