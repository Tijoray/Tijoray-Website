import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Hero from './components/Hero'
// import ScrollStory from './components/ScrollStory'
import HowItWorks from './components/HowItWorks'
import FeaturedPieces from './components/FeaturedPieces'
import TheMoment from './components/TheMoment'
import TrustSection from './components/TrustSection'
import PricingBand from './components/PricingBand'
import StickyMobileCta from './components/StickyMobileCta'
import Testimonials from './components/Testimonials'
import CtaSection from './components/CtaSection'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import { PRODUCTS } from './data/products'

const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ConfiguratorPage = lazy(() => import('./pages/ConfiguratorPage'))
const BraceletConfiguratorPage = lazy(() => import('./pages/BraceletConfiguratorPage'))
const TechnologyPage = lazy(() => import('./pages/TechnologyPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const PortalPage = lazy(() => import('./pages/PortalPage'))
const PortalPiecePage = lazy(() => import('./pages/PortalPiecePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const CraftsmanshipPage = lazy(() => import('./pages/CraftsmanshipPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))

// Admin panel (operational dashboard) — lazy so it never ships in the public bundle path.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPieces = lazy(() => import('./pages/admin/AdminPieces'))
const AdminPieceDetail = lazy(() => import('./pages/admin/AdminPieceDetail'))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminEmails = lazy(() => import('./pages/admin/AdminEmails'))
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'))

/** Shown while a lazy route's chunk downloads — a blank page reads as broken. */
function RouteFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div aria-label="Loading" style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.12)', borderTopColor: 'var(--gold, #b08d57)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
    </div>
  )
}

function HomePage() {
  useEffect(() => {
    const bar = document.getElementById('progress-bar')
    if (!bar) return
    function update() {
      const total = document.documentElement.scrollHeight - window.innerHeight
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0
      bar!.style.width = pct + '%'
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <main>
      <Hero />
      <HowItWorks />
      {/* <ScrollStory /> */}
      {/* Jewelry is bought with the eyes — show something buyable before the
          essays. Features (Craft / Vault / Legacy) was retired from the home
          page: it restated HowItWorks in prose, and TheMoment now carries the
          argument it was reaching for. The component is still in the tree if
          you want it back. */}
      <FeaturedPieces />
      <TheMoment />
      <PricingBand />
      <TrustSection />
      <Testimonials />
      <CtaSection />
      <StickyMobileCta />
    </main>
  )
}

export default function App() {
  const { pathname, hash } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    // A hash means the link is aimed at a section (the footer's /faq#care), so
    // jumping to the top would land in the wrong place. The target page is
    // lazy-loaded and usually not mounted on this tick, so poll briefly for the
    // element rather than scrolling once and missing it.
    if (hash) {
      const id = hash.slice(1)
      let frames = 0
      let raf = 0
      const find = () => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
        // ~1s at 60fps, then give up and leave the page where it is.
        if (frames++ < 60) raf = requestAnimationFrame(find)
      }
      raf = requestAnimationFrame(find)
      return () => cancelAnimationFrame(raf)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  // The admin panel is a self-contained shell — no public navbar, footer, or progress bar.
  if (isAdmin) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pieces" element={<AdminPieces />} />
            <Route path="pieces/:pieceId" element={<AdminPieceDetail />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="emails" element={<AdminEmails />} />
          </Route>
        </Routes>
      </Suspense>
    )
  }

  return (
    <>
      <div id="progress-bar" style={{
        position: 'fixed', top: 0, left: 0, height: '1.5px', width: '0%',
        background: 'linear-gradient(90deg,var(--rose),var(--gold),var(--gold-soft))',
        zIndex: 1000, transition: 'width 0.08s linear'
      }} />
      <Navbar />
      <CartDrawer />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* Configurator routes generated from the products matrix.
              Each product type maps to its own configurator page. */}
          {PRODUCTS.filter(p => p.available && p.productTypeId === 'pendant').map(p => (
            <Route key={p.id} path={p.route} element={<ConfiguratorPage />} />
          ))}
          {PRODUCTS.filter(p => p.available && p.productTypeId === 'bracelet').map(p => (
            <Route key={p.id} path={p.route} element={<BraceletConfiguratorPage />} />
          ))}
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order/success" element={<OrderSuccessPage />} />
          <Route path="/portal" element={
            <ProtectedRoute><PortalPage /></ProtectedRoute>
          } />
          <Route path="/portal/piece/:pieceId" element={
            <ProtectedRoute><PortalPiecePage /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          } />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/craftsmanship" element={<CraftsmanshipPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  )
}
