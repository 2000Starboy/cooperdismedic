import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { syncProducts } from '../scripts/sync-products.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const productsPath = path.join(projectRoot, 'public', 'api', 'products.json');
const lastSyncPath = path.join(projectRoot, 'public', 'api', 'last-sync.json');
const port = Number(process.env.PORT || 3001);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

async function readProducts() {
  const content = await fs.readFile(productsPath, 'utf8');
  return JSON.parse(content);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/products') {
    try {
      const products = await readProducts();
      sendJson(res, 200, products);
    } catch (error) {
      sendJson(res, 500, { error: 'Unable to load products', details: error.message });
    }
    return;
  }

  if (req.method === 'GET' && ['/api/products/last-sync', '/api/last-sync.json', '/last-sync.json'].includes(url.pathname)) {
    try {
      const content = await fs.readFile(lastSyncPath, 'utf8');
      const metadata = JSON.parse(content);
      sendJson(res, 200, metadata);
    } catch (error) {
      sendJson(res, 500, { error: 'Unable to load sync metadata', details: error.message });
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/products/sync') {
    try {
      const result = await syncProducts();
      sendJson(res, 200, { ok: true, ...result });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

async function runDailySync() {
  try {
    const result = await syncProducts();
    console.log(`[SYNC] ${new Date().toISOString()} - synced ${result.count} products, imported ${result.importedCount}`);
  } catch (error) {
    console.error('[SYNC] failed to sync products:', error);
  }
}

function getNext3AMDelay() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

function scheduleDailySync() {
  const delay = getNext3AMDelay();
  console.log(`[SYNC] scheduling next sync in ${Math.round(delay / 1000 / 60)} minutes`);
  setTimeout(async () => {
    await runDailySync();
    setInterval(runDailySync, 24 * 60 * 60 * 1000);
  }, delay);
}

server.listen(port, () => {
  console.log(`Products API listening on http://localhost:${port}/api/products`);
  scheduleDailySync();
});
