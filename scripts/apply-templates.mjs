import fs from 'fs'
import {fileURLToPath} from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const seedPath = path.join(__dirname, '..', 'src', 'data', 'market-products.seed.json')
const cataloguePath = path.join(__dirname, '..', 'src', 'data', 'products-catalogue.ts')

function isPlaceholder(v){
  if(v === undefined || v === null) return true
  if(typeof v!=='string') return false
  return v.trim() === 'À compléter' || v.trim() === 'À compléter.'
}

function normalizeName(s){
  return String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
}

let seed
try{ seed = JSON.parse(fs.readFileSync(seedPath,'utf8')) }catch(e){ console.error('Failed reading seed:', e); process.exit(1) }

// import catalogue by dynamic evaluation: require ts file via regex parse for PRODUCTS export
let catalogue = []
try{
  const txt = fs.readFileSync(cataloguePath,'utf8')
  // try regex first
  let m = txt.match(/export const PRODUCTS\s*=\s*(\[[\s\S]*\])/) || txt.match(/export default\s*(\[[\s\S]*\])/) 
  if(m){
    const arrText = m[1]
    const jsText = arrText.replace(/([a-zA-Z0-9_]+)\s*:/g,'"$1":').replace(/\n/g,' ').replace(/,\s*]/g,']')
    try{ catalogue = JSON.parse(jsText) }catch(e){ console.warn('Regex parse found PRODUCTS but JSON.parse failed:', e.message) }
  }

  // fallback: bracket-balanced extraction after PRODUCTS identifier
  if(!catalogue.length){
    const idx = txt.indexOf('PRODUCTS')
    if(idx !== -1){
      const bidx = txt.indexOf('[', idx)
      if(bidx !== -1){
        let i = bidx
        let depth = 0
        for(; i < txt.length; i++){
          if(txt[i] === '[') depth++
          else if(txt[i] === ']'){
            depth--
            if(depth === 0) { break }
          }
        }
        const arrText = txt.slice(bidx, i+1)
        let jsText = arrText.replace(/([a-zA-Z0-9_]+)\s*:/g,'"$1":')
        jsText = jsText.replace(/,\s*]/g,']')
        try{ catalogue = JSON.parse(jsText) }catch(e){ console.warn('Bracket-parse failed to JSON.parse:', e.message) }
      }
    }
  }
  if(!catalogue.length) console.warn('Could not parse catalogue file heuristically; catalogue left empty')
}catch(e){ console.warn('Error reading catalogue file, continuing without it:', e.message) }

// build indexes
const byPpm = new Map()
const byName = new Map()
for(const c of catalogue){
  if(c.ppm) byPpm.set(String(c.ppm), c)
  const n = normalizeName(c.name || c.label || '')
  if(n) byName.set(n, c)
}

let updated = 0
const now = new Date().toISOString().replace(/[:.]/g,'')
const backup = seedPath + '.backup-templates-' + now
fs.writeFileSync(backup, JSON.stringify(seed, null, 2))

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
      // try token intersection
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
    if(wrote) { updated++; }
  }
}

fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2))
console.log('Templates applied. Updated fields count (approx products modified):', updated)
console.log('Backup written at', backup)
