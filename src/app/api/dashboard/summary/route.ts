import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isAuthError } from '@/lib/auth';
import Transaction from '@/lib/models/Transaction';
import Wallet from '@/lib/models/Wallet';

export async function GET(request: NextRequest) {
    const auth = await authenticateRequest(request);
    if (isAuthError(auth)) return auth;

    try {
        // Get all-time summary
        const allTime = await Transaction.getSummary(auth.userId);

        // Get total actual balance from active wallets
        const actualBalance = await Wallet.getTotalBalance(auth.userId);

        // Get current month summary
        const now = new Date();
        const currentMonth = await Transaction.getMonthlySummary(
            auth.userId,
            now.getFullYear(),
            now.getMonth() + 1
        );

        // Get previous month summary for comparison
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonth = await Transaction.getMonthlySummary(
            auth.userId,
            prevMonth.getFullYear(),
            prevMonth.getMonth() + 1
        );

        // Get today's summary (income and expense for today)
        const todaySummary = await Transaction.getTodaySummary(auth.userId);

        // Get recent transactions
        const recentTransactions = await Transaction.getRecent(auth.userId, 5);

        // Calculate month-over-month change
        const incomeChange = previousMonth.total_income > 0
            ? ((currentMonth.total_income - previousMonth.total_income) / previousMonth.total_income * 100).toFixed(1)
            : 0;
        const expenseChange = previousMonth.total_expense > 0
            ? ((currentMonth.total_expense - previousMonth.total_expense) / previousMonth.total_expense * 100).toFixed(1)
            : 0;

        return NextResponse.json({
            success: true,
            data: {
                allTime: {
                    totalIncome: allTime.total_income,
                    totalExpense: allTime.total_expense,
                    balance: actualBalance
                },
                currentMonth: {
                    income: currentMonth.total_income,
                    expense: currentMonth.total_expense,
                    balance: currentMonth.total_income - currentMonth.total_expense,
                    incomeChange: parseFloat(incomeChange as string),
                    expenseChange: parseFloat(expenseChange as string)
                },
                today: {
                    income: todaySummary?.income || 0,
                    expense: todaySummary?.expense || 0,
                    budget_expense: todaySummary?.budget_expense || 0
                },
                recentTransactions
            }
        });
    } catch (error: any) {
        console.error('Get summary error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Terjadi kesalahan pada server'
        }, { status: 500 });
    }
}
