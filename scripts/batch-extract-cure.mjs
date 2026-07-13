import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const seedPath = path.join(root, 'src', 'data', 'market-products.seed.json');
const publicPath = path.join(root, 'public', 'api', 'products.json');

function normalize(s){ return String(s||'').replace(/\s+/g,' ').replace(/\u00A0/g,' ').trim(); }
function isPlaceholder(v){ if(!v) return true; const t=String(v).trim(); return !t || t.toLowerCase().includes('à compléter') || t.toLowerCase().includes('à préciser'); }

async function extractFromPage(page, url){
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // extract by headings and neighbors
  const labels = ['Indications','Posologie','Contre‑indications','Contre-indications','Effets indésirables','Effets secondaires','Conservation','Mode d\'emploi','Mode d\'utilisation'];
  const sections = {};

  for(const label of labels) sections[label] = '';

  const headerTexts = await page.$$eval('h1,h2,h3,h4,section,div', nodes => nodes.map(n => ({text:n.innerText||n.textContent||'', tag:n.tagName.toLowerCase()})));

  // naive scan: for each node, if text contains label, get next sibling innerText
  for(const [i, node] of headerTexts.entries()){
    const text = normalize(node.text || '');
    if(!text) continue;
    for(const label of labels){
      if(text.toLowerCase().includes(label.toLowerCase())){
        // try to get content from DOM using page.evaluate on index
        const content = await page.evaluate((idx)=>{
          const nodes = Array.from(document.querySelectorAll('h1,h2,h3,h4,section,div'));
          const el = nodes[idx];
          if(!el) return '';
          let out='';
          let sib = el.nextElementSibling;
          let steps=0;
          while(sib && steps<50){
            const tag = sib.tagName.toLowerCase();
            if(/h1|h2|h3|h4|section/.test(tag)) break;
            out += ' ' + (sib.innerText || sib.textContent || '');
            sib = sib.nextElementSibling;
            steps++;
          }
          return out;
        }, i);
        if(content && content.trim()) sections[label] = normalize(content);
      }
    }
  }

  // fallback: JSON-LD Drug description
  try{
    const jsons = await page.$$eval('script[type="application/ld+json"]', nodes => nodes.map(n=>n.textContent));
    for(const txt of jsons){
      try{
        const j = JSON.parse(txt);
        const find = (obj)=>{
          if(!obj) return null;
          if(obj['@type'] === 'Drug' && obj.description) return obj.description;
          for(const v of Object.values(obj)){
            if(typeof v === 'object'){
              const r = find(v);
              if(r) return r;
            }
          }
          return null;
        };
        const desc = find(j);
        if(desc) sections['jsonld_description'] = normalize(desc);
      }catch(e){}
    }
  }catch(e){}

  return sections;
}

(async ()=>{
  if(!fs.existsSync(seedPath)){
    console.error('Missing seed:', seedPath);
    process.exit(2);
  }

  const raw = fs.readFileSync(seedPath,'utf8');
  const seed = JSON.parse(raw);
  const products = Array.isArray(seed)?seed:(Array.isArray(seed.products)?seed.products:[]);

  function extractUrlFromText(text){
    if(!text) return '';
    const m = String(text).match(/https?:\/\/[\w\-\.\/:?&=%#]+/i);
    return m? m[0].replace(/[.,;]+$/,'') : '';
  }

  const itemsToProcess = products.map(p=>({
    prod: p,
    url: extractUrlFromText(p.sourceUrl || p.description || '')
  })).filter(x=>/https?:\/\/([^\/]+\.)?cure\.ma\//i.test(x.url));

  console.log('Found', itemsToProcess.length, 'Cure.ma products to process');
  if(itemsToProcess.length===0) process.exit(0);

  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage();

  let updated=0;
  for(const entry of itemsToProcess){
    const p = entry.prod;
    const url = entry.url;
    try{
      const sections = await extractFromPage(page, url);
      const before = {indications:p.indications,posology:p.posology,contraindications:p.contraindications,sideEffects:p.sideEffects,conservation:p.conservation};
      // prefer JSON-LD description for indications if none
      if((isPlaceholder(p.indications) || !p.indications) && sections['jsonld_description']) p.indications = sections['jsonld_description'];
      if((isPlaceholder(p.indications) || !p.indications) && sections['Indications']) p.indications = sections['Indications'];
      if((isPlaceholder(p.posology) || !p.posology) && sections['Posologie']) p.posology = sections['Posologie'];
      if((isPlaceholder(p.contraindications) || !p.contraindications) && (sections['Contre‑indications']||sections['Contre-indications'])) p.contraindications = sections['Contre‑indications']||sections['Contre-indications'];
      if((isPlaceholder(p.sideEffects) || !p.sideEffects) && (sections['Effets indésirables']||sections['Effets secondaires'])) p.sideEffects = sections['Effets indésirables']||sections['Effets secondaires'];
      if((isPlaceholder(p.conservation) || !p.conservation) && sections['Conservation']) p.conservation = sections['Conservation'];

      const changed = JSON.stringify(before) !== JSON.stringify({indications:p.indications,posology:p.posology,contraindications:p.contraindications,sideEffects:p.sideEffects,conservation:p.conservation});
      if(changed){ updated++; console.log('Updated', p.id || '-', p.name); }
      await new Promise(r=>setTimeout(r, 600));
    }catch(e){ console.error('ERR', url, e.message); }
  }

  await browser.close();

    if(updated>0){
    // backup
    fs.copyFileSync(seedPath, seedPath + '.bak');
    // preserve original file shape
    if (Array.isArray(seed)) {
      fs.writeFileSync(seedPath, JSON.stringify(products, null, 2), 'utf8');
    } else if (seed && typeof seed === 'object' && Array.isArray(seed.products)) {
      seed.products = products;
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
    } else {
      fs.writeFileSync(seedPath, JSON.stringify(products, null, 2), 'utf8');
    }
    console.log('Wrote updated seed, backup at', seedPath + '.bak');

    // update public products.json similarly if present
    if(fs.existsSync(publicPath)){
      const rawp = fs.readFileSync(publicPath,'utf8');
      const pub = JSON.parse(rawp);
      const pubArr = Array.isArray(pub)?pub:(Array.isArray(pub.products)?pub.products:[]);
      // map by name+dci
      const key = (x)=> (String(x.name||'')+'::'+String(x.dci||'')).toLowerCase();
      const map = new Map(pubArr.map(x=>[key(x), x]));
      for(const prod of products){
        const k = key(prod);
        if(map.has(k)){
          const target = map.get(k);
          if(isPlaceholder(target.indications) && !isPlaceholder(prod.indications)) target.indications = prod.indications;
          if(isPlaceholder(target.posology) && !isPlaceholder(prod.posology)) target.posology = prod.posology;
          if(isPlaceholder(target.contraindications) && !isPlaceholder(prod.contraindications)) target.contraindications = prod.contraindications;
          if(isPlaceholder(target.sideEffects) && !isPlaceholder(prod.sideEffects)) target.sideEffects = prod.sideEffects;
          if(isPlaceholder(target.conservation) && !isPlaceholder(prod.conservation)) target.conservation = prod.conservation;
        }
      }
      fs.copyFileSync(publicPath, publicPath + '.bak');
      fs.writeFileSync(publicPath, JSON.stringify(pubArr, null, 2),'utf8');
      console.log('Updated public products.json, backup at', publicPath + '.bak');
    }
  }

  console.log('Done. Updated products:', updated);
  process.exit(0);
})();
