// ============================================================================
// TeamSection.tsx — Premium Board Profile Grid (Corporate Portal)
// ============================================================================

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mail, Phone, Briefcase } from 'lucide-react';
import { useTranslation, useIsRTL } from '@/lib/i18n';
import siteData from '@/data/site-data.json';

gsap.registerPlugin(ScrollTrigger);

const AVATAR_COLORS = [
  { bg: 'hsl(213,94%,45% / 0.08)', color: 'hsl(213,94%,45%)' },
  { bg: 'hsl(160,84%,39% / 0.08)', color: 'hsl(160,84%,39%)' },
  { bg: 'hsl(250,70%,55% / 0.08)', color: 'hsl(250,70%,55%)' },
];

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function TeamSection() {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;
    if (!section || !header || !grid) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(header.querySelectorAll('.t-reveal'), { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' } });

      gsap.fromTo(grid.querySelectorAll('.member-card'), { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out',
          scrollTrigger: { trigger: grid, start: 'top 80%', toggleActions: 'play none none reverse' } });
    }, section);

    return () => ctx.revert();
  }, [isRTL]);

  return (
    <section
      ref={sectionRef}
      id="team"
      className="section-premium bg-slate-50/50 dark:bg-[#0B1120]/50"
    >
      <div className="container mx-auto px-6 lg:px-16">
        
        {/* Section Header */}
        <div ref={headerRef} className="max-w-3xl mb-20">
          <span className="t-reveal section-label">{t('team.label')}</span>
          <h2 
            className="t-reveal text-4xl lg:text-5xl font-extrabold leading-tight text-slate-900 dark:text-white mt-2"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {t('team.title')}
          </h2>
          <p className="t-reveal text-lg text-slate-600 dark:text-slate-400 mt-4 leading-relaxed">
            {t('team.subtitle')}
          </p>
        </div>

        {/* Board Members Grid */}
        <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {siteData.team.map((member, idx) => {
            const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            
            return (
              <div
                key={member.id}
                className="member-card group p-6 rounded-2xl border border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Top row: Avatar & Initials */}
                  <div className="flex items-center gap-4 mb-6">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm shrink-0"
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-sm border border-slate-200 dark:border-slate-800 shrink-0"
                        style={{ background: avatarStyle.bg, color: avatarStyle.color, fontFamily: 'Outfit, sans-serif' }}
                      >
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div>
                      <h3 
                        className="font-bold text-base text-slate-900 dark:text-white leading-tight"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {member.name}
                      </h3>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  {/* Service indicator */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 mb-4">
                    <Briefcase size={12} className="text-slate-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{member.service}</span>
                  </div>

                  {/* Optional short description */}
                  {member.description && (
                    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 mb-6">
                      {member.description}
                    </p>
                  )}
                </div>

                {/* Direct Action Shortcuts */}
                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-auto">
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      <Mail size={12} />
                      Email
                    </a>
                  )}
                  {member.phone && (
                    <a
                      href={`tel:${member.phone.replace(/\s/g, '')}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      <Phone size={12} />
                      Appel
                    </a>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">
          {t('team.directoryDesc')}
        </p>

      </div>
    </section>
  );
}
