import { createSign } from 'crypto'
import { readFileSync } from 'fs'
import { homedir } from 'os'

const teamId   = 'XQS925JXWH'
const keyId    = '9VQU52D622'
const clientId = 'com.tijoray.web' // ← replace with your Services ID e.g. com.tijoray.web
const keyPath  = homedir() + '/Downloads/AuthKey_9VQU52D622.p8'

const key = readFileSync(keyPath, 'utf8')
const now = Math.floor(Date.now() / 1000)

const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url')
const payload = Buffer.from(JSON.stringify({
  iss: teamId,
  iat: now,
  exp: now + 15777000, // 6 months
  aud: 'https://appleid.apple.com',
  sub: clientId,
})).toString('base64url')

const sign = createSign('SHA256')
sign.update(`${header}.${payload}`)
const sig = sign.sign({ key, dsaEncoding: 'ieee-p1363' }, 'base64url')

console.log('\n--- COPY THIS INTO SUPABASE SECRET KEY FIELD ---\n')
console.log(`${header}.${payload}.${sig}`)
console.log('\n------------------------------------------------\n')
