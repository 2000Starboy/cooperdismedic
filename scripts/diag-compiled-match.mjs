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

const targetNames = ['OMÉPRAZOLE 20MG','PARACÉTAMOL 500MG','METFORMINE 850MG','SERINGUE 5ML','MASQUE CHIRURGICAL','INSULINE RAPIDE']
for(const n of targetNames){
  const seedEntry = seed.find(p => normalize(p.name) === normalize(n) || normalize(p.name) === normalize(n.replace(/é/g,'e')))
  const foundByExact = catalogue.find(p => p.name === n)
  const foundByNorm = catalogue.find(p => normalize(p.name) === normalize(n))
  const foundByDci = catalogue.find(p => normalize(p.dci) === normalize(seedEntry?.dci || ''))
  console.log('---')
  console.log('target', n)
  console.log('seed name exact?', seedEntry ? seedEntry.name : 'none')
  console.log('catalog exact name', foundByExact ? foundByExact.name : 'none')
  console.log('catalog norm name', foundByNorm ? foundByNorm.name : 'none')
  console.log('catalog dci match', foundByDci ? `${foundByDci.name} (${foundByDci.dci})` : 'none')
}
console.log('catalogue count', catalogue.length)
console.log('seed count', seed.length)
