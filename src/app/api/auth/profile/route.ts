import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const user = await User.findById(auth.userId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Get profile error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { username, email, avatar = null } = body;

        const user = await User.updateProfile(auth.userId, { username, email, avatar });

        return NextResponse.json({
            success: true,
            message: 'Profil berhasil diperbarui',
            data: user
        });
    } catch (error: any) {
        console.error('Update profile error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
