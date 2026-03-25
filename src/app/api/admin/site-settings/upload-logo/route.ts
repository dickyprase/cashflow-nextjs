import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import SiteSetting from '@/lib/models/SiteSetting';
import ActivityLog from '@/lib/models/ActivityLog';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('logo') as File | null;
        const logoType = (formData.get('logo_type') as string) || 'light';

        if (!file) {
            return NextResponse.json({
                success: false,
                message: 'File logo wajib diupload'
            }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                message: 'Hanya file PNG, JPG, atau SVG yang diizinkan'
            }, { status: 400 });
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                message: 'Ukuran file maksimal 2MB'
            }, { status: 400 });
        }

        // Save file to public/uploads
        const ext = path.extname(file.name);
        const filename = `logo-${logoType}${ext}`;
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);

        const settingKey = logoType === 'dark' ? 'site_logo_dark' : 'site_logo';
        const logoUrl = `/uploads/${filename}`;

        await SiteSetting.set(settingKey, logoUrl, 'file');

        // Log activity
        await ActivityLog.create({
            user_id: auth.userId,
            action: 'UPLOAD_LOGO',
            resource: 'site_settings',
            details: JSON.stringify({ type: logoType, url: logoUrl })
        });

        return NextResponse.json({
            success: true,
            message: 'Logo berhasil diupload',
            data: {
                url: logoUrl,
                type: logoType
            }
        });
    } catch (error: any) {
        console.error('Upload logo error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal menyimpan logo'
        }, { status: 500 });
    }
}
