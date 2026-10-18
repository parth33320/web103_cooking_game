import pg from 'pg';
import dotenv from 'dotenv';
import { newDb, DataType } from 'pg-mem';

dotenv.config();

const { Pool } = pg;

let poolInstance = null;

if (process.env.DATABASE_URL) {
  poolInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  // In-memory Postgres instance for tests when no real DB is running
  const memDb = newDb();

  // Support setval function for postgres sequences
  memDb.public.registerFunction({
    name: 'setval',
    args: [DataType.text, DataType.integer],
    returns: DataType.integer,
    implementation: () => 1,
  });

  const adapter = memDb.adapters.createPg();
  poolInstance = new adapter.Pool();
}

export const pool = poolInstance;
