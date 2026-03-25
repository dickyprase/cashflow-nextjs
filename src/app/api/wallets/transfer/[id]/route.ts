import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import Wallet from '@/lib/models/Wallet';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const searchParams = request.nextUrl.searchParams;
        const deleteFee = searchParams.get('deleteFee');

        // Check ownership & existence
        const transferTx = await Transaction.findById(id);

        if (!transferTx || transferTx.user_id !== auth.userId || transferTx.type !== 'transfer') {
            return NextResponse.json({
                success: false,
                message: 'Data transfer tidak ditemukan'
            }, { status: 404 });
        }

        // 1. Reverse the main transfer amounts
        // Add back to Sender, Deduct from Receiver
        await Wallet.updateBalance(transferTx.wallet_id, transferTx.amount);
        await Wallet.updateBalance(transferTx.target_wallet_id, -transferTx.amount);

        // 2. Delete the main transfer record
        await Transaction.delete(id, auth.userId);

        // 3. Handle the fee if requested and it exists
        if (deleteFee === 'true' && transferTx.admin_fee_transaction_id) {
            // Refund the fee to the sender wallet
            await Wallet.updateBalance(transferTx.wallet_id, transferTx.admin_fee);
            // Delete the fee record
            await Transaction.delete(transferTx.admin_fee_transaction_id, auth.userId);
        }

        return NextResponse.json({
            success: true,
            message: 'Transfer berhasil dibatalkan dan dikembalikan'
        });
    } catch (error: any) {
        console.error('Delete transfer error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menghapus transfer'
        }, { status: 500 });
    }
}
