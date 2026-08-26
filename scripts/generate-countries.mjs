/**
 * Regenerates src/data/countries.ts from the phone app's lib/data/countries.dart.
 *
 * The dialling table has to be IDENTICAL on both sides. The app formats the
 * giftee's verified number with it and the website formats the number the
 * gifter types for them; the piece links the two by comparing digits, so a
 * table that drifts on one side is a piece that silently never unlocks.
 *
 * The app's table is itself generated — tool/generate_countries.py there
 * derives it from libphonenumber metadata. This script is the second hop, not a
 * second source: it parses that output rather than restating any of it.
 *
 *   node scripts/generate-countries.mjs [path-to-phone-app]
 *
 * Defaults to ~/Downloads/Tijoray-Phone-App. Re-run whenever the app's table is
 * regenerated, and commit the result.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

const appRoot = process.argv[2] ?? resolve(homedir(), 'Downloads/Tijoray-Phone-App')
const src = resolve(appRoot, 'lib/data/countries.dart')
const out = resolve(import.meta.dirname, '../src/data/countries.ts')

const dart = readFileSync(src, 'utf8')

// Country('GB', 44, 'United Kingdom', 10, 10, '7400123456', '0', isPrimaryForCode: true),
const ENTRY =
  /Country\(\s*'([A-Z]{2})'\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'([^']*)'\s*,\s*(null|'[^']*')\s*(?:,\s*isPrimaryForCode:\s*(true|false)\s*)?,?\s*\)/g

const rows = []
for (const m of dart.matchAll(ENTRY)) {
  const [, iso, calling, name, nsnMin, nsnMax, example, trunk, primary] = m
  rows.push({
    iso,
    callingCode: Number(calling),
    // Dart escapes only the apostrophe inside these names (Côte d'Ivoire).
    name: name.replace(/\\'/g, "'"),
    nsnMin: Number(nsnMin),
    nsnMax: Number(nsnMax),
    example,
    trunkPrefix: trunk === 'null' ? null : trunk.slice(1, -1),
    isPrimaryForCode: primary === 'true',
  })
}

if (rows.length < 200) {
  console.error(`Only parsed ${rows.length} countries from ${src} — refusing to write a truncated table.`)
  process.exit(1)
}

const isoSeen = new Set()
for (const r of rows) {
  if (isoSeen.has(r.iso)) {
    console.error(`Duplicate ISO code ${r.iso} — the app's table is not what this script expects.`)
    process.exit(1)
  }
  isoSeen.add(r.iso)
}

const lit = (v) => (v === null ? 'null' : `'${String(v).replace(/'/g, "\\'")}'`)

const body = rows
  .map(
    (r) =>
      `  { iso: '${r.iso}', callingCode: ${r.callingCode}, name: ${lit(r.name)}, ` +
      `nsnMin: ${r.nsnMin}, nsnMax: ${r.nsnMax}, example: '${r.example}', ` +
      `trunkPrefix: ${lit(r.trunkPrefix)}, isPrimaryForCode: ${r.isPrimaryForCode} },`,
  )
  .join('\n')

writeFileSync(
  out,
  `/**
 * Dialling data for every region that can receive an SMS.
 *
 * GENERATED — do not hand-edit. \`node scripts/generate-countries.mjs\` derives
 * this from the phone app's lib/data/countries.dart, which is itself generated
 * from libphonenumber metadata. Both apps must agree: the app writes the
 * giftee's number and this writes the gifter's, and a piece links the two by
 * comparing their digits.
 *
 * The fields that matter are the ones that are easy to get wrong by hand: Italy
 * keeps the leading 0 the UK drops, Russia's trunk prefix is 8 rather than 0,
 * and two dozen territories share +1 with the United States.
 */

export type Country = {
  /** ISO 3166-1 alpha-2, uppercase. Also what the flag is derived from. */
  iso: string
  /** Calling code without the \`+\` — 1 for the US, 44 for the UK. */
  callingCode: number
  /** English display name, from CLDR. */
  name: string
  /**
   * Digit count of the national significant number — the part after the calling
   * code, with any trunk prefix already removed. Tighter than E.164's blanket
   * 4–15, which is what lets us say "too short for a UK mobile".
   */
  nsnMin: number
  nsnMax: number
  /** A specimen national number, used as the field's placeholder. */
  example: string
  /**
   * The digit locals dial before the national number and drop when calling from
   * abroad — 0 in most of Europe, 8 in Russia, 1 in the US. Null where there
   * isn't one (Italy, Spain, Mexico), the case that makes stripping it
   * unconditionally wrong.
   */
  trunkPrefix: string | null
  /** Whether a bare calling code resolves here — +1 is 25 territories, but a
   *  pasted +1 number is assumed American. */
  isPrimaryForCode: boolean
}

/** Every region, sorted by display name — the order the picker shows them in. */
export const COUNTRIES: readonly Country[] = [
${body}
]
`,
  'utf8',
)

console.log(`Wrote ${rows.length} countries to ${out}`)
