"use client";

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, PieChart, Wallet, Settings, Plus, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { path: '/', label: 'Home', icon: LayoutDashboard },
    { path: '/transactions/history', label: 'Riwayat', icon: ReceiptText },
    { path: '/transactions/add', label: 'Tambah', icon: Plus, isFab: true },
    { path: '/wallets', label: 'Wallet', icon: Wallet },
    { path: '/settings', label: 'Setting', icon: Settings },
] as const;

export function BottomNav() {
    const router = useRouter();
    const currentPath = usePathname();

    const getActiveIndex = () => {
        if (currentPath === '/') return 0;
        const idx = NAV_ITEMS.findIndex((item, i) => i > 0 && currentPath.startsWith(item.path));
        return idx >= 0 ? idx : -1;
    };

    const activeIndex = getActiveIndex();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;
                    const Icon = item.icon;

                    if ('isFab' in item && item.isFab) {
                        return (
                            <motion.button
                                key={item.path}
                                whileTap={{ scale: 0.85 }}
                                onClick={() => router.push(item.path)}
                                className="relative flex flex-col items-center justify-center -mt-8"
                            >
                                <div className="w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-600/30 border-4 border-slate-50 dark:border-gray-950">
                                    <Icon className="w-6 h-6" />
                                </div>
                            </motion.button>
                        );
                    }

                    return (
                        <motion.button
                            key={item.path}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => router.push(item.path)}
                            className={cn(
                                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-colors min-w-[56px]',
                                isActive
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-400 dark:text-gray-500'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute inset-0 bg-primary-50 dark:bg-primary-950/40 rounded-2xl"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className="w-5 h-5 relative z-10" />
                            <span className="text-[10px] font-medium relative z-10">{item.label}</span>
                        </motion.button>
                    );
                })}
            </div>
            {/* Safe area for iOS */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
