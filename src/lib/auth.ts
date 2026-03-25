import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';

export interface JWTPayload {
    userId: number;
    role?: string;
}

export async function authenticateRequest(request: NextRequest): Promise<JWTPayload | NextResponse> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
            { success: false, message: 'Akses ditolak. Token tidak ditemukan.' },
            { status: 401 }
        );
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

        // Verify user still exists in database
        const result = await query('SELECT id, is_active FROM users WHERE id = $1', [decoded.userId]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'User tidak ditemukan. Silakan login kembali.' },
                { status: 401 }
            );
        }

        if (!result.rows[0].is_active) {
            return NextResponse.json(
                { success: false, message: 'Akun Anda telah dinonaktifkan.' },
                { status: 403 }
            );
        }

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { success: false, message: 'Token sudah kadaluarsa. Silakan login kembali.' },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { success: false, message: 'Token tidak valid.' },
            { status: 401 }
        );
    }
}

// Helper that returns a type guard to easily check if the result is a NextResponse (error)
export function isAuthError(result: JWTPayload | NextResponse): result is NextResponse {
    return result instanceof NextResponse;
}
