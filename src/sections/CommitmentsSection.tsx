// ============================================================================
// CommitmentsSection.tsx — Premium CSR Commitments Grid
// ============================================================================

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Leaf, Heart, GraduationCap, ArrowUpRight } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);

export default function CommitmentsSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const pillars = [
    { icon: Leaf, title: t('commitments.envTitle'), desc: t('commitments.envDesc'), stat: t('commitments.envStat'), statLabel: t('commitments.envStatLabel'), color: 'hsl(160,84%,39%)', bg: 'hsl(160,84%,39% / 0.05)' },
    { icon: Heart, title: t('commitments.healthTitle'), desc: t('commitments.healthDesc'), stat: t('commitments.healthStat'), statLabel: t('commitments.healthStatLabel'), color: 'hsl(340,70%,50%)', bg: 'hsl(340,70%,50% / 0.05)' },
    { icon: GraduationCap, title: t('commitments.eduTitle'), desc: t('commitments.eduDesc'), stat: t('commitments.eduStat'), statLabel: t('commitments.eduStatLabel'), color: 'hsl(213,94%,45%)', bg: 'hsl(213,94%,45% / 0.05)' },
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(header.querySelectorAll('.h-reveal'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' } });

      gsap.fromTo(cards.querySelectorAll('.pillar-card'), { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: cards, start: 'top 80%', toggleActions: 'play none none reverse' } });
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section 
      ref={sectionRef} 
      id="commitments" 
      className="section-premium bg-white dark:bg-[#0a0f1c]"
    >
      <div className="container mx-auto px-6 lg:px-16">
        
        {/* Section Header */}
        <div ref={headerRef} className="max-w-3xl mb-20">
          <span className="h-reveal section-label">{t('commitments.label')}</span>
          <h2 
            className="h-reveal text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('commitments.title')}
          </h2>
          <p className="h-reveal text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            {t('commitments.subtitle')}
          </p>
        </div>

        {/* Pillars Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            
            return (
              <div 
                key={idx} 
                className="pillar-card group p-8 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-[380px]"
              >
                <div>
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: p.bg, color: p.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 
                    className="text-xl font-bold text-slate-900 dark:text-white mb-3"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {p.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800/50">
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {p.stat}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                      {p.statLabel}
                    </div>
                  </div>
                  <div 
                    className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors"
                    style={{ color: p.color }}
                  >
                    <ArrowUpRight size={14} />
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
