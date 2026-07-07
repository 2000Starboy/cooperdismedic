// ============================================================================
// Navigation.tsx — Premium Corporate Portal Navigation
// Clean, professional, institutional navbar (Roche / Merck style)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Menu, X, ArrowRight, Globe, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTranslation, localeNames, localeFlags, type Locale } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

const NAV_SECTIONS = [
  { key: 'home',     href: '#hero' },
  { key: 'about',    href: '#about' },
  { key: 'services', href: '#services' },
  { key: 'team',     href: '#team' },
  { key: 'products', href: '#products' },
  { key: 'contact',  href: '#contact' },
] as const;

interface NavigationProps {
  darkBackground?: boolean;
}

export default function Navigation({ darkBackground = false }: NavigationProps) {
  const { t, locale, setLocale, dir } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const [isScrolled,    setIsScrolled]    = useState(false);
  const [isMobileOpen,  setIsMobileOpen]  = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isLangOpen,    setIsLangOpen]    = useState(false);

  // ── Scroll & section tracking ─────────────────────────────────────
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 40);
          const ids = NAV_SECTIONS.map((s) => s.href.replace('#', ''));
          for (const id of [...ids].reverse()) {
            const el = document.getElementById(id);
            if (el && el.getBoundingClientRect().top <= 120) {
              setActiveSection((prev) => prev !== id ? id : prev);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    setTimeout(onScroll, 100);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setIsMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMobileOpen(false);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsLangOpen(false);
  };

  const isDark = theme === 'dark' || darkBackground;

  // Compute nav background based on scroll
  const navBg: React.CSSProperties = isScrolled
    ? {
        background: isDark ? 'rgba(11, 17, 32, 0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
      }
    : { background: 'transparent' };

  const linkColor     = isDark ? '#94A3B8' : '#64748B';
  const activeLinkColor = 'hsl(213,94%,45%)';
  const headingColor  = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <>
      {/* ── Main Nav Bar ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 inset-x-0 z-[1000] transition-all duration-500"
        style={navBg}
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <a
              href="#hero"
              onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }}
              className="relative z-10 flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="Cooper Dismedic"
                className="h-9 w-auto"
                draggable={false}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = 'flex';
                }}
              />
              <span
                className="hidden items-center gap-2 font-bold text-lg"
                style={{ fontFamily: 'Outfit, sans-serif', color: headingColor, display: 'none' }}
              >
                Cooper Dismedic
              </span>
            </a>

            {/* Desktop Links */}
            <div className="hidden lg:flex items-center gap-8">
              {NAV_SECTIONS.map(({ key, href }) => {
                const id = href.replace('#', '');
                const isActive = activeSection === id;
                return (
                  <a
                    key={key}
                    href={href}
                    onClick={(e) => { e.preventDefault(); scrollTo(href); }}
                    className="text-[13px] font-semibold transition-colors duration-200 relative pb-0.5"
                    style={{
                      color: isActive ? activeLinkColor : linkColor,
                    }}
                  >
                    {t(`nav.${key}`)}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        style={{ background: activeLinkColor }}
                      />
                    )}
                  </a>
                );
              })}
            </div>

            {/* Right Controls */}
            <div className="hidden lg:flex items-center gap-3">

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ color: headingColor, borderColor: isDark ? '#334155' : '#E2E8F0' }}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark'
                  ? <Sun  size={15} />
                  : <Moon size={15} />
                }
              </button>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-lg border transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  style={{ color: linkColor, borderColor: isDark ? '#334155' : '#E2E8F0' }}
                >
                  <Globe size={13} style={{ color: activeLinkColor }} />
                  <span>{localeFlags[locale]}</span>
                  <ChevronDown size={11} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangOpen && (
                  <div
                    className="absolute end-0 top-full mt-2 w-44 rounded-xl shadow-xl border overflow-hidden bg-white dark:bg-slate-900"
                    style={{ borderColor: isDark ? '#334155' : '#E2E8F0', boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                  >
                    {(Object.keys(localeNames) as Locale[]).map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleLocaleChange(loc)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                        style={{
                          color: locale === loc ? activeLinkColor : (isDark ? '#94A3B8' : '#475569'),
                          fontWeight: locale === loc ? 600 : 400,
                          borderBottom: isDark ? '1px solid #1E293B' : '1px solid #F1F5F9',
                        }}
                      >
                        <span className="text-base">{localeFlags[loc]}</span>
                        <span>{localeNames[loc]}</span>
                        {locale === loc && (
                          <span className="ms-auto w-1.5 h-1.5 rounded-full" style={{ background: activeLinkColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA button */}
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollTo('#contact'); }}
                className="btn-primary group text-[12px] font-bold px-5 py-2.5"
              >
                <span>{t('nav.pharmacistPortal')}</span>
                <ArrowRight size={12} className={`transition-transform group-hover:${dir === 'rtl' ? '-translate-x-1' : 'translate-x-1'}`} />
              </a>
            </div>

            {/* Mobile: hamburger */}
            <div className="lg:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ color: headingColor }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                className="relative z-10 p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ color: headingColor }}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle menu"
              >
                {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ─────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[999] lg:hidden transition-all duration-400 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-white dark:bg-[#0B1120]"
          onClick={() => setIsMobileOpen(false)}
        />

        <div className={`relative h-full flex flex-col pt-24 pb-8 px-8 transition-transform duration-400 ${isMobileOpen ? 'translate-y-0' : '-translate-y-8'}`}>

          {/* Links */}
          <div className="flex-1 flex flex-col gap-0 mb-8">
            {NAV_SECTIONS.map(({ key, href }, i) => (
              <a
                key={key}
                href={href}
                onClick={(e) => { e.preventDefault(); scrollTo(href); }}
                className="flex items-center justify-between text-2xl font-light py-5 border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                style={{ fontFamily: 'Outfit, sans-serif', transitionDelay: `${i * 30}ms` }}
              >
                {t(`nav.${key}`)}
                <ArrowRight size={16} style={{ opacity: 0.3 }} />
              </a>
            ))}
          </div>

          {/* Language Bar */}
          <div className="flex gap-2 mb-6">
            {(Object.keys(localeNames) as Locale[]).map((loc) => (
              <button
                key={loc}
                onClick={() => { handleLocaleChange(loc); setIsMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all"
                style={{
                  background: locale === loc ? 'hsl(213,94%,45% / 0.08)' : 'transparent',
                  color: locale === loc ? activeLinkColor : (isDark ? '#94A3B8' : '#64748B'),
                  borderColor: locale === loc ? 'hsl(213,94%,45% / 0.3)' : (isDark ? '#334155' : '#E2E8F0'),
                }}
              >
                <span>{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
              </button>
            ))}
          </div>

          <a
            href="#contact"
            onClick={(e) => { e.preventDefault(); scrollTo('#contact'); setIsMobileOpen(false); }}
            className="btn-primary w-full justify-center py-4"
          >
            {t('nav.pharmacistPortal')}
            <ArrowRight size={16} />
          </a>

          <span className="mt-8 text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} Cooper Dismedic
          </span>
        </div>
      </div>

      {/* Click-away for lang dropdown */}
      {isLangOpen && <div className="fixed inset-0 z-[998]" onClick={() => setIsLangOpen(false)} />}
    </>
  );
}
