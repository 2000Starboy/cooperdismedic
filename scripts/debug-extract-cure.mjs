import { extractProductDataFromHtml } from './import-product-from-url.mjs';

const url = 'https://cure.ma/medicaments/anor-70-mg-comprime';

(async () => {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr-FR,fr;q=0.9' } });
    const html = await res.text();
    const extracted = extractProductDataFromHtml(html, url);
    console.log(JSON.stringify({
      name: extracted.name,
      dci: extracted.dci,
      indications: extracted.indications,
      posology: extracted.posology,
      contraindications: extracted.contraindications,
      sideEffects: extracted.sideEffects,
      conservation: extracted.conservation
    }, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
