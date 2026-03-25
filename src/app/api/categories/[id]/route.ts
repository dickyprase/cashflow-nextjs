import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Category from '@/lib/models/Category';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const id = (await params).id;
        const category = await Category.findById(id);

        if (!category || category.user_id !== auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Kategori tidak ditemukan'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: category
        });
    } catch (error: any) {
        console.error('Get category error:', error);
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
        const { name, type, color, icon, budget_limit } = body;

        // Check ownership
        if (!(await Category.belongsToUser(id, auth.userId))) {
            return NextResponse.json({
                success: false,
                message: 'Kategori tidak ditemukan'
            }, { status: 404 });
        }

        // Validate type if provided
        if (type && !['income', 'expense'].includes(type)) {
            return NextResponse.json({
                success: false,
                message: 'Tipe harus income atau expense'
            }, { status: 400 });
        }

        const category = await Category.update(id, auth.userId, {
            name, type, color, icon, budget_limit
        });

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil diupdate',
            data: category
        });
    } catch (error: any) {
        console.error('Update category error:', error);
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
        if (!(await Category.belongsToUser(id, auth.userId))) {
            return NextResponse.json({
                success: false,
                message: 'Kategori tidak ditemukan'
            }, { status: 404 });
        }

        const deleted = await Category.delete(id, auth.userId);

        if (!deleted) {
            return NextResponse.json({
                success: false,
                message: 'Gagal menghapus kategori'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'Kategori berhasil dihapus'
        });
    } catch (error: any) {
        console.error('Delete category error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
