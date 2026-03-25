import { query } from '../db';

class Goal {
    /**
     * Create a new goal
     */
    static async create(userId, data) {
        const {
            name,
            target_amount,
            deadline = null,
            tracking_method = 'single',
            description = null,
            color = '#4361ee',
            icon = 'target',
            priority = 'medium',
            wallet_ids = [],
            is_locked = false
        } = data;

        // Validate target amount
        if (target_amount < 10000) {
            throw new Error('Target amount minimal Rp 10.000');
        }

        // Insert goal
        const result = await query(`
            INSERT INTO goals (user_id, name, target_amount, deadline, tracking_method, description, color, icon, priority, is_locked)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [userId, name, target_amount, deadline, tracking_method, description, color, icon, priority, is_locked]);
        const goalId = result.rows[0].id;

        // Insert wallet relationships (for single/multiple tracking)
        if (tracking_method !== 'all' && wallet_ids.length > 0) {
            for (const walletId of wallet_ids) {
                await query('INSERT INTO goal_wallets (goal_id, wallet_id) VALUES ($1, $2)', [goalId, walletId]);
            }
        }

        return this.findById(goalId, userId);
    }

    /**
     * Find goal by ID with full details
     */
    static async findById(id, userId) {
        const result = await query(`
            SELECT g.*, 
                   string_agg(gw.wallet_id::text, ',') as wallet_ids
            FROM goals g
            LEFT JOIN goal_wallets gw ON g.id = gw.goal_id
            WHERE g.id = $1 AND g.user_id = $2
            GROUP BY g.id
        `, [id, userId]);
        const goal = result.rows[0];

        if (!goal) return null;

        // Parse wallet_ids
        goal.wallet_ids = goal.wallet_ids ? goal.wallet_ids.split(',').map(Number) : [];

        // Calculate progress
        goal.current_amount = await this.calculateCurrentAmount(goal, userId);
        goal.progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));

        return goal;
    }

    /**
     * Get all goals for a user
     * @param {number} userId
     * @param {string|null} [status=null]
     */
    static async findByUserId(userId, status = null) {
        let sql = `
            SELECT g.*, 
                   string_agg(gw.wallet_id::text, ',') as wallet_ids
            FROM goals g
            LEFT JOIN goal_wallets gw ON g.id = gw.goal_id
            WHERE g.user_id = $1
        `;
        const params = [userId];

        if (status) {
            params.push(status);
            sql += ` AND g.status = $${params.length}`;
        } else {
            sql += " AND g.status != 'archived'";
        }

        sql += ' GROUP BY g.id ORDER BY g.priority DESC, g.deadline ASC, g.created_at DESC';

        const result = await query(sql, params);
        const goals = result.rows;

        // Calculate progress for each goal
        for (const goal of goals) {
            goal.wallet_ids = goal.wallet_ids ? goal.wallet_ids.split(',').map(Number) : [];
            goal.current_amount = await this.calculateCurrentAmount(goal, userId);
            goal.progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
        }

        return goals;
    }

    /**
     * Calculate current amount based on tracking method
     */
    static async calculateCurrentAmount(goal, userId) {
        if (goal.tracking_method === 'all') {
            // Sum all active wallet balances
            const result = await query(`
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE user_id = $1 AND is_active = 1
            `, [userId]);
            return parseFloat(result.rows[0].total) || 0;
        } else {
            // Sum selected wallet balances
            if (!goal.wallet_ids || goal.wallet_ids.length === 0) {
                return 0;
            }
            const placeholders = goal.wallet_ids.map((_, i) => `$${i + 1}`).join(',');
            const params = [...goal.wallet_ids, userId];
            const result = await query(`
                SELECT COALESCE(SUM(balance), 0) as total
                FROM wallets
                WHERE id IN (${placeholders}) AND user_id = $${params.length} AND is_active = 1
            `, params);
            return parseFloat(result.rows[0].total) || 0;
        }
    }

    /**
     * Update goal
     */
    static async update(id, userId, updates) {
        const {
            name,
            target_amount,
            deadline,
            tracking_method,
            description,
            color,
            icon,
            priority,
            wallet_ids,
            is_locked
        } = updates;

        // Validate target amount if provided
        if (target_amount !== undefined && target_amount < 10000) {
            throw new Error('Target amount minimal Rp 10.000');
        }

        // Update goal
        await query(`
            UPDATE goals 
            SET name = COALESCE($1, name),
                target_amount = COALESCE($2, target_amount),
                deadline = COALESCE($3, deadline),
                tracking_method = COALESCE($4, tracking_method),
                description = COALESCE($5, description),
                color = COALESCE($6, color),
                icon = COALESCE($7, icon),
                priority = COALESCE($8, priority),
                is_locked = COALESCE($9, is_locked),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 AND user_id = $11
        `, [name, target_amount, deadline, tracking_method, description, color, icon, priority, is_locked, id, userId]);

        // Update wallet relationships if provided
        if (wallet_ids !== undefined) {
            // Remove old relationships
            await query('DELETE FROM goal_wallets WHERE goal_id = $1', [id]);

            // Add new relationships
            if (tracking_method !== 'all' && wallet_ids.length > 0) {
                for (const walletId of wallet_ids) {
                    await query('INSERT INTO goal_wallets (goal_id, wallet_id) VALUES ($1, $2)', [id, walletId]);
                }
            }
        }

        return this.findById(id, userId);
    }

    /**
     * Complete goal
     */
    static async complete(id, userId, autoDeduct = false) {
        const goal = await this.findById(id, userId);

        if (!goal) {
            throw new Error('Goal tidak ditemukan');
        }

        if (goal.status === 'completed') {
            throw new Error('Goal sudah selesai');
        }

        // Mark as completed
        await query(`
            UPDATE goals 
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
        `, [id, userId]);

        // Auto deduct if requested and single wallet
        let transaction = null;
        if (autoDeduct && goal.tracking_method === 'single' && goal.wallet_ids.length === 1) {
            // Get or create "Goal Achievement" category
            let catResult = await query(`
                SELECT id FROM categories 
                WHERE user_id = $1 AND name = 'Goal Achievement' AND type = 'expense'
            `, [userId]);
            let category = catResult.rows[0];

            if (!category) {
                const newCatResult = await query(`
                    INSERT INTO categories (user_id, name, type, color, icon)
                    VALUES ($1, 'Goal Achievement', 'expense', '#4361ee', 'target')
                    RETURNING id
                `, [userId]);
                category = newCatResult.rows[0];
            }

            // Create expense transaction
            const d = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const txResult = await query(`
                INSERT INTO transactions (user_id, category_id, wallet_id, amount, type, description, date)
                VALUES ($1, $2, $3, $4, 'expense', $5, $6)
                RETURNING id
            `, [userId, category.id, goal.wallet_ids[0], goal.target_amount, `Pencapaian Goal: ${goal.name}`, today]);

            // Update wallet balance
            await query(`
                UPDATE wallets SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [goal.target_amount, goal.wallet_ids[0]]);

            transaction = { id: txResult.rows[0].id };
        }

