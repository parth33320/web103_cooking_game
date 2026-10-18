import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/security/**/*.test.js', 'tests/api/**/*.test.js', 'tests/health.test.js'],
    exclude: ['tests/e2e/**'],
    fileParallelism: false,
  },
});
