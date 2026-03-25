import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Wallet from '@/lib/models/Wallet';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const body = await request.json();
        const { balance } = body;

        if (balance === undefined || balance < 0) {
            return NextResponse.json({
                success: false,
                message: 'Saldo tidak valid'
            }, { status: 400 });
        }

        // Check ownership
        const existing = await Wallet.findByIdAndUser(id, auth.userId);
        if (!existing) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        const wallet = await Wallet.setBalance(id, auth.userId, balance);

        return NextResponse.json({
            success: true,
            message: 'Saldo berhasil diperbarui',
            data: wallet
        });
    } catch (error: any) {
        console.error('Set balance error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memperbarui saldo'
        }, { status: 500 });
    }
}
