import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import Category from '@/lib/models/Category';
import Wallet from '@/lib/models/Wallet';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const categoryId = searchParams.get('categoryId');
        const walletId = searchParams.get('walletId');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const limitStr = searchParams.get('limit');
        const offsetStr = searchParams.get('offset');

        const filters = {
            startDate,
            endDate,
            categoryId: categoryId ? parseInt(categoryId) : null,
            walletId: walletId ? parseInt(walletId) : null,
            type,
            search,
            limit: limitStr ? parseInt(limitStr) : 50,
            offset: offsetStr ? parseInt(offsetStr) : 0
        };

        const transactions = await Transaction.findByUserId(auth.userId, filters);
        const total = await Transaction.count(auth.userId, filters);

        return NextResponse.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    limit: filters.limit,
                    offset: filters.offset,
                    hasMore: filters.offset + filters.limit < total
                }
            }
        });
    } catch (error: any) {
        console.error('Get transactions error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { category_id, wallet_id, amount, type, description, date, is_excluded_from_budget } = body;

        // Validation
        if (!category_id || !amount || !type || !date) {
            return NextResponse.json({
                success: false,
                message: 'Kategori, jumlah, tipe, dan tanggal wajib diisi'
            }, { status: 400 });
        }

        if (!['income', 'expense'].includes(type)) {
            return NextResponse.json({
                success: false,
                message: 'Tipe harus income atau expense'
            }, { status: 400 });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({
                success: false,
                message: 'Jumlah harus angka positif'
            }, { status: 400 });
        }

        // Check category ownership
        if (!(await Category.belongsToUser(category_id, auth.userId))) {
            return NextResponse.json({
                success: false,
                message: 'Kategori tidak valid'
            }, { status: 400 });
        }

        // Get wallet (use default if not provided)
        let targetWalletId = wallet_id;
        if (!targetWalletId) {
            const defaultWallet = await Wallet.getDefault(auth.userId);
            if (defaultWallet) {
                targetWalletId = defaultWallet.id;
            }
        }

        // Check wallet ownership if provided
        if (targetWalletId) {
            const wallet = await Wallet.findByIdAndUser(targetWalletId, auth.userId);
            if (!wallet) {
                return NextResponse.json({
                    success: false,
                    message: 'Wallet tidak valid'
                }, { status: 400 });
            }

            // Check balance for expense
            if (type === 'expense' && wallet.balance < parsedAmount) {
                return NextResponse.json({
                    success: false,
                    message: `Saldo tidak mencukupi. Saldo ${wallet.name}: Rp ${Number(wallet.balance).toLocaleString('id-ID')}`
                }, { status: 400 });
            }

            // Update wallet balance
            if (type === 'income') {
                await Wallet.updateBalance(targetWalletId, parsedAmount);
            } else {
                await Wallet.updateBalance(targetWalletId, -parsedAmount);
            }
        }

        const transaction = await Transaction.create(auth.userId, {
            category_id,
            wallet_id: targetWalletId,
            amount: parsedAmount,
            type,
            transaction_type: type,
            description: description || '',
            date,
            is_excluded_from_budget: is_excluded_from_budget ? true : false
        });

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'create',
            resource: 'transaction',
            resource_id: transaction.id,
            details: JSON.stringify({ type, amount: parsedAmount, description }),
            ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1'
        });

        return NextResponse.json({
            success: true,
            message: 'Transaksi berhasil dibuat',
            data: transaction
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create transaction error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
