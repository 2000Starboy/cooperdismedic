// ============================================================================
// MaintenancePage.tsx — Premium Light Theme B2B Portal with Multi-Role Login
// ============================================================================

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, Activity, Lock, User } from 'lucide-react';

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cd_auth') === 'true';
};

export const getLoggedInUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('cd_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

interface MaintenancePageProps {
  onAuthenticated?: () => void;
}

export default function MaintenancePage({ onAuthenticated }: MaintenancePageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Identifiants incorrects');
      }

      const result = await response.json();
      localStorage.setItem('cd_auth', 'true');
      localStorage.setItem('cd_user', JSON.stringify(result.user));
      onAuthenticated?.();
    } catch (err) {
      setError((err as Error).message || 'Identifiant ou mot de passe incorrect');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col md:grid md:grid-cols-12 bg-white font-sans overflow-x-hidden">
      {/* ── Top Header (Logo Top Left) ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-start z-20 pointer-events-none">
        <div className="w-12 h-12 flex items-center justify-center relative pointer-events-auto">
          <img src="/logo.png" alt="Cooper Dismedic" className="w-full h-full object-contain relative z-10" />
        </div>
      </div>
      
      {/* ── LEFT PANEL (Dark Gradient) ────────────────────────────────────── */}
      <div className="hidden md:flex md:col-span-5 flex-col justify-between p-12 bg-gradient-to-br from-[#091E2F] via-[#0b2438] to-[#0a3a40] text-white relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.08),transparent_40%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
        
        {/* Top: Logo & Name */}
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="Cooper Dismedic Logo" className="h-10 w-auto object-contain" />
          <span className="text-xl font-bold tracking-tight text-white font-display">Cooper Dismedic</span>
        </div>

        {/* Center content */}
        <div className="my-auto py-12 relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-500/20 text-[#60a5fa] text-xs font-semibold uppercase tracking-wider mb-8">
            <Activity size={12} className="animate-pulse text-[#38bdf8]" />
            <span className="tracking-wider">Portail Sécurisé</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight text-white mb-6 font-display">
            Espace Privé B2B <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Cooper Dismedic
            </span>
          </h1>
          
          {/* Descriptive Text */}
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed max-w-md">
            Bienvenue sur le répertoire officiel des produits Cooper Dismedic. Veuillez vous connecter avec vos accès pour consulter le catalogue.
          </p>
        </div>

        {/* Bottom Security Badge */}
        <div className="flex items-center gap-2 text-xs text-slate-400 relative z-10">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Connexion sécurisée AES-256</span>
        </div>
      </div>

      {/* ── RIGHT PANEL (Light content & Authentication) ─────────────────── */}
      <div className="flex-1 md:col-span-7 flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-[#fbfcfd] min-h-screen md:min-h-0">
        
        {/* Mobile Header (only visible on small screens) */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <img src="/logo.png" alt="Cooper Dismedic" className="h-8 w-auto object-contain" />
          <span className="text-lg font-bold text-slate-900 font-display">Cooper Dismedic</span>
        </div>

        {/* Center Panel Content */}
        <div className="my-auto w-full flex flex-col justify-center">
          {!showLogin ? (
            // State 1: Access Restricted page
            <div className="w-full max-w-md mx-auto flex flex-col items-center md:items-start text-center md:text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Lock Icon Circle */}
              <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Lock size={24} className="text-blue-600" />
              </div>
              
              {/* Heading */}
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 font-display" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Accès Restreint
              </h2>
              
              {/* Paragraph */}
              <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm">
                Ce portail est réservé aux professionnels. Veuillez vous authentifier pour accéder au catalogue de produits.
              </p>

              {/* Action Card Button */}
              <button
                onClick={() => setShowLogin(true)}
                className="group w-full bg-white border border-slate-100 hover:border-blue-500/50 hover:shadow-md rounded-2xl p-4 transition-all duration-300 flex items-center gap-4 text-left shadow-sm"
              >
                <div className="w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-95 transition-transform duration-300">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 font-display">Connexion Collaborateur</div>
                  <div className="text-xs text-slate-400 mt-0.5">Saisir vos identifiants</div>
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all ml-auto shrink-0" />
              </button>
            </div>
          ) : (
            // State 2: Login form
            <div className="w-full max-w-md mx-auto flex flex-col items-stretch animate-in fade-in zoom-in-95 duration-300">
              {/* Back Button */}
              <button 
                onClick={() => { setShowLogin(false); setError(''); setPassword(''); setUsername(''); }}
                className="self-start w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center mb-6 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>

              {/* Heading */}
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-1 font-display" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Connexion Portail
              </h2>
              <p className="text-sm text-slate-500 mb-8">
                Entrez votre identifiant et votre mot de passe
              </p>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">
                    Identifiant
                  </label>
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-350 shadow-sm"
                    placeholder="Ex: pharmacien ou admin"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-display">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input 
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm"
                      placeholder="••••••••"
                      required
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
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-center gap-2 animate-in fade-in duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading || !username || !password}
                  className="relative w-full h-14 rounded-xl flex items-center justify-center font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100/80 text-xs text-slate-400 font-medium mt-12">
          <span>&copy; {new Date().getFullYear()} Cooper Dismedic. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Mentions légales</a>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
          </div>
        </div>

      </div>

    </div>
  );
}
