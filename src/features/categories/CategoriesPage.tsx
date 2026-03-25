"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const ICONS = ['🍔', '🚗', '💰', '🏠', '🎮', '📱', '👕', '💊', '📚', '✈️', '🎁', '💼', '🛒', '⚡', '💧', '📺', '🎬', '🏋️', '🐾', '💇'];
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'];

export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [showModal, setShowModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [form, setForm] = useState({ name: '', icon: '💰', color: '#3b82f6' });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = categories.filter(c => c.type === activeTab);

    const openAdd = () => {
        setEditingCat(null);
        setForm({ name: '', icon: '💰', color: '#3b82f6' });
        setShowModal(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setForm({ name: cat.name, icon: cat.icon, color: cat.color });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const payload = { ...form, type: activeTab };
            if (editingCat) {
                await api.put(`/categories/${editingCat.id}`, payload);
                toast.success('Kategori berhasil diperbarui');
            } else {
                await api.post('/categories', payload);
                toast.success('Kategori berhasil ditambahkan');
            }
            setShowModal(false);
            loadCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus kategori ini?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (!result.isConfirmed) return;

        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori berhasil dihapus');
            loadCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghapus kategori');
            console.error(err);
        }
    };

    return (
        <div className="px-4 pt-6 pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kategori</h1>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={openAdd}
                    className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30"
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                {/* Tabs */}
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex mb-5">
                    {(['expense', 'income'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={cn(
                                'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                                activeTab === t
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                                    : 'text-gray-500'
                            )}
                        >
                            {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                    ))}
                </div>

                {/* Categories Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton h-24 rounded-2xl" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {filtered.map((cat, i) => (
                            <motion.div
                                key={cat.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 card-hover"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                        style={{ backgroundColor: `${cat.color}20` }}
                                    >
                                        {cat.icon}
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEdit(cat)}
                                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                                        >
                                            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cat.id)}
                                            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{cat.name}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Tag className="w-7 h-7 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">Belum ada kategori</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-6 pb-32 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {editingCat ? 'Edit Kategori' : 'Tambah Kategori'}
                                </h3>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Nama</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Nama kategori"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Ikon</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ICONS.map(icon => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, icon }))}
                                                className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all',
                                                    form.icon === icon ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500' : 'bg-gray-100 dark:bg-gray-800'
                                                )}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Warna</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, color }))}
                                                className={cn(
                                                    'w-8 h-8 rounded-full transition-all',
                                                    form.color === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                                                )}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors mt-2"
                                >
                                    Simpan
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
