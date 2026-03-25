"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';

export default function TransactionsPageRoute() {
    return (
        <PageWrapper>
            <TransactionsPage />
        </PageWrapper>
    );
}
