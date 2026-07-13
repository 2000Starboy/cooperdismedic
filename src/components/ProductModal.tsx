// ============================================================================
// ProductModal.tsx — Premium Reimagined Medical Poster (Quick View)
// ============================================================================

import { X, ArrowRight, ShieldCheck, FileText, CheckCircle2, FlaskConical, Milestone, Activity, Sparkles, Layers } from 'lucide-react';
import { Product } from '@/types';
import { useIsRTL, useTranslation } from '@/lib/i18n';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onExpand?: (product: Product) => void;
}

export default function ProductModal({ product, isOpen, onClose, onExpand }: ProductModalProps) {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!mounted || !product) return null;

  const content = (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with a premium blur */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-out bg-slate-950/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card - Styled with premium glow and glassmorphism */}
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.15)] transition-all duration-500 ease-out transform border bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl ${
          isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'
        }`}
        style={{ 
          borderColor: 'hsl(var(--cd-card-border))',
        }}
      >
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 end-6 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-20 border bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700"
          style={{ borderColor: 'hsl(var(--cd-card-border))', color: 'hsl(var(--cd-heading))' }}
        >
          <X size={18} />
        </button>

        {/* Poster Content */}
        <div className="relative z-10 p-8 sm:p-10">
          
          {/* Header Area */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10"
              >
                <Sparkles size={11} />
                {product.categories[0]}
              </span>
              
              {product.isPrescriptionRequired ? (
                <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10">
                  Sur ordonnance
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                  Sans ordonnance
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--cd-heading))' }}>
              {product.name}
            </h2>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {product.dci}
            </div>
          </div>

          {/* Premium Grid: Lab, Form, Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Lab Card */}
            <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm hover:border-blue-500/20 transition-all duration-300 group" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/5 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-300 mb-3 border border-blue-500/10">
                <Milestone size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Laboratoire</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.laboratory}</div>
            </div>

            {/* Form Card */}
            <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm hover:border-emerald-500/20 transition-all duration-300 group" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300 mb-3 border border-emerald-500/10">
                <FlaskConical size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Forme Galénique</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.form}</div>
            </div>

            {/* Dosage Card */}
            <div className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-sm hover:border-violet-500/20 transition-all duration-300 group" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/5 text-violet-600 dark:text-violet-400 group-hover:scale-105 transition-transform duration-300 mb-3 border border-violet-500/10">
                <Layers size={16} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dosage</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{product.dosage}</div>
            </div>
          </div>

          {/* Classe Thérapeutique Card */}
          <div className="p-5 rounded-2xl border mb-6 bg-gradient-to-r from-blue-500/[0.02] to-emerald-500/[0.02]" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Classe Thérapeutique</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{product.therapeuticClass}</div>
          </div>

          {/* Description Section */}
          <div className="mb-6">
            <p className="text-sm leading-relaxed text-slate-650 dark:text-slate-300">
              {product.description}
            </p>
          </div>

          {/* Indications Section */}
          <div className="p-5 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/20" style={{ borderColor: 'hsl(var(--cd-card-border))' }}>
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Indications</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350">
              {product.indications}
            </p>
          </div>

          {/* Separation Divider */}
          <div className="w-full h-px my-8 bg-slate-200 dark:bg-slate-800" />

          {/* Premium Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-0.5">Prix Public Maroc (PPM)</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {product.ppm ? `${product.ppm.toLocaleString()} MAD` : 'Sur devis'}
              </div>
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl text-xs font-bold border transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex-1 sm:flex-none text-slate-600 dark:text-slate-300"
                style={{ borderColor: 'hsl(var(--cd-card-border))' }}
              >
                Fermer
              </button>
              <button 
                onClick={() => onExpand?.(product)}
                className="px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 group flex-1 sm:flex-none"
              >
                Fiche complète
                <ArrowRight size={14} className={`transition-transform duration-300 group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
