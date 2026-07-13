#!/usr/bin/env node
/**
 * Playwright extraction for remaining products with URLs
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { gotoNoticePage, extractNoticeSections } from './cure-notice-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à préciser' || v === 'à preciser' || v === 'a preciser' || v === 'n/a';
}
function normalizeUrl(u){
  if(!u) return null;
  // strip trailing punctuation
  return u.replace(/[\.,;:\)\]]+$/,'');
}
function extractSourceUrl(desc){
  if(!desc) return null;
  const m = desc.match(/https?:\/\/[^\s\)\]]+/i);
  return m ? normalizeUrl(m[0]) : null;
}

async function run(){
  const raw = await fs.readFile(seedPath,'utf8');
  const products = JSON.parse(raw);
  const fieldsToFill = ['indications','posology','contraindications','sideEffects','conservation'];
  const needs = products.filter(p=> fieldsToFill.some(f=> isPlaceholder(p[f])));
  const withUrls = needs.map(p=> ({p, url: extractSourceUrl(p.description)})).filter(x=>x.url);
  if(withUrls.length===0){
    console.log('No URLs to process');
    return;
  }
  console.log(`Processing ${withUrls.length} products with Playwright`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  let updated=0;
  for(let i=0;i<withUrls.length;i++){
    const {p,url} = withUrls[i];
    console.log(`[${i+1}/${withUrls.length}] ${p.id} ${p.name}`);
    try{
      await gotoNoticePage(page,url);
      const sections = await extractNoticeSections(page);
      if(!sections) { console.log('  ⚠ no sections'); continue; }
      let changed=false;
      if(isPlaceholder(p.indications) && sections.indications){ p.indications = sections.indications; changed=true; }
      if(isPlaceholder(p.posology) && sections.posology){ p.posology = sections.posology; changed=true; }
      if(isPlaceholder(p.contraindications) && sections.contraindications){ p.contraindications = sections.contraindications; changed=true; }
      if(isPlaceholder(p.sideEffects) && sections.sideEffects){ p.sideEffects = sections.sideEffects; changed=true; }
      if(isPlaceholder(p.conservation) && sections.conservation){ p.conservation = sections.conservation; changed=true; }
      if(changed){ updated++; console.log('  ✓ Updated'); }
      else console.log('  ⚠ No new data');
    }catch(err){
      console.log('  ✗', err.message);
    }
    await new Promise(r=>setTimeout(r,500));
  }
  await browser.close();
  if(updated>0){
    const backup = seedPath + '.backup-playwright-' + new Date().toISOString().slice(0,10).replace(/-/g,'');
    await fs.copyFile(seedPath, backup);
    await fs.writeFile(seedPath, JSON.stringify(products,null,2),'utf8');
    console.log(`\n✓ Saved updates (${updated}). Backup: ${backup}`);
  } else {
    console.log('\nNo updates applied');
  }
}

run().catch(err=>{ console.error(err); process.exit(1); });
