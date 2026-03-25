"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { TransactionsHistoryPage } from '@/features/transactions/TransactionsHistoryPage';

export default function TransactionsHistoryPageRoute() {
    return (
        <PageWrapper>
            <TransactionsHistoryPage />
        </PageWrapper>
    );
}
