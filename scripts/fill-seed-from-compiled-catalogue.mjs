import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const seedPath = path.join(root, 'src', 'data', 'market-products.seed.json')
const cataloguePath = path.join(root, 'tmp', 'products-catalogue.compiled.js')
const backupPath = seedPath + '.backup-compiled-catalogue-' + new Date().toISOString().replace(/[:.]/g, '')

function normalize(s){
  return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function isPlaceholder(v){
  if(v === undefined || v === null) return true
  const t = String(v).trim().toLowerCase()
  return !t || t === 'à compléter' || t === 'à préciser' || t === 'a preciser' || t === 'n/a'
}

if(!fs.existsSync(cataloguePath)){
  console.error('Compiled catalogue not found:', cataloguePath)
  process.exit(1)
}

const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
const catalogueModule = await import(pathToFileURL(cataloguePath).href)
const catalogue = catalogueModule.PRODUCTS || catalogueModule.default || []
if(!Array.isArray(catalogue) || catalogue.length === 0){
  console.error('No products loaded from compiled catalogue')
  process.exit(1)
}

const byExactName = new Map()
const byNormName = new Map()
const byNormDci = new Map()
const byPpm = new Map()
for(const item of catalogue){
  if(item.name) byExactName.set(item.name, item)
  if(item.name) byNormName.set(normalize(item.name), item)
  if(item.dci) byNormDci.set(normalize(item.dci), item)
  if(item.ppm) byPpm.set(String(item.ppm), item)
}

const fields = ['indications','posology','contraindications','sideEffects','conservation']
let changes = 0
const details = []

fs.writeFileSync(backupPath, JSON.stringify(seed, null, 2))

for(const p of seed){
  const missing = fields.filter(f => isPlaceholder(p[f]))
  if(missing.length === 0) continue

  const normName = normalize(p.name)
  const normDci = normalize(p.dci)
  const ppmKey = p.ppm ? String(p.ppm) : null

  let candidate = byExactName.get(p.name)
  if(!candidate) candidate = byNormName.get(normName)
  if(!candidate && normDci) candidate = byNormDci.get(normDci)
  if(!candidate && ppmKey) candidate = byPpm.get(ppmKey)

  if(!candidate){
    // token overlap fallback
    const tokens = new Set(normName.split(' ').filter(Boolean))
    for(const [n,c] of byNormName){
      const kt = new Set(n.split(' ').filter(Boolean))
      let inter = 0
      for(const t of tokens) if(kt.has(t)) inter++
      if(inter >= 2){ candidate = c; break }
    }
  }

  if(candidate){
    let filled = []
    for(const f of missing){
      if(candidate[f] && !isPlaceholder(candidate[f])){
        p[f] = candidate[f]
        filled.push(f)
      }
    }
    if(filled.length){
      changes++
      details.push({id:p.id,name:p.name,source:candidate.name,filled})
    }
  }
}

if(changes > 0){
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2))
}

console.log('Compiled catalogue products:', catalogue.length)
console.log('Seed products updated:', changes)
for(const d of details){
  console.log(`- ${d.id} ${d.name} <- ${d.source} (${d.filled.join(', ')})`)
}
console.log('Backup saved at', backupPath)
