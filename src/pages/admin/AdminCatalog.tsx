import { useEffect, useState } from 'react'
import { adminApi, type CatalogDoc, type CatalogLoad } from '../../lib/adminApi'
import { dateTime } from './format'
import styles from './admin.module.css'

type Tab = 'products' | 'collections' | 'productTypes' | 'metals' | 'stones' | 'models' | 'json'
const TABS: { id: Tab; label: string }[] = [
  { id: 'products', label: 'Products & Pricing' },
  { id: 'collections', label: 'Collections' },
  { id: 'productTypes', label: 'Product Types' },
  { id: 'metals', label: 'Metals' },
  { id: 'stones', label: 'Stones & Gems' },
  { id: 'models', label: '3D Models' },
  { id: 'json', label: 'Raw JSON' },
]

/** Deep-clone + mutate helper — data is plain JSON so structuredClone is safe. */
function mutate(doc: CatalogDoc, fn: (d: CatalogDoc) => void): CatalogDoc {
  const next = structuredClone(doc)
  fn(next)
  return next
}

export default function AdminCatalog() {
  const [load, setLoad] = useState<CatalogLoad | null>(null)
  const [doc, setDoc] = useState<CatalogDoc | null>(null)
  const [tab, setTab] = useState<Tab>('products')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)
  const [error, setError] = useState('')

  const reload = () => {
    adminApi.getCatalog()
      .then(l => { setLoad(l); setDoc(l.doc); setDirty(false) })
      .catch(e => setError(e.message))
  }
  useEffect(reload, [])

  const edit = (fn: (d: CatalogDoc) => void) => {
    setDoc(d => (d ? mutate(d, fn) : d))
    setDirty(true)
    setFlash(null)
  }

  const save = async () => {
    if (!doc || !load) return
    setSaving(true); setFlash(null)
    try {
      const r = await adminApi.saveCatalog(doc, load.version)
      setLoad(l => l ? { ...l, version: r.version, updatedAt: r.updatedAt, isDefault: false } : l)
      setDirty(false)
      setFlash({ ok: true, text: `Saved as v${r.version}. Prices are live in checkout immediately.` })
    } catch (e) {
      setFlash({ ok: false, text: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (error) return <div className={styles.msg + ' ' + styles.msgErr}>{error}</div>
  if (!doc || !load) return <div className={styles.loading}>Loading catalog…</div>

  return (
    <>
      <h1 className={styles.h1}>Catalog</h1>
      <p className={styles.subtle}>
        Edit pricing, collections, product copy, 3D models, and gem materials. Prices flow into checkout on save.
      </p>

      <div className={styles.saveBar}>
        <button className={styles.btn} onClick={save} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
        {dirty && <span className={`${styles.badge} ${styles.badgeDirty}`}>Unsaved changes</span>}
        {load.isDefault && !dirty && <span className={`${styles.badge} ${styles.badgeDefault}`}>Showing code defaults — first save persists them</span>}
        <span className={styles.badge}>v{load.version}</span>
        {load.updatedAt && <span className={styles.subtle} style={{ margin: 0 }}>Updated {dateTime(load.updatedAt)} {load.updatedBy ? `· ${load.updatedBy}` : ''}</span>}
        <button className={styles.filterBtn} style={{ marginLeft: 'auto' }} onClick={reload} disabled={dirty}>Reload</button>
      </div>

      {flash && <div className={`${styles.msg} ${flash.ok ? styles.msgOk : styles.msgErr}`}>{flash.text}</div>}

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products'     && <ProductsTab doc={doc} edit={edit} />}
      {tab === 'collections'  && <CollectionsTab doc={doc} edit={edit} />}
      {tab === 'productTypes' && <ProductTypesTab doc={doc} edit={edit} />}
      {tab === 'metals'       && <MetalsTab doc={doc} edit={edit} />}
      {tab === 'stones'       && <StonesTab doc={doc} edit={edit} />}
      {tab === 'models'       && <ModelsTab doc={doc} />}
      {tab === 'json'         && <JsonTab doc={doc} setDoc={(d) => { setDoc(d); setDirty(true); setFlash(null) }} />}
    </>
  )
}

type EditFn = (fn: (d: CatalogDoc) => void) => void

/* ── Small field helpers ─────────────────────────────────────────────────── */
function Text({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div className={styles.formRow}>
      <label>{label}</label>
      <input className={styles.input} style={{ minWidth: 0, fontFamily: mono ? 'ui-monospace, monospace' : undefined }}
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.formRow}>
      <label>{label}</label>
      <textarea className={styles.textarea} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> {label}
    </label>
  )
}
function Num({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <div className={styles.formRow}>
      <label>{label}</label>
      <input className={styles.input} style={{ minWidth: 0 }} type="number" step={step ?? 'any'}
        value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )
}

/* ── Products & pricing ──────────────────────────────────────────────────── */
function ProductsTab({ doc, edit }: { doc: CatalogDoc; edit: EditFn }) {
  const metals = doc.metals.map(m => m.id)
  const addProduct = () => edit(d => {
    const prices = Object.fromEntries(d.metals.map(m => [m.id, 29900])) as CatalogDoc['products'][number]['prices']
    d.products.push({
      id: `product-${d.products.length + 1}`, route: '/products/new-product',
      collectionId: d.collections[0]?.id ?? 'birthstone', productTypeId: d.productTypes[0]?.id ?? 'pendant',
      name: 'New Product', priceFrom: 299, prices, cardImage: '', cardDetail: '', models: {}, available: false,
    })
  })

  return (
    <>
      {doc.products.map((p, i) => (
        <div key={i} className={styles.itemCard}>
          <div className={styles.itemHead}>
            <div className={styles.itemName}>{p.name || p.id}</div>
            <div className={styles.rowActions}>
              <Toggle label="Available" checked={p.available} onChange={v => edit(d => { d.products[i].available = v })} />
              <button className={styles.dangerBtn} onClick={() => edit(d => { d.products.splice(i, 1) })}>Remove</button>
            </div>
          </div>

          <div className={styles.grid2}>
            <Text label="Name" value={p.name} onChange={v => edit(d => { d.products[i].name = v })} />
            <Text label="Product ID (slug)" value={p.id} onChange={v => edit(d => { d.products[i].id = v })} mono />
            <div className={styles.formRow}>
              <label>Collection</label>
              <select className={styles.select} value={p.collectionId} onChange={e => edit(d => { d.products[i].collectionId = e.target.value })}>
                {doc.collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formRow}>
              <label>Product Type</label>
              <select className={styles.select} value={p.productTypeId} onChange={e => edit(d => { d.products[i].productTypeId = e.target.value })}>
                {doc.productTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <Text label="Route" value={p.route} onChange={v => edit(d => { d.products[i].route = v })} mono />
            <Num label="'From' price (display $)" value={p.priceFrom} onChange={v => edit(d => { d.products[i].priceFrom = v })} />
          </div>

          <div className={styles.formRow} style={{ marginTop: 8 }}>
            <label>Charged price per metal</label>
            <div className={styles.priceGrid}>
              {metals.map(m => (
                <div key={m} className={styles.priceCell}>
                  <label>{doc.metals.find(x => x.id === m)?.label ?? m}</label>
                  <div className={styles.priceInput}>
                    <input className={styles.input} style={{ minWidth: 0 }} type="number" step="1"
                      value={(p.prices[m] ?? 0) / 100}
                      onChange={e => edit(d => { d.products[i].prices[m] = Math.round(Number(e.target.value) * 100) })} />
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.hint}>Stored in cents; shown in dollars. This is the amount Stripe charges for each metal.</p>
          </div>

          <Area label="Card copy" value={p.cardDetail} onChange={v => edit(d => { d.products[i].cardDetail = v })} />
          <Text label="Card image URL" value={p.cardImage} onChange={v => edit(d => { d.products[i].cardImage = v })} mono />

          <Area label="Model overrides (JSON, per shape — leave {} to use the product type's models)"
            value={JSON.stringify(p.models ?? {}, null, 0)}
            onChange={v => edit(d => { try { d.products[i].models = JSON.parse(v || '{}') } catch { /* keep typing */ } })} />
        </div>
      ))}
      <button className={styles.addBtn} onClick={addProduct}>+ Add product</button>
    </>
  )
}

/* ── Collections ─────────────────────────────────────────────────────────── */
function CollectionsTab({ doc, edit }: { doc: CatalogDoc; edit: EditFn }) {
  return (
    <>
      {doc.collections.map((c, i) => (
        <div key={i} className={styles.itemCard}>
          <div className={styles.itemHead}>
            <div className={styles.itemName}>{c.name || c.id}</div>
            <div className={styles.rowActions}>
              <Toggle label="Available" checked={c.available} onChange={v => edit(d => { d.collections[i].available = v })} />
              <button className={styles.dangerBtn} onClick={() => edit(d => { d.collections.splice(i, 1) })}>Remove</button>
            </div>
          </div>
          <div className={styles.grid3}>
            <Text label="Name" value={c.name} onChange={v => edit(d => { d.collections[i].name = v })} />
            <Text label="Number" value={c.number} onChange={v => edit(d => { d.collections[i].number = v })} />
            <Text label="Collection ID" value={c.id} onChange={v => edit(d => { d.collections[i].id = v })} mono />
            <Text label="Design label" value={c.designLabel} onChange={v => edit(d => { d.collections[i].designLabel = v })} />
            <Text label="Design kind" value={c.designKind} onChange={v => edit(d => { d.collections[i].designKind = v })} mono />
            <Text label="Design applicator (code id)" value={c.designApplicator} onChange={v => edit(d => { d.collections[i].designApplicator = v })} mono />
          </div>
          <Text label="Tagline" value={c.tagline} onChange={v => edit(d => { d.collections[i].tagline = v })} />
          <Area label="Description" value={c.description} onChange={v => edit(d => { d.collections[i].description = v })} />
          <p className={styles.hint}>{c.designOptions?.length ?? 0} design options. Edit the options list in the Raw JSON tab.</p>
        </div>
      ))}
      <p className={styles.hint} style={{ marginTop: 8 }}>
        Note: <code>designApplicator</code> must match a strategy that exists in the 3D code — a new value renders nothing until code is added.
      </p>
    </>
  )
}

/* ── Product types ───────────────────────────────────────────────────────── */
function ProductTypesTab({ doc, edit }: { doc: CatalogDoc; edit: EditFn }) {
  const shapes = ['square', 'circle', 'heart', 'pear'] as const
  return (
    <>
      {doc.productTypes.map((t, i) => (
        <div key={i} className={styles.itemCard}>
          <div className={styles.itemHead}>
            <div className={styles.itemName}>{t.label || t.id}</div>
            <Toggle label="Available" checked={t.available} onChange={v => edit(d => { d.productTypes[i].available = v })} />
          </div>
          <div className={styles.grid3}>
            <Text label="Label" value={t.label} onChange={v => edit(d => { d.productTypes[i].label = v })} />
            <Text label="Noun" value={t.noun} onChange={v => edit(d => { d.productTypes[i].noun = v })} />
            <Text label="Assembly (code id)" value={t.assembly} onChange={v => edit(d => { d.productTypes[i].assembly = v })} mono />
          </div>
          <Text label="Chain model URL" value={t.chain ?? ''} onChange={v => edit(d => { d.productTypes[i].chain = v })} mono />
          <div className={styles.formRow}>
            <label>Shape model URLs</label>
            {shapes.map(s => (
              <input key={s} className={styles.input} style={{ minWidth: 0, marginBottom: 6, fontFamily: 'ui-monospace, monospace' }}
                placeholder={s} value={t.models[s] ?? ''}
                onChange={e => edit(d => { d.productTypes[i].models[s] = e.target.value })} />
            ))}
          </div>
          <p className={styles.hint}>Assembly <code>{t.assembly}</code> must exist in the 3D code layer.</p>
        </div>
      ))}
    </>
  )
}

/* ── Metals ──────────────────────────────────────────────────────────────── */
function MetalsTab({ doc, edit }: { doc: CatalogDoc; edit: EditFn }) {
  return (
    <div className={styles.itemCard}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>ID</th><th>Short label</th><th>Long label</th><th>Roughness</th></tr></thead>
          <tbody>
            {doc.metals.map((m, i) => (
              <tr key={m.id}>
                <td className={styles.mono}>{m.id}</td>
                <td><input className={styles.input} style={{ minWidth: 0 }} value={m.label} onChange={e => edit(d => { d.metals[i].label = e.target.value })} /></td>
                <td><input className={styles.input} style={{ minWidth: 0 }} value={m.labelLong} onChange={e => edit(d => { d.metals[i].labelLong = e.target.value })} /></td>
                <td><input className={styles.input} style={{ minWidth: 0, width: 90 }} type="number" step="0.01" value={m.roughness} onChange={e => edit(d => { d.metals[i].roughness = Number(e.target.value) })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.hint}>Metal colours (white/gold/rose) and their hex live in the Raw JSON tab under <code>metalColors</code>.</p>
    </div>
  )
}

/* ── Stones & gems ───────────────────────────────────────────────────────── */
function StonesTab({ doc, edit }: { doc: CatalogDoc; edit: EditFn }) {
  return (
    <>
      {doc.stones.map((s, i) => (
        <div key={i} className={styles.itemCard}>
          <div className={styles.itemHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={styles.swatch} style={{ background: s.color }} />
              <div className={styles.itemName}>{s.name}</div>
            </div>
            <button className={styles.dangerBtn} onClick={() => edit(d => { d.stones.splice(i, 1) })}>Remove</button>
          </div>
          <div className={styles.grid4}>
            <Text label="Month" value={s.month} onChange={v => edit(d => { d.stones[i].month = v })} />
            <Text label="Display name" value={s.name} onChange={v => edit(d => { d.stones[i].name = v })} />
            <Text label="DB name (checkout lookup)" value={s.dbName} onChange={v => edit(d => { d.stones[i].dbName = v })} mono />
            <Text label="Swatch color" value={s.color} onChange={v => edit(d => { d.stones[i].color = v })} mono />
          </div>
          <Text label="Meaning" value={s.meaning} onChange={v => edit(d => { d.stones[i].meaning = v })} />
          <Area label="Gem material (configurator, JSON)"
            value={JSON.stringify(s.gem, null, 0)}
            onChange={v => edit(d => { try { d.stones[i].gem = JSON.parse(v) } catch { /* keep typing */ } })} />
          <Area label="Gem thumbnail material (JSON)"
            value={JSON.stringify(s.gemThumb, null, 0)}
            onChange={v => edit(d => { try { d.stones[i].gemThumb = JSON.parse(v) } catch { /* keep typing */ } })} />
        </div>
      ))}
      <p className={styles.hint}>Changing a stone's DB name affects the Supabase Stones lookup at checkout — keep it aligned with the Stones table.</p>
    </>
  )
}

/* ── 3D models inspector ─────────────────────────────────────────────────── */
function ModelsTab({ doc }: { doc: CatalogDoc }) {
  const rows: { url: string; used: string }[] = []
  for (const t of doc.productTypes) {
    if (t.chain) rows.push({ url: t.chain, used: `${t.label} · chain` })
    for (const [shape, url] of Object.entries(t.models)) if (url) rows.push({ url, used: `${t.label} · ${shape}` })
  }
  for (const p of doc.products) {
    for (const [shape, url] of Object.entries(p.models ?? {})) if (url) rows.push({ url, used: `${p.name} · ${shape} (override)` })
  }
  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Used by</th><th>Model URL</th><th>Open</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={3} className={styles.empty}>No model URLs.</td></tr> : rows.map((r, i) => (
              <tr key={i}>
                <td>{r.used}</td>
                <td className={styles.mono} style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.url}</td>
                <td><a className={styles.linkOut} href={r.url} target="_blank" rel="noreferrer">Open ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Raw JSON escape hatch ───────────────────────────────────────────────── */
function JsonTab({ doc, setDoc }: { doc: CatalogDoc; setDoc: (d: CatalogDoc) => void }) {
  const [text, setText] = useState(() => JSON.stringify(doc, null, 2))
  const [err, setErr] = useState('')

  const apply = () => {
    try {
      const parsed = JSON.parse(text)
      setErr('')
      setDoc(parsed)
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className={styles.itemCard}>
      <p className={styles.hint} style={{ marginBottom: 10 }}>
        Full document — add/remove anything (products, collections, design options, gem params). Click Apply, then Save. The server re-validates on save.
      </p>
      {err && <div className={styles.msg + ' ' + styles.msgErr}>{err}</div>}
      <textarea className={`${styles.textarea} ${styles.jsonArea}`} value={text} onChange={e => setText(e.target.value)} spellCheck={false} />
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button className={styles.btn} onClick={apply}>Apply JSON to editor</button>
        <button className={styles.filterBtn} onClick={() => setText(JSON.stringify(doc, null, 2))}>Reset to current</button>
      </div>
    </div>
  )
}
