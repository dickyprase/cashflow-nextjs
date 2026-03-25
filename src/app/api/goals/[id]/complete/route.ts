import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Goal from '@/lib/models/Goal';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const body = await request.json();
        const { auto_deduct = false } = body;

        const result = await Goal.complete(id, auth.userId, auto_deduct);

        return NextResponse.json({
            success: true,
            message: result.autoDeducted
                ? 'Goal selesai! Transaksi pengeluaran otomatis dibuat'
                : 'Goal selesai! Jangan lupa buat transaksi pengeluaran untuk merealisasikan goal',
            data: result
        });
    } catch (error: any) {
        console.error('Complete goal error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Gagal menyelesaikan goal'
        }, { status: 500 });
    }
}
