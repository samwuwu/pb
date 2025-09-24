// Emoji/Base64 mapping and simple password-based rotation cipher.

const EMOJI_ALPHABET = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗',
  '😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐',
  '😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲',
  '😡','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱',
  '🥵','🥶'
];
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

const BASE64_INDEX = new Map([...BASE64_ALPHABET].map((c, i) => [c, i]));
const EMOJI_INDEX = new Map(EMOJI_ALPHABET.map((e, i) => [e, i]));

function toBase64(buffer) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer || buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function encodeBase64(text) {
  const buffer = new TextEncoder().encode(text);
  return toBase64(buffer);
}
export function decodeBase64(base64) {
  const buffer = fromBase64(base64);
  return new TextDecoder().decode(buffer);
}

export function computeShift(password) {
  let sum = 0;
  for (const ch of password) sum += ch.charCodeAt(0);
  return sum % 64;
}

export function encodeEmoji(text, password = '') {
  const b64 = encodeBase64(text);
  const shift = computeShift(password);
  const out = [];
  for (const ch of b64) {
    const index = BASE64_INDEX.get(ch);
    if (index === undefined) continue;
    if (index === 64) out.push(EMOJI_ALPHABET[64]);
    else out.push(EMOJI_ALPHABET[(index + shift) % 64]);
  }
  return out.join('');
}

export function decodeEmoji(emojiStr, password = '') {
  const shift = computeShift(password);
  const chars = [];
  for (const symbol of emojiStr) {
    if (/\s/.test(symbol)) continue;
    const idx = EMOJI_INDEX.get(symbol);
    if (idx === undefined) throw new Error('包含未知的表情符号，无法解密');
    if (idx === 64) chars.push('=');
    else chars.push(BASE64_ALPHABET[(idx - shift + 64) % 64]);
  }
  let b64 = chars.join('');
  while (b64.length % 4 !== 0) b64 += '=';
  return decodeBase64(b64);
}

// Optional exports for testing/diagnostics
export { EMOJI_ALPHABET, BASE64_ALPHABET };

