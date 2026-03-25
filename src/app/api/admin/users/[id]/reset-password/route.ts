import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const id = (await params).id;
        const body = await request.json();
        const { new_password } = body;

        if (!new_password || new_password.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'Password minimal 6 karakter'
            }, { status: 400 });
        }

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(new_password, salt);

        await User.updatePassword(id, passwordHash);

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'RESET_PASSWORD',
            resource: 'users',
            resource_id: id
        });

        return NextResponse.json({
            success: true,
            message: 'Password berhasil direset'
        });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mereset password'
        }, { status: 500 });
    }
}
