import { Component, type ReactNode } from 'react'

/**
 * Last-resort catch for render errors. Without this, any uncaught exception in
 * a component tree unmounts the whole SPA to a white screen with no way back.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[Tijoray] render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main style={{
        minHeight: '70vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '48px 24px', textAlign: 'center',
        fontFamily: "'Montserrat', sans-serif",
      }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif", fontWeight: 500,
          fontSize: 'clamp(28px, 4vw, 40px)', margin: 0,
        }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: 420, color: '#6b6b66', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          An unexpected error interrupted the page. Your account and any saved
          work are unaffected.
        </p>
        <button
          onClick={() => { window.location.href = '/' }}
          style={{
            marginTop: 8, padding: '12px 28px', border: '1px solid #1a1a18',
            background: '#1a1a18', color: '#f7f7f2', letterSpacing: '0.08em',
            textTransform: 'uppercase', fontSize: 12, cursor: 'pointer',
          }}
        >
          Return Home
        </button>
      </main>
    )
  }
}
