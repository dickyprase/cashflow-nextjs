import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Wallet from '@/lib/models/Wallet';
import Transaction from '@/lib/models/Transaction';
import ActivityLog from '@/lib/models/ActivityLog';

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { from_wallet_id, to_wallet_id, amount, fee = 0, description } = body;

        // Validate input
        if (!from_wallet_id || !to_wallet_id || !amount) {
            return NextResponse.json({
                success: false,
                message: 'Data transfer tidak lengkap'
            }, { status: 400 });
        }

        if (from_wallet_id === to_wallet_id) {
            return NextResponse.json({
                success: false,
                message: 'Wallet sumber dan tujuan tidak boleh sama'
            }, { status: 400 });
        }

        if (amount <= 0 || fee < 0) {
            return NextResponse.json({
                success: false,
                message: 'Jumlah transfer dan fee harus valid (Transfer > 0, Fee >= 0)'
            }, { status: 400 });
        }

        // Check ownership of both wallets
        const fromWallet = await Wallet.findByIdAndUser(from_wallet_id, auth.userId);
        const toWallet = await Wallet.findByIdAndUser(to_wallet_id, auth.userId);

        if (!fromWallet || !toWallet) {
            return NextResponse.json({
                success: false,
                message: 'Wallet tidak ditemukan'
            }, { status: 404 });
        }

        // Check balance (Transfer amount + Fee)
        const totalDeduction = amount + fee;
        if (fromWallet.balance < totalDeduction) {
            return NextResponse.json({
                success: false,
                message: `Saldo tidak mencukupi. Total potongan (Transfer + Fee) melebihi saldo. Saldo ${fromWallet.name}: Rp ${Number(fromWallet.balance).toLocaleString('id-ID')}`
            }, { status: 400 });
        }

        // Perform transfer
        const result = await Wallet.transfer(auth.userId, from_wallet_id, to_wallet_id, amount);

        // Handle fee deduction if applicable
        if (fee > 0) {
            await Wallet.updateBalance(from_wallet_id, -fee);
        }

        // Create transfer transaction records
        try {
            const d = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            let feeTransactionId = null;

            // 1. Create Fee Record (Expense) FIRST, so we get the ID
            if (fee > 0) {
                const feeTx = await Transaction.create(auth.userId, {
                    category_id: null,
                    wallet_id: from_wallet_id,
                    target_wallet_id: null,
                    amount: fee,
                    type: 'expense',
                    transaction_type: 'expense',
                    description: `Biaya admin transfer ${fromWallet.name} ke ${toWallet.name} Rp ${new Intl.NumberFormat('id-ID').format(amount)}`,
                    date: today,
                    is_excluded_from_budget: true,
                    is_system_generated: true
                });
                feeTransactionId = feeTx.id;
            }

            // 2. Create Transfer Record linking the fee
            await Transaction.createTransfer(auth.userId, {
                wallet_id: from_wallet_id,
                target_wallet_id: to_wallet_id,
                amount,
                description: description ? `${description} (ke ${toWallet.name})` : `Transfer ke ${toWallet.name}`,
                date: today,
                admin_fee: fee,
                admin_fee_transaction_id: feeTransactionId
            });

        } catch (txError) {
            console.error('Failed to create transfer record:', txError);
            // Don't fail the transfer itself if DB logging fails
        }

        return NextResponse.json({
            success: true,
            message: 'Transfer berhasil',
            data: result
        });
    } catch (error: any) {
        console.error('Transfer error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Gagal melakukan transfer'
        }, { status: 500 });
    }
}
