// ============================================================================
// ServicesSection.tsx — Premium 3x2 Services Grid (Clinical Portal)
// ============================================================================

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Warehouse, Truck, Thermometer, BarChart3, Shield, Clock, ArrowRight } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);

const serviceIcons = [Warehouse, Truck, Thermometer, BarChart3, Shield, Clock];
const iconColors = [
  { color: 'hsl(213,94%,45%)', bg: 'hsl(213,94%,45% / 0.08)' },
  { color: 'hsl(160,84%,39%)', bg: 'hsl(160,84%,39% / 0.08)' },
  { color: 'hsl(250,70%,55%)', bg: 'hsl(250,70%,55% / 0.08)' },
  { color: 'hsl(24,80%,50%)',  bg: 'hsl(24,80%,50% / 0.08)' },
  { color: 'hsl(340,70%,50%)', bg: 'hsl(340,70%,50% / 0.08)' },
  { color: 'hsl(45,90%,45%)',  bg: 'hsl(45,90%,45% / 0.08)' },
];

export default function ServicesSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const services = Array.from({ length: 6 }, (_, i) => ({
    icon: serviceIcons[i],
    title: t(`services.s${i + 1}Title`),
    desc: t(`services.s${i + 1}Desc`),
    colorSet: iconColors[i],
  }));

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    if (!section || !header || !cards) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        header.querySelectorAll('.h-reveal'),
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        cards.querySelectorAll('.svc-card-premium'),
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: cards, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={sectionRef}
      id="services"
      className="section-premium bg-white dark:bg-[#0B1120]"
    >
      <div className="container mx-auto px-6 lg:px-16">
        
        {/* Section Header */}
        <div ref={headerRef} className="max-w-3xl mb-20">
          <span className="h-reveal section-label">{t('services.label')}</span>
          <h2 
            className="h-reveal text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('services.title')}
          </h2>
          <p className="h-reveal text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            {t('services.subtitle')}
          </p>
        </div>

        {/* Services 3x2 Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <div
                key={i}
                className="svc-card-premium group p-8 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Icon Circle wrapper */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: svc.colorSet.bg, color: svc.colorSet.color }}
                  >
                    <Icon size={22} />
                  </div>

                  <h3 
                    className="text-xl font-bold text-slate-900 dark:text-white mb-3"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {svc.title}
                  </h3>
                  
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 mb-6">
                    {svc.desc}
                  </p>
                </div>

                <a 
                  href="#contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold transition-colors group-hover:underline"
                  style={{ color: svc.colorSet.color }}
                >
                  <span>En savoir plus</span>
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </a>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
