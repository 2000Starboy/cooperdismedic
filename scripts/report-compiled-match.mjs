import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const seed = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'market-products.seed.json'), 'utf8'))
const catalogueModule = await import(pathToFileURL(path.join(root, 'tmp', 'products-catalogue.compiled.js')).href)
const catalogue = catalogueModule.PRODUCTS || catalogueModule.default || []
const normalize = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function isPlaceholder(v){
  if(v === undefined || v === null) return true
  const t = String(v).trim().toLowerCase()
  return !t || t === 'à compléter' || t === 'à préciser' || t === 'a preciser' || t === 'n/a'
}

console.log('Compiled catalogue products:', catalogue.length)

const mapped = []
for(const item of catalogue){
  const normName = normalize(item.name)
  const exact = seed.find(p => p.name === item.name)
  const norm = seed.find(p => normalize(p.name) === normName)
  const dci = item.dci ? seed.find(p => normalize(p.dci) === normalize(item.dci)) : null
  mapped.push({
    catalogueName: item.name,
    catalogueDci: item.dci,
    exactId: exact?.id,
    exactName: exact?.name,
    normId: norm?.id,
    normName: norm?.name,
    dciId: dci?.id,
    dciName: dci?.name,
    ppm: item.ppm
  })
}
for(const m of mapped){
  console.log('---')
  console.log('catalogue:', m.catalogueName, m.catalogueDci, 'ppm', m.ppm)
  console.log(' exact seed:', m.exactId ? `${m.exactId} ${m.exactName}` : 'none')
  console.log(' norm seed:', m.normId ? `${m.normId} ${m.normName}` : 'none')
  console.log(' dci seed:', m.dciId ? `${m.dciId} ${m.dciName}` : 'none')
}

const unmatched = []
const fields = ['indications','posology','contraindications','sideEffects','conservation']
for(const p of seed){
  const missing = fields.filter(f => isPlaceholder(p[f]))
  if(missing.length === 0) continue
  const normName = normalize(p.name)
  const match = catalogue.find(item => normalize(item.name) === normName || (item.dci && normalize(item.dci) === normalize(p.dci)) || (item.ppm && p.ppm && Math.abs(Number(item.ppm) - Number(p.ppm)) < 0.1))
  if(!match){
    unmatched.push({id:p.id,name:p.name,missing})
  }
}
console.log('---')
console.log('Seed products with gaps not matched by compiled catalogue:', unmatched.length)
for(const u of unmatched) console.log(u.id, u.name, u.missing.join(', '))
