import { PRODUCTS as fallbackProducts, type Product } from '@/data/products-catalogue';

export async function loadProductsFromApi(): Promise<Product[]> {
  const endpoints = ['/api/products', '/api/products.json'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) continue;
      const data = await response.json();
      if (Array.isArray(data)) return data as Product[];
    } catch {
      // Keep trying the next endpoint.
    }
  }

  return fallbackProducts;
}

export async function loadCatalogProducts(): Promise<Product[]> {
  const products = await loadProductsFromApi();
  const seenKeys = new Set(products.map((product) => `${product.name}::${product.dci}`));
  const merged = [
    ...products,
    ...fallbackProducts.filter((product) => !seenKeys.has(`${product.name}::${product.dci}`)),
  ];
  return merged;
}
