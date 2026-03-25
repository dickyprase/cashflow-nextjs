import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';

export async function PUT(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                success: false,
                message: 'Password saat ini dan password baru wajib diisi'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'Password baru minimal 6 karakter'
            }, { status: 400 });
        }

        // Get user with password
        const user = await User.findByIdWithPassword(auth.userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: 'Password saat ini salah'
            }, { status: 401 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.updatePassword(auth.userId, passwordHash);

        return NextResponse.json({
            success: true,
            message: 'Password berhasil diubah'
        });
    } catch (error: any) {
        console.error('Change password error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
