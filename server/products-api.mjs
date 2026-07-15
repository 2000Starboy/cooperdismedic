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

  // PUT /api/products/:id - Update a specific product
  const putProductMatch = url.pathname.match(/^\/api\/products\/(\d+)$/);
  if (req.method === 'PUT' && putProductMatch) {
    try {
      const productId = parseInt(putProductMatch[1]);
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 1e6) req.connection.destroy();
      });

      req.on('end', async () => {
        try {
          const updateData = JSON.parse(body);
          const products = await readProducts();
          const productIndex = products.findIndex(p => p.id === productId);

          if (productIndex === -1) {
            sendJson(res, 404, { error: 'Product not found' });
            return;
          }

          // Merge the update with existing product
          products[productIndex] = {
            ...products[productIndex],
            ...updateData,
            id: productId, // Ensure ID doesn't change
          };

          // Save updated products
          await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf8');

          console.log(`[EDIT] ✏️  Product updated: ID ${productId} - ${products[productIndex].name}`);

          sendJson(res, 200, {
            ok: true,
            message: 'Product updated successfully',
            product: products[productIndex],
          });
        } catch (error) {
          sendJson(res, 400, { error: 'Invalid request body', details: error.message });
        }
      });
    } catch (error) {
      sendJson(res, 500, { error: 'Failed to update product', details: error.message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

async function runDailySync() {
  const startTime = new Date();
  console.log(`[SYNC] ⏱️  Starting daily synchronization at ${startTime.toISOString()}`);
  try {
    const result = await syncProducts();
    const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
    console.log(`[SYNC] ✅ Completed at ${new Date().toISOString()}`);
    console.log(`[SYNC]    • Total products: ${result.count}`);
    console.log(`[SYNC]    • Newly imported: ${result.importedCount}`);
    console.log(`[SYNC]    • Duration: ${duration}s`);
    if (result.importedProducts && result.importedProducts.length > 0) {
      console.log(`[SYNC]    • New products: ${result.importedProducts.map(p => p.name).join(', ')}`);
    }
  } catch (error) {
    console.error(`[SYNC] ❌ Failed to sync products at ${new Date().toISOString()}`);
    console.error(`[SYNC]    Error: ${error.message}`);
  }
}

function getNext3AMDelay() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  const hours = Math.round(delay / 1000 / 3600);
  const mins = Math.round((delay / 1000 % 3600) / 60);
  console.log(`[SYNC] ⏰ Next sync scheduled for ${next.toLocaleString('fr-FR')} (in ${hours}h ${mins}m)`);
  return delay;
}

function scheduleDailySync() {
  const delay = getNext3AMDelay();
  setTimeout(async () => {
    console.log(`[SYNC] 🔔 3h00 alarm! Starting scheduled sync...`);
    await runDailySync();
    // Schedule every 24 hours after first execution
    setInterval(runDailySync, 24 * 60 * 60 * 1000);
  }, delay);
}

server.listen(port, () => {
  console.log(`🚀 Products API listening on http://localhost:${port}/api/products`);
  scheduleDailySync();
});
