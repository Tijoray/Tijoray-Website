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

/** Full configuration a customer chose — the source of truth for a piece. */
export type PieceConfig = {
  productType?:     string
  collectionId?:    string
  shape?:           string
  metal?:           string
  metalColor?:      string
  birthstoneIndex?: number
}

export type Piece = {
  id: string
  /// Not readable from the browser once the serial becomes the tag credential
  /// — see PIECE_COLUMNS. Reachable through the `piece_serial` function, which
  /// returns it only to a piece's sender or receiver.
  serial?: string | null
  collection: string | null
  product_type: string | null
  config: PieceConfig | null
  cover_image_url: string | null
  model_3d_url: string | null
  stone_id: string | null
  metal_id: string | null
  sender_id: string | null
  receiver_id: string | null
  /// Not readable from the browser — see PIECE_COLUMNS. Only the admin API,
  /// which runs on the service role, ever sees this.
  hardware_id?: string | null
  nfc_linked_at: string | null
  activated_at: string | null
  created_at: string
}

/**
 * Columns the browser may read from `Pieces`, listed explicitly.
 *
 * `select('*')` cannot be used against this table. The migrations revoke the
 * blanket SELECT from `authenticated` and re-grant a column list, deliberately
 * withholding both `hardware_id` (the chip's own UID) and `serial` (the code
 * written onto the tag, and therefore the credential that opens an unclaimed
 * piece). `*` expands to every column including those, and Postgres then
 * refuses the entire query rather than omitting them.
 *
 * The portal falls back to a shortened piece id where it used to print the
 * serial. To show a real serial again, call the `piece_serial` function, which
 * returns it only to the piece's sender or receiver.
 */
// One unbroken literal: supabase-js parses this string in the type system to
// shape the result, and concatenation widens it to `string`, which it rejects.
export const PIECE_COLUMNS = 'id,collection,product_type,config,cover_image_url,model_3d_url,stone_id,metal_id,sender_id,receiver_id,nfc_linked_at,activated_at,created_at'

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
  /// Ciphertext on the wire when enc_v is 1. Everything in the UI works with
  /// these already decrypted — see decryptItems in PortalPiecePage.
  title: string | null
  type: MessageItemType
  file_url: string | null
  content: string | null
  sort_order: number | null
  created_at: string
  /// Always 1 — the database refuses any other value. It exists so a future
  /// format change has somewhere to declare itself.
  enc_v: number
  /// Encrypted JSON: the original filename and MIME type, which no longer
  /// appear in the object key or its Content-Type. Null for rows with no file.
  enc_meta: string | null
  /// Populated client-side from enc_meta once decrypted; never written back.
  /// Players need the real type — a .mov handed to <video> as video/mp4 is
  /// refused by Chrome.
  mime?: string
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
