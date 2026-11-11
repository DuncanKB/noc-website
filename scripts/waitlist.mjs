// The app-launch waitlist, for launch day.
//
//   npm run waitlist:export
//     Saves every address to waitlist-export/ (git-ignored, keep it private):
//       waitlist-<date>.csv        email + sign-up time
//       bcc-<date>-<n>.txt         addresses in groups of 400, ready to paste
//                                  into Gmail's Bcc field (Gmail allows 500
//                                  recipients per email and per day).
//
//   npm run waitlist:delete -- waitlist-export/waitlist-<date>.csv
//     After the launch email: deletes exactly the addresses in that export
//     from the database (the privacy policy promises this). People who signed
//     up after the export stay on the list. Asks you to type "delete" first.
//
// Add --local to either command to use the local test database (wrangler dev)
// instead of the real one.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [command, ...rest] = process.argv.slice(2);
const where = rest.includes('--local') ? '--local' : '--remote';
const file = rest.find((a) => !a.startsWith('--'));
const GROUP = 400;

function wrangler(args) {
  // Runs the project's own wrangler with node directly (no shell, so nothing is re-split).
  const bin = join(import.meta.dirname, '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const out = execFileSync(process.execPath, [bin, 'd1', 'execute', 'noc-waitlist', where, '--json', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(out);
}

const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

if (command === 'export') {
  const [{ results }] = wrangler(['--command', 'SELECT email, created_at FROM waitlist ORDER BY created_at']);
  const date = new Date().toISOString().slice(0, 10);
  mkdirSync('waitlist-export', { recursive: true });
  const csv = ['email,created_at', ...results.map((r) => `${csvCell(r.email)},${r.created_at}`)].join('\n') + '\n';
  writeFileSync(`waitlist-export/waitlist-${date}.csv`, csv);
  const groups = Math.ceil(results.length / GROUP);
  for (let i = 0; i < groups; i++) {
    const part = results.slice(i * GROUP, (i + 1) * GROUP).map((r) => r.email);
    writeFileSync(`waitlist-export/bcc-${date}-${i + 1}.txt`, part.join(', ') + '\n');
  }
  console.log(`${results.length} addresses → waitlist-export/waitlist-${date}.csv`);
  if (groups) console.log(`Bcc lists: ${groups} file(s), up to ${GROUP} addresses each (one email per file, max 500 a day in Gmail).`);
} else if (command === 'delete') {
  if (!file) throw new Error('Give the export to delete: npm run waitlist:delete -- waitlist-export/waitlist-<date>.csv');
  const emails = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(',')[0].replace(/^"|"$/g, '').replace(/""/g, '"'))
    .filter(Boolean);
  if (!emails.length) throw new Error(`No addresses in ${file}`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `Delete ${emails.length} addresses from the ${where === '--local' ? 'LOCAL TEST' : 'REAL'} waitlist? This can't be undone. Type "delete": `,
  );
  rl.close();
  if (answer.trim() !== 'delete') {
    console.log('Nothing deleted.');
    process.exit(0);
  }
  const sql = emails.map((e) => `DELETE FROM waitlist WHERE email = '${e.replace(/'/g, "''")}';`).join('\n');
  const tmp = join(tmpdir(), `waitlist-delete-${Date.now()}.sql`);
  writeFileSync(tmp, sql);
  try {
    wrangler(['--file', tmp]);
  } finally {
    unlinkSync(tmp);
  }
  const [{ results }] = wrangler(['--command', 'SELECT COUNT(*) AS n FROM waitlist']);
  console.log(`Deleted. ${results[0].n} addresses left (people who signed up after the export).`);
} else {
  console.log('Use: npm run waitlist:export   or   npm run waitlist:delete -- waitlist-export/waitlist-<date>.csv');
  process.exit(1);
}
