import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import { Parser } from 'json2csv';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        const searchParams = request.nextUrl.searchParams;
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const type = searchParams.get('type') || null;

        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        let startDate, endDate;

        if (month) {
            startDate = `${targetYear}-${month.padStart(2, '0')}-01`;
            const lastDay = new Date(targetYear, parseInt(month), 0).getDate();
            endDate = `${targetYear}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        } else {
            startDate = `${targetYear}-01-01`;
            endDate = `${targetYear}-12-31`;
        }

        const filters = { startDate, endDate, type, limit: 10000, offset: 0 };
        const transactions = await Transaction.findByUserId(auth.userId, filters);

        if (transactions.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'Tidak ada data untuk diekspor'
            }, { status: 404 });
        }

        // Format data for CSV
        const data = transactions.map((t: any) => ({
            Tanggal: t.date,
            Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            Kategori: t.category_name,
            Jumlah: t.amount,
            Deskripsi: t.description || '-'
        }));

        const parser = new Parser({ fields: ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Deskripsi'] });
        const csv = parser.parse(data);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename=cashflow_${targetYear}${month ? '-' + month : ''}.csv`
            }
        });
    } catch (error: any) {
        console.error('Export CSV error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
