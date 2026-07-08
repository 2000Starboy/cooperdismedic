import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pendingPath = path.join(projectRoot, 'src', 'data', 'pending-products.json');
const sourcesPath = path.join(projectRoot, 'src', 'data', 'market-products.sources.json');

async function approveAll() {
  const pendingRaw = await fs.readFile(pendingPath, 'utf8').catch(() => '{"pending":[]}');
  const sourcesRaw = await fs.readFile(sourcesPath, 'utf8').catch(() => '{"sources":[]}');

  const pending = JSON.parse(pendingRaw).pending || [];
  const sources = JSON.parse(sourcesRaw).sources || [];

  if (pending.length === 0) {
    console.log('No pending URLs to approve');
    return;
  }

  const newToAdd = pending.filter((u) => !sources.includes(u));
  const nextSources = { sources: [...sources, ...newToAdd] };

  await fs.writeFile(sourcesPath, JSON.stringify(nextSources, null, 2));
  await fs.writeFile(pendingPath, JSON.stringify({ pending: [] }, null, 2));

  console.log(`Approved ${newToAdd.length} URLs and cleared pending`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('approve-pending.mjs')) {
  approveAll().catch((err) => {
    console.error('Approve failed:', err);
    process.exitCode = 1;
  });
}