        return {
            goal: await this.findById(id, userId),
            transaction,
            autoDeducted: autoDeduct && goal.tracking_method === 'single'
        };
    }

    /**
     * Archive goal (soft delete)
     */
    static async archive(id, userId) {
        const result = await query(`
            UPDATE goals 
            SET status = 'archived',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
        `, [id, userId]);
        return result.rowCount > 0;
    }

    /**
     * Toggle lock status
     */
    static async toggleLock(id, userId, is_locked) {
        const result = await query(`
            UPDATE goals
            SET is_locked = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND user_id = $3
            RETURNING id
        `, [is_locked, id, userId]);

        if (result.rowCount === 0) return null;

        return this.findById(id, userId);
    }

    /**
     * Get dashboard widget data
     */
    static async getDashboardData(userId) {
        // Get all active goals with progress
        const goals = await this.findByUserId(userId, 'active');

        // Overview stats
        const totalGoals = goals.length;
        const completedGoals = await this.getCompletedCount(userId);
        const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount || 0), 0);
        const totalCurrent = goals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
        const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

        // Priority goals (top 3 high priority)
        const priorityGoals = goals
            .filter(g => g.priority === 'high')
            .slice(0, 3);

        // Upcoming deadlines (next 30 days)
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = goals
            .filter(g => g.deadline && new Date(g.deadline) <= thirtyDaysLater)
            .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
            .slice(0, 5);

        // Goals ready to complete (progress >= 100%)
        const readyToComplete = goals.filter(g => g.progress >= 100);

        return {
            overview: {
                total: totalGoals,
                completed: completedGoals,
                totalTarget,
                totalCurrent,
                overallProgress
            },
            priorityGoals,
            upcomingDeadlines,
            readyToComplete,
            recentGoals: goals.slice(0, 5)
        };
    }

    /**
     * Get completed goals count
     */
    static async getCompletedCount(userId) {
        const result = await query(`
            SELECT COUNT(*) as count FROM goals
            WHERE user_id = $1 AND status = 'completed'
        `, [userId]);
        return parseInt(result.rows[0].count, 10);
    }
}

export default Goal;
