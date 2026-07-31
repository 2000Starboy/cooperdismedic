// ============================================================================
// ProductsPage.tsx — Premium Corporate Portal (Full Catalogue Page)
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, Pill, Activity, ShieldPlus, ArrowRight, ArrowLeft, Eye, Bone, 
  Stethoscope, Droplet, HeartPulse, Package, ShieldCheck, ChevronLeft, ChevronRight,
  User, LogOut, X, SlidersHorizontal
} from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import { PRODUCTS as fallbackProducts } from '@/data/products-catalogue';
import { Product } from '@/types';
import { loadCatalogProducts, getCategoryTranslation, categoryStyleMapping } from '@/lib/products-data';
import { getLoggedInUser } from '@/components/MaintenancePage';

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

const categoryColors: Record<string, { bg: string; darkBg: string; color: string }> = {
  Cardiologie: { bg: 'hsl(340,70%,50% / 0.08)', darkBg: 'hsl(340,70%,50% / 0.2)', color: 'hsl(340,80%,55%)' },
  Neurologie: { bg: 'hsl(250,70%,55% / 0.08)', darkBg: 'hsl(250,70%,55% / 0.2)', color: 'hsl(250,80%,65%)' },
  Gastroentérologie: { bg: 'hsl(45,90%,48% / 0.08)', darkBg: 'hsl(45,90%,48% / 0.2)', color: 'hsl(45,90%,48%)' },
  Infectiologie: { bg: 'hsl(160,84%,39% / 0.08)', darkBg: 'hsl(160,84%,39% / 0.2)', color: 'hsl(160,84%,45%)' },
  Dermatologie: { bg: 'hsl(190,80%,40% / 0.08)', darkBg: 'hsl(190,80%,40% / 0.2)', color: 'hsl(190,80%,50%)' },
  Ophtalmologie: { bg: 'hsl(213,94%,40% / 0.08)', darkBg: 'hsl(213,94%,40% / 0.2)', color: 'hsl(213,94%,60%)' },
  Rhumatologie: { bg: 'hsl(24,80%,50% / 0.08)', darkBg: 'hsl(24,80%,50% / 0.2)', color: 'hsl(24,80%,60%)' },
  Pneumologie: { bg: 'hsl(280,60%,55% / 0.08)', darkBg: 'hsl(280,60%,55% / 0.2)', color: 'hsl(280,70%,65%)' },
};

interface ProductsPageProps {
  onProductClick?: (product: Product) => void;
  onBack?: () => void;
  onAdminClick?: () => void;
}

export default function ProductsPage({ onProductClick, onBack, onAdminClick }: ProductsPageProps) {
  const { t, locale } = useTranslation();
  const isRTL = useIsRTL();
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  
  // ── Pagination State ────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(24);

  const currentUser = getLoggedInUser();
  const showAdminButton = currentUser && (currentUser.role === 'admin' || currentUser.role === 'super admin');

  useEffect(() => {
    let cancelled = false;
    loadCatalogProducts().then((data) => {
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
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter(p => activeCategory === 'all' || p.categories.includes(activeCategory as any))
      .filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.dci && p.dci.toLowerCase().includes(q)) ||
        (p.laboratory && p.laboratory.toLowerCase().includes(q))
      );
  }, [activeCategory, searchQuery, products]);

  // Réinitialiser à la page 1 lors d'un changement de filtre ou recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, itemsPerPage]);

  // Calculs de pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const gridEl = document.getElementById('catalogue-grid-top');
      if (gridEl) {
        gridEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Génération intelligente des numéros de pages
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100">
      
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="container mx-auto px-6 lg:px-16 pt-28 pb-12">
          
          <div className="flex items-center justify-between mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                Retour à l'accueil
              </button>
            )}

            <div className="flex items-center gap-3 ms-auto">
              {showAdminButton && onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-white transition-all bg-blue-500/10 hover:bg-blue-600 px-3.5 py-1.5 rounded-xl border border-blue-500/20"
                >
                  <ShieldCheck size={14} />
                  Gérer le catalogue
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className="section-label">{t('products.label')}</span>
              <h1
                className="text-4xl md:text-5xl font-extrabold leading-tight mt-3 mb-4 text-slate-900 dark:text-white"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Catalogue Produits
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
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
                className="w-full px-5 py-3 ps-11 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
              />
              <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Category Filter Bar ─────────────────────────────── */}
      <div
        className="sticky top-[72px] z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex items-center gap-6 py-3 overflow-x-auto hide-scrollbar">

            {/* Result count */}
            <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider shrink-0 hidden md:block">
              {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
            </span>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0 hidden md:block" />

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
                      color: isActive ? '#fff' : undefined,
                      boxShadow: isActive ? '0 2px 8px hsl(213,94%,45% / 0.3)' : 'none',
                    }}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}>
                      {getCategoryTranslation(cat, t)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Anchor for smooth scroll on page change */}
      <div id="catalogue-grid-top" className="scroll-mt-36" />

      {/* ── Product Grid ───────────────────────────────────────────── */}
      <div className="container mx-auto px-6 lg:px-16 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map(product => {
            const primaryCat = product.categories[0];
            const mappedCat = categoryStyleMapping[primaryCat] || primaryCat;
            const Icon = categoryIcons[mappedCat] || Pill;
            const catColor = categoryColors[mappedCat] || { 
              bg: 'hsl(213,94%,45% / 0.08)', 
              darkBg: 'hsl(213,94%,45% / 0.2)',
              color: 'hsl(213,94%,55%)' 
            };

            return (
              <div
                key={product.id}
                onClick={() => onProductClick?.(product)}
                className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between cursor-pointer hover:shadow-xl dark:hover:shadow-black/40 hover:border-blue-500/40 dark:hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1"
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
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                      >
                        Prescription Req.
                      </span>
                    ) : (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"
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
                    {getCategoryTranslation(primaryCat, t)}
                  </span>

                  {/* Product name */}
                  <h3
                    className="font-bold text-base text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {product.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs line-clamp-2 text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Bottom: Price + action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {product.ppm ? `${product.ppm.toLocaleString(locale)} MAD` : 'Sur devis'}
                  </span>
                  <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 group-hover:underline">
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
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-6">
              <Package size={28} />
            </div>
            <h3
              className="text-xl font-bold text-slate-900 dark:text-white mb-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Aucun produit trouvé
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Essayez d'autres mots-clés ou modifiez vos filtres de spécialité.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* ── PAGINATION BAR ────────────────────────────────────────────── */}
        {filteredProducts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Display info + items per page selector */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>
                Affichage <strong className="text-slate-900 dark:text-white">{Math.min(filteredProducts.length, (currentPage - 1) * itemsPerPage + 1)}</strong> à <strong className="text-slate-900 dark:text-white">{Math.min(filteredProducts.length, currentPage * itemsPerPage)}</strong> sur <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> produits
              </span>
              
              <div className="flex items-center gap-2 border-s border-slate-200 dark:border-slate-800 ps-4">
                <SlidersHorizontal size={13} className="text-slate-400" />
                <span>Par page :</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={14} />
                  <span>Préc.</span>
                </button>

                {/* Number Buttons */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((pg, idx) => 
                    pg === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-400 select-none text-xs font-bold">
                        …
                      </span>
                    ) : (
                      <button
                        key={pg}
                        onClick={() => handlePageChange(pg as number)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 ${
                          currentPage === pg
                            ? 'bg-blue-600 text-white border border-blue-600 shadow-md shadow-blue-500/20 scale-105'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pg}
                      </button>
                    )
                  )}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Page suivante"
                >
                  <span>Suiv.</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
