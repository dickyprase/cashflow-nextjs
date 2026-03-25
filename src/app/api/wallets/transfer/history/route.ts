import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const limitStr = searchParams.get('limit') || '50';

        const result = await Transaction.findByUserId(auth.userId, {
            type: 'transfer',
            limit: parseInt(limitStr)
        });

        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Get transfer history error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat riwayat transfer'
        }, { status: 500 });
    }
}
