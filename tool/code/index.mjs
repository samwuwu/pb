// EmojiCrypt JS (ESM)
import { scrypt } from "scrypt-js";

export class BaseEmoji {
  constructor(alphabet) {
    const set = new Set(alphabet);
    if (set.size !== alphabet.length) throw new Error("Duplicate emoji");
    this.alphabet = alphabet;
    this.base = alphabet.length;
    this.toIndex = new Map(alphabet.map((e,i)=>[e,i]));
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

export function unpackFrame(buf) {
  let i=0;
  if (buf.length<2 || buf[0]!==MAGIC[0] || buf[1]!==MAGIC[1]) throw new Error("E_FORMAT");
  i=2;
  const [version,i2] = decVarInt(buf, i); i=i2;
  if (version!==0) throw new Error("E_BAD_VERSION");
  if (i>=buf.length) throw new Error("E_FORMAT");
  const mode = buf[i++];
  const [headerBlob, i3] = decVarBytes(buf, i); i=i3;
  const fields = new Map();
  let j = 0;
  while (j < headerBlob.length) {
    const tag = headerBlob[j++];
    const len = headerBlob[j++];
    const value = headerBlob.slice(j, j+len);
    fields.set(tag, value);
    j += len;
  }
  const [payload, i4] = decVarBytes(buf, i);
  return [version, mode, fields, headerBlob, payload];
}

export function encodeNoKey(text, alphabet) {
  const utf8 = new TextEncoder().encode(text);
  const crc = crc32(utf8);
  const fields = new Map([ [1, new Uint8Array([1])], [2, encVarInt(utf8.length)], [3, new Uint8Array([ (crc>>>24)&255, (crc>>>16)&255, (crc>>>8)&255, crc&255 ])] ]);
  const frame = packFrame(0, 0, fields, utf8);
  return alphabet.encodeBytesToEmoji(frame);
}

export function decodeNoKey(emojiStr, alphabet) {
  const raw = alphabet.decodeEmojiToBytes(emojiStr);
  const [version, mode, fields, headerBlob, payload] = unpackFrame(raw);
  if (mode!==0) throw new Error("E_FORMAT");
  const len = decVarInt(fields.get(2), 0)[0];
  const crc = crc32(payload);
  if (crc !== fields.get(3)) throw new Error("E_BAD_CHECKSUM");
  return new TextDecoder().decode(payload);
}
