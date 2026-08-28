import { useEffect } from 'react'

const SUFFIX = 'Tijoray'
const DEFAULT_TITLE = 'Tijoray — Fine Jewelry with an Encrypted Memory Vault'
const DEFAULT_DESCRIPTION =
  'Handcrafted gold and silver jewelry with an encrypted vault sealed inside — photographs, voice notes and letters, opened with a tap of your phone.'

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
    document.title = title ? `${title} — ${SUFFIX}` : DEFAULT_TITLE
    const desc = description ?? DEFAULT_DESCRIPTION
    setMeta('meta[name="description"]', desc)
    setMeta('meta[property="og:title"]', document.title)
    setMeta('meta[property="og:description"]', desc)
    setMeta('meta[name="twitter:title"]', document.title)
    setMeta('meta[name="twitter:description"]', desc)

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('meta[name="description"]', DEFAULT_DESCRIPTION)
      setMeta('meta[property="og:title"]', DEFAULT_TITLE)
      setMeta('meta[property="og:description"]', DEFAULT_DESCRIPTION)
      setMeta('meta[name="twitter:title"]', DEFAULT_TITLE)
      setMeta('meta[name="twitter:description"]', DEFAULT_DESCRIPTION)
    }
  }, [title, description])
}
