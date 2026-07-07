// ============================================================================
// ProductsPage.tsx — Premium Corporate Portal (Full Catalogue Page)
// ============================================================================

import { useState, useMemo } from 'react';
import { Search, Pill, Activity, ShieldPlus, ArrowRight, ArrowLeft, Eye, Bone, Stethoscope, Droplet, HeartPulse, Package } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import { PRODUCTS } from '@/data/products-catalogue';
import { Product } from '@/types';

const categoryIcons: Record<string, React.ElementType> = {
  Cardiologie: HeartPulse,
  Neurologie: Activity,
  Gastroentérologie: Pill,
  Infectiologie: ShieldPlus,
  Dermatologie: Droplet,
  Ophtalmologie: Eye,
  Rhumatologie: Bone,
  Pneumologie: Stethoscope,
};

const categoryColors: Record<string, { bg: string, color: string }> = {
  Cardiologie: { bg: 'hsl(340,70%,50% / 0.08)', color: 'hsl(340,70%,50%)' },
  Neurologie: { bg: 'hsl(250,70%,55% / 0.08)', color: 'hsl(250,70%,55%)' },
  Gastroentérologie: { bg: 'hsl(45,90%,48% / 0.08)', color: 'hsl(45,90%,45%)' },
  Infectiologie: { bg: 'hsl(160,84%,39% / 0.08)', color: 'hsl(160,84%,39%)' },
  Dermatologie: { bg: 'hsl(190,80%,40% / 0.08)', color: 'hsl(190,80%,40%)' },
  Ophtalmologie: { bg: 'hsl(213,94%,40% / 0.08)', color: 'hsl(213,94%,40%)' },
  Rhumatologie: { bg: 'hsl(24,80%,50% / 0.08)', color: 'hsl(24,80%,50%)' },
  Pneumologie: { bg: 'hsl(280,60%,55% / 0.08)', color: 'hsl(280,60%,55%)' },
};

interface ProductsPageProps {
  onProductClick?: (product: Product) => void;
  onBack?: () => void;
}

export default function ProductsPage({ onProductClick, onBack }: ProductsPageProps) {
  const { t, locale } = useTranslation();
  const isRTL = useIsRTL();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = new Set(PRODUCTS.flatMap(p => p.categories));
    return ['all', ...Array.from(cats)].sort();
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS
      .filter(p => activeCategory === 'all' || p.categories.includes(activeCategory as any))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--cd-bg))' }}>
      
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 lg:px-16 pt-28 pb-12">
          
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
              Retour à l'accueil
            </button>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="section-label">{t('products.label')}</span>
              <h1
                className="text-4xl md:text-5xl font-extrabold leading-tight mt-3 mb-4 text-slate-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Catalogue Produits
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Explorez notre gamme complète de médicaments et dispositifs médicaux.
                Sélectionnez une spécialité pour affiner votre recherche ou consultez-en voir la fiche complète.
              </p>
            </div>

            {/* Search bar */}
            <div className="relative w-full lg:w-80 shrink-0">
              <input
                type="text"
                placeholder={t('products.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3 ps-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 transition-all"
                style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
              />
              <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Category Filter Bar ─────────────────────────────── */}
      <div
        className="sticky top-[72px] z-40 bg-white border-b border-slate-200"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex items-center gap-6 py-3 overflow-x-auto hide-scrollbar">

            {/* Result count */}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 hidden md:block">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
            </span>

            <div className="w-px h-5 bg-slate-200 shrink-0 hidden md:block" />

            {/* Category pills */}
            <div className="flex gap-2">
              {categories.map(cat => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200"
                    style={{
                      background: isActive ? 'hsl(213,94%,45%)' : 'transparent',
                      color: isActive ? '#fff' : '#64748B',
                      boxShadow: isActive ? '0 2px 8px hsl(213,94%,45% / 0.25)' : 'none',
                    }}
                  >
                    {cat === 'all' ? 'Tous' : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Grid ───────────────────────────────────────────── */}
      <div className="container mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const primaryCat = product.categories[0];
            const Icon = categoryIcons[primaryCat] || Pill;
            const catColor = categoryColors[primaryCat] || { bg: 'hsl(213,94%,45% / 0.08)', color: 'hsl(213,94%,45%)' };

            return (
              <div
                key={product.id}
                onClick={() => onProductClick?.(product)}
                className="group p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Top row: Icon + stock badge */}
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ background: catColor.bg, color: catColor.color }}
                    >
                      <Icon size={18} />
                    </div>
                    {product.isPrescriptionRequired ? (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ background: 'hsl(160,84%,95%)', color: 'hsl(160,84%,39%)' }}
                      >
                        Prescription Req.
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-500"
                      >
                        Libre
                      </span>
                    )}
                  </div>

                  {/* Category label */}
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block"
                    style={{ color: catColor.color }}
                  >
                    {primaryCat}
                  </span>

                  {/* Product name */}
                  <h3
                    className="font-bold text-base text-slate-900 leading-tight mb-2"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs line-clamp-2 text-slate-500 mb-6 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Bottom: Price + action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {product.ppm ? `${product.ppm.toLocaleString(locale)} MAD` : 'Sur devis'}
                  </span>
                  <div className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5 group-hover:underline">
                    Détails
                    <ArrowRight size={11} className={`transition-transform group-hover:${isRTL ? '-translate-x-0.5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-28">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-6">
              <Package size={28} />
            </div>
            <h3
              className="text-xl font-bold text-slate-900 mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Aucun produit trouvé
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Essayez d'autres mots-clés ou modifiez vos filtres de spécialité.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="btn-ghost"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
