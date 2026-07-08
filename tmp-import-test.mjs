import { importProductFromUrl } from './scripts/import-product-from-url.mjs';
const urls = [
  'https://www.cure.ma/medicaments/parantal-c-1000-comprime-effervescent',
  'https://www.cure.ma/medicaments/ibuprofene-400-mg/comprime',
  'https://www.cure.ma/medicaments/amoxil-500-mg-comprime-dispersible'
];
for (const url of urls) {
  try {
    const result = await importProductFromUrl({ url, existingProducts: [] });
    console.log(url);
    console.log('  imported:', result.imported);
    console.log('  reason:', result.reason || 'ok');
    if (result.product) console.log('  product:', { id: result.product.id, name: result.product.name, dci: result.product.dci, laboratory: result.product.laboratory, form: result.product.form, dosage: result.product.dosage });
  } catch (e) {
    console.error(url, 'ERROR', e);
  }
}
