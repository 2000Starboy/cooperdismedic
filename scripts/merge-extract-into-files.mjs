import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const url = process.argv[2];
if(!url){ console.error('Usage: node merge-extract-into-files.mjs <url>'); process.exit(2); }

function runExtractor(url){
  return new Promise((resolve,reject)=>{
    exec(`node scripts/render-extract-cure.mjs "${url}"`, { maxBuffer: 1024*1024*10 }, (err, stdout, stderr)=>{
      if(err){ return reject({err, stderr, stdout}); }
      try{ const obj = JSON.parse(stdout); resolve(obj); }catch(e){ reject({err:e, stdout, stderr}); }
    });
  });
}

function backup(file){
  const dst = file + '.bak.' + Date.now();
  fs.copyFileSync(file, dst);
  return dst;
}

function mergeIntoList(list, url, fieldMap){
  let updated=0;
  for(const p of list){
    const desc = String(p.description||p.sourceUrl||'');
    if(desc.includes(url) || (p.sourceUrl && String(p.sourceUrl).includes(url))){
      for(const k of Object.keys(fieldMap)){
        const val = fieldMap[k];
        if(val && val.trim() && (!p[k] || String(p[k]).trim()==='À compléter')){
          p[k]=val.trim(); updated++;
        }
      }
    }
  }
  return updated;
}

(async ()=>{
  try{
    const out = await runExtractor(url);
    const sections = out.sections||{};
    const fieldMap = {};
    if(sections['Indications']) fieldMap.indications = sections['Indications'];
    if(sections['Posologie']) fieldMap.posology = sections['Posologie'];
    if(sections['Contre‑indications']) fieldMap.contraindications = sections['Contre‑indications'];
    if(sections['Contre-indications']) fieldMap.contraindications = fieldMap.contraindications || sections['Contre-indications'];
    if(sections['Effets indésirables']) fieldMap.sideEffects = sections['Effets indésirables'];
    if(sections['Effets secondaires']) fieldMap.sideEffects = fieldMap.sideEffects || sections['Effets secondaires'];
    if(sections['Conservation']) fieldMap.conservation = sections['Conservation'];

    const seedFile = path.join(process.cwd(),'src','data','market-products.seed.json');
    const publicFile = path.join(process.cwd(),'public','api','products.json');

    const seedRaw = fs.readFileSync(seedFile,'utf8');
    const publicRaw = fs.readFileSync(publicFile,'utf8');
    const seed = JSON.parse(seedRaw);
    const pub = JSON.parse(publicRaw);
    const seedList = Array.isArray(seed)?seed:(Array.isArray(seed.products)?seed.products:[]);
    const pubList = Array.isArray(pub)?pub:(Array.isArray(pub.products)?pub.products:[]);

    const b1 = backup(seedFile);
    const b2 = backup(publicFile);

    const u1 = mergeIntoList(seedList, url, fieldMap);
    const u2 = mergeIntoList(pubList, url, fieldMap);

    fs.writeFileSync(seedFile, JSON.stringify(seed, null, 2), 'utf8');
    fs.writeFileSync(publicFile, JSON.stringify(pub, null, 2), 'utf8');

    console.log('Merged fields:', Object.keys(fieldMap));
    console.log('Seed updated entries:', u1, 'backup:', b1);
    console.log('Public updated entries:', u2, 'backup:', b2);
  }catch(e){ console.error('ERROR', e); process.exitCode=2; }
})();
