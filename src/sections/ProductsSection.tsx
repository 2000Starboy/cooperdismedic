// ============================================================================
// ProductsSection.tsx — Premium Medical Catalogue (Clinical Portal)
// ============================================================================

import { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Pill, Activity, ShieldPlus, ArrowRight, Search, Stethoscope, Droplet, Eye, Bone, HeartPulse, Filter } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import { PRODUCTS as fallbackProducts } from '@/data/products-catalogue';
import ProductModal from '@/components/ProductModal';
import { Product } from '@/data/products-catalogue';
import { loadProductsFromApi } from '@/lib/products-data';

const categoryIcons: Record<string, React.ElementType> = {
  cardiovascular: HeartPulse,
  analgesic: Activity,
  digestive: Pill,
  antibiotic: ShieldPlus,
  dermatology: Droplet,
  respiratory: Stethoscope,
};

const categoryColors: Record<string, { bg: string, color: string }> = {
  cardiovascular: { bg: 'hsl(340,70%,50% / 0.08)', color: 'hsl(340,70%,50%)' },
  analgesic: { bg: 'hsl(250,70%,55% / 0.08)', color: 'hsl(250,70%,55%)' },
  digestive: { bg: 'hsl(45,90%,45% / 0.08)', color: 'hsl(45,90%,45%)' },
  antibiotic: { bg: 'hsl(160,84%,39% / 0.08)', color: 'hsl(160,84%,39%)' },
  dermatology: { bg: 'hsl(190,80%,40% / 0.08)', color: 'hsl(190,80%,40%)' },
  respiratory: { bg: 'hsl(280,60%,55% / 0.08)', color: 'hsl(280,60%,55%)' },
};

interface ProductsSectionProps {
  onProductClick: (product: Product) => void;
  onViewAll: () => void;
}

export default function ProductsSection({ onProductClick, onViewAll }: ProductsSectionProps) {
  const { t, locale } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    let cancelled = false;
    loadProductsFromApi().then((data) => {
      if (!cancelled) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.flatMap(p => p.categories));
    return ['all', ...Array.from(cats)].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => activeCategory === 'all' || p.categories.includes(activeCategory as any))
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8); // Show top 8 on landing page
  }, [activeCategory, searchQuery, products]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    if (!section || !header) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(header.querySelectorAll('.p-reveal'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' } });
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  // Re-animate catalog items on filter
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        grid.querySelectorAll('.prod-card-premium'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }, grid);
    return () => ctx.revert();
  }, [filteredProducts]);

  return (
    <>
      <section 
        ref={sectionRef} 
        id="products" 
        className="section-premium bg-white dark:bg-[#0B1120]"
      >
        <div className="container mx-auto px-6 lg:px-16">
          
          {/* Section Header */}
          <div ref={headerRef} className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <span className="p-reveal section-label">{t('products.label')}</span>
              <h2 
                className="p-reveal text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t('products.title')}
              </h2>
              <p className="p-reveal text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                {t('products.subtitle')}
              </p>
            </div>
            
            <div className="p-reveal shrink-0">
              <button onClick={onViewAll} className="btn-primary group">
                {t('products.viewAll')}
                <ArrowRight size={16} className={`transition-transform group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Filtering bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-10 pb-6 border-b border-slate-200 dark:border-slate-800/50">
            
            {/* Categories pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveCategory('all')}
                className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300"
                style={{
                  background: activeCategory === 'all' ? 'hsl(213,94%,45%)' : 'hsl(var(--cd-surface-2))',
                  color: activeCategory === 'all' ? 'white' : 'hsl(var(--cd-heading))',
                }}
              >
                {t('common.all')}
              </button>
              {categories.filter(c => c !== 'all').slice(0, 5).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300"
                  style={{
                    background: activeCategory === cat ? 'hsl(213,94%,45%)' : 'hsl(var(--cd-surface-2))',
                    color: activeCategory === cat ? 'white' : 'hsl(var(--cd-heading))',
                  }}
                >
                  {t(`products.${cat}`, cat)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72 shrink-0">
              <input
                type="text"
                placeholder={t('products.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 ps-10 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-900 transition-all"
                style={{ borderColor: 'hsl(var(--cd-card-border))', color: 'hsl(var(--cd-heading))' }}
              />
              <Search size={14} className="absolute start-4 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--cd-body-muted))' }} />
            </div>
          </div>

          {/* Grid display */}
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => {
              const primaryCat = product.categories[0];
              const Icon = categoryIcons[primaryCat] || Pill;
              const catColor = categoryColors[primaryCat] || { bg: 'hsl(213,94%,45% / 0.08)', color: 'hsl(213,94%,45%)' };

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    onProductClick(product);
                  }}
                  className="prod-card-premium group p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: catColor.bg, color: catColor.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: product.isPrescriptionRequired ? 'hsl(160,84%,95%)' : 'hsl(var(--cd-surface-2))', color: product.isPrescriptionRequired ? 'hsl(160,84%,39%)' : 'hsl(var(--cd-body-muted))' }}>
                        {product.isPrescriptionRequired ? t('common.prescriptionRequired') : t('common.otc')}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: catColor.color }}>
                      {primaryCat}
                    </span>
                    <h3 
                      className="font-bold text-base text-slate-900 dark:text-white leading-tight mb-2 truncate"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {product.name}
                    </h3>
                    <p className="text-xs line-clamp-2 text-slate-500 dark:text-slate-400 mb-6">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {product.ppm ? `${product.ppm.toLocaleString(locale)} MAD` : t('common.quoteOnRequest')}
                    </span>
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:underline">
                      <span>{t('common.details')}</span>
                      <ArrowRight size={12} className={`transition-transform group-hover:${isRTL ? '-translate-x-0.5' : 'translate-x-0.5'}`} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-sm text-slate-400">
              {t('common.noProductsFound')}
            </div>
          )}

        </div>
      </section>

      <ProductModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
