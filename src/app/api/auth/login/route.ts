import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { loginId, password } = body;

        // Validation
        if (!loginId || !password) {
            return NextResponse.json({
                success: false,
                message: 'Username/Email dan password wajib diisi'
            }, { status: 400 });
        }

        // Find user
        const user = await User.findByEmailOrUsername(loginId);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'Username/Email atau password salah'
            }, { status: 401 });
        }

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json({
                success: false,
                message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.'
            }, { status: 403 });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return NextResponse.json({
                success: false,
                message: 'Username/Email atau password salah'
            }, { status: 401 });
        }

        // Generate token with role
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
        );

        return NextResponse.json({
            success: true,
            message: 'Login berhasil',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar
                },
                token
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
