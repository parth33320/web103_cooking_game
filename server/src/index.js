import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = process.env.PORT || 3001;

async function start() {
  await runMigrations();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
