import { query } from '../db';

class User {
    // Create new user
    static async create(username, email, passwordHash, role = 'user') {
        const result = await query(`
            INSERT INTO users (username, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [username, email, passwordHash, role]);
        return result.rows[0].id;
    }

    // Find user by email or username
    static async findByEmailOrUsername(identifier) {
        const result = await query('SELECT * FROM users WHERE email = $1 OR username = $1', [identifier]);
        return result.rows[0];
    }

    // Find user by username
    static async findByUsername(username) {
        const result = await query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    }

    // Find user by ID (without password)
    static async findById(id) {
        const result = await query('SELECT id, username, email, role, is_active, avatar, created_at FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Find user by ID with role (for middleware)
    static async findByIdWithRole(id) {
        const result = await query('SELECT id, username, email, role, is_active, avatar FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Check if email exists
    static async emailExists(email) {
        const result = await query('SELECT COUNT(*) as count FROM users WHERE email = $1', [email]);
        return parseInt(result.rows[0].count, 10) > 0;
    }

    // Check if username exists
    static async usernameExists(username) {
        const result = await query('SELECT COUNT(*) as count FROM users WHERE username = $1', [username]);
        return parseInt(result.rows[0].count, 10) > 0;
    }

    // Update user profile
    static async updateProfile(id, updates) {
        const { username = null, email = null, avatar = null } = updates;
        await query(`
            UPDATE users 
            SET username = COALESCE($1, username),
                email = COALESCE($2, email),
                avatar = COALESCE($3, avatar),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [username, email, avatar, id]);
        return this.findById(id);
    }

    // Update password
    static async updatePassword(id, passwordHash) {
        await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, id]);
        return true;
    }

    // Get user with password (for auth)
    static async findByIdWithPassword(id) {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    // ================== ADMIN METHODS ==================

    // Get all users (admin only)
    static async getAll(filters = {}) {
        const { search, role, is_active, limit = 50, offset = 0 } = filters;

        let sql = 'SELECT id, username, email, role, is_active, avatar, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`, `%${search}%`);
            sql += ` AND (username LIKE $${params.length - 1} OR email LIKE $${params.length})`;
        }
        if (role) {
            params.push(role);
            sql += ` AND role = $${params.length}`;
        }
        if (is_active !== undefined) {
            params.push(is_active);
            sql += ` AND is_active = $${params.length}`;
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        return result.rows;
    }

    // Get total user count
    static async count(filters = {}) {
        const { search, role, is_active } = filters;

        let sql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`, `%${search}%`);
            sql += ` AND (username LIKE $${params.length - 1} OR email LIKE $${params.length})`;
        }
        if (role) {
            params.push(role);
            sql += ` AND role = $${params.length}`;
        }
        if (is_active !== undefined) {
            params.push(is_active);
            sql += ` AND is_active = $${params.length}`;
        }

        const result = await query(sql, params);
        return parseInt(result.rows[0].total, 10);
    }

    // Update user role (admin only)
    static async updateRole(id, role) {
        await query('UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [role, id]);
        return this.findById(id);
    }

    // Toggle user status (admin only)
    static async toggleStatus(id) {
        const user = await this.findById(id);
        if (!user) return null;

        const newStatus = user.is_active ? 0 : 1;
        await query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newStatus, id]);
        return this.findById(id);
    }

    // Set user status (admin only)
    static async setStatus(id, is_active) {
        await query('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [is_active ? 1 : 0, id]);
        return this.findById(id);
    }

    // Get user stats (admin only)
    static async getStats() {
        const result = await query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as total_admins,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
                SUM(CASE WHEN CAST(created_at AS DATE) = CURRENT_DATE THEN 1 ELSE 0 END) as new_today,
                SUM(CASE WHEN CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as new_this_week,
                SUM(CASE WHEN CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '30 days' THEN 1 ELSE 0 END) as new_this_month
            FROM users
        `);
        return result.rows[0];
    }

    // Get user growth by month (admin only)
    static async getGrowthByMonth(year) {
        const result = await query(`
            SELECT 
                to_char(created_at, 'MM') as month,
                COUNT(*) as count
            FROM users
            WHERE to_char(created_at, 'YYYY') = $1
            GROUP BY to_char(created_at, 'MM')
            ORDER BY month
        `, [year.toString()]);
        return result.rows;
    }

    // Get user with transaction summary (admin only)
    static async getUserWithStats(id) {
        const result = await query(`
            SELECT u.id, u.username, u.email, u.role, u.is_active, u.avatar, u.created_at,
                   COUNT(t.id) as transaction_count,
                   COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
                   COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expense
            FROM users u
            LEFT JOIN transactions t ON u.id = t.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `, [id]);
        return result.rows[0];
    }

    // Delete user (admin only - use with caution)
    static async delete(id) {
        const result = await query('DELETE FROM users WHERE id = $1', [id]);
        return result.rowCount > 0;
    }
}

export default User;
