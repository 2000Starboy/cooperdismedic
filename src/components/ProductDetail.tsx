// ============================================================================
// ProductDetail.tsx — Premium Clinical Portal (Product Detail Page)
// ============================================================================

import { useEffect, useState } from 'react';
import { ArrowLeft, Check, AlertCircle, Info, Milestone, FlaskConical, Layers, ChevronRight, Activity, CalendarDays } from 'lucide-react';
import { Product } from '@/types';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import { getRelatedProducts } from '@/data/products-catalogue';
import { loadProductsFromApi } from '@/lib/products-data';

interface ProductDetailProps {
  product: Product;
  onBack?: () => void;
  onProductClick?: (product: Product) => void;
}

type TabKey = 'indications' | 'posology' | 'contraindications' | 'sideEffects' | 'conservation';

export default function ProductDetail({ product, onBack, onProductClick }: ProductDetailProps) {
  const { t, locale } = useTranslation();
  const isRTL = useIsRTL();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([product]);
  const [activeTab, setActiveTab] = useState<TabKey>('indications');

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

  const relatedProducts = getRelatedProducts(product, 3, catalogProducts);

  // Recommendations based on season (e.g. spring recommendations)
  const springProducts = catalogProducts
    .filter((p) => p.id !== product.id && (p.categories.includes('baby' as any) || p.categories.includes('respiratory' as any)))
    .slice(0, 3);

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'indications', label: 'Indications', icon: Activity },
    { key: 'posology', label: 'Posologie', icon: Info },
    { key: 'contraindications', label: 'Contre-indications', icon: AlertCircle },
    { key: 'sideEffects', label: 'Effets Indésirables', icon: AlertCircle },
    { key: 'conservation', label: 'Conservation', icon: CalendarDays },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'indications': return product.indications;
      case 'posology': return product.posology;
      case 'contraindications': return product.contraindications;
      case 'sideEffects': return product.sideEffects;
      case 'conservation': return product.conservation;
      default: return '';
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'hsl(var(--cd-bg))' }}>
      
      {/* ── IMMERSIVE HERO HEADER ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-slate-900 text-white border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_40%)]" />
        
        <div className="container mx-auto px-6 lg:px-16 pt-32 pb-16 relative z-10">
          
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-8 group uppercase tracking-wider"
            >
              <ArrowLeft size={14} className={`transition-transform duration-300 group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
              Retour au catalogue
            </button>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            {/* Left Header info */}
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {product.categories[0]}
                </span>
                
                {product.isPrescriptionRequired ? (
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Sur ordonnance
                  </span>
                ) : (
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    En vente libre
                  </span>
                )}

                <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-800 text-slate-350 border border-slate-700">
                  Grossesse : {product.pregnancyCategory}
                </span>

                {product.ppm && (
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-600 text-white">
                    {product.ppm.toLocaleString(locale)} MAD
                  </span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3 text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {product.name}
              </h1>
              <p className="text-lg font-semibold text-slate-400">
                {product.dci}
              </p>
            </div>

            {/* Right Header specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 lg:w-[480px]">
              <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <Milestone size={16} />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Laboratoire</div>
                <div className="text-xs font-bold truncate text-slate-200">{product.laboratory}</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <FlaskConical size={16} />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Forme</div>
                <div className="text-xs font-bold truncate text-slate-200">{product.form}</div>
              </div>

              <div className="p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3">
                  <Layers size={16} />
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-0.5">Dosage</div>
                <div className="text-xs font-bold truncate text-slate-200">{product.dosage}</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT GRID ─────────────────────────────────────── */}
      <div className="container mx-auto px-6 lg:px-16 mt-12">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: DESCRIPTION + TABS */}
          <div className="lg:col-span-8 space-y-8">
            {/* Description Card */}
            <div className="p-8 rounded-[24px] border bg-white dark:bg-slate-900 shadow-sm" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Présentation générale</h2>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-350">
                {product.description}
              </p>
            </div>

            {/* Interactive Tabs Card */}
            <div className="p-2 sm:p-8 rounded-[24px] border bg-white dark:bg-slate-900 shadow-sm" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              {/* Tab Selector Header */}
              <div className="flex border-b overflow-x-auto hide-scrollbar border-slate-200 dark:border-slate-800 mb-6">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 py-4 px-5 text-xs font-bold border-b-2 whitespace-nowrap transition-all duration-300 ${
                        isActive 
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      <IconComponent size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Content Panel */}
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-200">
                  {(() => {
                    const CurrentIcon = tabs.find((t) => t.key === activeTab)?.icon || Activity;
                    return <CurrentIcon size={18} className="text-blue-600" />;
                  })()}
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {tabs.find((t) => t.key === activeTab)?.label}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-650 dark:text-slate-300">
                  {getTabContent() || 'Non applicable ou non mentionné.'}
                </p>
              </div>

              {/* Extra Notice Info Badge */}
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 text-xs text-slate-500 dark:text-slate-400">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  Les informations ci-dessus sont tirées du Répertoire Clinique et de la notice officielle (RCP) du produit. Pour tout usage thérapeutique, veuillez consulter un professionnel de santé.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Classe Thérapeutique Card */}
            <div className="p-6 rounded-[24px] border bg-white dark:bg-slate-900 shadow-sm" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Classe Thérapeutique</div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {product.therapeuticClass}
              </h3>
            </div>

            {/* Produits Similaires */}
            {relatedProducts.length > 0 && (
              <div className="p-6 rounded-[24px] border bg-white dark:bg-slate-900 shadow-sm" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-5" style={{ fontFamily: 'Outfit, sans-serif' }}>Produits similaires</h3>
                
                <div className="space-y-3">
                  {relatedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onProductClick?.(p)}
                      className="w-full text-left p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-blue-500/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-300 flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400 truncate mb-0.5">{p.dci}</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">{p.name}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations Printemps */}
            {springProducts.length > 0 && (
              <div className="p-6 rounded-[24px] border bg-gradient-to-b from-emerald-500/[0.03] to-blue-500/[0.03] dark:from-emerald-500/[0.01] dark:to-transparent border-emerald-500/10 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/5 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/10">Recommandations Saisonnières</span>
                </div>
                
                <div className="space-y-3">
                  {springProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onProductClick?.(p)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 flex items-center justify-between group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.laboratory}</div>
                      </div>
                      <ChevronRight size={14} className="text-slate-400 transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
