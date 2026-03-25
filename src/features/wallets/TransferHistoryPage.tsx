"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Clock, X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { formatCurrency, formatDate, cn, formatTime } from '@/lib/utils';
import { CardSkeleton } from '@/components/Skeleton';
import type { Transaction } from '@/types';
import { useTheme } from '@/context/ThemeContext';

export function TransferHistoryPage() {
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const [selectedTransfer, setSelectedTransfer] = useState<Transaction | null>(null);

    const handleClose = () => setSelectedTransfer(null);

    const { data: transfers, isLoading } = useQuery({
        queryKey: ['transfer-history'],
        queryFn: async () => {
            const res = await api.get('/wallets/transfer/history', { params: { limit: 200 } });
            return res.data.data as Transaction[];
        }
    });

    return (
        <div className="px-4 pt-6 pb-32 min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Riwayat Transfer Wallet</h1>

            <div className="space-y-4">
                {isLoading ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : !transfers || transfers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ArrowLeftRight className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada riwayat transfer.</p>
                    </div>
                ) : (
                    Object.entries(
                        transfers.reduce((acc, tx) => {
                            const d = tx.date.split('T')[0];
                            if (!acc[d]) acc[d] = [];
                            acc[d].push(tx);
                            return acc;
                        }, {} as Record<string, Transaction[]>)
                    )
                        .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                        .map(([dateKey, dayTransfers]) => (
                            <div key={dateKey} className="mt-8 mb-4 first:mt-2">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {formatDate(dateKey, 'EEEE, dd MMM yyyy')}
                                    </h3>
                                    <span className="text-xs font-bold text-gray-500">
                                        {dayTransfers.length} Transfer
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {dayTransfers.map((tx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={tx.id}
                                            onClick={() => setSelectedTransfer(tx)}
                                            className={cn(
                                                "p-4 cursor-pointer active:scale-[0.98] transition-all",
                                                theme === 'neo-brutalism'
                                                    ? "bg-white dark:bg-gray-900 rounded-xl border-2 border-black shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a]"
                                                    : "bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            )}
                                        >
                                            <div className="flex flex-col gap-3">
                                                {/* Top info row: Title & Amount */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                            Transfer Dana
                                                        </span>
                                                        {tx.created_at && (
                                                            <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {formatTime(tx.created_at)} WIB
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                            {formatCurrency(Number(tx.amount))}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Wallets Route Row */}
                                                <div className="flex items-center gap-2 mt-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-2.5">
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Dari</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{tx.wallet_name}</span>
                                                    </div>

                                                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600">
                                                        <ArrowLeftRight className="w-3 h-3" />
                                                    </div>

                                                    <div className="flex flex-col flex-1 min-w-0 text-right">
                                                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Ke</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{tx.target_wallet_name || 'Wallet Tujuan'}</span>
                                                    </div>
                                                </div>

                                                {/* Optional Note */}
                                                {tx.description && !tx.description.startsWith('Transfer ke') && (
                                                    <p className="text-xs text-gray-500 italic px-1">
                                                        "{tx.description}"
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))
                )}
            </div>

            {/* Modal Bottom Sheet Detail Transfer */}
            <AnimatePresence>
                {selectedTransfer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={cn(
                                "fixed bottom-0 left-0 right-0 z-50 p-6 pb-safe max-h-[85vh] overflow-y-auto",
                                theme === 'neo-brutalism'
                                    ? "bg-white dark:bg-gray-900 border-t-4 border-l-4 border-r-4 border-black rounded-t-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                                    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
                            )}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Detail Transfer</h2>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Konten Atas: Rute Transfer & Nominal */}
                            <div className="flex flex-col items-center justify-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                                    <ArrowLeftRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-2">
                                    {formatCurrency(Number(selectedTransfer.amount))}
                                </h3>
                                <p className="text-sm font-semibold text-gray-500 mt-1">
                                    Transfer Dana
                                </p>
                            </div>

                            {/* Detail Informasi */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Dari</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{selectedTransfer.wallet_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Ke</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{selectedTransfer.target_wallet_name || '-'}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Tanggal</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                            {formatDate(selectedTransfer.date, 'dd MMM yyyy')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Waktu</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                                            {selectedTransfer.created_at ? `${formatTime(selectedTransfer.created_at)} WIB` : '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Biaya Admin</p>
                                    <p className="text-sm font-bold mt-0.5">
                                        {Number(selectedTransfer.admin_fee) > 0 ? (
                                            <span className="text-red-500">{formatCurrency(Number(selectedTransfer.admin_fee))}</span>
                                        ) : (
                                            <span className="text-green-500">Gratis (Rp 0)</span>
                                        )}
                                    </p>
                                </div>

                                <div className="h-px bg-gray-200 dark:bg-gray-700/50 w-full" />

                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Catatan</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
                                        {selectedTransfer.description && !selectedTransfer.description.startsWith('Transfer ke')
                                            ? selectedTransfer.description
                                            : <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    className={cn(
                                        "flex-1 py-3.5 flex items-center justify-center gap-2 transition-all",
                                        theme === 'neo-brutalism'
                                            ? "bg-white text-gray-900 border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl font-medium shadow-sm active:scale-95 border-none focus:outline-none hover:bg-gray-200 dark:hover:bg-gray-700"
                                    )}
                                >
                                    Tutup
                                </button>
                                <button
                                    onClick={async () => {
                                        handleClose();

                                        // Step 1: Main confirmation
                                        const result = await Swal.fire({
                                            title: 'Batalkan Transfer?',
                                            text: `Dana sebesar Rp ${formatCurrency(Number(selectedTransfer.amount))} akan otomatis dikembalikan ke dompet asal (${selectedTransfer.wallet_name}).`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#ef4444',
                                            confirmButtonText: 'Ya, Batalkan!'
                                        });

                                        if (result.isConfirmed) {
                                            let deleteFee = false;

                                            // Step 2 & 3: Fee Checking Confirmation
                                            if (Number(selectedTransfer.admin_fee) > 0 && selectedTransfer.admin_fee_transaction_id) {
                                                const feeResult = await Swal.fire({
                                                    title: 'Transfer dibatalkan.',
                                                    text: `Apakah Anda juga ingin menghapus catatan pengeluaran Biaya Admin sebesar Rp ${formatCurrency(Number(selectedTransfer.admin_fee))} dan mengembalikannya ke dompet asal?`,
                                                    icon: 'question',
                                                    showCancelButton: true,
                                                    confirmButtonColor: '#ef4444',
                                                    cancelButtonColor: '#6b7280',
                                                    confirmButtonText: 'Ya, Hapus Fee',
                                                    cancelButtonText: 'Biarkan Saja'
                                                });

                                                if (feeResult.isConfirmed) {
                                                    deleteFee = true;
                                                }
                                            }

                                            // Step 4: Execute API Deletion
                                            try {
                                                await api.delete(`/wallets/transfer/${selectedTransfer.id}?deleteFee=${deleteFee}`);
                                                queryClient.invalidateQueries({ queryKey: ['transfer-history'] });
                                                // If we have wallets query caching
                                                queryClient.invalidateQueries({ queryKey: ['wallets'] });
                                                toast.success('Transfer berhasil dibatalkan dan saldo dikembalikan');
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Gagal membatalkan transfer');
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "flex-1 py-3.5 flex items-center justify-center gap-2 transition-all",
                                        theme === 'neo-brutalism'
                                            ? "bg-red-500 text-white border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none focus:outline-none"
                                            : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-xl font-medium active:scale-95 border-none focus:outline-none"
                                    )}
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
