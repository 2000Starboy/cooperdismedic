import fs from 'node:fs';
import path from 'node:path';

function normalizeString(str) {
  return String(str || '').toLowerCase().trim();
}

function normalizeDosageValue(dosage) {
  if (!dosage) return undefined;
  const m = String(dosage)
    .toLowerCase()
    .replace(',', '.')
    .match(/([\d.]+)\s*(%|mg|g|ml|mcg|ug|l)?/i);
  if (!m) return undefined;
  return { value: Number(m[1]), unit: (m[2] || '').toLowerCase() };
}

function tokenize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function levenshtein(a, b) {
  const A = String(a||'').split('');
  const B = String(b||'').split('');
  const m = A.length; const n = B.length;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++){ const cost=A[i-1]===B[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);} 
  return dp[m][n];
}

function fuzzyNameScore(a,b){ const sa=String(a||'').toLowerCase().trim(); const sb=String(b||'').toLowerCase().trim(); if(!sa||!sb) return 0; const dist=levenshtein(sa,sb); const maxLen=Math.max(sa.length,sb.length); if(maxLen===0) return 0; const ratio=1-dist/maxLen; if(ratio<=0) return 0; return Math.round(Math.min(10, Math.max(0, ratio*10))); }

function computeScore(product,candidate){
  if(product.id===candidate.id) return -1;
  const prodDci=normalizeString(product.dci||'');
  const candDci=normalizeString(candidate.dci||'');
  const prodTher=normalizeString(product.therapeuticClass||'');
  const candTher=normalizeString(candidate.therapeuticClass||'');
  const prodLab=normalizeString(product.laboratory||'');
  const candLab=normalizeString(candidate.laboratory||'');
  const prodForm=normalizeString(product.form||'');
  const candForm=normalizeString(candidate.form||'');
  let score=0;
  if(prodDci && candDci && prodDci===candDci) score+=50;
  if(prodTher && candTher && (prodTher===candTher || prodTher.includes(candTher) || candTher.includes(prodTher))) score+=30;
  if(prodLab && candLab && prodLab===candLab) score+=10;
  if(prodForm && candForm && prodForm===candForm) score+=5;
  const pd=normalizeDosageValue(product.dosage); const cd=normalizeDosageValue(candidate.dosage);
  if(pd && cd && pd.unit && cd.unit && pd.unit===cd.unit && pd.value===cd.value) score+=5;
  score+=fuzzyNameScore(product.name||'', candidate.name||'');
  const prodTags=new Set([...(product.categories||[]), ...tokenize(product.name||''), ...tokenize(product.dci||'')]);
  const candTags=new Set([...(candidate.categories||[]), ...tokenize(candidate.name||''), ...tokenize(candidate.dci||'')]);
  let common=0; for(const t of candTags) if(prodTags.has(t)) common++; score+=Math.min(10, common*2);
  if(!prodDci || !candDci || !prodTher || !candTher){ const prodKeywords=new Set([...tokenize(product.name||''), ...tokenize(product.indications||''), ...tokenize(product.therapeuticClass||'')]); const candKeywords=new Set([...tokenize(candidate.name||''), ...tokenize(candidate.indications||''), ...tokenize(candidate.therapeuticClass||'')]); let shared=0; for(const k of candKeywords) if(prodKeywords.has(k)) shared++; if(shared>=3) score+=40; else if(shared===2) score+=20; else if(shared===1) score+=10; }
  if(product.relatedIds?.includes(candidate.id) || candidate.relatedIds?.includes(product.id)) score+=5;
  if(score<0) score=0; return score;
}

const publicPath=path.resolve('./public/api/products.json'); const distPath=path.resolve('./dist/api/products.json'); let raw;
if(fs.existsSync(publicPath)) raw=fs.readFileSync(publicPath,'utf8'); else raw=fs.readFileSync(distPath,'utf8');
const products=JSON.parse(raw);

const target = products.find((p) => p.name && p.name.toLowerCase().includes('losartan') && p.dosage && p.dosage.includes('50'));
if (!target) {
  console.error('Losartan 50 not found');
  process.exit(1);
}
console.log('Target:', target.name, '| DCI:', target.dci, '| Ther:', target.therapeuticClass);

let scored = products
  .map((c) => ({ name: c.name, id: c.id, score: computeScore(target, c), dci: c.dci, ther: c.therapeuticClass, cats: c.categories }))
  .filter((s) => s.score > 0)
  .sort((a, b) => b.score - a.score);

const MIN_SCORE = 30;
const high = scored.filter((s) => s.score >= MIN_SCORE).slice(0, 12);
console.log('Top related for', target.name);
if (high.length === 0) {
  console.log('No high-confidence related products (min score', MIN_SCORE + ')');
} else {
  for (const s of high) console.log(s.score, '\t', s.name, '| DCI:', s.dci, '| Ther:', s.ther, '| Cats:', (s.cats || []).join(','));
}
