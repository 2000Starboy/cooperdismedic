// ============================================================================
// MaintenancePage.tsx — Premium Light Theme B2B Portal
// ============================================================================

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cd_auth') === 'true';
};

interface MaintenancePageProps {
  onAuthenticated?: () => void;
}

export default function MaintenancePage({ onAuthenticated }: MaintenancePageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === 'dismedic@2026') {
        localStorage.setItem('cd_auth', 'true');
        onAuthenticated?.();
      } else {
        setError('Mot de passe incorrect. Veuillez réessayer.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden font-sans bg-slate-50">
      
      {/* ── Soft Light Background ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Soft abstract blobs */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-50/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* ── Top Header (Logo Top Left) ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-start z-20 pointer-events-none">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2.5 relative pointer-events-auto">
          <img src="/logo.png" alt="Cooper Dismedic" className="w-full h-full object-contain relative z-10" />
        </div>
      </div>

      {/* ── Main Content Container ────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto px-6 py-12 pt-24 md:pt-12">
        
        {!showLogin ? (
          // View 1: Portal Entry
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center text-center">
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Portail Professionnel <br/>Cooper Dismedic
            </h1>
            
            <p className="text-slate-500 text-base md:text-lg leading-relaxed mb-6 max-w-md">
              Bienvenue sur notre plateforme exclusive. L'accès à ce portail est strictement réservé aux professionnels de la santé et à nos collaborateurs.
            </p>

            <p className="text-sm text-slate-500 mb-12">
              Besoin d'aide ? Contactez <a href="mailto:support@cooperdismedic.com" className="text-blue-500 hover:text-blue-600 transition-colors underline underline-offset-4 font-medium">support@cooperdismedic.com</a>
            </p>

            {/* Separator */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-12" />

            <p className="text-sm text-slate-500 mb-4 font-medium">
              Vous disposez d'un accès ?
            </p>
            
            <button 
              onClick={() => setShowLogin(true)}
              className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 hover:border-blue-500 hover:shadow-md transition-all duration-300 w-full sm:w-auto shadow-sm"
            >
              <ShieldCheck size={18} className="text-blue-500" />
              <span className="font-bold">S'authentifier</span>
              <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        ) : (
          // View 2: Login Form
          <div className="w-full bg-white border border-slate-100 p-8 md:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500 relative">
            
            <button 
              onClick={() => { setShowLogin(false); setError(''); setPassword(''); }}
              className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center mb-8 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            >
              <ArrowLeft size={16} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Connexion Sécurisée
            </h2>
            <p className="text-sm text-slate-500 mb-8">Réseau interne Cooper Dismedic</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Mot de passe employé
                </label>
                <div className="relative">
                  <input 
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !password}
                className="relative w-full h-14 rounded-xl flex items-center justify-center font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Accéder au portail"
                )}
              </button>
              
            </form>
          </div>
        )}

      </div>

      {/* ── Minimal Legal Footer ─────────────────────────────────────────── */}
      <div className="relative z-10 w-full flex justify-center px-6 pb-8 pt-4">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-xs text-slate-400 font-medium text-center">
          <span>&copy; {new Date().getFullYear()} Cooper Dismedic. Tous droits réservés.</span>
          <span className="hidden md:inline-block w-1 h-1 rounded-full bg-slate-200" />
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>

    </div>
  );
}
