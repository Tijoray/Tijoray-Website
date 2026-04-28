import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Hero from './components/Hero'
import ScrollStory from './components/ScrollStory'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import TrustSection from './components/TrustSection'
import PricingBand from './components/PricingBand'
import StickyMobileCta from './components/StickyMobileCta'
import Testimonials from './components/Testimonials'
import CtaSection from './components/CtaSection'
import Footer from './components/Footer'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ConfiguratorPage from './pages/ConfiguratorPage'
import TechnologyPage from './pages/TechnologyPage'
import CollectionPage from './pages/CollectionPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import PortalPage from './pages/PortalPage'
import PortalPiecePage from './pages/PortalPiecePage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import NotFoundPage from './pages/NotFoundPage'
import FaqPage from './pages/FaqPage'
import CraftsmanshipPage from './pages/CraftsmanshipPage'

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
      <ScrollStory />
      <Features />
      <PricingBand />
      <TrustSection />
      <Testimonials />
      <CtaSection />
      <StickyMobileCta />
    </main>
  )
}

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <div id="progress-bar" style={{
        position: 'fixed', top: 0, left: 0, height: '1.5px', width: '0%',
        background: 'linear-gradient(90deg,var(--rose),var(--gold),var(--gold-soft))',
        zIndex: 1000, transition: 'width 0.08s linear'
      }} />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/build" element={<ConfiguratorPage />} />
        <Route path="/products/birthstone-pendant" element={<ConfiguratorPage />} />
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </>
  )
}
