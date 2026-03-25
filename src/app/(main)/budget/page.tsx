"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { BudgetingPage } from '@/features/budget/BudgetingPage';

export default function BudgetPageRoute() {
    return (
        <PageWrapper>
            <BudgetingPage />
        </PageWrapper>
    );
}
