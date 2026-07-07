// ============================================================================
// FeaturesSection.tsx — Premium 3-Column Highlights Strip
// ============================================================================

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Award, TrendingUp } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);

export default function FeaturesSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);

  const stats = [
    { icon: Award, val: t('features.f1Stat'), unit: t('features.f1Unit'), label: t('features.f1Title'), desc: t('features.f1Desc'), color: 'text-[hsl(var(--cd-accent))]' },
    { icon: TrendingUp, val: t('features.f2Stat'), unit: t('features.f2Unit'), label: t('features.f2Title'), desc: t('features.f2Desc'), color: 'text-emerald-600 dark:text-emerald-400' },
    { icon: ShieldCheck, val: t('features.f3Stat'), unit: t('features.f3Unit'), label: t('features.f3Title'), desc: t('features.f3Desc'), color: 'text-indigo-600 dark:text-indigo-400' },
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelectorAll('.stat-col'),
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="section-premium bg-slate-50/50 dark:bg-[#0B1120]/50"
    >
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            
            return (
              <div 
                key={idx} 
                className="stat-col space-y-4 md:border-r border-slate-200 dark:border-slate-800/50 last:border-0 pr-4"
              >
                {/* Visual Icon */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800/50 shadow-sm text-slate-700 dark:text-slate-300">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                    {item.label}
                  </span>
                </div>

                {/* Big numbers */}
                <div 
                  className={`text-5xl font-black ${item.color}`}
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {item.val}
                  <span className="text-2xl font-bold">{item.unit}</span>
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
