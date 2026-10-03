import pg from "pg";

const { DATABASE_URL } = process.env;

// Local Postgres-ku SSL vendaam, cloud (Render/Neon)-ku venum
const isLocal = DATABASE_URL?.includes("localhost") || DATABASE_URL?.includes("127.0.0.1");

export const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    })
  : null;

// Table illana create pannum
export async function initDb() {
  if (!pool) return false;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('spam', 'ham')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  return true;
}
