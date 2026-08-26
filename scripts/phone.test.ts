/** Behavioural checks for the E.164 normalisation. `npx tsx scripts/phone.test.ts` */
import {
  countryForIso, stripTrunkPrefix, toE164, splitE164, phoneStatus, digitsOnly,
} from '../src/lib/phone'

const GB = countryForIso('GB')!, US = countryForIso('US')!
const IT = countryForIso('IT')!, RU = countryForIso('RU')!, MX = countryForIso('MX')!

let fail = 0
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) fail++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`)
}

// The case from the brief: a Londoner types their number as it is printed.
const typed = stripTrunkPrefix(GB, digitsOnly('07700 900123'))
eq('UK trunk 0 dropped', typed, '7700900123')
eq('UK composes to E.164', toE164(GB, typed), '+447700900123')
eq('digits match what the giftee verifies',
   digitsOnly(toE164(GB, typed)!), digitsOnly('+447700900123'))

// Countries whose leading digit is part of the number must keep it.
eq('IT keeps leading 0', stripTrunkPrefix(IT, '0612345678'), '0612345678')
eq('MX keeps leading digit', stripTrunkPrefix(MX, '2221234567'), '2221234567')
eq('RU trunk 8 dropped', stripTrunkPrefix(RU, '89123456789'), '9123456789')
eq('US trunk 1 dropped', stripTrunkPrefix(US, '12015550123'), '2015550123')

// Punctuation never survives into storage.
eq('US punctuation stripped', toE164(US, digitsOnly('(201) 555-0123')), '+12015550123')

// A half-typed number must not compose to something storable.
eq('short UK has no E.164', toE164(GB, '7700'), null)
eq('short UK status', phoneStatus(GB, '7700'), 'tooShort')
eq('long UK status', phoneStatus(GB, '77009001234567'), 'tooLong')
eq('empty status', phoneStatus(GB, ''), 'empty')

// A stored value round-trips back onto the picker.
eq('round-trip country', splitE164('+447700900123')!.country.iso, 'GB')
eq('round-trip nsn', splitE164('+447700900123')!.nsn, '7700900123')
eq('+1 resolves to the primary territory', splitE164('+12015550123')!.country.iso, 'US')
eq('non-E.164 does not parse', splitE164('07700900123'), null)

// The regression itself: UK digits with the picker left on the US default.
// Must refuse to compose rather than store a number that can never match.
eq('UK digits under US is refused',
   toE164(US, stripTrunkPrefix(US, digitsOnly('07700 900123'))), null)

console.log(fail ? `\n${fail} FAILED` : '\nall passed')
process.exit(fail ? 1 : 0)
