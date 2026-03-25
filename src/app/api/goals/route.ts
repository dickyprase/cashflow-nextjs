import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Goal from '@/lib/models/Goal';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const goals = await Goal.findByUserId(auth.userId, status || null);

        return NextResponse.json({
            success: true,
            data: goals
        });
    } catch (error: any) {
        console.error('Get goals error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal mengambil data goals'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const body = await request.json();
        const { name, target_amount, deadline, tracking_method, description, color, icon, priority, wallet_ids } = body;

        // Validation
        if (!name || name.trim().length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Nama goal wajib diisi'
            }, { status: 400 });
        }

        if (name.length > 100) {
            return NextResponse.json({
                success: false,
                message: 'Nama goal maksimal 100 karakter'
            }, { status: 400 });
        }

        if (!target_amount || target_amount < 10000) {
            return NextResponse.json({
                success: false,
                message: 'Target amount minimal Rp 10.000'
            }, { status: 400 });
        }

        if (!tracking_method || !['single', 'multiple', 'all'].includes(tracking_method)) {
            return NextResponse.json({
                success: false,
                message: 'Tracking method harus single, multiple, atau all'
            }, { status: 400 });
        }

        if (tracking_method !== 'all' && (!wallet_ids || wallet_ids.length === 0)) {
            return NextResponse.json({
                success: false,
                message: 'Pilih minimal satu wallet'
            }, { status: 400 });
        }

        const goal = await Goal.create(auth.userId, {
            name: name.trim(),
            target_amount,
            deadline,
            tracking_method,
            description,
            color,
            icon,
            priority,
            wallet_ids
        });

        return NextResponse.json({
            success: true,
            message: 'Goal berhasil dibuat',
            data: goal
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create goal error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Gagal membuat goal'
        }, { status: 500 });
    }
}
