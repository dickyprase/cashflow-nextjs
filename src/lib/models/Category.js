import { query } from '../db';

class Category {
    // Create new category
    static async create(userId, name, type, color = '#4361ee', icon = '💰', budgetLimit = 0) {
        const result = await query(`
            INSERT INTO categories (user_id, name, type, color, icon, budget_limit)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [userId, name, type, color, icon, budgetLimit]);
        return this.findById(result.rows[0].id);
    }

    // Find category by ID
    static async findById(id) {
        const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
        return result.rows[0];
    }

    /**
     * Get all categories for a user
     * @param {number} userId
     * @param {string|null} [type=null]
     */
    static async findByUserId(userId, type = null) {
        let sql = 'SELECT * FROM categories WHERE user_id = $1';
        const params = [userId];

        if (type) {
            params.push(type);
            sql += ` AND type = $${params.length}`;
        }

        sql += ' ORDER BY name ASC';
        const result = await query(sql, params);
        return result.rows;
    }

    // Update category
    static async update(id, userId, updates) {
        const { name, type, color, icon, budget_limit } = updates;
        await query(`
            UPDATE categories 
            SET name = COALESCE($1, name),
                type = COALESCE($2, type),
                color = COALESCE($3, color),
                icon = COALESCE($4, icon),
                budget_limit = COALESCE($5, budget_limit)
            WHERE id = $6 AND user_id = $7
        `, [name, type, color, icon, budget_limit, id, userId]);
        return this.findById(id);
    }

    // Delete category
    static async delete(id, userId) {
        const result = await query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
        return result.rowCount > 0;
    }

    // Check if category belongs to user
    static async belongsToUser(id, userId) {
        const result = await query('SELECT COUNT(*) as count FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
        return parseInt(result.rows[0].count, 10) > 0;
    }

    // Get category with spending for current month
    static async getWithSpending(userId) {
        const result = await query(`
            SELECT c.*, 
                   COALESCE(SUM(CASE WHEN date_trunc('month', t.date) = date_trunc('month', CURRENT_DATE) 
                                     THEN t.amount ELSE 0 END), 0) as current_spending
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id AND t.type = 'expense'
            WHERE c.user_id = $1
            GROUP BY c.id
            ORDER BY c.name ASC
        `, [userId]);
        return result.rows;
    }

    // Create default categories for new user
    static async createDefaults(userId) {
        const defaults = [
            // Income categories
            { name: 'Gaji', type: 'income', color: '#4cc9f0', icon: '💰' },
            { name: 'Freelance', type: 'income', color: '#4361ee', icon: '💻' },
            { name: 'Investasi', type: 'income', color: '#7209b7', icon: '📈' },
            { name: 'Lainnya', type: 'income', color: '#3a0ca3', icon: '🎁' },
            // Expense categories
            { name: 'Makanan', type: 'expense', color: '#f72585', icon: '🍔' },
            { name: 'Transportasi', type: 'expense', color: '#f8961e', icon: '🚗' },
            { name: 'Belanja', type: 'expense', color: '#90be6d', icon: '🛒' },
            { name: 'Tagihan', type: 'expense', color: '#577590', icon: '💧' },
            { name: 'Hiburan', type: 'expense', color: '#f94144', icon: '🎬' },
            { name: 'Kesehatan', type: 'expense', color: '#43aa8b', icon: '💊' },
        ];

        for (const cat of defaults) {
            await query(`
                INSERT INTO categories (user_id, name, type, color, icon, budget_limit)
                VALUES ($1, $2, $3, $4, $5, 0)
            `, [userId, cat.name, cat.type, cat.color, cat.icon]);
        }
    }
}

export default Category;
