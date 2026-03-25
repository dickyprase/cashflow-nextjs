"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { TransactionFormPage } from '@/features/transactions/TransactionFormPage';

export default function TransactionAddPageRoute() {
    return (
        <PageWrapper>
            <TransactionFormPage />
        </PageWrapper>
    );
}
