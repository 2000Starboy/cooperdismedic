// ============================================================================
// AboutSection.tsx — Premium Horizontal Chronological Timeline
// ============================================================================

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Calendar, History } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const timeline = [
    { year: t('about.year1'), text: t('about.year1Text') },
    { year: t('about.year2'), text: t('about.year2Text') },
    { year: t('about.year3'), text: t('about.year3Text') },
    { year: t('about.year4'), text: t('about.year4Text') },
  ];

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const tlEl    = timelineRef.current;
    if (!section || !content || !tlEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content.querySelectorAll('.reveal'),
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        tlEl.querySelectorAll('.tl-step'),
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: tlEl, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section-premium bg-slate-50/50 dark:bg-[#0a0f1c]"
    >
      <div className="container mx-auto px-6 lg:px-16">
        
        {/* Editorial Content Grid */}
        <div ref={contentRef} className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start mb-20">
          <div className="lg:col-span-5">
            <span className="reveal section-label">{t('about.label')}</span>
            <h2
              className="reveal text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('about.title')}
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-6 pt-4 lg:pt-8 text-slate-600 dark:text-slate-300">
            <p className="reveal text-lg leading-relaxed font-medium">
              {t('about.p1')}
            </p>
            <p className="reveal text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t('about.p2')}
            </p>
          </div>
        </div>

        {/* Horizontal Timeline Roadmap */}
        <div ref={timelineRef} className="relative mt-12">
          
          {/* Connecting line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {timeline.map((item, idx) => (
              <div key={idx} className="tl-step relative space-y-4">
                
                {/* Year Marker dot */}
                <div className="flex md:flex-col items-center md:items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0B1120] border-2 border-blue-500 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                    <Calendar size={18} />
                  </div>
                  <span
                    className="text-2xl font-black text-slate-900 dark:text-white"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {item.year}
                  </span>
                </div>

                {/* Content description */}
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 pl-16 md:pl-0">
                  {item.text}
                </p>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
