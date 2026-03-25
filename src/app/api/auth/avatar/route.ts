import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import fs from 'fs';

export async function POST(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const formData = await request.formData();
        const file = formData.get('avatar') as File | null;

        if (!file) {
            return NextResponse.json({
                success: false,
                message: 'File avatar wajib diupload'
            }, { status: 400 });
        }

        // Validation
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                message: 'Hanya file PNG, JPG, JPEG atau WEBP yang diizinkan'
            }, { status: 400 });
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB
            return NextResponse.json({
                success: false,
                message: 'Ukuran file maksimal 2MB'
            }, { status: 400 });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // In Next.js App Router, public files can be uploaded to public/uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
        const filename = `avatar-${auth.userId}-${Date.now()}${ext}`;
        const filepath = path.join(uploadsDir, filename);

        await writeFile(filepath, buffer);

        // Update User
        const avatarUrl = `/uploads/${filename}`;
        const user = await User.updateProfile(auth.userId, { avatar: avatarUrl });

        return NextResponse.json({
            success: true,
            message: 'Avatar berhasil diperbarui',
            data: user
        });

    } catch (error: any) {
        console.error('Upload avatar error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Gagal menyimpan avatar'
        }, { status: 500 });
    }
}
