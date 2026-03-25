import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    if (auth.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const yearStr = searchParams.get('year');
        const targetYear = yearStr ? parseInt(yearStr) : new Date().getFullYear();

        const growth = await User.getGrowthByMonth(targetYear);

        // Fill in missing months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const fullData = monthNames.map((name, index) => {
            const monthNum = (index + 1).toString().padStart(2, '0');
            const found = growth.find((g: any) => g.month === monthNum);
            return {
                month: name,
                count: found ? found.count : 0
            };
        });

        return NextResponse.json({
            success: true,
            data: fullData
        });
    } catch (error: any) {
        console.error('Get user growth error:', error);
        return NextResponse.json({
            success: false,
            message: 'Gagal memuat data pertumbuhan user'
        }, { status: 500 });
    }
}
