import fs from 'node:fs';
import path from 'node:path';

const AUDIT_LOG_PATH = path.resolve(process.cwd(), 'logs/audit.jsonl');

/**
 * Appends an audit event to logs/audit.jsonl
 * @param {string} action
 * @param {object} details
 */
export async function logAudit(action, details = {}) {
  const dir = path.dirname(AUDIT_LOG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    details
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(entry) + '\n');
}
