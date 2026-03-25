import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Goal from '@/lib/models/Goal';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const body = await request.json();
        const { is_locked } = body;

        if (is_locked === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Status is_locked harus disertakan'
            }, { status: 400 });
        }

        const updatedGoal = await Goal.toggleLock(id, auth.userId, is_locked);

        if (!updatedGoal) {
            return NextResponse.json({
                success: false,
                message: 'Goal tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: is_locked ? 'Goal berhasil dikunci' : 'Goal berhasil dibuka',
            data: updatedGoal
        });
    } catch (error: any) {
        console.error('Toggle goal lock error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mengganti status lock goal'
        }, { status: 500 });
    }
}
