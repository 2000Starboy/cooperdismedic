import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const seed = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'market-products.seed.json'), 'utf8'))
const catalogueModule = await import(pathToFileURL(path.join(root, 'tmp', 'products-catalogue.compiled.js')).href)
const products = catalogueModule.PRODUCTS || catalogueModule.default || []
const normalize = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const remainingIds = [1005,1008,1011,1012,1037,1038,1045,1051,1089,1114,1126,1177,1259,1356]

console.log('catalogue products count', products.length)
for (const id of remainingIds) {
  const p = seed.find((item) => item.id === id)
  if (!p) continue
  const normName = normalize(p.name)
  const normDci = normalize(p.dci)
  const exactName = products.find((x) => x.name === p.name)
  const exactDci = products.find((x) => x.dci === p.dci)
  const fuzzyName = products.find((x) => normalize(x.name) === normName)
  const fuzzyDci = products.find((x) => normalize(x.dci) === normDci)
  const ppmMatch = products.find((x) => x.ppm && p.ppm && Math.abs(Number(x.ppm) - Number(p.ppm)) < 0.1)
  console.log('---')
  console.log('seed id', p.id, 'name', p.name, 'dci', p.dci, 'ppm', p.ppm)
  console.log(' exactName', exactName ? exactName.name : 'none')
  console.log(' exactDci', exactDci ? exactDci.name : 'none')
  console.log(' fuzzyName', fuzzyName ? fuzzyName.name : 'none')
  console.log(' fuzzyDci', fuzzyDci ? fuzzyDci.name : 'none')
  console.log(' ppmMatch', ppmMatch ? ppmMatch.name : 'none')
}
