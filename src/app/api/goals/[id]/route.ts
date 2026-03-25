import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Goal from '@/lib/models/Goal';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const goal = await Goal.findById(id, auth.userId);

        if (!goal) {
            return NextResponse.json({
                success: false,
                message: 'Goal tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: goal
        });
    } catch (error: any) {
        console.error('Get goal error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mengambil data goal'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const goal = await Goal.findById(id, auth.userId);

        if (!goal) {
            return NextResponse.json({
                success: false,
                message: 'Goal tidak ditemukan'
            }, { status: 404 });
        }

        if (goal.status === 'completed') {
            return NextResponse.json({
                success: false,
                message: 'Goal yang sudah selesai tidak bisa diedit'
            }, { status: 400 });
        }

        const body = await request.json();
        const { name, target_amount, deadline, tracking_method, description, color, icon, priority, wallet_ids, is_locked } = body;

        // Validation
        if (name && name.length > 100) {
            return NextResponse.json({
                success: false,
                message: 'Nama goal maksimal 100 karakter'
            }, { status: 400 });
        }

        if (target_amount && target_amount < 10000) {
            return NextResponse.json({
                success: false,
                message: 'Target amount minimal Rp 10.000'
            }, { status: 400 });
        }

        const updatedGoal = await Goal.update(id, auth.userId, {
            name: name?.trim(),
            target_amount,
            deadline,
            tracking_method,
            description,
            color,
            icon,
            priority,
            wallet_ids,
            is_locked
        });

        return NextResponse.json({
            success: true,
            message: 'Goal berhasil diupdate',
            data: updatedGoal
        });
    } catch (error: any) {
        console.error('Update goal error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Gagal mengupdate goal'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const deleted = await Goal.archive(id, auth.userId);

        if (!deleted) {
            return NextResponse.json({
                success: false,
                message: 'Goal tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Goal berhasil dihapus'
        });
    } catch (error: any) {
        console.error('Delete goal error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menghapus goal'
        }, { status: 500 });
    }
}
