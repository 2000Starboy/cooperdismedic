import fs from 'fs'
import {fileURLToPath} from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const seedPath = path.join(__dirname, '..', 'src', 'data', 'market-products.seed.json')
const outPath = path.join(__dirname, '..', 'tmp', 'gaps-export.csv')

function isPlaceholder(v){
  if(v === undefined || v === null) return true
  if(typeof v!=='string') return false
  return v.trim() === 'À compléter' || v.trim() === 'À compléter.'
}

let data
try{
  data = JSON.parse(fs.readFileSync(seedPath, 'utf8'))
}catch(e){
  console.error('Failed reading seed file:', seedPath)
  throw e
}

const rows = []
rows.push(['id','name','field','value','ppm','sourceUrl'].join(','))

for(const p of data){
  const fields = ['indications','posology','contraindications','sideEffects','conservation']
  for(const f of fields){
    if(isPlaceholder(p[f])){
      const safeVal = (p[f]||'').replace(/"/g,'""')
      const safeName = (p.name||'').replace(/"/g,'""')
      const url = p.url || ''
      const ppm = p.ppm || ''
      rows.push([p.id, `"${safeName}"`, f, `"${safeVal}"`, ppm, `"${url.replace(/"/g,'""')}"`].join(','))
    }
  }
}

fs.mkdirSync(path.dirname(outPath), {recursive:true})
fs.writeFileSync(outPath, rows.join('\n'))
console.log('Exported gaps CSV to', outPath)
