// ============================================================================
// BackToTop.tsx — Luminous Medical Prestige
// ============================================================================

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 end-6 lg:bottom-10 lg:end-10 z-[90] w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
      style={{
        background: 'linear-gradient(135deg, hsl(213,94%,40%), hsl(160,84%,39%))',
        color: 'white',
        boxShadow: '0 8px 24px hsl(213,94%,40% / 0.3)',
      }}
    >
      <ArrowUp size={20} className="transition-transform group-hover:-translate-y-1" />
    </button>
  );
}
