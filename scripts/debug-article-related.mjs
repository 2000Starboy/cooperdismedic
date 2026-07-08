import fs from 'node:fs';
import path from 'node:path';

const publicPath = path.resolve('./public/api/products.json');
const distPath = path.resolve('./dist/api/products.json');
let raw;
if (fs.existsSync(publicPath)) raw = fs.readFileSync(publicPath, 'utf8');
else raw = fs.readFileSync(distPath, 'utf8');
const products = JSON.parse(raw);

function normalizeString(s){return String(s||'').toLowerCase().trim();}
function tokenizeName(name){
  return String(name||'')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s]+/g,' ')
    .split(/\s+/).filter(Boolean);
}

function isPlaceholder(p){
  const tc = normalizeString(p.therapeuticClass||'');
  return tc.includes('produit import') || normalizeString(p.dci||'')==='à préciser' || normalizeString(p.dci||'')==='a preciser';
}

const article = products.find(p => p.name && p.name.toUpperCase().includes('ANTIDÉPRESSEURS'));
if(!article){
  console.error('Article not found'); process.exit(1);
}

const title = String(article.name || '').toLowerCase();
console.log('Article title:', article.name);

// detect antidepressant
if (/antidepr|antid[eé]press/i.test(title)) {
  const antidepressantDcis = [
    'sertraline', 'fluoxetine', 'citalopram', 'escitalopram', 'paroxetine', 'mirtazapine', 'venlafaxine', 'duloxetine', 'amitriptyline', 'nortriptyline'
  ];
  const candidates = products.filter(p=>!isPlaceholder(p));
  const hits = candidates.filter(c=>{
    const tc = String(c.therapeuticClass||'').toLowerCase();
    const dci = String(c.dci||'').toLowerCase();
    const name = String(c.name||'').toLowerCase();
    if (tc.includes('antid')) return true;
    for (const d of antidepressantDcis) if (dci.includes(d) || name.includes(d)) return true;
    return false;
  }).slice(0,10);

  console.log('Top related products for article (antidepressant mapping):');
  for (const h of hits) console.log('-', h.name, '| DCI:', h.dci, '| Ther:', h.therapeuticClass);
  process.exit(0);
}

console.log('No specific mapping found for article; fallback not shown');
