import fs from 'fs'
import path from 'path'
import ts from 'typescript'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const catalogueTs = path.join(__dirname, '..', 'src', 'data', 'products-catalogue.ts')
const seedPath = path.join(__dirname, '..', 'src', 'data', 'market-products.seed.json')
const tmpJs = path.join(__dirname, '..', 'tmp', 'products-catalogue.compiled.js')

function isPlaceholder(v){
  if(v === undefined || v === null) return true
  if(typeof v!=='string') return false
  return v.trim() === 'À compléter' || v.trim() === 'À compléter.'
}

function normalizeName(s){
  return String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
}

if(!fs.existsSync(catalogueTs)){
  console.error('Catalogue TS not found at', catalogueTs)
  process.exit(1)
}

const tsText = fs.readFileSync(catalogueTs,'utf8')
// transpile with TypeScript API to plain JS (ES2020)
const transpiled = ts.transpileModule(tsText, {compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020}})
let js = transpiled.outputText
// write temporary JS file exporting PRODUCTS if present
fs.mkdirSync(path.dirname(tmpJs), {recursive:true})
fs.writeFileSync(tmpJs, js)

let catalogue = []
try{
  const mod = await import('file://' + tmpJs.replace(/\\/g,'/'))
  catalogue = mod.PRODUCTS || mod.default || []
}catch(e){
  console.error('Failed importing transpiled catalogue:', e.message)
}

if(!catalogue || !catalogue.length){
  console.error('No catalogue items found after import; aborting')
  process.exit(1)
}

const byPpm = new Map()
const byName = new Map()
for(const c of catalogue){
  if(c.ppm) byPpm.set(String(c.ppm), c)
  const n = normalizeName(c.name || c.label || c.nom || '')
  if(n) byName.set(n, c)
}

let seed
try{ seed = JSON.parse(fs.readFileSync(seedPath,'utf8')) }catch(e){ console.error('Failed reading seed:', e); process.exit(1) }

const backup = seedPath + '.backup-tsimport-' + new Date().toISOString().replace(/[:.]/g,'')
fs.writeFileSync(backup, JSON.stringify(seed, null, 2))

let modified = 0
for(const p of seed){
  const fields = ['indications','posology','contraindications','sideEffects','conservation']
  const needs = fields.some(f => isPlaceholder(p[f]))
  if(!needs) continue
  let candidate = null
  if(p.ppm && byPpm.has(String(p.ppm))) candidate = byPpm.get(String(p.ppm))
  if(!candidate){
    const n = normalizeName(p.name)
    if(byName.has(n)) candidate = byName.get(n)
    else{
      const tokens = new Set(n.split(' '))
      for(const [k,c] of byName){
        const kt = new Set(k.split(' '))
        let inter = 0
        for(const t of tokens) if(kt.has(t)) inter++
        if(inter >= Math.min(2, tokens.size)) { candidate = c; break }
      }
    }
  }
  if(candidate){
    let wrote = false
    for(const f of fields){
      if(isPlaceholder(p[f]) && candidate[f] && !isPlaceholder(candidate[f])){
        p[f] = candidate[f]
        wrote = true
      }
    }
    if(wrote) modified++
  }
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2))
console.log('Catalogue imported; templates reapplied. Products modified:', modified)
console.log('Backup at', backup)
