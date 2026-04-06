import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ScrollStory from './components/ScrollStory'
import Features from './components/Features'
import CtaSection from './components/CtaSection'
import Footer from './components/Footer'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import ConfiguratorPage from './pages/ConfiguratorPage'

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
    <>
      <Hero />
      <ScrollStory />
      <Features />
      <CtaSection />
    </>
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
      </Routes>
      <Footer />
    </>
  )
}
