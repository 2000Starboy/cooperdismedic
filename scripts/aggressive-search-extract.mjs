#!/usr/bin/env node
/**
 * Aggressive name-based search and extraction for remaining products
 * Tries multiple slug variants on cure.ma and fallback to Playwright when needed
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { extractProductDataFromHtml } from './import-product-from-url.mjs';
import { gotoNoticePage, extractNoticeSections } from './cure-notice-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value){
  const v = String(value||'').trim().toLowerCase();
  return !v || v==='à compléter' || v==='à préciser' || v==='à preciser' || v==='a preciser' || v==='n/a';
}

function stripAccents(s){ return s.normalize('NFD').replace(/\p{Diacritic}/gu,''); }
function slugify(s){
  if(!s) return '';
  let out = s.toLowerCase();
  out = stripAccents(out);
  out = out.replace(/\(.*?\)/g,''); // remove parentheses content
  out = out.replace(/[^a-z0-9\s\|\-]/g,' ');
  out = out.replace(/\b(\d+\s*(mg|g|ml|%|ui|mcg|µg))\b/g,'');
  out = out.replace(/\s+/g,'-');
  out = out.replace(/^-+|-+$/g,'');
  out = out.replace(/\|/g,'');
  out = out.replace(/-+/g,'-');
  return out;
}

function generateCandidates(p){
  const name = String(p.name||'');
  const dci = String(p.dci||'');
  const base = slugify(name);
  const withoutDosage = slugify(name.replace(/\d+/g,''));
  const dciSlug = slugify(dci.split('|')[0]||dci);
  const tokens = name.split(/[\s,()|]+/).slice(0,4).join(' ');
  const short = slugify(tokens);
  const candidates = new Set();
  [base, withoutDosage, dciSlug, short].forEach(s=>{ if(s) candidates.add(s); });
  // try variants
  const arr = Array.from(candidates);
  const out = [];
  for(const s of arr){
    out.push(s);
    out.push(s + '-');
    out.push(s + '.');
  }
  return [...new Set(out)].filter(Boolean).slice(0,25);
}

async function tryFetch(url, timeout=8000){
  try{
    const ctrl = new AbortController();
    const id = setTimeout(()=>ctrl.abort(), timeout);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    return res;
  }catch(e){ return null; }
}

async function run(){
  const raw = await fs.readFile(seedPath,'utf8');
  const products = JSON.parse(raw);
  const fields = ['indications','posology','contraindications','sideEffects','conservation'];
  const needs = products.filter(p=> fields.some(f=>isPlaceholder(p[f])));
  console.log(`Found ${needs.length} products with gaps`);

  const baseUrls = ['https://www.cure.ma/medicaments/','https://cure.ma/medicaments/'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let updates=0;

  for(let i=0;i<needs.length;i++){
    const p = needs[i];
    console.log(`\n[${i+1}/${needs.length}] ${p.id} ${p.name}`);
    const candidates = generateCandidates(p);
    let found=false;
    for(const slug of candidates){
      for(const base of baseUrls){
        const url = base + slug;
        const res = await tryFetch(url,6000);
        if(res && res.ok){
          const html = await res.text();
          const extracted = extractProductDataFromHtml(html, url);
          if(!extracted) continue;
          // merge
          let changed=false;
          for(const f of fields){
            if(isPlaceholder(p[f]) && extracted[f] && !isPlaceholder(extracted[f])){ p[f]=extracted[f]; changed=true; }
          }
          if(changed){ updates++; console.log(`  ✓ Updated from ${url}`); found=true; break; }
          // if not changed maybe product page is generic; still treat as found
          if(!changed){ console.log(`  ✓ Page ok but no new fields from ${url}`); found=true; break; }
        }
      }
      if(found) break;
      // short delay between candidate tries
      await new Promise(r=>setTimeout(r,250));
    }

    if(found) continue;

    // fallback: use Playwright to render possible JS-only pages trying first candidate urls
    for(const slug of candidates){
      for(const base of baseUrls){
        const url = base + slug;
        try{
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
          const sections = await extractNoticeSections(page);
          if(sections){
            let changed=false;
            for(const f of fields){
              if(isPlaceholder(p[f]) && sections[f] && !isPlaceholder(sections[f])){ p[f]=sections[f]; changed=true; }
            }
            if(changed){ updates++; console.log(`  ✓ Updated from Playwright ${url}`); found=true; break; }
            if(!changed){ console.log(`  ✓ Page rendered but no new fields ${url}`); found=true; break; }
          }
        }catch(e){ /* ignore navigation errors */ }
      }
      if(found) break;
      await new Promise(r=>setTimeout(r,400));
    }

    if(!found) console.log('  ✗ No page found for candidates');

    // small inter-product delay
    await new Promise(r=>setTimeout(r,500));
  }

  await browser.close();

  if(updates>0){
    const backup = seedPath + '.backup-aggressive-name-' + new Date().toISOString().slice(0,10).replace(/-/g,'');
    await fs.copyFile(seedPath, backup);
    await fs.writeFile(seedPath, JSON.stringify(products,null,2),'utf8');
    console.log(`\nSaved ${updates} updates. Backup: ${backup}`);
  } else console.log('\nNo updates applied');
}

run().catch(err=>{ console.error(err); process.exit(1); });
