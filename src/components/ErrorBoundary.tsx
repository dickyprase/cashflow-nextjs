"use client";

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Terjadi Kesalahan
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            {this.state.error?.message || 'Aplikasi mengalami masalah. Silakan coba lagi.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Muat Ulang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
