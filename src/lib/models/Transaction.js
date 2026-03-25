import { query } from '../db';

class Transaction {
    // Create new transaction with wallet support
    static async create(userId, data) {
        const {
            category_id,
            wallet_id,
            target_wallet_id = null,
            amount,
            type,
            transaction_type = null,
            description,
            date,
            attachment_url = null,
            is_system_generated = false
        } = data;

        const result = await query(`
            INSERT INTO transactions (user_id, category_id, wallet_id, target_wallet_id, amount, type, transaction_type, description, date, attachment_url, is_system_generated)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `, [userId, category_id, wallet_id, target_wallet_id, amount, type, transaction_type || type, description, date, attachment_url, is_system_generated]);
        return this.findById(result.rows[0].id);
    }

    // Create transfer transaction (no category required)
    static async createTransfer(userId, data) {
        const {
            wallet_id,
            target_wallet_id,
            amount,
            description,
            date,
            admin_fee_transaction_id = null,
            admin_fee = 0
        } = data;

        const result = await query(`
            INSERT INTO transactions (user_id, category_id, wallet_id, target_wallet_id, amount, type, transaction_type, description, date, admin_fee_transaction_id, admin_fee)
            VALUES ($1, NULL, $2, $3, $4, 'transfer', 'transfer', $5, $6, $7, $8)
            RETURNING id
        `, [userId, wallet_id, target_wallet_id, amount, description, date, admin_fee_transaction_id, admin_fee]);
        return this.findById(result.rows[0].id);
    }

    // Find transaction by ID
    static async findById(id) {
        const result = await query(`
            SELECT t.*, 
                   c.name as category_name, c.color as category_color, c.icon as category_icon,
                   w.name as wallet_name, w.color as wallet_color, w.icon as wallet_icon,
                   tw.name as target_wallet_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            LEFT JOIN wallets tw ON t.target_wallet_id = tw.id
            WHERE t.id = $1
        `, [id]);
        return result.rows[0];
    }

