import { query } from '../db';

class ActivityLog {
    // Create activity log entry
    static async create(data) {
        const { user_id, action, resource, resource_id = null, details = null, ip_address = null } = data;

        const result = await query(`
            INSERT INTO activity_logs (user_id, action, resource, resource_id, details, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [user_id, action, resource, resource_id, details, ip_address]);

        return result.rows[0].id;
    }

    // Get recent activity logs
    static async getRecent(limit = 50, offset = 0) {
        const result = await query(`
            SELECT al.*, u.username, u.email
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);
        return result.rows;
    }

    // Get activity logs by user
    static async getByUserId(userId, limit = 50) {
        const result = await query(`
            SELECT * FROM activity_logs
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `, [userId, limit]);
        return result.rows;
    }

    // Get activity logs by resource
    static async getByResource(resource, resourceId = null, limit = 50) {
        let sql = 'SELECT al.*, u.username FROM activity_logs al LEFT JOIN users u ON al.user_id = u.id WHERE al.resource = $1';
        const params = [resource];

        if (resourceId) {
            params.push(resourceId);
            sql += ` AND al.resource_id = $${params.length}`;
        }

        params.push(limit);
        sql += ` ORDER BY al.created_at DESC LIMIT $${params.length}`;

        const result = await query(sql, params);
        return result.rows;
    }

    // Get activity stats
    static async getStats() {
        const result = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN CAST(created_at AS DATE) = CURRENT_DATE THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN CAST(created_at AS DATE) >= CURRENT_DATE - INTERVAL '7 days' THEN 1 ELSE 0 END) as this_week
            FROM activity_logs
        `);
        return result.rows[0];
    }

    // Clean old logs (older than 30 days)
    static async cleanOldLogs(daysToKeep = 30) {
        const result = await query(`
            DELETE FROM activity_logs 
            WHERE created_at < CURRENT_DATE - ($1 * INTERVAL '1 day')
        `, [daysToKeep]);
        return result.rowCount;
    }
}

export default ActivityLog;
