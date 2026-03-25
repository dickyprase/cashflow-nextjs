import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Wallet from '@/lib/models/Wallet';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const wallets = await Wallet.findByUserIdWithStats(auth.userId);
        const totalBalance = await Wallet.getTotalBalance(auth.userId);

        return NextResponse.json({
            success: true,
            data: wallets,
            totalBalance
        });
    } catch (error: any) {
        console.error('Get wallets error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat daftar wallet'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { name, type, balance, color, icon, is_default } = body;

        if (!name) {
            return NextResponse.json({
                success: false,
                message: 'Nama wallet wajib diisi'
            }, { status: 400 });
        }

        const wallet = await Wallet.create(auth.userId, {
            name,
            type: type || 'cash',
            balance: balance || 0,
            color: color || '#4361ee',
            icon: icon || 'wallet',
            is_default: is_default || 0
        });

        return NextResponse.json({
            success: true,
            message: 'Wallet berhasil dibuat',
            data: wallet
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create wallet error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal membuat wallet'
        }, { status: 500 });
    }
}
