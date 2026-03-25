import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const id = (await params).id;

        // Prevent self-deactivation
        if (parseInt(id) === auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menonaktifkan akun sendiri'
            }, { status: 400 });
        }

        const user = await User.toggleStatus(id);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: user.is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
            resource: 'users',
            resource_id: id
        });

        return NextResponse.json({
            success: true,
            message: user.is_active ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan',
            data: user
        });
    } catch (error: any) {
        console.error('Toggle user status error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mengubah status user'
        }, { status: 500 });
    }
}
