import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProductDataFromHtml, buildImportedProduct, importProductFromUrl } from './import-product-from-url.mjs';
import { extractProductUrlsFromSitemapXml } from './discover-products.mjs';

test('extracts product data from JSON-LD schema', () => {
  const html = `
    <html>
      <head>
        <title>Produit marocain</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Doliprane 1000mg",
            "brand": { "name": "Sanofi" },
            "category": "Médicaments",
            "description": "Produit disponible au Maroc"
          }
        </script>
      </head>
      <body>
        <h1>Doliprane 1000mg</h1>
        <p>DCI : Paracétamol</p>
        <p>Laboratoire : Sanofi Maroc</p>
        <p>Forme : Comprimé</p>
        <p>Dosage : 1000 mg</p>
      </body>
    </html>
  `;

  const result = extractProductDataFromHtml(html, 'https://example.com/produit');
  assert.equal(result.name, 'Doliprane 1000mg');
  assert.equal(result.dci, 'Paracétamol');
  assert.equal(result.laboratory, 'Sanofi Maroc');
  assert.equal(result.form, 'Comprimé');
  assert.equal(result.dosage, '1000 mg');
});

test('buildImportedProduct creates a normalized product entry', () => {
  const product = buildImportedProduct({
    name: 'Amoxicilline 500mg',
    dci: 'Amoxicilline',
    laboratory: 'Cooper Pharma',
    form: 'Capsule',
    dosage: '500 mg',
    sourceUrl: 'https://www.example.ma/medicament/amoxicilline',
    existingIds: [10],
  });

  assert.equal(product.id, 11);
  assert.equal(product.name, 'AMOXICILLINE 500MG');
  assert.equal(product.dci, 'Amoxicilline');
  assert.equal(product.laboratory, 'Cooper Pharma');
  assert.equal(product.categories[0], 'antibiotic');
});

test('extracts product URLs from sitemap XML', () => {
  const xml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://www.cure.ma/sitemap.xml</loc>
      </sitemap>
    </sitemapindex>
  `;

  const result = extractProductUrlsFromSitemapXml(xml);
  assert.deepEqual(result, ['https://www.cure.ma/sitemap.xml']);
});

test('ignores article URLs from the marocain site when extracting product URLs', () => {
  const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://www.cure.ma/actualites/en-2050-lantibioresistance-fera-un-mort-toutes-les-3-secondes/</loc></url>
      <url><loc>https://www.cure.ma/medicaments/paracetamol-1000mg/</loc></url>
    </urlset>
  `;

  const result = extractProductUrlsFromSitemapXml(xml);
  assert.deepEqual(result, ['https://www.cure.ma/medicaments/paracetamol-1000mg/']);
});

test('treats 404-like pages as invalid without throwing', async () => {
  const originalFetch = global.fetch;

  global.fetch = async () => ({
    ok: false,
    status: 404,
    text: async () => '<html><head><title>404 Not Found</title></head><body>Page introuvable</body></html>',
  });

  try {
    const result = await importProductFromUrl({
      url: 'https://example.com/missing',
      existingProducts: [],
    });

    assert.equal(result.imported, false);
    assert.equal(result.reason, 'invalid-page');
  } finally {
    global.fetch = originalFetch;
  }
});
