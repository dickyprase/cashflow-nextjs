import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Wallet from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get('limit') || '50';

        // Check ownership
        const wallet = await Wallet.findByIdAndUser(id, auth.userId);
        if (!wallet) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        const transactions = await Transaction.findByWalletId(id, auth.userId, parseInt(limit));

        return NextResponse.json({
            success: true,
            data: {
                wallet,
                transactions
            }
        });
    } catch (error: any) {
        console.error('Get wallet transactions error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat transaksi wallet'
        }, { status: 500 });
    }
}
