import { query } from '../db';

class DailyBudgetSetting {
    // Find settings by user ID
    static async findByUserId(userId) {
        const result = await query("SELECT * FROM daily_budget_settings WHERE user_id = $1", [userId]);
        return result.rows[0];
    }

    // Create or update settings
    static async createOrUpdate(userId, data) {
        const existing = await this.findByUserId(userId);

        if (existing) {
            await query(`
                UPDATE daily_budget_settings 
                SET is_active = $1,
                    mode = $2, 
                    reset_day = $3, 
                    manual_daily_amount = $4,
                    formula_income = $5,
                    formula_fixed_expenses = $6,
                    formula_savings_target = $7,
                    wallet_id = $8,
                    is_interactive = $9,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $10
            `, [
                data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active,
                data.mode !== undefined ? data.mode : existing.mode,
                data.reset_day !== undefined ? data.reset_day : existing.reset_day,
                data.manual_daily_amount !== undefined ? data.manual_daily_amount : existing.manual_daily_amount,
                data.formula_income !== undefined ? data.formula_income : existing.formula_income,
                data.formula_fixed_expenses !== undefined ? data.formula_fixed_expenses : existing.formula_fixed_expenses,
                data.formula_savings_target !== undefined ? data.formula_savings_target : existing.formula_savings_target,
                data.wallet_id !== undefined ? data.wallet_id : existing.wallet_id,
                data.is_interactive !== undefined ? (data.is_interactive ? 1 : 0) : existing.is_interactive,
                userId
            ]);
        } else {
            await query(`
                INSERT INTO daily_budget_settings 
                (user_id, is_active, mode, reset_day, manual_daily_amount, formula_income, formula_fixed_expenses, formula_savings_target, wallet_id, is_interactive)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                userId,
                data.is_active !== undefined ? (data.is_active ? 1 : 0) : 0, // default false
                data.mode || 'manual',
                data.reset_day || 25,
                data.manual_daily_amount || 0,
                data.formula_income || 0,
                data.formula_fixed_expenses || 0,
                data.formula_savings_target || 0,
                data.wallet_id !== undefined ? data.wallet_id : null,
                data.is_interactive ? 1 : 0
            ]);
        }

        return await this.findByUserId(userId);
    }
}

export default DailyBudgetSetting;
