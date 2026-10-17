import fs from 'node:fs';
import path from 'node:path';

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'logs' || file === 'scripts') continue;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function checkStandards() {
  console.log('Running standards-check...');
  const files = walk(process.cwd());
  let errors = 0;

  // Read STUB registry from 00-status.md
  const statusPath = path.resolve(process.cwd(), 'docs/plans/budget-bistro/00-status.md');
  const registeredStubs = new Set();
  if (fs.existsSync(statusPath)) {
    const statusContent = fs.readFileSync(statusPath, 'utf8');
    const matches = statusContent.matchAll(/STUB-\d+/g);
    for (const match of matches) {
      registeredStubs.add(match[0]);
    }
  }

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // 1. TODO without issue number
        if (/\/\/\s*TODO/i.test(line) && !/\/\/\s*TODO\(#\d+\)/i.test(line)) {
          console.error(`[ERROR] ${file}:${index + 1}: TODO comment must have an issue number e.g. // TODO(#12)`);
          errors++;
        }

        // 2. Skipped/disabled tests
        if (/\b(it|test|describe)\.(skip|only)\b/i.test(line) || /test\.fixme/i.test(line) || /\bxit\(/i.test(line) || /\bxdescribe\(/i.test(line)) {
          console.error(`[ERROR] ${file}:${index + 1}: Skipped/only tests are prohibited`);
          errors++;
        }

        // 3. Stubs
        if (/STUB-/i.test(line)) {
          const match = line.match(/STUB-\d+/);
          if (match) {
            const stubId = match[0];
            if (!registeredStubs.has(stubId)) {
              console.error(`[ERROR] ${file}:${index + 1}: Orphan stub ${stubId} not registered in 00-status.md`);
              errors++;
            }
          }
        }
      });
    }
  }

  if (errors > 0) {
    console.error(`\nstandards-check failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log('standards-check passed cleanly!');
  }
}

checkStandards();
