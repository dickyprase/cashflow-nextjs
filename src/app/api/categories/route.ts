import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Category from '@/lib/models/Category';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type');

        // Custom logic for categories with spending vs normal
        const withSpendingStr = searchParams.get('withSpending');

        let categories;
        if (withSpendingStr === 'true') {
            categories = await Category.getWithSpending(auth.userId);
        } else {
            categories = await Category.findByUserId(auth.userId, type as string);
        }

        return NextResponse.json({
            success: true,
            data: categories
        });
    } catch (error: any) {
        console.error('Get categories error:', error);
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
        const { name, type, color, icon, budget_limit } = body;

        // Validation
        if (!name || !type) {
            return NextResponse.json({
                success: false,
                message: 'Nama dan tipe kategori wajib diisi'
            }, { status: 400 });
        }

        if (!['income', 'expense'].includes(type)) {
            return NextResponse.json({
                success: false,
                message: 'Tipe harus income atau expense'
            }, { status: 400 });
        }

        const category = await Category.create(
            auth.userId,
            name,
            type,
            color || '#4361ee',
            icon || 'wallet',
            budget_limit || 0
        );

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil dibuat',
            data: category
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create category error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
