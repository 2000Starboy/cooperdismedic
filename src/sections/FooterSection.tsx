// ============================================================================
// FooterSection.tsx — Premium Corporate Footer (Deep Navy)
// ============================================================================

import { ArrowRight, MapPin, Phone, Mail, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function FooterSection() {
  const { t, tArray } = useTranslation();

  const navLinks = tArray('footer.navLinks');
  const specialties = tArray('footer.specialties');
  const socials = [Linkedin, Twitter, Facebook, Instagram];

  return (
    <footer
      className="relative pt-20 pb-10 overflow-hidden"
      style={{ background: 'hsl(222,47%,8%)' }}
    >
      {/* Subtle top line accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

      <div className="container mx-auto px-6 lg:px-16 relative z-10">

        {/* Top CTA Band */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-6 pb-16 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <h3
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('footer.ctaTitle')}
            </h3>
            <p className="text-slate-400 text-sm">
              {t('footer.ctaSubtitle')}
            </p>
          </div>
          <a
            href="#contact"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-300 group"
          >
            {t('footer.ctaButton')}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Main Footer Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/logo.png"
                alt="Cooper Dismedic"
                className="h-10 w-auto opacity-90"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span
                className="font-extrabold text-xl text-white"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Cooper Dismedic
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              {t('footer.brandTagline')}
            </p>
            <div className="flex gap-3">
              {socials.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 border transition-all duration-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4
              className="text-white font-extrabold mb-6 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('footer.navTitle')}
            </h4>
            <ul className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight
                      size={11}
                      className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400"
                    />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties Links */}
          <div>
            <h4
              className="text-white font-extrabold mb-6 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('footer.specialtiesTitle')}
            </h4>
            <ul className="flex flex-col gap-4">
              {specialties.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors shrink-0" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4
              className="text-white font-extrabold mb-6 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {t('footer.contactTitle')}
            </h4>
            <ul className="flex flex-col gap-5">
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin size={16} className="shrink-0 text-blue-400 mt-0.5" />
                <span>Lotissement Bachkou, Polo<br />Casablanca, Maroc</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone size={16} className="shrink-0 text-blue-400" />
                <a href="tel:+212522819020" className="hover:text-white transition-colors">
                  +212 5 22 81 90 20
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail size={16} className="shrink-0 text-blue-400" />
                <a href="mailto:contact@cooperdismedic.ma" className="hover:text-white transition-colors">
                  contact@cooperdismedic.ma
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
          <p className="text-slate-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} Cooper Dismedic — {t('footer.allRights').replace('© {year} Cooper Dismedic — ', '')}
          </p>
          <div className="flex items-center gap-6 text-slate-500 text-xs">
            <a href="#" className="hover:text-white transition-colors">{t('footer.legalMentions')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.confidentialite')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('footer.cookies')}</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
