"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export default function DashboardPageRoute() {
    return (
        <PageWrapper>
            <DashboardPage />
        </PageWrapper>
    );
}
