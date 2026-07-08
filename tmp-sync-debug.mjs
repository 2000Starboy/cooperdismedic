import { syncProducts } from './scripts/sync-products.mjs';
const result = await syncProducts();
console.log(JSON.stringify(result, null, 2));