    // Get all transactions for a user with filters
    static async findByUserId(userId, filters = {}) {
        const { startDate, endDate, categoryId, walletId, type, search, limit = 50, offset = 0 } = filters;

        let sql = `
            SELECT t.*, 
                   c.name as category_name, c.color as category_color, c.icon as category_icon,
                   w.name as wallet_name, w.color as wallet_color, w.icon as wallet_icon,
                   tw.name as target_wallet_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            LEFT JOIN wallets tw ON t.target_wallet_id = tw.id
            WHERE t.user_id = $1
        `;
        const params = [userId];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.date <= $${params.length}`;
        }
        if (categoryId) {
            params.push(categoryId);
            sql += ` AND t.category_id = $${params.length}`;
        }
        if (walletId) {
            params.push(walletId, walletId);
            sql += ` AND (t.wallet_id = $${params.length - 1} OR t.target_wallet_id = $${params.length})`;
        }
        if (type) {
            params.push(type);
            sql += ` AND t.type = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND t.description LIKE $${params.length}`;
        }

        sql += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    }

    // Get count for pagination
    static async count(userId, filters = {}) {
        const { startDate, endDate, categoryId, walletId, type, search } = filters;

        let sql = 'SELECT COUNT(*) as total FROM transactions t WHERE t.user_id = $1';
        const params = [userId];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.date <= $${params.length}`;
        }
        if (categoryId) {
            params.push(categoryId);
            sql += ` AND t.category_id = $${params.length}`;
        }
        if (walletId) {
            params.push(walletId, walletId);
            sql += ` AND (t.wallet_id = $${params.length - 1} OR t.target_wallet_id = $${params.length})`;
        }
        if (type) {
            params.push(type);
            sql += ` AND t.type = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            sql += ` AND t.description LIKE $${params.length}`;
        }

        const result = await query(sql, params);
        return parseInt(result.rows[0].total, 10);
    }

    // Update transaction
    static async update(id, userId, updates) {
        const { category_id, wallet_id, amount, type, description, date, attachment_url, is_excluded_from_budget, is_system_generated, admin_fee, admin_fee_transaction_id } = updates;

        // Convert undefined to null for pg driver compatibility with COALESCE
        const safeCategoryId = category_id !== undefined ? category_id : null;
        const safeWalletId = wallet_id !== undefined ? wallet_id : null;
        const safeAmount = amount !== undefined ? amount : null;
        const safeType = type !== undefined ? type : null;
        const safeDescription = description !== undefined ? description : null;
        const safeDate = date !== undefined ? date : null;
        const safeAttachmentUrl = attachment_url !== undefined ? attachment_url : null;
        const safeIsExcluded = is_excluded_from_budget !== undefined ? is_excluded_from_budget : null;
        const safeIsSystemGenerated = is_system_generated !== undefined ? is_system_generated : null;
        const safeAdminFee = admin_fee !== undefined ? admin_fee : null;
        const safeAdminFeeTransactionId = admin_fee_transaction_id !== undefined ? admin_fee_transaction_id : null;

        await query(`
            UPDATE transactions 
            SET category_id = COALESCE($1, category_id),
                wallet_id = COALESCE($2, wallet_id),
                amount = COALESCE($3, amount),
                type = COALESCE($4, type),
                description = COALESCE($5, description),
                date = COALESCE($6, date),
                attachment_url = COALESCE($7, attachment_url),
                is_excluded_from_budget = COALESCE($8, is_excluded_from_budget),
                is_system_generated = COALESCE($9, is_system_generated),
                admin_fee = COALESCE($10, admin_fee),
                admin_fee_transaction_id = COALESCE($11, admin_fee_transaction_id)
            WHERE id = $12 AND user_id = $13
        `, [
            safeCategoryId,
            safeWalletId,
            safeAmount,
            safeType,
            safeDescription,
            safeDate,
            safeAttachmentUrl,
            safeIsExcluded,
            safeIsSystemGenerated,
            safeAdminFee,
            safeAdminFeeTransactionId,
            id,
            userId
        ]);
        return this.findById(id);
    }

    // Delete transaction
    static async delete(id, userId) {
        const result = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
        return result.rowCount > 0;
    }

    // Get summary for dashboard
    static async getSummary(userId) {
        const result = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = false THEN amount ELSE 0 END), 0) as total_budget_expense,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
            FROM transactions
            WHERE user_id = $1
        `, [userId]);
        return result.rows[0];
    }

    // Get monthly summary
    static async getMonthlySummary(userId, year, month) {
        const result = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = false THEN amount ELSE 0 END), 0) as total_budget_expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = true THEN amount ELSE 0 END), 0) as total_incidental_expense
            FROM transactions
            WHERE user_id = $1 
              AND to_char(date, 'YYYY') = $2 
              AND to_char(date, 'MM') = $3
        `, [userId, year.toString(), month.toString().padStart(2, '0')]);
        return result.rows[0];
    }

    // Get sum of transactions in a date range (for Daily Budget)
    static async getSumByDateRange(userId, startDate, endDate, type = 'expense') {
        const result = await query(`
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = $1 
              AND date >= $2 
              AND date < $3
              AND type = $4
        `, [userId, startDate, endDate, type]);
        return parseFloat(result.rows[0].total) || 0;
    }

    // Get today's summary (income and expense for today)
    static async getTodaySummary(userId) {
        const d = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; // YYYY-MM-DD format
        const result = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = false THEN amount ELSE 0 END), 0) as budget_expense
            FROM transactions
            WHERE user_id = $1 
              AND date = $2
        `, [userId, today]);
        return result.rows[0];
    }

    // Get category breakdown for a period
    static async getCategoryBreakdown(userId, startDate, endDate, type = 'expense') {
        const result = await query(`
            SELECT c.id as category_id, c.name as category_name, c.color, c.icon,
                   COALESCE(SUM(t.amount), 0) as total,
                   COALESCE(SUM(CASE WHEN t.is_excluded_from_budget = false THEN t.amount ELSE 0 END), 0) as total_budget,
                   COALESCE(SUM(CASE WHEN t.is_excluded_from_budget = true THEN t.amount ELSE 0 END), 0) as total_incidental,
                   COUNT(t.id) as count
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id 
                AND t.date >= $1 AND t.date <= $2
            WHERE c.user_id = $3 AND c.type = $4
            GROUP BY c.id
            HAVING SUM(t.amount) > 0
            ORDER BY total DESC
        `, [startDate, endDate, userId, type]);
        return result.rows;
    }

    // Get monthly trend data
    static async getMonthlyTrend(userId, year) {
        const result = await query(`
            SELECT 
                to_char(date, 'MM') as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = false THEN amount ELSE 0 END), 0) as budget_expense,
                COALESCE(SUM(CASE WHEN type = 'expense' AND is_excluded_from_budget = true THEN amount ELSE 0 END), 0) as incidental_expense
            FROM transactions
            WHERE user_id = $1 AND to_char(date, 'YYYY') = $2
            GROUP BY to_char(date, 'MM')
            ORDER BY month ASC
        `, [userId, year.toString()]);
        return result.rows;
    }

    // Get recent transactions
    static async getRecent(userId, limit = 5) {
        const result = await query(`
            SELECT t.*, 
                   c.name as category_name, c.color as category_color, c.icon as category_icon,
                   w.name as wallet_name, w.color as wallet_color
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            WHERE t.user_id = $1
            ORDER BY t.date DESC, t.created_at DESC
            LIMIT $2
        `, [userId, limit]);
        return result.rows;
    }

    // Get all transactions for export
    static async getAllForExport(userId, filters = {}) {
        const { startDate, endDate, type, walletId } = filters;

        let sql = `
            SELECT t.date, t.type, c.name as category, w.name as wallet, t.description, t.amount
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            WHERE t.user_id = $1
        `;
        const params = [userId];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.date <= $${params.length}`;
        }
        if (type) {
            params.push(type);
            sql += ` AND t.type = $${params.length}`;
        }
        if (walletId) {
            params.push(walletId);
            sql += ` AND t.wallet_id = $${params.length}`;
        }

        sql += ' ORDER BY t.date DESC';
        const result = await query(sql, params);
        return result.rows;
    }

    // Get transactions by wallet
    static async findByWalletId(walletId, userId, limit = 50) {
        const result = await query(`
            SELECT t.*, 
                   c.name as category_name, c.color as category_color, c.icon as category_icon,
                   w.name as wallet_name, tw.name as target_wallet_name
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            LEFT JOIN wallets tw ON t.target_wallet_id = tw.id
            WHERE (t.wallet_id = $1 OR t.target_wallet_id = $2) AND t.user_id = $3
            ORDER BY t.date DESC, t.created_at DESC
            LIMIT $4
        `, [walletId, walletId, userId, limit]);
        return result.rows;
    }

    // Get daily activity for a month (calendar widget)
    static async getDailyActivity(userId, year, month) {
        const result = await query(`
            SELECT 
                to_char(date, 'YYYY-MM-DD') as date,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
            FROM transactions
            WHERE user_id = $1 
              AND to_char(date, 'YYYY') = $2 
              AND to_char(date, 'MM') = $3
            GROUP BY date
            ORDER BY date ASC
        `, [userId, year.toString(), month.toString().padStart(2, '0')]);
        return result.rows;
    }

    // ================== ADMIN METHODS ==================

    // Get all transactions (admin only)
    static async getAll(filters = {}) {
        const { startDate, endDate, userId, type, limit = 50, offset = 0 } = filters;

        let sql = `
            SELECT t.*, 
                   u.username, u.email,
                   c.name as category_name, c.color as category_color,
                   w.name as wallet_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN categories c ON t.category_id = c.id
            LEFT JOIN wallets w ON t.wallet_id = w.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.date <= $${params.length}`;
        }
        if (userId) {
            params.push(userId);
            sql += ` AND t.user_id = $${params.length}`;
        }
        if (type) {
            params.push(type);
            sql += ` AND t.type = $${params.length}`;
        }

        sql += ` ORDER BY t.date DESC, t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    }

    // Get global stats (admin only)
    static async getGlobalStats() {
        const result = await query(`
            SELECT 
                COUNT(*) as total_transactions,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(CASE WHEN CAST(created_at AS DATE) = CURRENT_DATE THEN 1 ELSE 0 END), 0) as today_count,
                COALESCE(SUM(CASE WHEN CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as week_count
            FROM transactions
        `);
        return result.rows[0];
    }

    // Get transactions count (admin)
    static async countAll(filters = {}) {
        const { startDate, endDate, userId, type } = filters;

        let sql = 'SELECT COUNT(*) as total FROM transactions t WHERE 1=1';
        const params = [];

        if (startDate) {
            params.push(startDate);
            sql += ` AND t.date >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            sql += ` AND t.date <= $${params.length}`;
        }
        if (userId) {
            params.push(userId);
            sql += ` AND t.user_id = $${params.length}`;
        }
        if (type) {
            params.push(type);
            sql += ` AND t.type = $${params.length}`;
        }

        const result = await query(sql, params);
        return parseInt(result.rows[0].total, 10);
    }
}

export default Transaction;
