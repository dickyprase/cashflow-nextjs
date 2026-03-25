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

export async function GET(request: NextRequest, { params }: { params: Promise<{ startDate: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const userId = auth.userId;
        const startParam = (await params).startDate;
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        const settings = await DailyBudgetSetting.findByUserId(userId);
        if (!settings) return NextResponse.json({ success: true, data: [], total: 0 });

        const resetDay = settings.reset_day || 1;
        const refDate = new Date(startParam + 'T00:00:00');
        const { startDate, endDate } = getCycleDatesForDate(resetDay, refDate);

        const startStr = fmtDate(startDate);
        const endStr = fmtDate(new Date(endDate.getTime() + 86400000));

        // Get daily aggregation
        const result = await query(`
            SELECT 
                date,
                SUM(amount) as daily_total,
                COUNT(*) as tx_count,
                json_agg(json_build_object(
                    'id', id,
                    'description', description,
                    'amount', amount,
                    'category', category
                ) ORDER BY amount DESC) as transactions
            FROM transactions 
            WHERE user_id = $1 
            AND type = 'expense' 
            AND is_excluded_from_budget = FALSE
            AND date >= $2 AND date < $3
            GROUP BY date
            ORDER BY date DESC
            LIMIT $4 OFFSET $5
        `, [userId, startStr, endStr, limit, offset]);

        // Total count of distinct days
        const countResult = await query(`
            SELECT COUNT(DISTINCT date) as total
            FROM transactions 
            WHERE user_id = $1 
            AND type = 'expense' 
            AND is_excluded_from_budget = FALSE
            AND date >= $2 AND date < $3
        `, [userId, startStr, endStr]);

        const total = parseInt(countResult.rows[0].total) || 0;

        return NextResponse.json({
            success: true,
            data: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
