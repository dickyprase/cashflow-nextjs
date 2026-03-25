import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Goal from '@/lib/models/Goal';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const data = await Goal.getDashboardData(auth.userId);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error('Get dashboard widgets error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mengambil data dashboard'
        }, { status: 500 });
    }
}
