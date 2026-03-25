"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DailyActivity {
    date: string;
    income: number;
    expense: number;
}

interface MonthlyActivityCalendarProps {
    data: DailyActivity[];
    year: number;
    month: number; // 1-indexed
}

const DAY_LABELS = ['SN', 'SL', 'RB', 'KM', 'JM', 'SB', 'MG'];

const MONTH_NAMES = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

function formatShortAmount(amount: number): string {
    if (amount === 0) return '';
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) {
        const val = abs / 1_000_000;
        const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
        return `${formatted}JT`;
    }
    if (abs >= 1_000) {
        const val = abs / 1_000;
        const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(0);
        return `${formatted}RB`;
    }
    return abs.toString();
}

export function MonthlyActivityCalendar({ data, year, month }: MonthlyActivityCalendarProps) {
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const todayDate = isCurrentMonth ? today.getDate() : -1;

    const calendarGrid = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const daysInMonth = new Date(year, month, 0).getDate();

        // Build activity map — parse values as numbers
        const activityMap: Record<number, { income: number; expense: number }> = {};

        data.forEach(d => {
            // Parse date in UTC but display in local
            let dateStr = String(d.date);
            if (dateStr.includes('T')) {
                // Ensure the date is interpreted literally as the saved YYYY-MM-DD
                const parts = dateStr.split('T')[0].split('-');
                if (parts.length === 3) {
                    const dayNum = parseInt(parts[2], 10);
                    activityMap[dayNum] = {
                        income: parseFloat(String(d.income)) || 0,
                        expense: parseFloat(String(d.expense)) || 0,
                    };
                }
            } else {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const dayNum = parseInt(parts[2], 10);
                    activityMap[dayNum] = {
                        income: parseFloat(String(d.income)) || 0,
                        expense: parseFloat(String(d.expense)) || 0,
                    };
                }
            }
        });

        const cells: (null | { day: number; income: number; expense: number })[] = [];

        for (let i = 0; i < startOffset; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            const act = activityMap[d];
            cells.push({ day: d, income: act?.income ?? 0, expense: act?.expense ?? 0 });
        }
        while (cells.length % 7 !== 0) cells.push(null);

        return cells;
    }, [data, year, month]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
        >
            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                Aktivitas Bulan Ini
            </h3>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-4">
                {MONTH_NAMES[month - 1]} {year}
            </p>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
                {DAY_LABELS.map(label => (
                    <div
                        key={label}
                        className="text-center text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-1.5"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-[3px]">
                {calendarGrid.map((cell, idx) => {
                    if (!cell) {
                        return (
                            <div
                                key={`empty-${idx}`}
                                className="min-h-[52px] rounded-lg bg-gray-50/50 dark:bg-gray-800/20"
                            />
                        );
                    }

                    const { day, income, expense } = cell;
                    const hasExpense = expense > 0;
                    const hasIncome = income > 0;
                    const isToday = day === todayDate;

                    return (
                        <div
                            key={day}
                            className={cn(
                                'min-h-[52px] rounded-lg flex flex-col items-center justify-center px-0.5 py-1 transition-colors overflow-hidden',
                                hasExpense
                                    ? 'bg-rose-50/60 dark:bg-rose-950/30'
                                    : hasIncome
                                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                                        : 'bg-gray-50/50 dark:bg-gray-800/40',
                                isToday && 'ring-2 ring-rose-400 dark:ring-rose-500'
                            )}
                        >
                            {/* Day number */}
                            <span className={cn(
                                'text-[12px] font-bold leading-none',
                                isToday
                                    ? 'text-rose-500 dark:text-rose-400'
                                    : 'text-gray-700 dark:text-gray-300'
                            )}>
                                {day}
                            </span>

                            {/* Expense label */}
                            {hasExpense && (
                                <span className="text-[8.5px] font-extrabold text-rose-500 dark:text-rose-400 leading-tight mt-[3px] whitespace-nowrap">
                                    -{formatShortAmount(expense)}
                                </span>
                            )}

                            {/* Income label */}
                            {hasIncome && (
                                <span className="text-[8.5px] font-extrabold text-emerald-500 dark:text-emerald-400 leading-tight mt-[1px] whitespace-nowrap">
                                    +{formatShortAmount(income)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
