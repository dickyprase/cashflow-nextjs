import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import PDFDocument from 'pdfkit';

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

        const filters = { startDate, endDate, type, limit: 1000, offset: 0 };
        const transactions = await Transaction.findByUserId(auth.userId, filters);
        const summary = await Transaction.getSummary(auth.userId);

        // To send a PDF from a Route Handler using pdfkit, we need to gather its output via a buffer
        return new Promise<NextResponse>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            let buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(new NextResponse(pdfData, {
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=cashflow_${targetYear}${month ? '-' + month : ''}.pdf`
                    }
                }));
            });

            // Handle doc errors
            doc.on('error', reject);

            // Title
            doc.fontSize(20).text('Laporan Cashflow', { align: 'center' });
            doc.moveDown();

            // Summary
            doc.fontSize(12);
            doc.text(`Total Pemasukan: Rp ${summary.total_income.toLocaleString('id-ID')}`);
            doc.text(`Total Pengeluaran: Rp ${summary.total_expense.toLocaleString('id-ID')}`);
            doc.text(`Saldo: Rp ${summary.balance.toLocaleString('id-ID')}`);
            doc.moveDown();

            // Period
            doc.text(`Periode: ${startDate} - ${endDate}`);
            doc.moveDown();

            // Transactions table header
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('Tanggal', 50, doc.y, { width: 80 });
            doc.text('Kategori', 130, doc.y - 12, { width: 100 });
            doc.text('Tipe', 230, doc.y - 12, { width: 70 });
            doc.text('Jumlah', 300, doc.y - 12, { width: 100 });
            doc.moveDown();

            // Draw line
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            // Transactions
            doc.font('Helvetica');
            transactions.slice(0, 50).forEach((t: any) => {
                const y = doc.y;
                doc.text(t.date, 50, y, { width: 80 });
                doc.text(t.category_name || '-', 130, y, { width: 100 });
                doc.text(t.type === 'income' ? 'Masuk' : 'Keluar', 230, y, { width: 70 });
                doc.text(`Rp ${t.amount.toLocaleString('id-ID')}`, 300, y, { width: 100 });
                doc.moveDown();
            });

            if (transactions.length > 50) {
                doc.moveDown();
                doc.text(`... dan ${transactions.length - 50} transaksi lainnya`);
            }

            // Footer
            doc.moveDown(2);
            doc.fontSize(8).text(`Dibuat pada: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

            doc.end();
        });

    } catch (error: any) {
        console.error('Export PDF error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
