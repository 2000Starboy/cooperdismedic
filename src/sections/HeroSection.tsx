// ============================================================================
// HeroSection.tsx — Premium Split Hero Layout (Luminous Corporate)
// ============================================================================

import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ArrowRight, Search, Activity, HelpCircle } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

export default function HeroSection() {
  const { t, dir } = useTranslation();
  const isRTL = useIsRTL();
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToServices = () => {
    document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.hero-reveal'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
      );
    }, el);
    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center bg-white dark:bg-[#0B1120] border-b border-slate-200 dark:border-slate-800/50 overflow-hidden"
    >
      {/* Dynamic Network / Waves abstract background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <circle cx="80%" cy="40%" r="300" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse-soft" />
        <circle cx="80%" cy="40%" r="500" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-pulse-soft" />
      </svg>

      <div className="container mx-auto px-6 lg:px-16 py-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="hero-reveal">
              <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[hsl(var(--cd-accent))] bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                <Activity size={14} className="animate-pulse" />
                Groupe Cooper Pharma
              </span>
            </div>

            <h1
              className="hero-reveal text-5xl sm:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tight text-slate-900 dark:text-white"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('hero.headline1')}
              <br />
              <span className="gradient-text">{t('hero.headline2')}</span>
            </h1>

            <p className="hero-reveal text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="hero-reveal flex flex-wrap gap-4 pt-4">
              <button onClick={scrollToServices} className="btn-primary group text-sm font-bold px-8 py-4">
                {t('hero.cta1')}
                <ArrowRight size={16} className={`transition-transform group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
              </button>
              <button onClick={scrollToContact} className="btn-secondary text-sm font-bold px-8 py-4">
                {t('hero.cta2')}
              </button>
            </div>
          </div>

          {/* Right Column: High-End abstract logistics dashboard illustration */}
          <div className="lg:col-span-5 hidden lg:block hero-reveal">
            <div className="relative p-8 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 shadow-sm overflow-hidden">
              
              {/* Circular light gradient */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800/50">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut Logistique</span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Réseau Opérationnel
                </span>
              </div>

              {/* Stats blocks */}
              <div className="space-y-6">
                {[
                  { label: "Livraison Nationale", val: "24h / 48h", color: "text-[hsl(var(--cd-accent))]" },
                  { label: "Conformité Règlementaire", val: "100% Certifié BPF", color: "text-emerald-600 dark:text-emerald-500" },
                  { label: "Spécialités Import / Export", val: "+300 Références", color: "text-slate-800 dark:text-slate-200" }
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{s.label}</span>
                    <span className={`text-base font-bold ${s.color}`} style={{ fontFamily: 'Outfit, sans-serif' }}>{s.val}</span>
                  </div>
                ))}
              </div>

              {/* Visual network nodes drawing */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Casablanca HQ</span>
                <span className="h-px bg-slate-200 dark:bg-slate-700/50 flex-grow mx-4" />
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> +24 Pays</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
