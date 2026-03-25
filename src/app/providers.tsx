"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useMobileKeyboardFix } from '@/hooks/useMobileKeyboardFix';

function InnerProviders({ children }: { children: React.ReactNode }) {
    useMobileKeyboardFix();
    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 2,
                refetchOnWindowFocus: false,
                staleTime: 1000 * 60 * 5,
            },
        },
    }));

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <InnerProviders>{children}</InnerProviders>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}
