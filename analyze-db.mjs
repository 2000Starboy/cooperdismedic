/**
 * Analyze the products database to understand available data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.resolve(__dirname, 'public/api/products.json');

let products = [];
if (fs.existsSync(publicPath)) {
  products = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
} else {
  console.error('Products file not found');
  process.exit(1);
}

console.log(`\n${'='.repeat(80)}`);
console.log('PRODUCT DATABASE ANALYSIS');
console.log(`${'='.repeat(80)}\n`);

console.log(`Total products: ${products.length}`);

// Count by source
const bySource = {};
products.forEach(p => {
  const source = p.description?.includes('cure.ma') ? 'cure.ma' : 
                 p.description?.includes('catalogue local') ? 'local' : 'other';
  bySource[source] = (bySource[source] || 0) + 1;
});

console.log('\nProducts by source:');
Object.entries(bySource).forEach(([source, count]) => {
  console.log(`  ${source}: ${count}`);
});

// Check DCI distribution
const dciCounts = {};
products.forEach(p => {
  const dci = String(p.dci || '').toLowerCase().trim();
  if (dci && dci !== 'à préciser' && dci !== 'a preciser') {
    dciCounts[dci] = (dciCounts[dci] || 0) + 1;
  }
});

console.log('\nDCI with multiple products (potential matches):');
Object.entries(dciCounts)
  .filter(([_, count]) => count > 1)
  .sort((a, b) => b[1] - a[1])
  .forEach(([dci, count]) => {
    const prods = products.filter(p => String(p.dci || '').toLowerCase().trim() === dci);
    console.log(`  ${dci}: ${count} products`);
    prods.forEach(p => console.log(`    - ${p.name}`));
  });

console.log('\n\nAll products by category:');
const categories = {};
products.forEach(p => {
  const cats = (p.categories || ['unknown']).join(',');
  categories[cats] = (categories[cats] || 0) + 1;
});

Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cats, count]) => {
    console.log(`  [${cats}]: ${count}`);
  });

console.log('\n\nAll DCI values:');
products
  .map(p => p.dci)
  .filter(Boolean)
  .sort()
  .forEach(dci => console.log(`  - ${dci}`));
