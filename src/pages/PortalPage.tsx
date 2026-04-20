import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Piece, Stone, Metal } from '../lib/supabase'
import PendantThumbnail from '../components/PendantThumbnail'
import styles from './PortalPage.module.css'

type Shape      = 'square' | 'circle' | 'heart' | 'pear'
type MetalKey   = 'steel' | 'silver' | '10k' | '18k'
type MetalColor = 'white' | 'gold' | 'rose'

const COLLECTION_TO_SHAPE: Record<string, Shape> = {
  'Square Pendant': 'square',
  'Circle Pendant': 'circle',
  'Heart Pendant':  'heart',
  'Pear Pendant':   'pear',
}

const BIRTHSTONE_NAMES = [
  'Garnet', 'Amethyst', 'Aquamarine', 'White Topaz',
  'Emerald', 'Pearl', 'Ruby', 'Peridot',
  'Sapphire', 'Pink Tourmaline', 'Citrine', 'Turquoise',
]

function stoneToIndex(name: string | null): number {
  if (!name) return 0
  const idx = BIRTHSTONE_NAMES.findIndex(n => n.toLowerCase() === name.toLowerCase())
  return idx >= 0 ? idx : 0
}

function purityToMetal(purity: string | null): MetalKey {
  if (purity === 'steel')  return 'steel'
  if (purity === 'silver') return 'silver'
  if (purity === '10k')    return '10k'
  return '18k'
}

function colourToMetalColor(colour: string | null): MetalColor {
  if (colour === 'white') return 'white'
  if (colour === 'rose')  return 'rose'
  return 'gold'
}

export default function PortalPage() {
  const { user, signOut } = useAuth()
  const [pieces,  setPieces]  = useState<Piece[]>([])
  const [stones,  setStones]  = useState<Stone[]>([])
  const [metals,  setMetals]  = useState<Metal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('Pieces').select('*').eq('sender_id', user.id).order('created_at', { ascending: false }),
      supabase.from('Stones').select('*'),
      supabase.from('Metals').select('*'),
    ]).then(([piecesRes, stonesRes, metalsRes]) => {
      if (piecesRes.error) console.error('Pieces query error:', piecesRes.error)
      setPieces(piecesRes.data ?? [])
      setStones(stonesRes.data ?? [])
      setMetals(metalsRes.data ?? [])
      setLoading(false)
    })
  }, [user])

  function thumbProps(piece: Piece) {
    const shape       = COLLECTION_TO_SHAPE[piece.collection ?? ''] ?? 'heart'
    const stone       = stones.find(s => s.id === piece.stone_id)
    const metal       = metals.find(m => m.id === piece.metal_id)
    const birthstoneIndex = stoneToIndex(stone?.name ?? null)
    const metalKey    = purityToMetal(metal?.purity ?? null)
    const metalColor  = colourToMetalColor(metal?.colour ?? null)
    return { shape, metal: metalKey, metalColor, birthstoneIndex } as const
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Memory Portal</p>
            <h1 className={styles.title}>Your <em>Tijoray</em> Pieces</h1>
          </div>
          <button className={styles.signOutBtn} onClick={signOut}>Sign out</button>
        </header>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : pieces.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No pieces yet</p>
            <p className={styles.emptyBody}>
              Your Tijoray pendant will appear here once your order is confirmed and dispatched.
            </p>
            <Link to="/build" className={styles.emptyLink}>Design a pendant</Link>
          </div>
        ) : (
          <ul className={styles.grid}>
            {pieces.map(piece => {
              const tp = thumbProps(piece)
              const dateStr = piece.created_at
                ? new Date(piece.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Recently ordered'
              return (
                <li key={piece.id} className={styles.card}>
                  <Link to={`/portal/piece/${piece.id}`} className={styles.cardLink}>
                    <div className={styles.cardThumb}>
                      <PendantThumbnail
                        shape={tp.shape}
                        metal={tp.metal}
                        metalColor={tp.metalColor}
                        birthstoneIndex={tp.birthstoneIndex}
                        size={240}
                      />
                    </div>
                    <div className={styles.cardBody}>
                      <p className={styles.cardTitle}>{piece.collection ?? 'Tijoray Pendant'}</p>
                      <p className={styles.cardSerial}>
                        {piece.serial ?? `ID: ${piece.id.slice(0, 8).toUpperCase()}`}
                      </p>
                      <p className={styles.cardDate}>{dateStr}</p>
                      <span className={styles.cardCta}>Open Memory Builder →</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
