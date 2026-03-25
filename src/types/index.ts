export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    avatar?: string;
    is_active: number;
    created_at: string;
}

export interface Category {
    id: number;
    user_id: number;
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color: string;
    is_active: number;
    created_at: string;
}

export interface Transaction {
    id: number;
    user_id: number;
    wallet_id: number;
    category_id: number;
    type: 'income' | 'expense' | 'transfer';
    transaction_type?: 'income' | 'expense' | 'transfer';
    amount: number | string;
    description: string;
    date: string;
    created_at?: string;
    is_excluded_from_budget: boolean;
    is_system_generated: boolean;
    admin_fee?: number | string;
    admin_fee_transaction_id?: number;
    category_name?: string;
    category_color?: string;
    category_icon?: string;
    wallet_name?: string;
    wallet_color?: string;
    wallet_icon?: string;
    target_wallet_name?: string;
}

export interface Wallet {
    id: number;
    user_id: number;
    name: string;
    type: string;
    balance: number;
    icon: string;
    color: string;
    is_active: number;
    created_at: string;
}

export interface Goal {
    id: number;
    user_id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    icon: string;
    color: string;
    status: string;
    created_at: string;
    updated_at?: string;
    completed_at?: string;
}

export interface DashboardData {
    balance: number;
    income: number;
    expense: number;
    transaction_count: number;
    recent_transactions: Transaction[];
    category_summary: CategorySummary[];
}

export interface CategorySummary {
    category_id: number;
    category_name: string;
    category_icon: string;
    category_color: string;
    total: number;
    count: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface LoginPayload {
    loginId: string;
    password?: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    full_name: string;
}
