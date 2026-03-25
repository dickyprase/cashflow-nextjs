import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const now = new Date();
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year') || now.getFullYear();
        const month = searchParams.get('month') || (now.getMonth() + 1);

        const dailyData = await Transaction.getDailyActivity(auth.userId, year, month);

        return NextResponse.json({
            success: true,
            data: dailyData
        });
    } catch (error: any) {
        console.error('Get daily activity error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
