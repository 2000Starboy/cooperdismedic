// ============================================================================
// ContactSection.tsx — Premium Split Contact & Map Layout
// ============================================================================

import { useRef, useState, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, MapPin, Phone, Send, Info, Globe, HelpCircle } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';

gsap.registerPlugin(ScrollTrigger);

export default function ContactSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');
    setTimeout(() => setFormState('success'), 1500);
  };

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const map = mapRef.current;
    if (!section || !content || !map) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.fromTo(
        content.querySelectorAll('.c-reveal'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      ).fromTo(
        map,
        { scale: 0.98, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
      );
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  const contactInfos = [
    { icon: MapPin, title: 'Siège Social', content: 'Lotissement Bachkou, Polo, Casablanca', color: 'hsl(213,94%,45%)', bg: 'hsl(213,94%,45% / 0.08)' },
    { icon: Phone, title: 'Téléphone', content: '+212 5 22 81 90 20', color: 'hsl(160,84%,39%)', bg: 'hsl(160,84%,39% / 0.08)' },
    { icon: Mail, title: 'Email', content: 'contact@cooperdismedic.ma', color: 'hsl(250,70%,55%)', bg: 'hsl(250,70%,55% / 0.08)' },
  ];

  return (
    <section 
      ref={sectionRef} 
      id="contact" 
      className="section-premium bg-slate-50/50 dark:bg-[#0a0f1c]"
    >
      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Form & Info */}
          <div ref={contentRef} className="lg:col-span-7 space-y-8">
            <div className="c-reveal">
              <span className="section-label">{t('contact.label')}</span>
              <h2 
                className="text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {t('contact.title')}
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
                {t('contact.subtitle')}
              </p>
            </div>

            {/* Info Cards Grid */}
            <div className="c-reveal grid sm:grid-cols-3 gap-4">
              {contactInfos.map((info, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col justify-between h-[130px]"
                >
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: info.bg, color: info.color }}
                  >
                    <info.icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      {info.title}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight block">
                      {info.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Message form */}
            <form onSubmit={handleSubmit} className="c-reveal p-8 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col gap-5">
              <h3 
                className="text-lg font-bold text-slate-900 dark:text-white"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Envoyez-nous un message d'information
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nom complet</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-950 transition-all text-slate-900 dark:text-white" 
                    style={{ borderColor: 'hsl(var(--cd-card-border))' }} 
                    placeholder="Dr. Ahmed..." 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full px-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-950 transition-all text-slate-900 dark:text-white" 
                    style={{ borderColor: 'hsl(var(--cd-card-border))' }} 
                    placeholder="ahmed@email.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Sujet</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-950 transition-all text-slate-900 dark:text-white" 
                  style={{ borderColor: 'hsl(var(--cd-card-border))' }}
                >
                  <option>Demande d'information produit</option>
                  <option>Partenariat distribution</option>
                  <option>Support pharmacien</option>
                  <option>Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Message</label>
                <textarea 
                  required 
                  rows={4} 
                  className="w-full px-4 py-2.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-950 transition-all resize-none text-slate-900 dark:text-white" 
                  style={{ borderColor: 'hsl(var(--cd-card-border))' }} 
                  placeholder="Votre requête..." 
                />
              </div>

              <button 
                type="submit" 
                disabled={formState === 'loading' || formState === 'success'} 
                className="btn-primary w-full py-3.5 text-xs font-bold"
              >
                {formState === 'idle' && <><Send size={14} /> {t('contact.send')}</>}
                {formState === 'loading' && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {formState === 'success' && 'Message Envoyé !'}
              </button>
            </form>
          </div>

          {/* Right Column: OSM Map */}
          <div ref={mapRef} className="lg:col-span-5 h-[400px] lg:h-[600px] w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden relative shadow-sm group">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=-7.6354%2C33.5454%2C-7.6154%2C33.5654&layer=mapnik&marker=33.5554%2C-7.6254"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(0.4) contrast(1.1) brightness(1.05)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cooper Dismedic Map"
              className="absolute inset-0 w-full h-full transition-all duration-500 group-hover:filter-none"
            />
            <div className="absolute top-6 start-6 end-6 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Siège Social</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">Lotissement Bachkou, Polo, Casablanca, Maroc</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
