#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const cataloguePath = path.join(projectRoot, 'src', 'data', 'products-catalogue.ts');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');
const backupPath = seedPath + '.backup-2026-07-13';

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à préciser' || v === 'à preciser' || v === 'a preciser' || v === 'n/a';
}

function extractField(block, field) {
  const re = new RegExp(field + "\s*:\s*'((?:\\'|[^'])*)'", 'i');
  const m = block.match(re);
  if (m) return m[1].replace(/\\'/g, "'");
  // try double quotes
  const re2 = new RegExp(field + '\\s*:\\s*"((?:\\"|[^\"])*)"', 'i');
  const m2 = block.match(re2);
  if (m2) return m2[1].replace(/\\"/g, '"');
  return null;
}

async function run(){
  const catText = await fs.readFile(cataloguePath, 'utf8');
  const seedText = await fs.readFile(seedPath, 'utf8');
  const backupExists = await fs.access(backupPath).then(()=>true).catch(()=>false);
  const backupText = backupExists ? await fs.readFile(backupPath,'utf8') : null;

  const seed = JSON.parse(seedText);
  const seedBackup = backupText ? JSON.parse(backupText) : null;
  // Parse catalogue blocks into map by normalized dci and name
  const objRegex = /\{[\s\S]*?\n\s*\}/g;
  const blocks = catText.match(objRegex) || [];
  function normalize(s){
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  }
  const catalogIndex = [];
  for(const b of blocks){
    const nameMatch = b.match(/name\s*:\s*'((?:\\'|[^'])*)'/i);
    const dciMatch = b.match(/dci\s*:\s*'((?:\\'|[^'])*)'/i);
    const idMatch = b.match(/id\s*:\s*(\d+)/i);
    const name = nameMatch ? nameMatch[1].replace(/\\'/g, "'") : null;
    const dci = dciMatch ? dciMatch[1].replace(/\\'/g, "'") : null;
    const cid = idMatch ? Number(idMatch[1]) : null;
    if(name || dci){
      catalogIndex.push({block: b, name, dci, id: cid, nname: normalize(name), ndci: normalize(dci)});
    }
  }

  let updated = 0, updatedBackup = 0;

  const fields = ['indications','posology','contraindications','sideEffects','conservation','description','pregnancyCategory','isPrescriptionRequired','ppm'];

  function findCatalogForSeed(prod){
    const ndci = normalize(prod.dci || prod.name || '');
    // exact dci match
    let found = catalogIndex.find(c => c.ndci && ndci && (c.ndci === ndci || c.ndci.includes(ndci) || ndci.includes(c.ndci)));
    if(found) return found.block;
    // try name match tokens
    const nname = normalize(prod.name || '');
    found = catalogIndex.find(c => c.nname && nname && (c.nname === nname || c.nname.includes(nname) || nname.includes(c.nname)));
    if(found) return found.block;
    // fuzzy token overlap
    const pTokens = new Set((ndci + ' ' + nname).split(' ').filter(Boolean));
    let best=null; let bestScore=0;
    for(const c of catalogIndex){
      const cTokens = new Set(((c.ndci||'') + ' ' + (c.nname||'')).split(' ').filter(Boolean));
      const inter = [...cTokens].filter(x=>pTokens.has(x)).length;
      const union = new Set([...cTokens, ...pTokens]).size || 1;
      const score = inter/union;
      if(score>bestScore && score>0.3){ best=c; bestScore=score; }
    }
    return best ? best.block : null;
  }

  for (const prod of seed){
    const block = findCatalogForSeed(prod);
    if(!block) continue;
    let anyChange=false;
    for(const f of fields){
      if(f==='isPrescriptionRequired'){
        const mb = block.match(new RegExp(f + "\\s*:\\s*(true|false)", 'i'));
        if(mb){ const boolVal = mb[1].toLowerCase()==='true'; if((prod[f]===undefined || isPlaceholder(prod[f])) && prod[f]!==boolVal){ prod[f]=boolVal; anyChange=true; } }
        continue;
      }
      if(f==='ppm'){
        const mn = block.match(new RegExp(f + "\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)", 'i'));
        if(mn){ const num = Number(mn[1]); if((prod[f]===undefined || isPlaceholder(prod[f])) && prod[f]!==num){ prod[f]=num; anyChange=true; } }
        continue;
      }
      const val = extractField(block,f);
      if(val!==null && (prod[f]===undefined || isPlaceholder(prod[f])) && val.trim().length>0){ prod[f]=val; anyChange=true; }
    }
    if(anyChange) updated++;
  }

  if(seedBackup){
    for(const prod of seedBackup){
      const block = findCatalogForSeed(prod);
      if(!block) continue;
      let anyChange=false;
      for(const f of fields){
        if(f==='isPrescriptionRequired'){
          const mb = block.match(new RegExp(f + "\\s*:\\s*(true|false)", 'i'));
          if(mb){ const boolVal = mb[1].toLowerCase()==='true'; if((prod[f]===undefined || isPlaceholder(prod[f])) && prod[f]!==boolVal){ prod[f]=boolVal; anyChange=true; } }
          continue;
        }
        if(f==='ppm'){
          const mn = block.match(new RegExp(f + "\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)", 'i'));
          if(mn){ const num = Number(mn[1]); if((prod[f]===undefined || isPlaceholder(prod[f])) && prod[f]!==num){ prod[f]=num; anyChange=true; } }
          continue;
        }
        const val = extractField(block,f);
        if(val!==null && (prod[f]===undefined || isPlaceholder(prod[f])) && val.trim().length>0){ prod[f]=val; anyChange=true; }
      }
      if(anyChange) updatedBackup++;
    }
  }

  // write files
  if(updated>0){
    await fs.copyFile(seedPath, seedPath + '.pre-merge-backup-' + new Date().toISOString().slice(0,10));
    await fs.writeFile(seedPath, JSON.stringify(seed,null,2),'utf8');
  }
  if(seedBackup && updatedBackup>0){
    await fs.copyFile(backupPath, backupPath + '.pre-merge-backup-' + new Date().toISOString().slice(0,10));
    await fs.writeFile(backupPath, JSON.stringify(seedBackup,null,2),'utf8');
  }

  console.log(`Merge complete. Updated seed: ${updated} products. Updated backup: ${updatedBackup} products.`);
}

run().catch(err=>{ console.error(err); process.exit(1); });
