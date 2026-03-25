"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, LogOut, User, Shield, ChevronRight, Info, Palette, Target, Wallet, Tag, Edit3, PieChart, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { cn, getAvatarUrl } from '@/lib/utils';
import { ProfileEditModal } from './ProfileEditModal';
import { getTheme } from '@/themes';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { useRouter } from 'next/navigation';

export function SettingsPage() {
    const { user, logout, isAdmin } = useAuth();
    const router = useRouter();
    const {
        theme: currentTheme,
        colorScheme: currentColorScheme,
        darkMode,
        setTheme,
        setColorScheme,
        toggleDarkMode,
        availableThemes,
    } = useTheme();
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [siteName, setSiteName] = useState('Cashflow App');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const res = await api.get('/site/settings');
                if (res.data?.data?.site_name) {
                    setSiteName(res.data.data.site_name);
                }
            } catch { /* ignore */ }
        };
        loadSettings();
    }, []);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Keluar dari akun?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            logout();
            router.push('/login');
        }
    };

    const menuItems = [
        {
            label: 'Kategori',
            icon: Tag,
            color: 'text-blue-500',
            bg: 'bg-blue-100 dark:bg-blue-950/50',
            onClick: () => router.push('/categories'),
        },
        {
            label: 'Wallet',
            icon: Wallet,
            color: 'text-green-500',
            bg: 'bg-green-100 dark:bg-green-950/50',
            onClick: () => router.push('/wallets'),
        },
        {
            label: 'Goals',
            icon: Target,
            color: 'text-purple-500',
            bg: 'bg-purple-100 dark:bg-purple-950/50',
            onClick: () => router.push('/goals'),
        },
        {
            label: 'Budget Harian',
            icon: PieChart,
            color: 'text-orange-500',
            bg: 'bg-orange-100 dark:bg-orange-950/50',
            onClick: () => router.push('/budget'),
        },
    ];

    if (isAdmin) {
        menuItems.push(
            {
                label: 'Manajemen Pengguna',
                icon: Shield,
                color: 'text-red-500',
                bg: 'bg-red-100 dark:bg-red-950/50',
                onClick: () => router.push('/admin/users'),
            },
            {
                label: 'Pengaturan Aplikasi',
                icon: Palette,
                color: 'text-indigo-500',
                bg: 'bg-indigo-100 dark:bg-indigo-950/50',
                onClick: () => router.push('/admin/settings'),
            }
        );
    }

    const currentThemeDef = getTheme(currentTheme);

    return (
        <div className="px-4 pt-6 pb-safe">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">Pengaturan</h1>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 overflow-hidden flex items-center justify-center text-white text-xl font-bold shadow-sm">
                        {user?.avatar ? (
                            <img src={getAvatarUrl(user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            user?.username?.charAt(0)?.toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {user?.full_name || user?.username}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-950/50 text-primary-700 dark:text-primary-400 rounded-full text-[10px] font-semibold">
                                <Shield className="w-3 h-3" />
                                Admin
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors"
                    >
                        <Edit3 className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>

            {/* ─── Theme Picker Section ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-primary-500" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tampilan & Tema</h3>
                </div>

                {/* Theme Cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {availableThemes.map((themeDef) => {
                        const isActive = currentTheme === themeDef.id;
                        return (
                            <button
                                key={themeDef.id}
                                onClick={() => setTheme(themeDef.id)}
                                className={cn(
                                    'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                                    isActive
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                )}
                                <span className="text-2xl">{themeDef.icon}</span>
                                <span className={cn(
                                    'text-xs font-semibold',
                                    isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'
                                )}>
                                    {themeDef.label}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight">
                                    {themeDef.description}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Color Scheme Swatches */}
                <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Skema Warna</p>
                    <div className="flex flex-wrap gap-2">
                        {currentThemeDef.colorSchemes.map((scheme) => {
                            const isActive = currentColorScheme === scheme.id;
                            return (
                                <button
                                    key={scheme.id}
                                    onClick={() => setColorScheme(scheme.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all',
                                        isActive
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    )}
                                >
                                    <div
                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                                        style={{ backgroundColor: scheme.preview }}
                                    >
                                        {isActive && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={cn(
                                        'text-xs font-medium',
                                        isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-300'
                                    )}>
                                        {scheme.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Dark Mode Toggle — only for themes that support it */}
                {currentThemeDef.supportsDarkMode && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                {darkMode ? <Moon className="w-4 h-4 text-yellow-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode Gelap</p>
                                <p className="text-[10px] text-gray-400">{darkMode ? 'Aktif' : 'Nonaktif'}</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={cn(
                                'w-12 h-7 rounded-full transition-colors relative',
                                darkMode ? 'bg-primary-600' : 'bg-gray-300'
                            )}
                        >
                            <motion.div
                                className="w-5 h-5 bg-white rounded-full absolute top-1"
                                animate={{ x: darkMode ? 24 : 4 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Menu Items */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-4 overflow-hidden"
            >
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                    >
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.bg)}>
                            <item.icon className={cn('w-4.5 h-4.5', item.color)} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-left">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                ))}
            </motion.div>

            {/* App Info */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Info className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{siteName}</p>
                        <p className="text-xs text-gray-400">Versi 2.0.0 — PWA Edition</p>
                    </div>
                </div>
            </motion.div>

            {/* Logout Button */}
            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl font-semibold text-sm"
            >
                <LogOut className="w-4 h-4" />
                Keluar
            </motion.button>

            <ProfileEditModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </div>
    );
}
