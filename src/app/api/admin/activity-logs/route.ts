import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const logs = await ActivityLog.getRecent(limit, offset);
        const stats = await ActivityLog.getStats();

        return NextResponse.json({
            success: true,
            data: logs,
            stats
        });
    } catch (error: any) {
        console.error('Get activity logs error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat log aktivitas'
        }, { status: 500 });
    }
}
