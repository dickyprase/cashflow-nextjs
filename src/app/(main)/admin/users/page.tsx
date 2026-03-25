"use client";

import { PageWrapper } from '@/components/PageWrapper';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';

export default function AdminUsersPageRoute() {
    return (
        <PageWrapper>
            <AdminUsersPage />
        </PageWrapper>
    );
}
