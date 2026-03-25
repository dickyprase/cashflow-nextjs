"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { TransactionFormPage } from '@/features/transactions/TransactionFormPage';

export default function TransactionEditPageRoute() {
    return (
        <PageWrapper>
            <TransactionFormPage />
        </PageWrapper>
    );
}
