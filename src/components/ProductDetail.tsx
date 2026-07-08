// ============================================================================
// ProductDetail.tsx — Premium Corporate Portal (Product Detail Page)
// ============================================================================

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, AlertCircle, FileText, ShoppingCart, Info, Archive } from 'lucide-react';
import { Product } from '@/types';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import { getRelatedProducts } from '@/data/products-catalogue';
import { loadProductsFromApi } from '@/lib/products-data';

interface ProductDetailProps {
  product: Product;
  onBack?: () => void;
  onProductClick?: (product: Product) => void;
}

export default function ProductDetail({ product, onBack, onProductClick }: ProductDetailProps) {
  const { t, locale } = useTranslation();
  const isRTL = useIsRTL();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([product]);

  useEffect(() => {
    let cancelled = false;

    loadProductsFromApi().then((products) => {
      if (!cancelled) {
        const merged = [product, ...products.filter((entry) => entry.id !== product.id)];
        setCatalogProducts(merged);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const relatedProducts = getRelatedProducts(product, 4, catalogProducts);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--cd-bg))' }}>

      {/* Header section */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-16 pt-28 pb-12">
          
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Retour au catalogue
            </button>
          )}

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            
            {/* Visual placeholder */}
            <div className="lg:col-span-5">
              <div 
                className="w-full aspect-square rounded-2xl flex items-center justify-center p-10 relative overflow-hidden border border-slate-200 bg-slate-50"
              >
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, hsl(213,94%,45% / 0.04), transparent 70%)' }} />
                <div className="w-full h-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 opacity-40 border-slate-300">
                  <Archive size={48} className="text-slate-400" />
                  <span className="text-sm font-medium text-slate-400">Image produit (3D/HD)</span>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                  style={{ background: 'hsl(213,94%,45% / 0.08)', color: 'hsl(213,94%,45%)' }}
                >
                  {product.categories[0]}
                </span>
                {product.isPrescriptionRequired ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                    <AlertCircle size={12} /> Sur ordonnance
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                    <Check size={12} /> En vente libre
                  </span>
                )}
              </div>

              <h1
                className="text-4xl lg:text-5xl font-extrabold leading-tight mb-3 text-slate-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {product.name}
              </h1>
              
              <div className="text-base font-semibold text-emerald-600 mb-8">
                Laboratoire : {product.laboratory}
              </div>

              <div
                className="text-3xl font-black text-slate-900 mb-10"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {product.ppm ? `${product.ppm.toLocaleString(locale)} MAD` : 'Sur devis'}
              </div>

              <p className="text-sm leading-relaxed text-slate-600 mb-10 max-w-2xl">
                {product.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
                  <FileText size={18} className="text-blue-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Documentation</div>
                    <a href="#" className="text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors">Notice RCP (PDF)</a>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-4">
                  <Info size={18} className="text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Code ACL / EAN</div>
                    <div className="text-sm font-semibold text-slate-900">3400930000000</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="btn-primary py-4 px-8 flex-1 sm:flex-none justify-center">
                  <ShoppingCart size={18} />
                  Commander (Espace Pro)
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="container mx-auto px-6 lg:px-16 py-16">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">{t('productPage.relatedTitle')}</h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              {t('productPage.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((related) => (
              <button
                key={related.id}
                onClick={() => onProductClick?.(related)}
                className="group w-full text-left rounded-3xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-xl"
              >
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 mb-4">
                  {related.categories[0]}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{related.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{related.laboratory}</p>
                <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-900">
                  <span>{related.ppm ? `${related.ppm.toLocaleString(locale)} MAD` : 'Sur devis'}</span>
                  <span className="text-blue-600 transition-colors group-hover:text-blue-800">Voir</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
