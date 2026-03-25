import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import SiteSetting from '@/lib/models/SiteSetting';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const settings = await SiteSetting.getAll();
        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        console.error('Get settings error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat pengaturan'
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { site_name, footer_text, currency, theme, enable_registration } = body;

        const updates: Record<string, any> = {};
        if (site_name) updates.site_name = site_name;
        if (footer_text !== undefined && footer_text !== '') updates.footer_text = footer_text;
        if (currency) updates.currency = currency;
        if (theme) updates.theme = theme;
        if (enable_registration !== undefined) updates.enable_registration = enable_registration;

        const settings = await SiteSetting.bulkUpdate(updates);

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'UPDATE_SITE_SETTINGS',
            resource: 'site_settings',
            details: JSON.stringify(updates)
        });

        return NextResponse.json({
            success: true,
            message: 'Pengaturan berhasil disimpan',
            data: settings
        });
    } catch (error: any) {
        console.error('Update settings error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menyimpan pengaturan'
        }, { status: 500 });
    }
}
