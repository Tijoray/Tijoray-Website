import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

/* ── Shared DB types (mirrors the Supabase schema) ───────── */
export type Stone = {
  id: string
  name: string
  carat: number | null
  cut: string | null
  clarity: string | null
  colour: string | null
  model_url: string | null
}

export type Metal = {
  id: string
  name: string
  weight: number | null
  purity: string | null
  colour: string | null
  model_url: string | null
}

export type Piece = {
  id: string
  serial: string | null
  collection: string | null
  cover_image_url: string | null
  model_3d_url: string | null
  stone_id: string | null
  metal_id: string | null
  sender_id: string | null
  receiver_id: string | null
  nfc_linked_at: string | null
  activated_at: string | null
  created_at: string
}

export type Message = {
  id: string
  piece_id: string
  sender_id: string
  title: string | null
  revealed_at: string | null
  created_at: string
}

export type MessageItemType =
  | 'photo' | 'video' | 'audio' | 'voice_note'
  | 'note' | 'spotify' | 'google_maps'

export type MessageItem = {
  id: string
  message_id: string
  title: string | null
  type: MessageItemType
  file_url: string | null
  content: string | null
  sort_order: number | null
  created_at: string
}

export type Vault = {
  id: string
  piece_id: string
  owner_id: string
  name: string | null
  storage_used_bytes: string | null
  storage_limit_bytes: string | null
  created_at: string
  updated_at: string
}
