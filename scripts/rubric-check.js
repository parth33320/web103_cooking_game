import fs from 'node:fs';
import path from 'node:path';

function checkRubric() {
  console.log('Running rubric-check...');
  const statusPath = path.resolve(process.cwd(), 'docs/plans/budget-bistro/00-status.md');
  if (!fs.existsSync(statusPath)) {
    console.error(`[ERROR] Status file not found at ${statusPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(statusPath, 'utf8');
  const lines = content.split('\n');
  let errors = 0;

  for (const line of lines) {
    if (line.startsWith('|') && !line.includes('---') && !line.includes('Rubric item')) {
      const columns = line.split('|').map(c => c.trim()).filter(Boolean);
      if (columns.length >= 5) {
        const item = columns[0];
        const testFilePath = columns[3];
        const status = columns[4];

        if (status === 'done') {
          if (!testFilePath || testFilePath === 'todo' || !fs.existsSync(path.resolve(process.cwd(), testFilePath))) {
            console.error(`[ERROR] Rubric row marked 'done' missing valid test file: ${item} -> ${testFilePath}`);
            errors++;
          }
        }
      }
    }
  }

  if (errors > 0) {
    console.error(`\nrubric-check failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log('rubric-check passed cleanly!');
  }
}

checkRubric();
