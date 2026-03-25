import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import Category from '@/lib/models/Category';
import Wallet from '@/lib/models/Wallet';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, email, password } = body;

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json({
                success: false,
                message: 'Username, email, dan password wajib diisi'
            }, { status: 400 });
        }

        if (username.length < 3) {
            return NextResponse.json({
                success: false,
                message: 'Username minimal 3 karakter'
            }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'Password minimal 6 karakter'
            }, { status: 400 });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: 'Format email tidak valid'
            }, { status: 400 });
        }

        // Check if user exists
        if (await User.emailExists(email)) {
            return NextResponse.json({
                success: false,
                message: 'Email sudah terdaftar'
            }, { status: 400 });
        }

        if (await User.usernameExists(username)) {
            return NextResponse.json({
                success: false,
                message: 'Username sudah digunakan'
            }, { status: 400 });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const userId = await User.create(username, email, passwordHash);

        // Create default categories for new user
        await Category.createDefaults(userId);

        // Create default wallet for new user
        await Wallet.createDefaultWallet(userId);

        // Get user with role
        const user = await User.findById(userId);

        // Generate token with role
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any }
        );

        return NextResponse.json({
            success: true,
            message: 'Registrasi berhasil',
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
        }, { status: 201 });
    } catch (error: any) {
        console.error('Register error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
