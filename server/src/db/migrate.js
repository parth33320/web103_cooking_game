import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

export async function runMigrations(dbUrl) {
  const connectionString = dbUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('No DATABASE_URL set. Skipping migrations.');
    return;
  }

  const pool = new Pool({ connectionString });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'server/src/db/migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const res = await pool.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
      if (res.rowCount === 0) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(sql);
        await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      }
    }
  } finally {
    await pool.end();
  }
}
