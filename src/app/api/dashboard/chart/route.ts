import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year') || new Date().getFullYear();
        const monthlyData = await Transaction.getMonthlyTrend(auth.userId, year);

        // Fill in missing months with zeros
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const chartData = monthNames.map((name, index) => {
            const monthNum = (index + 1).toString().padStart(2, '0');
            const found = monthlyData.find((m: any) => m.month === monthNum);
            return {
                month: name,
                income: found ? found.income : 0,
                expense: found ? found.expense : 0
            };
        });

        return NextResponse.json({
            success: true,
            data: chartData
        });
    } catch (error: any) {
        console.error('Get monthly chart error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
