import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { syncProducts } from '../scripts/sync-products.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const productsPath = path.join(projectRoot, 'public', 'api', 'products.json');
const lastSyncPath = path.join(projectRoot, 'public', 'api', 'last-sync.json');
const usersPath = path.join(projectRoot, 'public', 'api', 'users.json');
const port = Number(process.env.PORT || 3001);

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

async function readProducts() {
  const content = await fs.readFile(productsPath, 'utf8');
  return JSON.parse(content);
}

async function saveProducts(products) {
  await fs.writeFile(productsPath, JSON.stringify(products, null, 2), 'utf8');
}

async function readUsers() {
  try {
    const content = await fs.readFile(usersPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users) {
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf8');
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { req.connection.destroy(); reject(new Error('Body too large')); }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── POST /api/login ────────────────────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/login') {
    try {
      const body = await readBody(req);
      const { username, password } = JSON.parse(body);

      const users = await readUsers();
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        sendJson(res, 401, { error: 'Identifiants incorrects' });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        user: {
          username: user.username,
          role: user.role,
          fullName: user.fullName || user.username
        }
      });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid login request', details: error.message });
    }
    return;
  }

  // ── GET /api/users ─────────────────────────────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/api/users') {
    try {
      const users = await readUsers();
      // Do not return passwords for security
      const cleanUsers = users.map(({ password, ...u }) => u);
      sendJson(res, 200, cleanUsers);
    } catch (error) {
      sendJson(res, 500, { error: 'Unable to load users', details: error.message });
    }
    return;
  }

  // ── POST /api/users ────────────────────────────────────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/users') {
    try {
      const body = await readBody(req);
      const userData = JSON.parse(body);

      const users = await readUsers();
      if (users.some(u => u.username === userData.username)) {
        sendJson(res, 400, { error: 'Cet identifiant existe déjà' });
        return;
      }

      const newUser = {
        username: userData.username,
        password: userData.password || 'dismedic@2026',
        role: userData.role || 'pharmacien',
        fullName: userData.fullName || userData.username
      };

      users.push(newUser);
      await saveUsers(users);

      const { password, ...cleanNewUser } = newUser;
      sendJson(res, 201, { ok: true, user: cleanNewUser });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request', details: error.message });
    }
    return;
  }

  // ── PUT /api/users/:username ───────────────────────────────────────────────
  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (req.method === 'PUT' && userMatch) {
    try {
      const username = decodeURIComponent(userMatch[1]);
      const body = await readBody(req);
      const updateData = JSON.parse(body);

      const users = await readUsers();
      const userIndex = users.findIndex(u => u.username === username);

      if (userIndex === -1) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      users[userIndex] = {
        ...users[userIndex],
        ...updateData,
        username, // Prevent changing username here
      };

      await saveUsers(users);
      const { password, ...cleanUser } = users[userIndex];
      sendJson(res, 200, { ok: true, user: cleanUser });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request', details: error.message });
    }
    return;
  }

  // ── DELETE /api/users/:username ────────────────────────────────────────────
  if (req.method === 'DELETE' && userMatch) {
    try {
      const username = decodeURIComponent(userMatch[1]);
      let users = await readUsers();

      if (!users.some(u => u.username === username)) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      // Prevent deleting the last super admin
      const deletedUser = users.find(u => u.username === username);
      if (deletedUser?.role === 'super admin') {
        const superAdmins = users.filter(u => u.role === 'super admin');
        if (superAdmins.length <= 1) {
          sendJson(res, 400, { error: 'Impossible de supprimer le dernier super administrateur' });
          return;
        }
      }

      users = users.filter(u => u.username !== username);
      await saveUsers(users);
      sendJson(res, 200, { ok: true, message: 'User deleted successfully' });
    } catch (error) {
      sendJson(res, 500, { error: 'Failed to delete user', details: error.message });
    }
    return;
  }

  // ── GET /api/products ─────────────────────────────────────────────────────
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

  // ── POST /api/products — Create a new product ─────────────────────────────
  if (req.method === 'POST' && url.pathname === '/api/products') {
    try {
      const body = await readBody(req);
      const productData = JSON.parse(body);

      const products = await readProducts();

      // Auto-generate a unique ID (max existing + 1)
      const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
      const newId = maxId + 1;

      const newProduct = {
        id: newId,
        name: productData.name || '',
        dci: productData.dci || '',
        laboratory: productData.laboratory || '',
        form: productData.form || '',
        dosage: productData.dosage || '',
        therapeuticClass: productData.therapeuticClass || '',
        categories: Array.isArray(productData.categories) ? productData.categories : ['analgesic'],
        ppm: productData.ppm ? Number(productData.ppm) : undefined,
        ppv: productData.ppv ? Number(productData.ppv) : undefined,
        description: productData.description || '',
        indications: productData.indications || '',
        posology: productData.posology || '',
        contraindications: productData.contraindications || '',
        sideEffects: productData.sideEffects || '',
        conservation: productData.conservation || '',
        pregnancyCategory: productData.pregnancyCategory || 'N/A',
        isPrescriptionRequired: Boolean(productData.isPrescriptionRequired),
        status: 'active',
        active: true,
        relatedIds: [],
      };

      products.unshift(newProduct); // Add at the top
      await saveProducts(products);

      console.log(`[CREATE] ✅ New product created: ID ${newId} - ${newProduct.name}`);
      sendJson(res, 201, { ok: true, message: 'Product created successfully', product: newProduct });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request body', details: error.message });
    }
    return;
  }

  // ── PUT /api/products/:id — Update a product ──────────────────────────────
  const productIdMatch = url.pathname.match(/^\/api\/products\/(\d+)$/);

  if (req.method === 'PUT' && productIdMatch) {
    try {
      const productId = parseInt(productIdMatch[1]);
      const body = await readBody(req);
      const updateData = JSON.parse(body);
      const products = await readProducts();
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      products[productIndex] = {
        ...products[productIndex],
        ...updateData,
        id: productId,
      };

      await saveProducts(products);
      console.log(`[EDIT] ✏️  Product updated: ID ${productId} - ${products[productIndex].name}`);
      sendJson(res, 200, { ok: true, message: 'Product updated successfully', product: products[productIndex] });
    } catch (error) {
      sendJson(res, 400, { error: 'Invalid request', details: error.message });
    }
    return;
  }

  // ── DELETE /api/products/:id — Soft-delete a product ─────────────────────
  if (req.method === 'DELETE' && productIdMatch) {
    try {
      const productId = parseInt(productIdMatch[1]);
      const products = await readProducts();
      const productIndex = products.findIndex(p => p.id === productId);

      if (productIndex === -1) {
        sendJson(res, 404, { error: 'Product not found' });
        return;
      }

      const productName = products[productIndex].name;

      // Soft-delete: mark as inactive instead of removing
      products[productIndex] = {
        ...products[productIndex],
        active: false,
        status: 'deleted',
        deletedAt: new Date().toISOString(),
      };

      await saveProducts(products);
      console.log(`[DELETE] 🗑️  Product soft-deleted: ID ${productId} - ${productName}`);
      sendJson(res, 200, { ok: true, message: 'Product deleted successfully', id: productId });
    } catch (error) {
      sendJson(res, 500, { error: 'Failed to delete product', details: error.message });
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
