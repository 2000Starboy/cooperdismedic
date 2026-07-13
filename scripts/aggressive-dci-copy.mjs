#!/usr/bin/env node
/**
 * Aggressive DCI-based copy to fill remaining gaps
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'src', 'data', 'market-products.seed.json');

function isPlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v === 'à compléter' || v === 'à préciser' || v === 'à preciser' || v === 'a preciser' || v === 'n/a';
}

function normalizeDCI(s){
  if(!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\b(\d+\s*(mg|g|ml|%|ui|mcg|µg|mg\/ml))\b/g,'')
    .replace(/\b(ml|mg|g|%|ui|mcg|mcg)\b/g,'')
    .replace(/[^a-z0-9\s|]+/g,' ') // allow pipe as separator
    .replace(/\b(comprime|comprime|gelule|suspension|solution|collyre|pommade|injectable|suppositoire)\b/g,'')
    .replace(/\s+/g,' ').trim();
}

function tokens(s){ return s.split('|').map(x=>x.trim()).filter(Boolean).flatMap(x=>x.split(' ')).filter(Boolean); }

function jaccard(a,b){
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter(x=>B.has(x)).length;
  const union = new Set([...A,...B]).size;
  return union===0?0:inter/union;
}

async function run(){
  const raw = await fs.readFile(seedPath,'utf8');
  const products = JSON.parse(raw);
  const fields = ['indications','posology','contraindications','sideEffects','conservation'];

  const index = products.map(p=>({p, key: normalizeDCI(p.dci||p.name||'')}));

  let updated=0;

  for(const item of index){
    const p = item.p;
    const hasGap = fields.some(f=>isPlaceholder(p[f]));
    if(!hasGap) continue;
    const key = item.key;
    const tok = tokens(key);
    // find candidates with high jaccard
    const candidates = index.filter(c=>c.p.id!==p.id).map(c=>({c:c.p,score:jaccard(tok,tokens(c.key))})).filter(x=>x.score>0.4);
    candidates.sort((a,b)=>b.score-a.score);
    if(candidates.length===0) continue;
    const source = candidates[0].c;
    let changed=false;
    for(const f of fields){
      if(isPlaceholder(p[f]) && source[f] && !isPlaceholder(source[f])){ p[f]=source[f]; changed=true; }
    }
    if(changed){ updated++; console.log(`Updated ${p.id} from ${source.id} (score ${candidates[0].score.toFixed(2)})`); }
  }

  if(updated>0){
    const backup = seedPath + '.backup-aggressive-' + new Date().toISOString().slice(0,10).replace(/-/g,'');
    await fs.copyFile(seedPath, backup);
    await fs.writeFile(seedPath, JSON.stringify(products,null,2),'utf8');
    console.log(`\nSaved ${updated} updates. Backup: ${backup}`);
  } else console.log('No updates applied');
}

run().catch(err=>{ console.error(err); process.exit(1); });
