// ============================================================================
// ProductModal.tsx — Luminous Medical Prestige
// ============================================================================

import { X, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transition-all duration-300 transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        }`}
        style={{ 
          background: 'hsl(var(--cd-bg))',
          border: '1px solid hsl(var(--cd-card-border))'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 end-5 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
          style={{ background: 'hsl(var(--cd-surface))', color: 'hsl(var(--cd-heading))' }}
        >
          <X size={20} />
        </button>

        <div className="p-8 sm:p-10">
          
          {/* Header */}
          <div className="mb-8 pe-12">
            <span 
              className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4"
              style={{ background: 'hsl(213,94%,40% / 0.1)', color: 'hsl(213,94%,40%)' }}
            >
              {product.categories[0]}
            </span>
            <h2 className="text-3xl font-bold leading-tight mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--cd-heading))' }}>
              {product.name}
            </h2>
            <div className="text-sm font-medium" style={{ color: 'hsl(160,84%,39%)' }}>
              {product.laboratory}
            </div>
          </div>

          <div className="w-full h-px mb-8" style={{ background: 'hsl(var(--cd-card-border))' }} />

          {/* Details */}
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'hsl(var(--cd-body-muted))' }}>Description</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--cd-body))' }}>
                {product.description}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} style={{ color: 'hsl(213,94%,40%)' }} className="mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'hsl(var(--cd-body-muted))' }}>Format</div>
                  <div className="text-sm font-medium" style={{ color: 'hsl(var(--cd-heading))' }}>Boîte de 30 comprimés</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} style={{ color: 'hsl(160,84%,39%)' }} className="mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'hsl(var(--cd-body-muted))' }}>Disponibilité</div>
                  <div className="text-sm font-medium" style={{ color: 'hsl(var(--cd-heading))' }}>
                    En stock immédiat
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={18} style={{ color: 'hsl(var(--cd-body-muted))' }} className="mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'hsl(var(--cd-body-muted))' }}>Prescription</div>
                  <div className="text-sm font-medium" style={{ color: 'hsl(var(--cd-heading))' }}>{product.isPrescriptionRequired ? 'Sur ordonnance obligatoire' : 'En vente libre'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl" style={{ background: 'hsl(var(--cd-surface))' }}>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'hsl(var(--cd-body-muted))' }}>Prix public conseillé</div>
              <div className="text-2xl font-bold" style={{ color: 'hsl(var(--cd-heading))' }}>{product.ppm ? `${product.ppm.toLocaleString()} MAD` : 'Sur devis'}</div>
            </div>
            
            <button 
              onClick={() => onExpand?.(product)}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              Fiche détaillée
              <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
