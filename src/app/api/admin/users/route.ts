import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');
        const role = searchParams.get('role');
        const is_active_str = searchParams.get('is_active');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const is_active = is_active_str ? parseInt(is_active_str) : undefined;

        const users = await User.getAll({
            search,
            role,
            is_active,
            limit,
            offset
        });

        const total = await User.count({
            search,
            role,
            is_active
        });

        return NextResponse.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat daftar user'
        }, { status: 500 });
    }
}
