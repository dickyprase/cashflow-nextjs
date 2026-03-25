import { query } from '../db';

class SiteSetting {
    static async getAll() {
        const result = await query('SELECT key, value, description FROM site_settings');
        const rows = result.rows;

        const settings = {};
        rows.forEach(row => {
            settings[row.key] = {
                value: row.value,
                type: row.description
            };
        });
        return settings;
    }

    // Get single setting
    static async get(keyName) {
        const result = await query('SELECT value FROM site_settings WHERE key = $1', [keyName]);
        const row = result.rows[0];
        return row ? row.value : null;
    }

    // Set single setting
    static async set(keyName, value, type = 'text') {
        await query(`
            INSERT INTO site_settings (key, value, description, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET 
                value = EXCLUDED.value,
                updated_at = CURRENT_TIMESTAMP
        `, [keyName, value, type]);
        return this.get(keyName);
    }

    // Bulk update settings (upsert to handle missing keys)
    static async bulkUpdate(settings) {
        for (const [keyName, value] of Object.entries(settings)) {
            await query(`
                INSERT INTO site_settings (key, value, description, updated_at)
                VALUES ($1, $2, 'text', CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET
                    value = EXCLUDED.value,
                    updated_at = CURRENT_TIMESTAMP
            `, [keyName, value]);
        }
        return this.getAll();
    }

    // Get public settings (for frontend)
    static async getPublic() {
        const result = await query(`
            SELECT key, value 
            FROM site_settings 
            WHERE key IN ('site_name', 'site_logo', 'site_logo_dark', 'footer_text', 'currency', 'theme')
        `);
        const rows = result.rows;

        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}

export default SiteSetting;
