"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export function LoginPage() {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login({ loginId, password });
            router.push('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login gagal. Periksa username/email dan password Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm mx-auto"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                        className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                    >
                        <Wallet className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white">Cashflow</h1>
                    <p className="text-primary-100 mt-1 text-sm">Kelola keuangan Anda dengan mudah</p>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl shadow-black/20">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Masuk</h2>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm rounded-xl"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Username / Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                <input
                                    type="text"
                                    value={loginId}
                                    onChange={e => setLoginId(e.target.value)}
                                    placeholder="Username / Email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-11 pr-11 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Memproses...
                                </div>
                            ) : 'Masuk'}
                        </motion.button>
                    </form>

                    <div className="mt-6 text-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Belum punya akun? </span>
                        <button
                            onClick={() => router.push('/register')}
                            className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
                        >
                            Daftar
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
