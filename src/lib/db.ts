import pg from 'pg';

// Override pg timestamp parser to parse as UTC
pg.types.setTypeParser(1114, (str: string) => new Date(str + 'Z'));

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cashflow',
    // Uncomment for Supabase if needed (usually required for Supabase)
    ssl: { rejectUnauthorized: false }
});

// Helper to query directly from the pool
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
