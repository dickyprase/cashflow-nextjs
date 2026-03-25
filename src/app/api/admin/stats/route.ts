import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const userStats = await User.getStats();
        const activityStats = await ActivityLog.getStats();

        return NextResponse.json({
            success: true,
            data: {
                users: userStats,
                activity: activityStats
            }
        });
    } catch (error: any) {
        console.error('Get global stats error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat statistik'
        }, { status: 500 });
    }
}
