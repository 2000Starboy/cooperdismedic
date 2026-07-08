import { importProductFromUrl } from './scripts/import-product-from-url.mjs';
import { promises as fs } from 'node:fs';
const sourceConfig = JSON.parse(await fs.readFile('./src/data/market-products.sources.json', 'utf8'));
const urls = Array.isArray(sourceConfig.sources) ? sourceConfig.sources.slice(0, 10) : [];
for (const url of urls) {
  try {
    const result = await importProductFromUrl({ url, existingProducts: [] });
    console.log(url);
    console.log('  imported:', result.imported);
    console.log('  reason:', result.reason || 'ok');
    if (result.product) console.log('  product:', { id: result.product.id, name: result.product.name, dci: result.product.dci, laboratory: result.product.laboratory, form: result.product.form, dosage: result.product.dosage });
  } catch (e) {
    console.error(url, 'ERROR', e.message || e);
  }
}
