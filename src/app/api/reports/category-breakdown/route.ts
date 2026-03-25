import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const type = searchParams.get('type') || 'expense';

        // Default to current year/month if not provided
        const now = new Date();
        const targetYear = year ? parseInt(year) : now.getFullYear();

        let startDate, endDate;
        if (month) {
            // Specific month
            startDate = `${targetYear}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(targetYear, parseInt(month), 0).getDate();
            endDate = `${targetYear}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        } else {
            // Whole year
            startDate = `${targetYear}-01-01`;
            endDate = `${targetYear}-12-31`;
        }

        const breakdown = await Transaction.getCategoryBreakdown(auth.userId, startDate, endDate, type);

        return NextResponse.json({
            success: true,
            data: breakdown
        });
    } catch (error: any) {
        console.error('Get category breakdown error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
