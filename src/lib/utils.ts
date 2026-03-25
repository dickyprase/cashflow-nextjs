import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export function getLocalTodayStr(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy'): string {
    try {
        const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return format(date, fmt, { locale: id });
    } catch {
        return dateStr;
    }
}

export function formatDateShort(dateStr: string): string {
    return formatDate(dateStr, 'dd/MM/yy');
}

export function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
}

export function getAvatarUrl(path?: string | null): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;

    // In Next.js App Router, images are served from public/ or via /api
    return `${path.startsWith('/') ? '' : '/'}${path}`;
}

export function formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        let cleanStr = dateStr.split('.')[0];
        cleanStr = cleanStr.replace(' ', 'T');
        if (!cleanStr.endsWith('Z')) {
            cleanStr += 'Z';
        }
        const date = new Date(cleanStr);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
    } catch (error) {
        console.error("Format jam gagal:", error);
        return '';
    }
}
