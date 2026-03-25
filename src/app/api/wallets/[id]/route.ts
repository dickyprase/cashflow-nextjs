import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Wallet from '@/lib/models/Wallet';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const wallet = await Wallet.findByIdAndUser(id, auth.userId);

        if (!wallet) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: wallet
        });
    } catch (error: any) {
        console.error('Get wallet error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat wallet'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const body = await request.json();
        const { name, type, color, icon, is_default, is_active, balance } = body;

        // Check ownership
        const existing = await Wallet.findByIdAndUser(id, auth.userId);
        if (!existing) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        const wallet = await Wallet.update(id, auth.userId, {
            name,
            type,
            color,
            icon,
            is_default,
            is_active,
            balance
        });

        return NextResponse.json({
            success: true,
            message: 'Wallet berhasil diperbarui',
            data: wallet
        });
    } catch (error: any) {
        console.error('Update wallet error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memperbarui wallet'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;

        // Check ownership
        const existing = await Wallet.findByIdAndUser(id, auth.userId);
        if (!existing) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        // Check if it's the only active wallet
        const wallets = await Wallet.findByUserId(auth.userId);
        if (wallets.length <= 1) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menghapus wallet terakhir'
            }, { status: 400 });
        }

        await Wallet.delete(id, auth.userId);

        return NextResponse.json({
            success: true,
            message: 'Wallet berhasil dihapus'
        });
    } catch (error: any) {
        console.error('Delete wallet error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menghapus wallet'
        }, { status: 500 });
    }
}
