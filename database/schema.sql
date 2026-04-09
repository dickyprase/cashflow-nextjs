-- Cashflow Database Schema
-- Version 2.0 - Added Admin Roles and Wallet System

-- Users table (updated with role and status)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK(role IN ('user', 'admin')) DEFAULT 'user',
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wallets table (new)
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK(type IN ('cash', 'e-wallet', 'bank', 'credit_card', 'investment')) DEFAULT 'cash',
    balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'IDR',
    color VARCHAR(20) DEFAULT '#4361ee',
    icon VARCHAR(50) DEFAULT '💰',
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK(type IN ('income', 'expense')) NOT NULL,
    color VARCHAR(20) DEFAULT '#4361ee',
    icon VARCHAR(50) DEFAULT '💰',
    budget_limit DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table (updated with wallet support)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    wallet_id INTEGER,
    target_wallet_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(50) CHECK(type IN ('income', 'expense')) NOT NULL,
    transaction_type VARCHAR(50) CHECK(transaction_type IN ('income', 'expense', 'transfer')) DEFAULT NULL,
    description TEXT,
    date DATE NOT NULL,
    attachment_url TEXT,
    is_excluded_from_budget BOOLEAN DEFAULT FALSE,
    is_system_generated BOOLEAN DEFAULT FALSE,
    admin_fee DECIMAL(15,2),
    admin_fee_transaction_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (target_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_fee_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table (new)
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

INSERT INTO site_settings (key, value, description) VALUES 
    ('app_name', 'Cashflow', 'Application name'),
    ('default_currency', 'IDR', 'Default currency'),
    ('allow_registration', '1', 'Allow new user registration'),
    ('maintenance_mode', '0', 'Maintenance mode status')
ON CONFLICT (key) DO NOTHING;

-- Goals table (new)
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    deadline DATE,
    tracking_method VARCHAR(50) CHECK(tracking_method IN ('single', 'multiple', 'all')) NOT NULL DEFAULT 'single',
    description TEXT,
    color VARCHAR(20) DEFAULT '#4361ee',
    icon VARCHAR(50) DEFAULT 'target',
    priority VARCHAR(50) CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    status VARCHAR(50) CHECK(status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    is_locked BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Goal-Wallet relationship table (new)
CREATE TABLE IF NOT EXISTS goal_wallets (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL,
    wallet_id INTEGER NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
    UNIQUE(goal_id, wallet_id)
);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goal_wallets_goal ON goal_wallets(goal_id);

-- Daily Budget Settings table (new)
CREATE TABLE IF NOT EXISTS daily_budget_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    mode VARCHAR(50) CHECK(mode IN ('manual', 'formula')) DEFAULT 'manual',
    reset_day INTEGER DEFAULT 25,
    manual_daily_amount DECIMAL(15,2) DEFAULT 0,
    formula_income DECIMAL(15,2) DEFAULT 0,
    formula_fixed_expenses DECIMAL(15,2) DEFAULT 0,
    formula_savings_target DECIMAL(15,2) DEFAULT 0,
    wallet_id INTEGER DEFAULT NULL,
    is_interactive INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_budget_settings_user ON daily_budget_settings(user_id);
