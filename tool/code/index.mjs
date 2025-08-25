// EmojiCrypt JS (ESM)
// NOTE: The original implementation attempted to import `scrypt` from
// `scrypt-js`, however this module is not available when loading this file
// directly in a browser and will trigger a resolution error.  Since the
// provided code uses PBKDF2 via WebCrypto rather than scrypt, we remove
// this import.  If you wish to use scrypt in the future you should
// bundle an appropriate implementation or adjust the import to a relative
// path.
// import { scrypt } from "scrypt-js";

export class BaseEmoji {
  constructor(alphabet) {
    // Remove any duplicate entries from the provided alphabet.  The JSON
    // alphabet supplied in this project may inadvertently contain duplicate
    // emoji, which would otherwise cause an exception and break the page.  To
    // recover gracefully we deduplicate here.  If duplicates are removed
    // the effective base will be smaller than the original list length.
    const deduped = [];
    const seen = new Set();
    for (const e of alphabet) {
      if (!seen.has(e)) {
        seen.add(e);
        deduped.push(e);
      }
    }
    if (deduped.length !== alphabet.length) {
      console.warn('Duplicate emoji removed from alphabet:', alphabet.length - deduped.length);
    }
    // Filter out complex emoji sequences (e.g. ZWJ sequences) because the
    // encoding/decoding logic treats each Unicode code point as a single
    // symbol.  Multi‑codepoint sequences would be split during decoding,
    // causing unknown symbols.  Only keep entries where iterating over the
    // string yields a single element.
    const filtered = [];
    for (const e of deduped) {
      // Using the string iterator yields full Unicode code points
      const count = [...e].length;
      if (count === 1) {
        filtered.push(e);
      } else {
        console.warn('Removed complex emoji from alphabet:', e);
      }
    }
    this.alphabet = filtered;
    this.base = filtered.length;
    this.toIndex = new Map(filtered.map((e, i) => [e, i]));
  }
  encodeBytesToEmoji(bytes) {
    if (!bytes || bytes.length===0) return "";
    let leading = 0;
    for (let b of bytes) { if (b===0) leading++; else break; }
    let n = BigInt(0);
    for (let b of bytes) n = (n<<8n) | BigInt(b);
    const digits = [];
    const B = BigInt(this.base);
    if (n === 0n) digits.push(this.alphabet[0]);
    else {
      while (n>0n) { const rem = Number(n % B); n = n / B; digits.push(this.alphabet[rem]); }
    }
    for (let i=0;i<leading;i++) digits.push(this.alphabet[0]);
    return digits.reverse().join("");
  }
  decodeEmojiToBytes(str) {
    if (!str || str.length===0) return new Uint8Array();
    let leading = 0;
    for (let ch of str) { if (ch===this.alphabet[0]) leading++; else break; }
    let n = 0n;
    const B = BigInt(this.base);
    for (let ch of str) {
      const idx = this.toIndex.get(ch);
      if (idx===undefined) throw new Error("E_DECODE");
      n = n * B + BigInt(idx);
    }
    // Convert BigInt to bytes
    let arr = [];
    while (n>0n) { arr.push(Number(n & 0xFFn)); n >>= 8n; }
    arr.reverse();
    const body = Uint8Array.from(arr);
    const zeros = new Uint8Array(leading);
    return new Uint8Array([...zeros, ...body]);
  }
}

// LEB128
export function encVarInt(x) {
  if (x<0) throw new Error("varint negative");
  const out = [];
  while (true) {
    let b = x & 0x7F;
    x >>>= 7;
    if (x) out.push(0x80|b); else { out.push(b); break; }
  }
  return new Uint8Array(out);
}
export function decVarInt(buf, idx=0) {
  let x=0, shift=0;
  while (true) {
    if (idx>=buf.length) throw new Error("E_FORMAT");
    const b = buf[idx++];
    x |= (b & 0x7F) << shift;
    if ((b & 0x80)===0) break;
    shift += 7;
    if (shift>63) throw new Error("E_FORMAT");
  }
  return [x, idx];
}
export const MAGIC = new Uint8Array([0xEC, 0xF1]);
export function encVarBytes(b) { const len = encVarInt(b.length); return new Uint8Array([...len, ...b]); }
export function decVarBytes(buf, idx) {
  const [ln, i2] = decVarInt(buf, idx);
  const end = i2 + ln;
  if (end > buf.length) throw new Error("E_FORMAT");
  return [buf.slice(i2, end), end];
}
const TAG_ALPHA=1, TAG_LEN=2, TAG_CRC32=3, TAG_KDFN=4, TAG_KDFR=5, TAG_KDFP=6, TAG_SALT=7, TAG_NONCE=8;

export function packHeader(fields) {
  const out = [];
  for (const [tag,val] of fields) {
    out.push(...encVarInt(tag));
    out.push(...encVarBytes(val));
  }
  return new Uint8Array(out);
}

export function packFrame(version, mode, headerFields, payload) {
  const headerBlob = packHeader(headerFields);
  const headerVar = encVarBytes(headerBlob);
  const payloadVar = encVarBytes(payload);
  return new Uint8Array([ ...MAGIC, ...encVarInt(version), mode, ...headerVar, ...payloadVar ]);
}

