// ============================================================================
// AdminPage.tsx — Panneau d'administration Multi-Rôles Cooper Dismedic
// Premium sidebar layout with role-based navigation
// ============================================================================

import { useState, useMemo, useEffect } from 'react';
import {
  Search, Pill, Plus, ArrowLeft, Edit3, ShieldCheck,
  RefreshCw, AlertCircle, Layers, CheckCircle2,
  Eye, EyeOff, Users, User, Key, Trash2, LogOut,
  LayoutDashboard, ChevronRight, Menu, X
} from 'lucide-react';
import { Product } from '@/types';
import { loadProductsFromApi, getCategoryTranslation } from '@/lib/products-data';
import { getLoggedInUser } from '@/components/MaintenancePage';
import ProductEditModal from '@/components/ProductEditModal';

interface AdminPageProps {
  onBack: () => void;
}

const ITEMS_PER_PAGE = 30;

// ── Role badge config ─────────────────────────────────────────────────────────
const ROLE_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  'super admin': {
    label: 'Super Admin',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.25)',
  },
  admin: {
    label: 'Admin',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.25)',
  },
  pharmacien: {
    label: 'Pharmacien',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.25)',
  },
};

// ── Menu items definition ─────────────────────────────────────────────────────
type Tab = 'products' | 'users';

interface MenuItem {
  id: Tab;
  label: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'products',
    label: 'Médicaments',
    icon: Pill,
    description: 'Gérer le catalogue produits',
  },
  {
    id: 'users',
    label: 'Gestion des comptes',
    icon: Users,
    superAdminOnly: true,
    description: 'Créer, modifier et supprimer des comptes',
  },
];

