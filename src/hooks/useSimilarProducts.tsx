/**
 * Hook React - Utiliser le Similarity Engine
 * 
 * Ce fichier montre comment intégrer le moteur de similarité
 * dans votre application React
 */

import { useMemo } from 'react';
import { Product } from '@/types';

// Simple mock/implementation of similarity logic for React frontend usage
export function findSimilarProducts(product: Product, allProducts: Product[], options: { maxResults?: number } = {}) {
  const maxResults = options.maxResults || 6;
  return allProducts
    .filter((p) => p.id !== product.id && p.categories[0] === product.categories[0])
    .slice(0, maxResults)
    .map((p) => ({
      id: p.id,
      score: 1,
      breakdown: { dci: 0, dosage: 0, form: 0, atc: 1, laboratory: 0 }
    }));
}

/**
 * Hook pour trouver les produits similaires
 */
export function useSimilarProducts(product: Product | null, allProducts: Product[], maxResults = 6) {
  return useMemo(() => {
    if (!product || !allProducts) return [];
    
    const similar = findSimilarProducts(product, allProducts, {
      maxResults,
    });

    // Map to full products with scores
    return similar.map(item => {
      const fullProduct = allProducts.find(p => p.id === item.id);
      return {
        ...fullProduct,
        similarityScore: item.score,
        scoreBreakdown: item.breakdown,
      };
    });
  }, [product?.id, allProducts?.length]);
}