// -----------------------------------------------------------------------------
// CRC32 implementation
//
// The no‑key mode uses a CRC32 checksum to detect accidental corruption of the
// encoded frame.  The original code referenced a `crc32` function that was
// never implemented, which caused a runtime error.  This implementation
// constructs a lookup table on first use and computes the CRC over a
// Uint8Array input.  It returns a 32‑bit unsigned integer.
const CRC_TABLE = new Uint32Array(256);
let crcTableInited = false;
function initCrcTable() {
  if (crcTableInited) return;
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xEDB88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    CRC_TABLE[i] = c >>> 0;
  }
  crcTableInited = true;
}
function crc32(buf) {
  initCrcTable();
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

export function unpackFrame(buf) {
  let i=0;
  if (buf.length<2 || buf[0]!==MAGIC[0] || buf[1]!==MAGIC[1]) throw new Error("E_FORMAT");
  i=2;
  const [version,i2] = decVarInt(buf, i); i=i2;
  if (version!==0) throw new Error("E_BAD_VERSION");
  if (i>=buf.length) throw new Error("E_FORMAT");
  const mode = buf[i++];
  const [headerBlob, i3] = decVarBytes(buf, i); i=i3;
  // Decode the header into a map of tag -> Uint8Array values.  Each tag and
  // length is encoded as a LEB128 varint followed by the value bytes.  See
  // packHeader() for encoding details.
  const fields = new Map();
  let j = 0;
  while (j < headerBlob.length) {
    const [tag, tagEnd] = decVarInt(headerBlob, j);
    j = tagEnd;
    const [val, valEnd] = decVarBytes(headerBlob, j);
    fields.set(tag, val);
    j = valEnd;
  }
  const [payload, i4] = decVarBytes(buf, i);
  return [version, mode, fields, headerBlob, payload];
}

export function encodeNoKey(text, alphabet) {
  // Encode the input string as UTF‑8 bytes
  const utf8 = new TextEncoder().encode(text);
  // Compute CRC32 of the payload and convert to 4 bytes (big‑endian)
  const crc = crc32(utf8);
  const crcBytes = new Uint8Array([
    (crc >>> 24) & 0xFF,
    (crc >>> 16) & 0xFF,
    (crc >>> 8) & 0xFF,
    crc & 0xFF
  ]);
  // Build header fields: tag1 = alphabet version (1), tag2 = varint length, tag3 = CRC32
  const fields = new Map([
    [TAG_ALPHA, new Uint8Array([1])],
    [TAG_LEN, encVarInt(utf8.length)],
    [TAG_CRC32, crcBytes]
  ]);
  const frame = packFrame(0, 0, fields, utf8);
  return alphabet.encodeBytesToEmoji(frame);
}

export function decodeNoKey(emojiStr, alphabet) {
  const raw = alphabet.decodeEmojiToBytes(emojiStr);
  const [version, mode, fields, headerBlob, payload] = unpackFrame(raw);
  if (mode !== 0) throw new Error('E_FORMAT');
  // Validate length
  if (!fields.has(TAG_LEN)) throw new Error('E_FORMAT');
  const declaredLength = decVarInt(fields.get(TAG_LEN), 0)[0];
  if (declaredLength !== payload.length) throw new Error('E_FORMAT');
  // Validate CRC
  const crcBuf = fields.get(TAG_CRC32);
  if (!crcBuf || crcBuf.length !== 4) throw new Error('E_FORMAT');
  const storedCrc = ((crcBuf[0] << 24) | (crcBuf[1] << 16) | (crcBuf[2] << 8) | crcBuf[3]) >>> 0;
  const computedCrc = crc32(payload);
  if (storedCrc !== computedCrc) throw new Error('E_BAD_CHECKSUM');
  return new TextDecoder().decode(payload);
}

// -----------------------------------------------------------------------------
// Key derivation and authenticated encryption (AES‑GCM)
//
// The following functions implement a simple password‑based encryption mode
// compatible with the framing used in this module.  A random salt and nonce
// are generated for each operation.  The PBKDF2 algorithm built into the
// WebCrypto API is used to derive a 256‑bit key from the passphrase and
// salt.  AES‑GCM provides both confidentiality and integrity.  The
// encryption mode is identified by mode ID 1 in the packed frame.  On
// decryption the salt and nonce are extracted from the header, the same
// derivation is performed and the ciphertext is authenticated and decrypted.

// Derive a cryptographic key from a passphrase and salt using PBKDF2.
async function deriveAesKey(passphrase, salt, iterations = 100000) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string using a passphrase.  Returns an emoji string.
export async function encryptToEmoji(text, passphrase, alphabet) {
  const enc = new TextEncoder();
  const plaintext = enc.encode(text);
  // Generate random salt and nonce
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);
  const nonce = new Uint8Array(12);
  window.crypto.getRandomValues(nonce);
  const key = await deriveAesKey(passphrase, salt);
  const cipherBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    plaintext
  );
  const ciphertext = new Uint8Array(cipherBuf);
  const fields = new Map([
    [TAG_SALT, salt],
    [TAG_NONCE, nonce]
  ]);
  const frame = packFrame(0, 1, fields, ciphertext);
  return alphabet.encodeBytesToEmoji(frame);
}

// Decrypt an emoji string using a passphrase.  Throws on failure.
export async function decryptFromEmoji(emojiStr, passphrase, alphabet) {
  const raw = alphabet.decodeEmojiToBytes(emojiStr);
  const [version, mode, fields, headerBlob, payload] = unpackFrame(raw);
  if (mode !== 1) throw new Error('E_FORMAT');
  const salt = fields.get(TAG_SALT);
  const nonce = fields.get(TAG_NONCE);
  if (!salt || !nonce) throw new Error('E_FORMAT');
  const key = await deriveAesKey(passphrase, salt);
  try {
    const plainBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      payload
    );
    return new TextDecoder().decode(new Uint8Array(plainBuf));
  } catch (err) {
    throw new Error('E_AUTH');
  }
}