export default function AdminPage({ onBack }: AdminPageProps) {
  const currentUser = getLoggedInUser();
  const isSuperAdmin = currentUser?.role === 'super admin';
  const roleBadge = ROLE_BADGE[currentUser?.role ?? ''] ?? ROLE_BADGE['pharmacien'];

  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Products state
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus]     = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage]           = useState(1);
  const [isEditOpen, setIsEditOpen]             = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);

  // Users state
  const [users, setUsers]           = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser]       = useState<any | null>(null);
  const [userError, setUserError]   = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'pharmacien',
    fullName: '',
  });

  // ── Data loading ───────────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadProductsFromApi();
      setProducts(data);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isSuperAdmin) return;
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erreur lors du chargement des comptes');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (isSuperAdmin) fetchUsers();
  }, [isSuperAdmin]);

  const handleReload = () => {
    if (activeTab === 'products') fetchProducts();
    else fetchUsers();
  };

  // ── Categories & filters ───────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (Array.isArray(p.categories)) p.categories.forEach((c) => cats.add(c));
    });
    return ['all', ...Array.from(cats)].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products
      .filter((p) => {
        if (selectedStatus === 'active')   return p.active !== false;
        if (selectedStatus === 'inactive') return p.active === false;
        return true;
      })
      .filter((p) => {
        if (selectedCategory === 'all') return true;
        return Array.isArray(p.categories) && p.categories.includes(selectedCategory);
      })
      .filter((p) => {
        if (!q) return true;
        return (
          (p.name            && p.name.toLowerCase().includes(q)) ||
          (p.dci             && p.dci.toLowerCase().includes(q))  ||
          (p.laboratory      && p.laboratory.toLowerCase().includes(q)) ||
          (p.therapeuticClass && p.therapeuticClass.toLowerCase().includes(q))
        );
      });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedStatus]);

  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const stats = useMemo(() => {
    const total    = products.length;
    const active   = products.filter((p) => p.active !== false).length;
    const inactive = total - active;
    const uniqueCats = categories.length - 1;
    return { total, active, inactive, uniqueCats };
  }, [products, categories]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('cd_auth');
    localStorage.removeItem('cd_user');
    window.location.reload();
  };

  // ── Product CRUD ─────────────────────────────────────────────────────────
  const handleSaveProduct = async (productData: Product) => {
    const isNew = productData.id === 0;
    const url    = isNew ? '/api/products' : `/api/products/${productData.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur lors de l\'enregistrement');
    }
    const result = await response.json();
    if (isNew) {
      setProducts((prev) => [result.product, ...prev]);
    } else {
      setProducts((prev) => prev.map((p) => (p.id === productData.id ? result.product : p)));
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    setTogglingProductId(product.id);
    const newActiveState = product.active === false;
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActiveState }),
      });
      if (!response.ok) throw new Error('Impossible de modifier la visibilité');
      const result = await response.json();
      setProducts((prev) => prev.map((p) => (p.id === product.id ? result.product : p)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTogglingProductId(null);
    }
  };

  const openCreateModal = () => { setSelectedProductForEdit(null); setIsEditOpen(true); };
  const openEditModal   = (p: Product) => { setSelectedProductForEdit(p); setIsEditOpen(true); };

  // ── User CRUD ─────────────────────────────────────────────────────────────
  const openAddUserModal = () => {
    setSelectedUser(null);
    setUserForm({ username: '', password: '', role: 'pharmacien', fullName: '' });
    setUserError(null);
    setUserSuccess(false);
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: any) => {
    setSelectedUser(user);
    setUserForm({ username: user.username, password: '', role: user.role, fullName: user.fullName || '' });
    setUserError(null);
    setUserSuccess(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(false);
    const isNew = selectedUser === null;
    const url    = isNew ? '/api/users' : `/api/users/${encodeURIComponent(selectedUser.username)}`;
    const method = isNew ? 'POST' : 'PUT';
    const payload: any = { fullName: userForm.fullName, role: userForm.role };
    if (isNew) { payload.username = userForm.username.trim().toLowerCase(); payload.password = userForm.password; }
    else if (userForm.password) { payload.password = userForm.password; }
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erreur lors de la sauvegarde');
      }
      setUserSuccess(true);
      fetchUsers();
      setTimeout(() => setIsUserModalOpen(false), 1200);
    } catch (err) {
      setUserError((err as Error).message);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`Supprimer définitivement le compte @${username} ?`)) return;
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erreur lors de la suppression');
      }
      setUsers((prev) => prev.filter((u) => u.username !== username));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  // ── Visible menu items ────────────────────────────────────────────────────
  const visibleMenuItems = MENU_ITEMS.filter((item) => !item.superAdminOnly || isSuperAdmin);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════════════════════ */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-300 ease-in-out relative z-30"
        style={{
          width: sidebarOpen ? 260 : 72,
          background: 'linear-gradient(180deg, #0d1829 0%, #0b1323 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top: Logo + Toggle */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4" style={{ minHeight: 72 }}>
          {sidebarOpen && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-7 w-auto object-contain shrink-0" />
              <span className="text-sm font-bold text-white whitespace-nowrap" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Cooper Dismedic
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/08 transition-all"
            title={sidebarOpen ? 'Réduire' : 'Étendre'}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Role section */}
        {sidebarOpen && (
          <div className="px-4 mb-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
              style={{ color: roleBadge.color, background: roleBadge.bg, border: `1px solid ${roleBadge.border}` }}
            >
              <ShieldCheck size={13} />
              {roleBadge.label}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 mb-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Section label */}
        {sidebarOpen && (
          <p className="px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Navigation
          </p>
        )}

        {/* Menu items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className="w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative"
                style={{
                  padding: sidebarOpen ? '10px 12px' : '10px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                  color: isActive ? '#93c5fd' : '#64748b',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <Icon
                  size={18}
                  className="shrink-0 transition-colors"
                  style={{ color: isActive ? '#60a5fa' : '#475569' }}
                />
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[13px] font-semibold leading-tight" style={{ color: isActive ? '#e2e8f0' : '#94a3b8' }}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
                        {item.description}
                      </div>
                    </div>
                    {isActive && <ChevronRight size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />}
                  </>
                )}

                {/* Tooltip when collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Back + User card */}
        <div className="px-3 pb-5 pt-3 space-y-2">
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 10 }} />

          {/* Back to catalogue */}
          <button
            onClick={onBack}
            title={!sidebarOpen ? 'Retour au catalogue' : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/05 transition-all text-[12px] font-semibold relative group"
            style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
          >
            <ArrowLeft size={15} className="shrink-0" />
            {sidebarOpen && <span>Retour au catalogue</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                Retour au catalogue
              </div>
            )}
          </button>

          {/* User card */}
          {currentUser && (
            <div
              className="flex items-center rounded-xl overflow-hidden transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                padding: sidebarOpen ? '10px 12px' : '10px 0',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: sidebarOpen ? 10 : 0,
              }}
            >
              {/* Avatar circle */}
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{ background: roleBadge.bg, color: roleBadge.color, border: `1.5px solid ${roleBadge.border}` }}
              >
                {(currentUser.fullName || currentUser.username).charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-slate-200 truncate">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-500 truncate">@{currentUser.username}</div>
                </div>
              )}
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                  title="Se déconnecter"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

        {/* ── Top sub-header ─────────────────────────────────────────────────── */}
        <header
          className="shrink-0 flex items-center justify-between px-8 border-b"
          style={{
            height: 72,
            background: 'rgba(255,255,255,0.97)',
            borderColor: '#E2E8F0',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <h1 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {activeTab === 'products' ? 'Gestion des Médicaments' : 'Gestion des Comptes Utilisateurs'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === 'products'
                ? `${stats.total} produits au total · ${stats.active} visibles · ${stats.inactive} masqués`
                : `${users.length} compte${users.length !== 1 ? 's' : ''} enregistré${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReload}
              disabled={loading || usersLoading}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all disabled:opacity-40"
              title="Actualiser"
            >
              <RefreshCw size={16} className={(loading || usersLoading) ? 'animate-spin' : ''} />
            </button>

            {activeTab === 'products' ? (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
              >
                <Plus size={16} />
                Ajouter un produit
              </button>
            ) : isSuperAdmin ? (
              <button
                onClick={openAddUserModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,0.30)' }}
              >
                <Plus size={16} />
                Ajouter un compte
              </button>
            ) : null}
          </div>
        </header>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* ── PRODUCTS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Produits', value: stats.total, color: '#3b82f6' },
                  { label: 'Catégories', value: stats.uniqueCats, color: '#8b5cf6' },
                  { label: 'Visibles', value: stats.active, color: '#10b981' },
                  { label: 'Masqués', value: stats.inactive, color: '#94a3b8' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-extrabold" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, DCI, laboratoire…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full md:w-52 px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">Toutes catégories</option>
                  {categories.filter((c) => c !== 'all').map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryTranslation(cat, (k, fallback) => fallback || k)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full md:w-44 px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">Tous les états</option>
                  <option value="active">Visibles uniquement</option>
                  <option value="inactive">Masqués uniquement</option>
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Chargement du catalogue…</span>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
                    <Pill size={44} className="text-slate-300" />
                    <p className="text-base font-semibold">Aucun produit trouvé</p>
                    <p className="text-xs">Ajustez vos filtres ou effectuez une autre recherche.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-5 w-16">ID</th>
                          <th className="py-3.5 px-5">Produit</th>
                          <th className="py-3.5 px-5">DCI / Laboratoire</th>
                          <th className="py-3.5 px-5">Catégorie</th>
                          <th className="py-3.5 px-5 w-28">PPM</th>
                          <th className="py-3.5 px-5 w-24 text-center">État</th>
                          <th className="py-3.5 px-5 w-20 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {pagedProducts.map((p) => {
                          const primaryCat  = p.categories?.[0] || 'N/A';
                          const isInactive  = p.active === false;
                          const isToggling  = togglingProductId === p.id;
                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-blue-50/30 transition-colors ${isInactive ? 'opacity-50' : ''}`}
                            >
                              <td className="py-3.5 px-5 font-mono text-xs text-slate-400">#{p.id}</td>
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{p.form} · {p.dosage}</div>
                              </td>
                              <td className="py-3.5 px-5">
                                <div className="text-slate-700 font-medium truncate max-w-[180px]">{p.dci || '—'}</div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate">{p.laboratory || '—'}</div>
                              </td>
                              <td className="py-3.5 px-5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                                  <Layers size={11} className="text-slate-400" />
                                  {getCategoryTranslation(primaryCat, (k, fallback) => fallback || k)}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 font-semibold text-slate-800">
                                {p.ppm !== undefined ? `${p.ppm.toFixed(2)} MAD` : '—'}
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                {isInactive ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    Masqué
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    Visible
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditModal(p)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                    title="Modifier"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleVisibility(p)}
                                    disabled={isToggling}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      isInactive
                                        ? 'border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                                        : 'border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200'
                                    }`}
                                    title={isInactive ? 'Rendre visible' : 'Masquer'}
                                  >
                                    {isToggling ? (
                                      <div className="w-3.5 h-3.5 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    ) : isInactive ? (
                                      <EyeOff size={14} />
                                    ) : (
                                      <Eye size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!loading && filteredProducts.length > 0 && (
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} sur {filteredProducts.length} produits
                    </span>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Précédent
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-600">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Suivant
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── USERS TAB ──────────────────────────────────────────────────── */}
          {activeTab === 'users' && isSuperAdmin && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* User count card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Total Comptes', value: users.length, color: '#f59e0b' },
                  { label: 'Admins', value: users.filter(u => u.role === 'admin' || u.role === 'super admin').length, color: '#3b82f6' },
                  { label: 'Pharmaciens', value: users.filter(u => u.role === 'pharmacien').length, color: '#10b981' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-extrabold" style={{ color, fontFamily: 'Outfit, sans-serif' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Users table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {usersLoading ? (
                  <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Chargement des comptes…</span>
                  </div>
                ) : users.length === 0 ? (
                  <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
                    <Users size={44} className="text-slate-300" />
                    <p className="text-base font-semibold">Aucun compte trouvé</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-5">Utilisateur</th>
                          <th className="py-3.5 px-5">Identifiant</th>
                          <th className="py-3.5 px-5">Rôle</th>
                          <th className="py-3.5 px-5 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {users.map((u) => {
                          const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE['pharmacien'];
                          const isSelf = u.username === currentUser?.username;
                          return (
                            <tr key={u.username} className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  {/* Avatar */}
                                  <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
                                    style={{ background: badge.bg, color: badge.color, border: `1.5px solid ${badge.border}` }}
                                  >
                                    {(u.fullName || u.username).charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 leading-tight">
                                      {u.fullName || u.username}
                                      {isSelf && <span className="ml-1.5 text-[10px] text-slate-400 font-medium">(vous)</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5 font-mono text-slate-500 text-xs">@{u.username}</td>
                              <td className="py-4 px-5">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                  style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}
                                >
                                  <ShieldCheck size={10} />
                                  {badge.label}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditUserModal(u)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                    title="Modifier"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.username)}
                                    disabled={isSelf}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isSelf ? 'Impossible de supprimer votre propre compte' : 'Supprimer'}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* Product edit/create modal */}
      <ProductEditModal
        product={selectedProductForEdit}
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedProductForEdit(null); }}
        onSave={handleSaveProduct}
      />

      {/* User account modal */}
      {isUserModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsUserModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-7 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.10)' }}>
                <User size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {selectedUser ? 'Modifier le compte' : 'Créer un compte'}
                </h2>
                <p className="text-xs text-slate-400">Accès au portail Cooper Dismedic</p>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="ml-auto p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              {userSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-200">
                  <CheckCircle2 size={16} />
                  Compte enregistré avec succès !
                </div>
              )}
              {userError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
                  <AlertCircle size={16} />
                  {userError}
                </div>
              )}

              {[
                { label: 'Nom Complet', field: 'fullName', type: 'text', placeholder: 'Ex: Dr. Ahmed Benali', required: true },
                { label: 'Identifiant (Username)', field: 'username', type: 'text', placeholder: 'Ex: ahmed26', required: true, disabled: !!selectedUser },
                { label: `Mot de passe${selectedUser ? ' (laisser vide pour ne pas modifier)' : ''}`, field: 'password', type: 'password', placeholder: '••••••••', required: !selectedUser },
              ].map(({ label, field, type, placeholder, required, disabled }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={(userForm as any)[field]}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition disabled:opacity-50"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rôle</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition"
                >
                  <option value="pharmacien">Pharmacien</option>
                  <option value="admin">Admin</option>
                  <option value="super admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl text-white text-sm font-bold transition hover:-translate-y-px"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 12px rgba(245,158,11,0.30)' }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
