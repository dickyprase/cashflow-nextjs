"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, Image as ImageIcon, CheckCircle, ChevronLeft } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface SiteSettings {
    site_name: string;
    site_logo: string;
    site_logo_dark: string;
    footer_text: string;
    [key: string]: any;
}

export function AppSettingsPage() {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SiteSettings>({
        site_name: '',
        site_logo: '',
        site_logo_dark: '',
        footer_text: ''
    });

    const [logoLightRaw, setLogoLightRaw] = useState<File | null>(null);
    const [logoDarkRaw, setLogoDarkRaw] = useState<File | null>(null);

    const lightInputRef = useRef<HTMLInputElement>(null);
    const darkInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/');
            return;
        }
        loadSettings();
    }, [isAdmin]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/site-settings');
            const data = res.data.data;
            setSettings({
                site_name: data.site_name?.value || 'Cashflow',
                site_logo: data.site_logo?.value || '',
                site_logo_dark: data.site_logo_dark?.value || '',
                footer_text: data.footer_text?.value || ''
            });
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Text Settings
            await api.put('/admin/site-settings', {
                site_name: settings.site_name,
                footer_text: settings.footer_text
            });

            // Save Logos if changed
            if (logoLightRaw) {
                const fdLight = new FormData();
                fdLight.append('logo', logoLightRaw);
                fdLight.append('logo_type', 'light');
                await api.post('/admin/site-settings/upload-logo', fdLight, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            if (logoDarkRaw) {
                const fdDark = new FormData();
                fdDark.append('logo', logoDarkRaw);
                fdDark.append('logo_type', 'dark');
                await api.post('/admin/site-settings/upload-logo', fdDark, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            toast.success('Pengaturan Aplikasi berhasil disimpan.');
            loadSettings();
            setLogoLightRaw(null);
            setLogoDarkRaw(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'light') setLogoLightRaw(e.target.files[0]);
            else setLogoDarkRaw(e.target.files[0]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-4 flex items-center gap-3">
                <button
                    onClick={() => router.push('/settings')}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pengaturan Aplikasi</h1>
            </div>

            {loading ? (
                <div className="p-4 space-y-4">
                    <div className="skeleton h-32 rounded-2xl w-full" />
                    <div className="skeleton h-32 rounded-2xl w-full" />
                </div>
            ) : (
                <div className="p-4 space-y-6">


                    {/* General info */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Informasi Umum</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Nama Aplikasi</label>
                                <input
                                    type="text"
                                    value={settings.site_name}
                                    onChange={e => setSettings(p => ({ ...p, site_name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Logo settings - Temporarily Hidden */}
                    {false && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Logo Aplikasi</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Logo Light */}
                                <div
                                    onClick={() => lightInputRef.current?.click()}
                                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                                            {logoLightRaw ? (
                                                <img src={URL.createObjectURL(logoLightRaw!)} alt="New Light" className="max-h-10 max-w-10 object-contain" />
                                            ) : settings.site_logo ? (
                                                <img src={`http://localhost:5000${settings.site_logo}`} alt="Current Light" className="max-h-10 max-w-10 object-contain" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Mode Terang</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">Klik upload logo</span>
                                        </div>
                                    </div>
                                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                    <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" ref={lightInputRef} onChange={e => handleFileChange(e, 'light')} />
                                </div>

                                {/* Logo Dark */}
                                <div
                                    onClick={() => darkInputRef.current?.click()}
                                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 flex items-center justify-center bg-gray-900 dark:bg-black rounded-lg overflow-hidden border border-gray-700 shrink-0">
                                            {logoDarkRaw ? (
                                                <img src={URL.createObjectURL(logoDarkRaw!)} alt="New Dark" className="max-h-10 max-w-10 object-contain" />
                                            ) : settings.site_logo_dark ? (
                                                <img src={`http://localhost:5000${settings.site_logo_dark}`} alt="Current Dark" className="max-h-10 max-w-10 object-contain" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-gray-600" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Mode Gelap</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">Klik upload logo</span>
                                        </div>
                                    </div>
                                    <Upload className="w-5 h-5 text-gray-400 mr-2" />
                                    <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="hidden" ref={darkInputRef} onChange={e => handleFileChange(e, 'dark')} />
                                </div>
                            </div>
                        </div>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                        {saving ? 'Loading...' : <><Save className="w-5 h-5" /> Simpan Pengaturan</>}
                    </motion.button>
                </div>
            )}
        </div>
    );
}
