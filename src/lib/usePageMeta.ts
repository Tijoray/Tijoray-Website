import { useEffect } from 'react'

const SUFFIX = 'Tijoray'
const DEFAULT_TITLE = 'Tijoray · Jewelry That Opens Your Memories'
const DEFAULT_DESCRIPTION =
  'Birthstone jewelry with a passive NFC identity that opens encrypted online photos, voice notes and messages in the Tijoray app.'

function setMeta(selector: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(selector)
  if (el) el.content = content
}

/**
 * Per-page title and description for a client-rendered SPA.
 *
 * Every route previously shared one title, which is unhelpful for anyone with
 * several tabs open and worthless for search. This is a runtime fix only —
 * crawlers that do not execute JavaScript still see index.html, so the routes
 * that matter for search will eventually want prerendering or SSG.
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SUFFIX}` : DEFAULT_TITLE
    const desc = description ?? DEFAULT_DESCRIPTION
    setMeta('meta[name="description"]', desc)
    setMeta('meta[property="og:title"]', document.title)
    setMeta('meta[property="og:description"]', desc)
    setMeta('meta[name="twitter:title"]', document.title)
    setMeta('meta[name="twitter:description"]', desc)
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    const pageUrl = `${window.location.origin}${window.location.pathname}`
    if (canonical) canonical.href = pageUrl
    setMeta('meta[property="og:url"]', pageUrl)

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('meta[name="description"]', DEFAULT_DESCRIPTION)
      setMeta('meta[property="og:title"]', DEFAULT_TITLE)
      setMeta('meta[property="og:description"]', DEFAULT_DESCRIPTION)
      setMeta('meta[name="twitter:title"]', DEFAULT_TITLE)
      setMeta('meta[name="twitter:description"]', DEFAULT_DESCRIPTION)
      if (canonical) canonical.href = window.location.origin + '/'
      setMeta('meta[property="og:url"]', window.location.origin + '/')
    }
  }, [title, description])
}
