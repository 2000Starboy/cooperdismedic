import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Globe, ArrowRight } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);


export default function InternationalSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const destinations = [
    { key: 'dest_maroc', flag: '🇲🇦', cities: 3 },
    { key: 'dest_france', flag: '🇫🇷', cities: 3 },
    { key: 'dest_belgique', flag: '🇧🇪', cities: 2 },
    { key: 'dest_suisse', flag: '🇨🇭', cities: 2 },
    { key: 'dest_tunisie', flag: '🇹🇳', cities: 2 },
    { key: 'dest_senegal', flag: '🇸🇳', cities: 1 },
  ];


  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(content.querySelectorAll('.i-reveal'), { y: 45, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' } });
    }, section);
    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section ref={sectionRef} id="international" className="relative py-28 lg:py-36 overflow-hidden" style={{ background: 'hsl(var(--cd-bg))' }}>
      <div className="relative z-10 container mx-auto px-6 lg:px-16">
        <div ref={contentRef}>
          <span className="i-reveal section-label mb-5 block">{t('international.label')}</span>
          <h2 className="i-reveal text-4xl md:text-5xl font-bold leading-[1.05] mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--cd-heading))' }}>{t('international.title')}</h2>
          <p className="i-reveal text-lg leading-relaxed mb-10 max-w-2xl" style={{ color: 'hsl(var(--cd-body))' }}>{t('international.subtitle')}</p>

          <div className="i-reveal flex gap-8 mb-12">
            {[{ val: '30+', label: t('international.countriesStat') }, { val: '50+', label: t('international.partnersStat') }, { val: '5M', label: t('international.unitsStat') }].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'hsl(var(--cd-accent))' }}>{s.val}</div>
                <div className="text-sm" style={{ color: 'hsl(var(--cd-body))' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <h3 className="i-reveal text-lg font-semibold mb-4" style={{ color: 'hsl(var(--cd-heading))' }}>{t('international.destinations')}</h3>
          <div className="i-reveal grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
            {destinations.map((d) => (
              <div key={d.key} className="flex items-center gap-2.5 p-3 rounded-xl hover:shadow-md transition-all cursor-pointer" style={{ background: 'hsl(var(--cd-card))' }}>
                <span className="text-2xl">{d.flag}</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'hsl(var(--cd-heading))' }}>{t(`international.${d.key}`)}</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--cd-body))' }}>{d.cities} {t('international.cities')}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="i-reveal group flex items-center justify-center gap-2 px-8 py-3.5 text-white text-[15px] font-semibold rounded-full transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, hsl(var(--cd-accent)) 0%, hsl(var(--cd-accent-2)) 100%)', boxShadow: '0 6px 20px hsl(var(--cd-accent) / 0.3)' }}>
            {t('international.cta')}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
