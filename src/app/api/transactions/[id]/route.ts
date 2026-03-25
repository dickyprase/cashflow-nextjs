import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import Category from '@/lib/models/Category';
import Wallet from '@/lib/models/Wallet';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const transaction = await Transaction.findById(id);

        if (!transaction || transaction.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: transaction
        });
    } catch (error: any) {
        console.error('Get single transaction error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const body = await request.json();
        const { category_id, wallet_id, amount, type, description, date, is_excluded_from_budget } = body;

        // Check ownership
        const existing = await Transaction.findById(id);
        if (!existing || existing.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            }, { status: 404 });
        }

        // Validate type if provided
        if (type && !['income', 'expense'].includes(type)) {
            return NextResponse.json({
                success: false,
                message: 'Tipe harus income atau expense'
            }, { status: 400 });
        }

        const parsedAmount = amount ? parseFloat(amount) : undefined;

        // Validate amount if provided
        if (parsedAmount !== undefined && (isNaN(parsedAmount) || parsedAmount <= 0)) {
            return NextResponse.json({
                success: false,
                message: 'Jumlah harus angka positif'
            }, { status: 400 });
        }

        // Check category ownership if changing category
        if (category_id && !(await Category.belongsToUser(category_id, auth.userId))) {
            return NextResponse.json({
                success: false,
                message: 'Kategori tidak valid'
            }, { status: 400 });
        }

        // Check wallet ownership if changing wallet
        if (wallet_id) {
            const wallet = await Wallet.findByIdAndUser(wallet_id, auth.userId);
            if (!wallet) {
                return NextResponse.json({
                    success: false,
                    message: 'Wallet tidak valid'
                }, { status: 400 });
            }
        }

        // Handle balance updates if amount or type changed
        const finalAmount = parsedAmount || existing.amount;
        const finalType = type || existing.type;
        const finalWalletId = wallet_id || existing.wallet_id;

        // Reverse old transaction effect on wallet
        if (existing.wallet_id) {
            if (existing.type === 'income') {
                await Wallet.updateBalance(existing.wallet_id, -existing.amount);
            } else {
                await Wallet.updateBalance(existing.wallet_id, existing.amount);
            }
        }

        // Apply new transaction effect
        if (finalWalletId) {
            // Check balance for expense
            if (finalType === 'expense') {
                const wallet = await Wallet.findById(finalWalletId);
                if (wallet && wallet.balance < finalAmount) {
                    // Rollback
                    if (existing.wallet_id) {
                        if (existing.type === 'income') {
                            await Wallet.updateBalance(existing.wallet_id, existing.amount);
                        } else {
                            await Wallet.updateBalance(existing.wallet_id, -existing.amount);
                        }
                    }
                    return NextResponse.json({
                        success: false,
                        message: `Saldo tidak mencukupi untuk perubahan ini`
                    }, { status: 400 });
                }
            }

            if (finalType === 'income') {
                await Wallet.updateBalance(finalWalletId, finalAmount);
            } else {
                await Wallet.updateBalance(finalWalletId, -finalAmount);
            }
        }

        const transaction = await Transaction.update(id, auth.userId, {
            category_id,
            wallet_id,
            amount: parsedAmount,
            type,
            description,
            date,
            is_excluded_from_budget: is_excluded_from_budget !== undefined ? (is_excluded_from_budget ? true : false) : undefined
        });

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'update',
            resource: 'transaction',
            resource_id: parseInt(id as string),
            details: JSON.stringify({ type: finalType, amount: finalAmount }),
            ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({
            success: true,
            message: 'Transaksi berhasil diupdate',
            data: transaction
        });
    } catch (error: any) {
        console.error('Update transaction error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;

        // Check ownership
        const existing = await Transaction.findById(id);
        if (!existing || existing.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Transaksi tidak ditemukan'
            }, { status: 404 });
        }

        // Reverse wallet balance
        if (existing.wallet_id) {
            if (existing.type === 'income') {
                await Wallet.updateBalance(existing.wallet_id, -existing.amount);
            } else {
                await Wallet.updateBalance(existing.wallet_id, existing.amount);
            }
        }

        const deleted = await Transaction.delete(id, auth.userId);

        if (!deleted) {
            return NextResponse.json({
                success: false,
                message: 'Gagal menghapus transaksi'
            }, { status: 400 });
        }

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'delete',
            resource: 'transaction',
            resource_id: parseInt(id as string),
            details: JSON.stringify({ type: existing.type, amount: existing.amount }),
            ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({
            success: true,
            message: 'Transaksi berhasil dihapus'
        });
    } catch (error: any) {
        console.error('Delete transaction error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
