import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import DailyBudgetSetting from '@/lib/models/DailyBudgetSetting';
import { query } from '@/lib/db';

function getCycleDatesForDate(resetDay: number, refDate: Date) {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const d = refDate.getDate();

    let startDate, endDate;
    if (d < resetDay) {
        startDate = new Date(y, m - 1, resetDay);
        endDate = new Date(y, m, resetDay - 1);
    } else {
        startDate = new Date(y, m, resetDay);
        endDate = new Date(y, m + 1, resetDay - 1);
    }
    return { startDate, endDate };
}

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
        if (!settings) return NextResponse.json({ success: true, data: [] });

        const resetDay = settings.reset_day || 1;

        // Generate last 6 cycles
        const cycles: any[] = [];
        let refDate = new Date();
        for (let i = 0; i < 6; i++) {
            // Go back i cycles
            const ref = new Date(refDate.getFullYear(), refDate.getMonth() - i, refDate.getDate());
            const { startDate, endDate } = getCycleDatesForDate(resetDay, ref);

            // Avoid duplicate cycles
            const key = fmtDate(startDate);
            if (!cycles.find(c => c.key === key)) {
                cycles.push({ key, startDate, endDate });
            }
        }

        // Also try going further back to ensure we get 6 unique cycles
        for (let i = 6; i < 12 && cycles.length < 6; i++) {
            const ref = new Date(refDate.getFullYear(), refDate.getMonth() - i, refDate.getDate());
            const { startDate, endDate } = getCycleDatesForDate(resetDay, ref);
            const key = fmtDate(startDate);
            if (!cycles.find(c => c.key === key)) {
                cycles.push({ key, startDate, endDate });
            }
        }

        // Sort newest first
        cycles.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

        // Daily allowance
        let dailyAllowance = 0;
        if (settings.mode === 'manual') {
            dailyAllowance = parseFloat(settings.manual_daily_amount) || 0;
        } else {
            const disposable = parseFloat(settings.formula_income) - parseFloat(settings.formula_fixed_expenses) - parseFloat(settings.formula_savings_target);
            dailyAllowance = disposable > 0 ? disposable / 30 : 0;
        }

        // Query expenses for each cycle
        const results = [];
        for (const cycle of cycles) {
            const startStr = fmtDate(cycle.startDate);
            const endStr = fmtDate(new Date(cycle.endDate.getTime() + 86400000));
            const totalDays = diffDays(cycle.startDate, cycle.endDate) + 1;

            // Recalc allowance per cycle for formula mode
            let cycleAllowance = dailyAllowance;
            if (settings.mode === 'formula') {
                const disposable = parseFloat(settings.formula_income) - parseFloat(settings.formula_fixed_expenses) - parseFloat(settings.formula_savings_target);
                cycleAllowance = disposable > 0 ? disposable / totalDays : 0;
            }
            const monthlyBudget = cycleAllowance * totalDays;

            const expResult = await query(`
                SELECT COALESCE(SUM(amount), 0) as total_expense 
                FROM transactions 
                WHERE user_id = $1 
                AND type = 'expense' 
                AND is_excluded_from_budget = FALSE
                AND date >= $2 AND date < $3
            `, [userId, startStr, endStr]);

            results.push({
                key: cycle.key,
                start_date: startStr,
                end_date: fmtDate(cycle.endDate),
                total_days: totalDays,
                total_expense: parseFloat(expResult.rows[0].total_expense) || 0,
                monthly_budget: monthlyBudget,
            });
        }

        return NextResponse.json({ success: true, data: results });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
