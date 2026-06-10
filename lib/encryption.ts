// ============================================================
// AES Encryption — CryptoJS-compatible
//
// Matches CryptoJS.AES.encrypt(value, secretKey) output exactly
// so your scanner can decrypt with:
//   const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey)
//   const decrypted = bytes.toString(CryptoJS.enc.Utf8)
//
// Set your secret key in .env.local:
//   NEXT_PUBLIC_QR_ENCRYPTION_KEY=your_secret_key_here
// ============================================================

const SECRET_KEY = process.env.NEXT_PUBLIC_QR_ENCRYPTION_KEY ?? 'REPLACE_WITH_YOUR_SECRET_KEY'

// ── MD5 implementation ───────────────────────────────────────
// Web Crypto API does not support MD5, so we implement it here.
// This is only used for EVP_BytesToKey key derivation (CryptoJS compat),
// NOT for any security-sensitive hashing.

function md5(input: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  // MD5 constants
  const S = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5, 9,14,20,5, 9,14,20,5, 9,14,20,5, 9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ]
  const K = new Uint32Array(64)
  for (let i = 0; i < 64; i++) {
    K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0
  }

  // Pre-processing: padding
  const msgLen = input.length
  const bitLen = msgLen * 8
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64)
  const padded = new Uint8Array(msgLen + padLen + 8)
  padded.set(input)
  padded[msgLen] = 0x80
  // Append bit length as 64-bit little-endian
  const view = new DataView(padded.buffer)
  view.setUint32(msgLen + padLen, bitLen & 0xffffffff, true)
  view.setUint32(msgLen + padLen + 4, Math.floor(bitLen / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < padded.length; offset += 64) {
    const M = new Uint32Array(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  const result = new Uint8Array(16) as Uint8Array<ArrayBuffer>
  const rv = new DataView(result.buffer)
  rv.setUint32(0, a0, true)
  rv.setUint32(4, b0, true)
  rv.setUint32(8, c0, true)
  rv.setUint32(12, d0, true)
  return result
}

// ── EVP_BytesToKey ────────────────────────────────────────────
// Derives key + IV from passphrase + salt using MD5,
// matching CryptoJS's internal key derivation exactly.

function evpBytesToKey(
  password: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  keyLen: number,
  ivLen: number
): { key: Uint8Array<ArrayBuffer>; iv: Uint8Array<ArrayBuffer> } {
  const result: number[] = []
  let prev: Uint8Array<ArrayBuffer> = new Uint8Array(0) as Uint8Array<ArrayBuffer>

  while (result.length < keyLen + ivLen) {
    const input = new Uint8Array(prev.length + password.length + salt.length) as Uint8Array<ArrayBuffer>
    input.set(prev)
    input.set(password, prev.length)
    input.set(salt, prev.length + password.length)
    prev = md5(input)
    result.push(...prev)
  }

  return {
    key: new Uint8Array(result.slice(0, keyLen)) as Uint8Array<ArrayBuffer>,
    iv: new Uint8Array(result.slice(keyLen, keyLen + ivLen)) as Uint8Array<ArrayBuffer>,
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Encrypts a string using AES-256-CBC + EVP_BytesToKey,
 * producing output identical to CryptoJS.AES.encrypt(text, key).toString()
 */
export async function encryptQRCode(plaintext: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBytes = encoder.encode(SECRET_KEY) as Uint8Array<ArrayBuffer>
  const salt = crypto.getRandomValues(new Uint8Array(8)) as Uint8Array<ArrayBuffer>

  const { key, iv } = evpBytesToKey(passwordBytes, salt, 32, 16)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  )

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    encoder.encode(plaintext)
  )

  // Build: "Salted__" (8 bytes) + salt (8 bytes) + ciphertext
  const salted = encoder.encode('Salted__')
  const combined = new Uint8Array(salted.length + salt.length + ciphertext.byteLength)
  combined.set(salted, 0)
  combined.set(salt, salted.length)
  combined.set(new Uint8Array(ciphertext), salted.length + salt.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts a CryptoJS-compatible AES base64 string back to plaintext.
 */
export async function decryptQRCode(base64Ciphertext: string): Promise<string> {
  const encoder = new TextEncoder()
  const passwordBytes = encoder.encode(SECRET_KEY) as Uint8Array<ArrayBuffer>

  const raw = Uint8Array.from(atob(base64Ciphertext), (c) => c.charCodeAt(0)) as Uint8Array<ArrayBuffer>

  const header = String.fromCharCode(...raw.slice(0, 8))
  if (header !== 'Salted__') throw new Error('Invalid CryptoJS ciphertext format')

  const salt = raw.slice(8, 16) as Uint8Array<ArrayBuffer>
  const ciphertext = raw.slice(16) as Uint8Array<ArrayBuffer>

  const { key, iv } = evpBytesToKey(passwordBytes, salt, 32, 16)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  )

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}