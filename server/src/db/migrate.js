import fs from 'node:fs';
import path from 'node:path';
import { pool } from './index.js';

export async function runMigrations() {
  const client = await pool.connect();
  let lockAcquired = false;
  try {
    try {
      await client.query('SELECT pg_advisory_lock(987654321)');
      lockAcquired = true;
    } catch (_) {
      // pg-mem or some mock pools might not support advisory locks; ignore if unsupported
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'server/src/db/migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
      for (const file of files) {
        const res = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
        if (res.rowCount === 0) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
        }
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    if (lockAcquired) {
      try {
        await client.query('SELECT pg_advisory_unlock(987654321)');
      } catch (_) {}
    }
    client.release();
  }
}
