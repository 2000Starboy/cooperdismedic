#!/usr/bin/env node
// ============================================================================
// deploy.mjs — Cooper Dismedic · Hostinger Auto-Deploy Script
// ============================================================================
// Usage:
//   node deploy.mjs          → full build + deploy
//   node deploy.mjs --skip-build  → deploy existing dist/ without rebuilding
//   node deploy.mjs --dry-run     → discover account info only, no upload
//
// Requirements:
//   • Node 18+ (native fetch)
//   • .env.deploy file with HOSTINGER_API_TOKEN (already set up)
//   • Run from the project root folder
// ============================================================================

import { execSync, spawnSync }  from 'child_process';
import { existsSync, readFileSync, createReadStream, statSync, readdirSync, copyFileSync } from 'fs';
import { readFile, writeFile, mkdir, rm }    from 'fs/promises';

// Detect Windows once
const IS_WINDOWS = process.platform === 'win32';
import { resolve, join, relative, basename } from 'path';
import { createGzip }  from 'zlib';
import { pipeline }    from 'stream/promises';
import { createHash }  from 'crypto';
import * as https      from 'https';
import * as http       from 'http';
import * as url        from 'url';
import * as path       from 'path';

// ── Colours ────────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  cyan:  '\x1b[36m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  dim:   '\x1b[2m',
};
const ok   = (m) => console.log(`${C.green}✔${C.reset}  ${m}`);
const info = (m) => console.log(`${C.cyan}ℹ${C.reset}  ${m}`);
const warn = (m) => console.log(`${C.yellow}⚠${C.reset}  ${m}`);
const err  = (m) => console.error(`${C.red}✖${C.reset}  ${m}`);
const step = (m) => console.log(`\n${C.bold}${C.cyan}▶  ${m}${C.reset}`);
const dim  = (m) => console.log(`${C.dim}   ${m}${C.reset}`);

// ── Args ───────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const SKIP_BUILD = args.includes('--skip-build');
const DRY_RUN    = args.includes('--dry-run');

// ── Load credentials ───────────────────────────────────────────────────────
function loadEnv() {
  const envFile = resolve('.env.deploy');
  if (!existsSync(envFile)) {
    err('.env.deploy not found. Expected contents:');
    console.log('  HOSTINGER_API_TOKEN=your_token_here');
    process.exit(1);
  }
  const lines = readFileSync(envFile, 'utf8').split('\n');
  const env   = {};
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) env[k.trim()] = rest.join('=').trim();
  }
  return env;
}

// ── HTTP helper (native — no extra packages) ───────────────────────────────
function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'http:' ? http : https;
    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw  = Buffer.concat(chunks).toString();
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw });
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : body);
    req.end();
  });
}

async function apiGet(token, endpoint) {
  const parsed = new url.URL(endpoint);
  return httpsRequest({
    hostname: parsed.hostname,
    path:     parsed.pathname + parsed.search,
    method:   'GET',
    headers:  {
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/json',
      'Content-Type':  'application/json',
    },
  });
}

