import { query } from '../db';

class Wallet {
    // Create new wallet
    static async create(userId, data) {
        const { name, type = 'cash', balance = 0, currency = 'IDR', color = '#4361ee', icon = '💰', is_default = 0 } = data;

        // If this is set as default, unset other defaults first
        if (is_default) {
            await query('UPDATE wallets SET is_default = 0 WHERE user_id = $1', [userId]);
        }

        const result = await query(`
            INSERT INTO wallets (user_id, name, type, balance, currency, color, icon, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [userId, name, type, balance, currency, color, icon, is_default]);
        return this.findById(result.rows[0].id);
    }

    // Find wallet by ID
    static async findById(id) {
        const result = await query('SELECT * FROM wallets WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Find wallet by ID with ownership check
    static async findByIdAndUser(id, userId) {
        const result = await query('SELECT * FROM wallets WHERE id = $1 AND user_id = $2', [id, userId]);
        return result.rows[0];
    }

    // Get all wallets for a user
    static async findByUserId(userId, includeInactive = false) {
        let sql = 'SELECT * FROM wallets WHERE user_id = $1';
        if (!includeInactive) {
            sql += ' AND is_active = 1';
        }
        sql += ' ORDER BY is_default DESC, name ASC';
        const result = await query(sql, [userId]);
        return result.rows;
    }

    // Get default wallet for user
    static async getDefault(userId) {
        const result = await query('SELECT * FROM wallets WHERE user_id = $1 AND is_default = 1 AND is_active = 1', [userId]);
        return result.rows[0];
    }

    // Update wallet
    static async update(id, userId, updates) {
        const { name, type, color, icon, is_default, is_active, balance } = updates;

        // If setting as default, unset others first
        if (is_default) {
            await query('UPDATE wallets SET is_default = 0 WHERE user_id = $1', [userId]);
        }

        await query(`
            UPDATE wallets 
            SET name = COALESCE($1, name),
                type = COALESCE($2, type),
                color = COALESCE($3, color),
                icon = COALESCE($4, icon),
                is_default = COALESCE($5, is_default),
                is_active = COALESCE($6, is_active),
                balance = COALESCE($7, balance),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND user_id = $9
        `, [name, type, color, icon, is_default, is_active, balance !== undefined ? balance : null, id, userId]);
        return this.findById(id);
    }

    // Update balance (internal use)
    static async updateBalance(id, amount) {
        await query(`
            UPDATE wallets 
            SET balance = balance + $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [amount, id]);
        return this.findById(id);
    }

    // Set balance directly (for corrections)
    static async setBalance(id, userId, balance) {
        await query(`
            UPDATE wallets 
            SET balance = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3
        `, [balance, id, userId]);
        return this.findById(id);
    }

    // Delete wallet (soft delete - set inactive)
    static async delete(id, userId) {
        const result = await query('UPDATE wallets SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2', [id, userId]);
        return result.rowCount > 0;
    }

    // Hard delete (permanent)
    static async hardDelete(id, userId) {
        const result = await query('DELETE FROM wallets WHERE id = $1 AND user_id = $2', [id, userId]);
        return result.rowCount > 0;
    }

    // Get total balance for all user wallets
    static async getTotalBalance(userId) {
        const result = await query(`
            SELECT COALESCE(SUM(balance), 0) as total_balance
            FROM wallets 
            WHERE user_id = $1 AND is_active = 1
        `, [userId]);
        return parseFloat(result.rows[0].total_balance) || 0;
    }

    // Get wallet with transaction count
    static async findByUserIdWithStats(userId) {
        const result = await query(`
            SELECT w.*, 
                   COUNT(t.id) as transaction_count,
                   COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
                   COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
            FROM wallets w
            LEFT JOIN transactions t ON w.id = t.wallet_id
            WHERE w.user_id = $1 AND w.is_active = 1
            GROUP BY w.id
            ORDER BY w.is_default DESC, w.name ASC
        `, [userId]);
        return result.rows;
    }

    // Transfer between wallets
    static async transfer(userId, fromWalletId, toWalletId, amount) {
        // Verify ownership and get wallets
        const fromWallet = await this.findByIdAndUser(fromWalletId, userId);
        const toWallet = await this.findByIdAndUser(toWalletId, userId);

        if (!fromWallet || !toWallet) {
            throw new Error('Wallet tidak ditemukan');
        }

        if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
            throw new Error('Saldo tidak mencukupi');
        }

        // Perform transfer
        await this.updateBalance(fromWalletId, -amount);
        await this.updateBalance(toWalletId, amount);

        return {
            from: await this.findById(fromWalletId),
            to: await this.findById(toWalletId)
        };
    }

    // Create default wallet for new user
    static async createDefaultWallet(userId) {
        return this.create(userId, {
            name: 'Dompet Utama',
            type: 'cash',
            balance: 0,
            color: '#4361ee',
            icon: '💵',
            is_default: 1
        });
    }

    // Check if user has any wallets
    static async userHasWallets(userId) {
        const result = await query('SELECT COUNT(*) as count FROM wallets WHERE user_id = $1', [userId]);
        return parseInt(result.rows[0].count, 10) > 0;
    }
}

export default Wallet;
