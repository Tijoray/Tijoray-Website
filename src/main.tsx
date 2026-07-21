import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { CatalogProvider } from './contexts/CatalogContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <CatalogProvider>
        <CartProvider>
          <App />
          <SpeedInsights />
          <Analytics />
        </CartProvider>
      </CatalogProvider>
    </AuthProvider>
  </BrowserRouter>
)
