import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Final Security & Integrity Tests (S3.6)', () => {
  it('Public documentation files do not leak database passwords or private API keys', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    const milestonePath = path.resolve(process.cwd(), 'milestone5.md');

    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const milestoneContent = fs.readFileSync(milestonePath, 'utf8');

    // Assert no hardcoded credentials or database passwords in public docs
    expect(readmeContent).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/i);
    expect(milestoneContent).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/i);
    expect(readmeContent).not.toMatch(/secret_key|api_key|password\s*=/i);
    expect(milestoneContent).not.toMatch(/secret_key|api_key|password\s*=/i);
  });

  it('render.yaml deployment configuration references environment variable placeholders without hardcoding secrets', () => {
    const renderPath = path.resolve(process.cwd(), 'render.yaml');
    expect(fs.existsSync(renderPath)).toBe(true);
    const renderContent = fs.readFileSync(renderPath, 'utf8');

    expect(renderContent).toContain('DATABASE_URL');
    expect(renderContent).not.toMatch(/postgres:\/\/[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+@/);
  });
});
