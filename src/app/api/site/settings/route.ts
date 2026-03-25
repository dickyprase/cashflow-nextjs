import { NextRequest, NextResponse } from 'next/server';
import SiteSetting from '@/lib/models/SiteSetting';

// Public route - no auth required
export async function GET(request: NextRequest) {
    try {
        const settings = await SiteSetting.getPublic();
        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error: any) {
        console.error('Get public settings error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat pengaturan'
        }, { status: 500 });
    }
}
