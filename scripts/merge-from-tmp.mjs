import fs from 'node:fs';
import path from 'node:path';

const tmp='tmp-extract.json';
if(!fs.existsSync(tmp)){ console.error('Missing', tmp); process.exit(2); }
const raw = fs.readFileSync(tmp);
let s;
try{ s = raw.toString('utf8'); JSON.parse(s); }catch(e){ try{ s = raw.toString('utf16le'); if(s.charCodeAt(0)===0xFEFF) s = s.slice(1); JSON.parse(s); }catch(e2){ // try stripping null bytes
    try{ const filtered = Buffer.from(raw.filter(b=>b!==0x00)); s = filtered.toString('utf8'); if(s.charCodeAt(0)===0xFEFF) s = s.slice(1); JSON.parse(s); }catch(e3){ console.error('Failed to parse tmp json'); process.exit(2); } } }
const obj = JSON.parse(s);
const sections = obj.sections||{};
const fieldMap = {};
if(sections['Indications']) fieldMap.indications=sections['Indications'];
if(sections['Posologie']) fieldMap.posology=sections['Posologie'];
if(sections['Contre‑indications']) fieldMap.contraindications=sections['Contre‑indications'];
if(sections['Contre-indications']) fieldMap.contraindications=fieldMap.contraindications||sections['Contre-indications'];
if(sections['Effets indésirables']) fieldMap.sideEffects=sections['Effets indésirables'];
if(sections['Effets secondaires']) fieldMap.sideEffects=fieldMap.sideEffects||sections['Effets secondaires'];
if(sections['Conservation']) fieldMap.conservation=sections['Conservation'];

const base='https://cure.ma/medicaments/aciclovir-viatris-250-mg-poudre-pour-solution-injectable-iv';
const seedFile=path.join(process.cwd(),'src','data','market-products.seed.json');
const publicFile=path.join(process.cwd(),'public','api','products.json');
const seedRaw=fs.readFileSync(seedFile,'utf8');
const pubRaw=fs.readFileSync(publicFile,'utf8');
const seed=JSON.parse(seedRaw);
const pub=JSON.parse(pubRaw);
const seedList=Array.isArray(seed)?seed:(Array.isArray(seed.products)?seed.products:[]);
const pubList=Array.isArray(pub)?pub:(Array.isArray(pub.products)?pub.products:[]);
const backup=(f)=>{ const dst=f+'.bak.'+Date.now(); fs.copyFileSync(f,dst); return dst; };
const b1=backup(seedFile); const b2=backup(publicFile);
let u1=0,u2=0;
for(const p of seedList){ const desc=String(p.description||p.sourceUrl||''); if(desc.includes(base) || (p.sourceUrl && String(p.sourceUrl).includes(base))){ for(const k of Object.keys(fieldMap)){ const v=fieldMap[k]; if(v && v.trim() && (!p[k] || String(p[k]).trim()==='À compléter')){ p[k]=v.trim(); u1++; } } } }
for(const p of pubList){ const desc=String(p.description||p.sourceUrl||''); if(desc.includes(base) || (p.sourceUrl && String(p.sourceUrl).includes(base))){ for(const k of Object.keys(fieldMap)){ const v=fieldMap[k]; if(v && v.trim() && (!p[k] || String(p[k]).trim()==='À compléter')){ p[k]=v.trim(); u2++; } } } }
fs.writeFileSync(seedFile, JSON.stringify(seed, null, 2), 'utf8');
fs.writeFileSync(publicFile, JSON.stringify(pub, null, 2), 'utf8');
console.log('fields',Object.keys(fieldMap),'seedUpdated',u1,'publicUpdated',u2,'backups',b1,b2);
