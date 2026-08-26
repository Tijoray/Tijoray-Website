import { useRef, useState } from 'react'
import { adminApi } from '../../lib/adminApi'
import styles from './admin.module.css'

/**
 * The bench station: write a tag, then record which physical chip it was.
 *
 * Recording the chip UID is the step that gets skipped, because until now it
 * meant leaving the tag on the bench, finding the piece in a list, opening it
 * and typing a UID off a second screen. So this asks for the two things the
 * operator is already holding — the TIJ code they just wrote and the chip they
 * just wrote it to — and nothing else.
 *
 * Where the browser can read NFC (Chrome on Android), one tap fills both:
 * `serialNumber` on the scan event is the chip UID, and the TIJ code is in the
 * tag's own text record. That makes the fast path a single physical gesture
 * with no typing, which is the only version of this that survives a batch of
 * fifty. Everywhere else the fields are typed by hand and behave identically.
 */

/** Web NFC, which TypeScript's DOM lib does not describe. Chrome/Android only. */
type NdefRecord = { recordType: string; encoding?: string; data?: DataView }
type NdefMessage = { records: NdefRecord[] }
type NdefEvent = { serialNumber?: string; message: NdefMessage }
type NdefReader = {
  scan(opts?: { signal?: AbortSignal }): Promise<void>
  onreading: ((e: NdefEvent) => void) | null
  onreadingerror: (() => void) | null
}
type NdefCtor = new () => NdefReader

const nfcSupported = (): boolean =>
  typeof window !== 'undefined' && 'NDEFReader' in window

const SERIAL_RE = /^TIJ-[0-9A-F]{10}$/

/** The TIJ code out of whatever records the tag carries.
 *
 *  Walks all of them and takes the first match, exactly as the phone app does:
 *  a tag may also carry a URL record one day, and the text record has to keep
 *  working when it does. */
function serialFromMessage(msg: NdefMessage): string | null {
  for (const r of msg.records ?? []) {
    if (!r.data) continue
    try {
      const text = new TextDecoder(r.encoding ?? 'utf-8').decode(r.data).trim().toUpperCase()
      if (SERIAL_RE.test(text)) return text
    } catch {
      // A record we cannot decode is simply not the one we are looking for.
    }
  }
  return null
}

type Flash = { ok: boolean; text: string } | null

export default function BindTagPanel({ onBound }: { onBound?: () => void }) {
  const [serial, setSerial] = useState('')
  const [uid, setUid] = useState('')
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const abortRef = useRef<AbortController | null>(null)

  function stopScan() {
    abortRef.current?.abort()
    abortRef.current = null
    setScanning(false)
  }

  async function startScan() {
    setFlash(null)
    const Ctor = (window as unknown as { NDEFReader: NdefCtor }).NDEFReader
    const reader = new Ctor()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setScanning(true)

    reader.onreading = (e: NdefEvent) => {
      // The chip UID arrives colon-separated; the database function normalises
      // separators itself, so it is shown here exactly as the reader gave it.
      if (e.serialNumber) setUid(e.serialNumber)
      const found = serialFromMessage(e.message)
      if (found) setSerial(found)
      setFlash(
        found
          ? { ok: true, text: `Read ${found}. Check the two fields, then bind.` }
          : { ok: false, text: 'Tag read, but it carries no TIJ- code. Write the tag first, then scan it.' },
      )
      stopScan()
    }
    reader.onreadingerror = () => {
      setFlash({ ok: false, text: 'Could not read that tag. Reposition it and try again.' })
    }

    try {
      await reader.scan({ signal: ctrl.signal })
    } catch (err) {
      stopScan()
      const msg = err instanceof Error ? err.message : 'Scanning is unavailable'
      setFlash({
        ok: false,
        text: msg.includes('permission') || msg.includes('denied')
          ? 'NFC permission was refused. Allow it for this site, or type the values below.'
          : `Could not start the scanner: ${msg}`,
      })
    }
  }

  async function bind() {
    setBusy(true)
    setFlash(null)
    try {
      const r = await adminApi.bindHardware(serial.trim(), uid.trim())
      setFlash({
        ok: true,
        text: r.alreadyBound
          ? `${r.serial} was already bound to ${r.hardwareId}. Nothing changed.`
          : `Bound ${r.serial} to ${r.hardwareId}.`,
      })
      setSerial('')
      setUid('')
      onBound?.()
    } catch (e) {
      setFlash({ ok: false, text: e instanceof Error ? e.message : 'Bind failed' })
    } finally {
      setBusy(false)
    }
  }

  const ready = SERIAL_RE.test(serial.trim().toUpperCase()) && uid.trim().length >= 8

  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>Bind a tag</p>
      <p className={styles.hint}>
        After writing a tag, record which chip it was. The serial is the code on
        the tag; the tag UID is the chip&rsquo;s own identifier.
      </p>

      <div className={styles.toolbar}>
        {nfcSupported() ? (
          scanning ? (
            <button className={styles.btnGhost} onClick={stopScan} type="button">
              Cancel scan — hold a tag to the phone
            </button>
          ) : (
            <button className={styles.btn} onClick={startScan} type="button">
              Scan tag
            </button>
          )
        ) : (
          <span className={styles.hint}>
            This browser cannot read NFC — use Chrome on Android to scan, or type the values.
          </span>
        )}
      </div>

      <div className={styles.formRow}>
        <label htmlFor="bind-serial">Serial (on the tag)</label>
        <input
          id="bind-serial"
          className={`${styles.input} ${styles.mono}`}
          value={serial}
          placeholder="TIJ-4A9F2C81BE"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={e => setSerial(e.target.value.toUpperCase())}
        />
      </div>

      <div className={styles.formRow}>
        <label htmlFor="bind-uid">Tag UID (from the chip)</label>
        <input
          id="bind-uid"
          className={`${styles.input} ${styles.mono}`}
          value={uid}
          placeholder="04:A2:B3:C4:D5:E6:80"
          spellCheck={false}
          onChange={e => setUid(e.target.value)}
        />
      </div>

      {flash && (
        <div className={`${styles.msg} ${flash.ok ? styles.msgOk : styles.msgErr}`}>{flash.text}</div>
      )}

      <button className={styles.btn} disabled={!ready || busy} onClick={bind} type="button">
        {busy ? 'Binding…' : 'Bind tag to piece'}
      </button>
    </div>
  )
}
