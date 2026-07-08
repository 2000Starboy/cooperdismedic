// ============================================================================
// App.tsx — Main Application with Premium Corporate Portal Layout
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { I18nProvider } from '@/lib/i18n';
import SmoothScroll from '@/components/SmoothScroll';
import Navigation from '@/components/Navigation';
import BackToTop from '@/components/BackToTop';
import ProductModal from '@/components/ProductModal';
import ProductDetail from '@/components/ProductDetail';
import ProductsPage from '@/pages/ProductsPage';
import MaintenancePage, { isAuthenticated } from '@/components/MaintenancePage';

import HeroSection from '@/sections/HeroSection';
import AboutSection from '@/sections/AboutSection';
import ServicesSection from '@/sections/ServicesSection';
import CommitmentsSection from '@/sections/CommitmentsSection';
import TeamSection from '@/sections/TeamSection';
import FeaturesSection from '@/sections/FeaturesSection';
import ProductsSection from '@/sections/ProductsSection';
import ContactSection from '@/sections/ContactSection';
import FooterSection from '@/sections/FooterSection';
import StatsStrip from '@/components/StatsStrip';

import { Product } from '@/data/products-catalogue';

gsap.registerPlugin(ScrollTrigger);

type AppView = 'home' | 'products' | 'detail';

function AppContent() {
  const [authed, setAuthed]           = useState<boolean>(() => isAuthenticated());
  const [view, setView]               = useState<AppView>('home');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [modalProduct,  setModalProduct]  = useState<Product | null>(null);

  useEffect(() => {
    if (!authed) return;
    if (view !== 'home') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [view, authed]);

  useEffect(() => {
    if (!authed) return;
    if (view === 'home') {
      const timer = setTimeout(() => ScrollTrigger.refresh(), 100);
      return () => clearTimeout(timer);
    }
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [view, authed]);

  const openModal = useCallback((product: Product) => {
    setModalProduct(product);
  }, []);

  const closeModal = useCallback(() => {
    setModalProduct(null);
  }, []);

  const openDetail = useCallback((product: Product) => {
    setModalProduct(null);
    setDetailProduct(product);
    setView('detail');
  }, []);

  // Listen for global open-product events (e.g., notification clicks)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        // @ts-ignore
        const detail = ev?.detail;
        if (detail?.product) openDetail(detail.product);
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('cd:open-product' as any, handler as any);
    return () => window.removeEventListener('cd:open-product' as any, handler as any);
  }, [openDetail]);

  const goToProducts = useCallback(() => setView('products'), []);

  const goHome = useCallback(() => {
    setView('home');
    setDetailProduct(null);
  }, []);

  const backToProducts = useCallback(() => {
    setView('products');
    setDetailProduct(null);
  }, []);

  if (!authed) {
    return <MaintenancePage onAuthenticated={() => setAuthed(true)} />;
  }

  // ── Products page ──────────────────────────────────────────────────────────
  if (view === 'products') {
    return (
      <>
        <div className="grain-overlay" />
        <Navigation darkBackground />
        <main>
          <ProductsPage onProductClick={openModal} onBack={goHome} />
        </main>
        <FooterSection />
        {modalProduct && (
          <ProductModal
            product={modalProduct}
            isOpen={!!modalProduct}
            onClose={closeModal}
            onExpand={openDetail}
          />
        )}
      </>
    );
  }

  // ── Product detail page ───────────────────────────────────────────────────
  if (view === 'detail' && detailProduct) {
    return (
      <>
        <div className="grain-overlay" />
        <Navigation darkBackground />
        <main>
          <ProductDetail
            product={detailProduct}
            onBack={backToProducts}
            onProductClick={(p) => {
              setDetailProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
        <FooterSection />
        {modalProduct && (
          <ProductModal
            product={modalProduct}
            isOpen={!!modalProduct}
            onClose={closeModal}
            onExpand={openDetail}
          />
        )}
      </>
    );
  }

  // ── Homepage: Premium Corporate Portal Layout ──────────────────────────────
  return (
    <SmoothScroll>
      <div className="grain-overlay" />
      <Navigation />
      
      <main className="relative z-10">
        <HeroSection />
        <StatsStrip />
        <FeaturesSection />
        <AboutSection />
        <ServicesSection />
        <CommitmentsSection />
        <TeamSection />
        <ProductsSection onProductClick={openModal} onViewAll={goToProducts} />
        <ContactSection />
      </main>

      <FooterSection />
      <BackToTop />

      {modalProduct && (
        <ProductModal
            product={modalProduct}
            isOpen={!!modalProduct}
            onClose={closeModal}
            onExpand={openDetail}
          />
      )}
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