async function apiPost(token, endpoint, jsonBody) {
  const parsed = new url.URL(endpoint);
  const body   = JSON.stringify(jsonBody);
  return httpsRequest({
    hostname: parsed.hostname,
    path:     parsed.pathname + parsed.search,
    method:   'POST',
    headers:  {
      'Authorization': `Bearer ${token}`,
      'Accept':        'application/json',
      'Content-Type':  'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);
}

async function apiUploadZip(token, endpoint, zipPath) {
  const parsed   = new url.URL(endpoint);
  const fileData = readFileSync(zipPath);
  const boundary = '----FormBoundary' + createHash('md5').update(String(Date.now())).digest('hex');
  const header   = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${basename(zipPath)}"\r\nContent-Type: application/zip\r\n\r\n`
  );
  const footer   = Buffer.from(`\r\n--${boundary}--\r\n`);
  const body     = Buffer.concat([header, fileData, footer]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsed.hostname,
      path:     parsed.pathname,
      method:   'POST',
      headers:  {
        'Authorization':  `Bearer ${token}`,
        'Accept':         'application/json',
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, body: parsed, raw });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Zip helper — cross-platform (Windows + Unix) ──────────────────────────
async function createArchive(distDir, outFile) {
  info(`Creating archive from ${distDir} …`);

  if (IS_WINDOWS) {
    // Windows: use PowerShell's Compress-Archive (built-in, no install needed)
    const zipOut = outFile.replace('.tar.gz', '.zip');
    // PowerShell path with forward slashes to avoid escaping issues
    const src  = distDir.replace(/\\/g, '/');
    const dest = zipOut.replace(/\\/g, '/');
    const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${src}\\*' -DestinationPath '${dest}' -Force"`;
    const r = spawnSync('powershell', [
      '-NoProfile', '-Command',
      `Compress-Archive -Path '${src}\\*' -DestinationPath '${dest}' -Force`,
    ], { stdio: 'pipe' });
    if (r.status !== 0) {
      const errMsg = r.stderr?.toString() ?? 'unknown';
      throw new Error(`PowerShell Compress-Archive failed: ${errMsg}`);
    }
    ok(`Archive created: ${zipOut}`);
    return zipOut;
  }

  // Unix/macOS: use tar (always available)
  const r = spawnSync('tar', ['-czf', outFile, '-C', distDir, '.'], { stdio: 'pipe' });
  if (r.status !== 0) {
    // Fallback: zip
    const zipOut = outFile.replace('.tar.gz', '.zip');
    const r2 = spawnSync('zip', ['-r', zipOut, '.'], { cwd: distDir, stdio: 'pipe' });
    if (r2.status !== 0) throw new Error('Could not create archive. Install tar or zip.');
    return zipOut;
  }
  return outFile;
}

// ── Discover Hostinger account via all known base-URL patterns ────────────
const API_BASES = [
  'https://developers.hostinger.com/api/v1',
  'https://api.hostinger.com/v1',
  'https://hpanel.hostinger.com/api/v1',
];

async function discoverApi(token) {
  const probeEndpoints = [
    '/billing/catalog',
    '/hosting',
    '/hosting/v1/accounts',
    '/account',
  ];

  for (const base of API_BASES) {
    for (const ep of probeEndpoints) {
      try {
        const r = await apiGet(token, base + ep);
        if (r.status >= 200 && r.status < 400) {
          ok(`API base found: ${base}`);
          return { base, probeEndpoint: ep, firstResponse: r };
        }
      } catch { /* try next */ }
    }
  }
  return null;
}

async function listHostingAccounts(token, base) {
  const attempts = [
    '/hosting',
    '/hosting/v1/accounts',
    '/hosting/accounts',
    '/billing/subscriptions',
  ];
  for (const ep of attempts) {
    try {
      const r = await apiGet(token, base + ep);
      if (r.status === 200 && r.body) return { endpoint: ep, data: r.body };
    } catch {}
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════╗`);
  console.log(`║   Cooper Dismedic · Hostinger Deploy     ║`);
  console.log(`╚══════════════════════════════════════════╝${C.reset}\n`);

  // 1. Load credentials
  step('Loading credentials');
  const env   = loadEnv();
  const TOKEN = env.HOSTINGER_API_TOKEN;
  if (!TOKEN) { err('HOSTINGER_API_TOKEN missing in .env.deploy'); process.exit(1); }
  ok(`Token loaded (${TOKEN.slice(0, 6)}…)`);

  // 2. Build site
  if (!SKIP_BUILD) {
    step('Building production bundle');
    info('Running: npm run build …');
    try {
      execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
      ok('Build complete');
    } catch {
      err('Build failed. Fix errors above then retry.');
      err('Tip: run "npm run build" first to see the full error.');
      process.exit(1);
    }
  } else {
    warn('Skipping build (--skip-build flag)');
  }

  // Verify dist/ exists
  if (!existsSync('dist')) {
    err('dist/ folder not found. Run without --skip-build first.');
    process.exit(1);
  }

  // Check dist has index.html
  if (!existsSync('dist/index.html')) {
    err('dist/index.html not found — build may have failed silently.');
    process.exit(1);
  }
  ok('dist/ folder verified');

  // Copy .htaccess into dist/ — cross-platform (no shell cp/copy)
  if (existsSync('public/.htaccess')) {
    copyFileSync('public/.htaccess', join('dist', '.htaccess'));
    ok('.htaccess copied to dist/');
  }

  if (DRY_RUN) {
    warn('Dry run — skipping upload.');
  }

  // 3. Discover API
  step('Connecting to Hostinger API');
  const discovery = await discoverApi(TOKEN);

  if (!discovery) {
    warn('Could not reach Hostinger API automatically.');
    warn('This is common when running on a restricted network.');
    console.log(`\n${C.yellow}━━━  Manual deployment option  ━━━${C.reset}`);
    info('Go to hPanel → Hosting → File Manager → Upload dist/ contents to public_html/');
    info('Or use the FTP credentials from hPanel → Files → FTP Accounts to upload with FileZilla.');
    console.log(`\n${C.cyan}The dist/ folder is ready at:${C.reset} ${resolve('dist')}`);
    process.exit(0);
  }

  const { base } = discovery;
  ok(`Connected to: ${base}`);

  // 4. List hosting accounts
  step('Discovering hosting accounts');
  const accounts = await listHostingAccounts(TOKEN, base);

  if (accounts) {
    info(`Accounts endpoint: ${accounts.endpoint}`);
    console.log('\n  Hosting accounts found:');
    const list = Array.isArray(accounts.data) ? accounts.data
      : accounts.data?.data ?? [accounts.data];
    list.slice(0, 5).forEach((a, i) => {
      const domain = a.domain ?? a.main_domain ?? a.hostname ?? a.name ?? JSON.stringify(a).slice(0,60);
      const id     = a.id ?? a.account_id ?? a.hash ?? '?';
      console.log(`  ${C.cyan}${i + 1}.${C.reset} ${domain}  ${C.dim}(${id})${C.reset}`);
    });

    if (list.length === 1 || DRY_RUN) {
      const account = list[0];
      const accountId = account.id ?? account.account_id ?? account.hash;
      ok(`Using account: ${account.domain ?? accountId}`);

      if (DRY_RUN) {
        warn('Dry run — stopping before upload.');
        process.exit(0);
      }

      // 5. Deploy
      step('Uploading to Hostinger');
      await deployFiles(TOKEN, base, accountId, account);
    } else {
      warn('Multiple accounts found. Edit deploy.mjs → ACCOUNT_ID constant and run again.');
      info('Set the ACCOUNT_ID to the ID shown above for your domain.');
    }
  } else {
    warn('Could not list hosting accounts via API.');
    info('Check that your API token has hosting permissions in hPanel.');
    info(`\ndist/ folder is ready at: ${resolve('dist')}`);
    info('You can still upload manually via hPanel File Manager or FileZilla FTP.');
  }
}

async function deployFiles(token, base, accountId, account) {
  // Try the JS app deploy endpoint (Hostinger shared hosting)
  // Use OS-appropriate temp path
  const tmpDir      = IS_WINDOWS ? (process.env.TEMP ?? process.env.TMP ?? 'C:\\Temp') : '/tmp';
  const archivePath = join(tmpDir, 'cooperdismedic-deploy.tar.gz');

  try {
    const archive = await createArchive(resolve('dist'), archivePath);
    ok(`Archive created: ${archive}`);

    const deployEndpoints = [
      `${base}/hosting/${accountId}/deploy`,
      `${base}/hosting/v1/accounts/${accountId}/deploy`,
      `${base}/hosting/${accountId}/nodejs/deploy`,
    ];

    for (const endpoint of deployEndpoints) {
      try {
        info(`Trying: POST ${endpoint}`);
        const r = await apiUploadZip(token, endpoint, archive);
        if (r.status >= 200 && r.status < 300) {
          ok(`Deployed successfully! Status: ${r.status}`);
          console.log(`\n${C.green}${C.bold}🚀  Website is live!${C.reset}`);
          console.log(`${C.cyan}   Domain: ${account.domain ?? accountId}${C.reset}\n`);
          return;
        }
        dim(`→ ${r.status}: ${JSON.stringify(r.body).slice(0, 120)}`);
      } catch (e) { dim(`→ Error: ${e.message}`); }
    }

    // Fallback — try file-by-file FTP info
    warn('API deploy endpoints did not accept the upload.');
    printFtpFallback(account);

  } catch (e) {
    err(`Archive/upload error: ${e.message}`);
    printFtpFallback(account);
  }
}

function printFtpFallback(account) {
  console.log(`\n${C.yellow}━━━  Use File Manager or FTP instead  ━━━${C.reset}`);
  console.log(`${C.cyan}Your built site is in:${C.reset}  dist/`);
  console.log(`${C.cyan}Upload ALL files in dist/ to:${C.reset}  public_html/`);
  console.log(`\nFTP setup in hPanel:`);
  console.log(`  Hosting → your domain → Files → FTP Accounts`);
  console.log(`  Host: ${account?.ftp_host ?? 'files.hostinger.com'}`);
  console.log(`  Use FileZilla, Cyberduck, or WinSCP to upload.\n`);
}

main().catch((e) => {
  err(`Unexpected error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
