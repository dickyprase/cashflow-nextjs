import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const id = (await params).id;
        const user = await User.findById(id);

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        // Return only basic user info, no financial data
        return NextResponse.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat data user'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const id = (await params).id;
        const body = await request.json();
        const { role, is_active } = body;

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        // Prevent self-demotion
        if (parseInt(id) === auth.userId && role === 'user') {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat mengubah role sendiri'
            }, { status: 400 });
        }

        // Update role if provided
        if (role) {
            await User.updateRole(id, role);
        }

        // Update status if provided
        if (is_active !== undefined) {
            await User.setStatus(id, is_active);
        }

        const updatedUser = await User.findById(id);

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'UPDATE_USER',
            resource: 'users',
            resource_id: id,
            details: JSON.stringify({ role, is_active })
        });

        return NextResponse.json({
            success: true,
            message: 'User berhasil diperbarui',
            data: updatedUser
        });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memperbarui user'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const id = (await params).id;

        // Prevent self-deletion
        if (parseInt(id) === auth.userId) {
            return NextResponse.json({
                success: false,
                message: 'Tidak dapat menghapus akun sendiri'
            }, { status: 400 });
        }

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User tidak ditemukan'
            }, { status: 404 });
        }

        await User.delete(id);

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'DELETE_USER',
            resource: 'users',
            resource_id: id,
            details: JSON.stringify({ username: user.username, email: user.email })
        });

        return NextResponse.json({
            success: true,
            message: 'User berhasil dihapus'
        });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menghapus user'
        }, { status: 500 });
    }
}
