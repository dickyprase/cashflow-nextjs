"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { AppSettingsPage } from '@/features/admin/AppSettingsPage';

export default function AdminSettingsPageRoute() {
    return (
        <PageWrapper>
            <AppSettingsPage />
        </PageWrapper>
    );
}
