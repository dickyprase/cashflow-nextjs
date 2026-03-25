import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const yearStr = searchParams.get('year');
        const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();

        const monthlyData = await Transaction.getMonthlyTrend(auth.userId, year);

        // Fill in all 12 months
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const report = monthNames.map((name, index) => {
            const monthNum = (index + 1).toString().padStart(2, '0');
            const found = monthlyData.find((m: any) => m.month === monthNum);
            return {
                month: name,
                monthNumber: index + 1,
                income: found ? found.income : 0,
                expense: found ? found.expense : 0,
                budget_expense: found ? found.budget_expense : 0,
                incidental_expense: found ? found.incidental_expense : 0,
                balance: found ? (found.income - found.expense) : 0
            };
        });

        return NextResponse.json({
            success: true,
            data: report
        });
    } catch (error: any) {
        console.error('Get monthly report error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
