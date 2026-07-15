// ============================================================================
// Navigation.tsx — Premium Corporate Portal Navigation
// Clean, professional, institutional navbar (Roche / Merck style)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Menu, X, ArrowRight, Globe, ChevronDown, Sun, Moon, Bell, Check } from 'lucide-react';
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
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [notification,  setNotification]  = useState<{
    syncedAt: string;
    count: number;
    importedCount: number;
    importedProducts: Array<{ id: number; name: string; dci: string; url?: string }>;
  } | null>(null);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [isLoadingSync, setIsLoadingSync] = useState(false);

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

  const unreadProducts = (notification?.importedProducts ?? []).filter(
    (p) => !readIds.includes(p.id)
  );
  const unreadCount = unreadProducts.length;

  const formatSyncDate = useCallback((value: string) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value));
    } catch {
      return value;
    }
  }, [locale]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('cd-notifications-read');
      if (saved) setReadIds(JSON.parse(saved));
    } catch { /* ignore corrupt data */ }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const endpoints = ['/api/products/last-sync', '/api/last-sync.json', '/last-sync.json'];
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, { cache: 'no-store' });
            if (!response.ok) continue;
            const data = await response.json();
            const normalized = {
              syncedAt: String(data.syncedAt ?? ''),
              count: Number(data.count ?? 0),
              importedCount: Number(data.importedCount ?? (Array.isArray(data.importedProducts) ? data.importedProducts.length : 0)),
              importedProducts: Array.isArray(data.importedProducts) ? data.importedProducts : [],
            };
            if (active) setNotification(normalized);
            return;
          } catch {
            // try next endpoint
          }
        }
      } catch {
        // ignore fallback failures
      }
    };
    load();
    // Recharger les notifications toutes les 30 secondes (au lieu de 5 minutes)
    const timer = window.setInterval(load, 30 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  // Fonction pour déclencher la synchronisation avec cure.ma
  const triggerSync = async () => {
    setIsLoadingSync(true);
    try {
      // Déclencher la synchronisation avec cure.ma
      const syncResponse = await fetch('/api/products/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!syncResponse.ok) {
        console.error('Sync failed:', syncResponse.statusText);
      }

      // Attendre un peu puis recharger les notifications
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recharger les notifications mises à jour
      const endpoints = ['/api/products/last-sync', '/api/last-sync.json', '/last-sync.json'];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: 'no-store' });
          if (!response.ok) continue;
          const data = await response.json();
          const normalized = {
            syncedAt: String(data.syncedAt ?? ''),
            count: Number(data.count ?? 0),
            importedCount: Number(data.importedCount ?? (Array.isArray(data.importedProducts) ? data.importedProducts.length : 0)),
            importedProducts: Array.isArray(data.importedProducts) ? data.importedProducts : [],
          };
          setNotification(normalized);
          return;
        } catch {
          // try next endpoint
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsLoadingSync(false);
    }
  };

  const markOneRead = (id: number) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      window.localStorage.setItem('cd-notifications-read', JSON.stringify(next));
      return next;
    });
  };

  const markAllRead = () => {
    if (!notification) return;
    const allIds = notification.importedProducts.map((p) => p.id);
    setReadIds((prev) => {
      const merged = Array.from(new Set([...prev, ...allIds]));
      window.localStorage.setItem('cd-notifications-read', JSON.stringify(merged));
      return merged;
    });
  };

  const toggleNotifications = () => {
    setIsNotifOpen((prev) => !prev);
  };

  const x = (count: number) => (count > 1 ? 's' : '');

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
            <div className="hidden lg:flex items-center gap-3 relative">

              <button
                type="button"
                onClick={triggerSync}
                disabled={isLoadingSync}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: isDark ? '#334155' : '#E2E8F0' }}
                aria-label="Lancer la synchronisation"
              >
                {isLoadingSync ? 'Synchronisation…' : 'Synchroniser'}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  style={{ color: headingColor, borderColor: isDark ? '#334155' : '#E2E8F0' }}
                  aria-label="Notifications"
                >
                  <Bell size={15} />
                  {unreadCount > 0 ? (
                    <span className="absolute top-0 right-0 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border bg-white text-slate-900 shadow-xl dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 z-10">
                    <div className="px-4 py-3 border-b dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold">Dernière synchronisation</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {notification ? formatSyncDate(notification.syncedAt) : 'Chargement...'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={triggerSync}
                          disabled={isLoadingSync}
                          className="px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors whitespace-nowrap disabled:opacity-50"
                          title="Synchroniser avec cure.ma"
                        >
                          {isLoadingSync ? '⟳' : '↻'}
                        </button>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllRead}
                            className="px-2 py-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors whitespace-nowrap"
                          >
                            Tout lire
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      {!notification ? (
                        <div className="text-sm text-slate-500 dark:text-slate-400">Impossible de charger les notifications.</div>
                      ) : notification.importedProducts.length > 0 ? (
                        <>
                          <div className="text-sm font-medium mb-3">
                            {unreadCount > 0
                              ? `${unreadCount} non lu${x(unreadCount)}`
                              : 'Tout est lu'}
                          </div>
                          <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                            {notification.importedProducts.slice(0, 10).map((item) => {
                              const isRead = readIds.includes(item.id);
                              return (
                                <li key={item.id}>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markOneRead(item.id);

                                        const product = {
                                          id: Number(item.id) || -1,
                                          name: item.name || 'Produit',
                                          dci: item.dci || 'À préciser',
                                          laboratory: 'À préciser',
                                          form: 'À préciser',
                                          dosage: 'À préciser',
                                          therapeuticClass: 'Produit importé',
                                          categories: ['digestive'],
                                          description: item.dci || '',
                                          indications: 'À compléter',
                                          posology: 'À compléter',
                                          contraindications: 'À compléter',
                                          sideEffects: 'À compléter',
                                          conservation: 'À compléter',
                                          pregnancyCategory: 'N/A',
                                          isPrescriptionRequired: false,
                                          relatedIds: [],
                                        };

                                        try {
                                          window.dispatchEvent(new CustomEvent('cd:open-product', { detail: { product } }));
                                        } catch (e) {
                                          if (item.url) window.open(item.url, '_blank');
                                        }
                                      }}
                                      className={`w-full text-left rounded-2xl border p-3 transition-colors duration-200 ${
                                        isRead
                                          ? 'border-slate-100 bg-white dark:border-slate-800/50 dark:bg-slate-950 opacity-60'
                                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold truncate">{item.name}</div>
                                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.dci}</div>
                                        </div>
                                        {!isRead && (
                                          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                        )}
                                      </div>
                                    </button>
                                    {!isRead && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markOneRead(item.id);
                                        }}
                                        className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/80 hover:bg-emerald-100 text-slate-500 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-900/40 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
                                        title="Marquer comme lu"
                                      >
                                        <Check size={12} />
                                      </button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                          {notification.importedProducts.length > 10 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                              +{notification.importedProducts.length - 10} autre{notification.importedProducts.length - 10 > 1 ? 's' : ''} non affiché{notification.importedProducts.length - 10 > 1 ? 's' : ''}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400">Aucune nouvelle importation.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
