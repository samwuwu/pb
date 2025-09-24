// Standalone app script for encryption.html without ES module imports.
// Includes emoji cipher + UI logic in one file to avoid module loader and MIME issues.

(function () {
  // --- Emoji/Base64 mapping and simple password-based rotation cipher ---
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
  function encodeBase64(text) { return toBase64(new TextEncoder().encode(text)); }
  function decodeBase64(base64) { return new TextDecoder().decode(fromBase64(base64)); }
  function computeShift(password) { let sum = 0; for (const ch of password) sum += ch.charCodeAt(0); return sum % 64; }
  function encodeEmoji(text, password = '') {
    const b64 = encodeBase64(text); const shift = computeShift(password); const out = [];
    for (const ch of b64) { const idx = BASE64_INDEX.get(ch); if (idx === undefined) continue; out.push(idx === 64 ? EMOJI_ALPHABET[64] : EMOJI_ALPHABET[(idx + shift) % 64]); }
    return out.join('');
  }
  function decodeEmoji(emojiStr, password = '') {
    const shift = computeShift(password); const chars = [];
    for (const symbol of emojiStr) { if (/\s/.test(symbol)) continue; const idx = EMOJI_INDEX.get(symbol); if (idx === undefined) throw new Error('包含未知的表情符号，无法解密'); chars.push(idx === 64 ? '=' : BASE64_ALPHABET[(idx - shift + 64) % 64]); }
    let b64 = chars.join(''); while (b64.length % 4 !== 0) b64 += '='; return decodeBase64(b64);
  }

  // --- UI wiring ---
  document.addEventListener('DOMContentLoaded', () => {
    // playful favicon (optional)
    try {
      document.title = document.title.replace(/^🍊\s*/, '');
      document.title = '🍊 ' + document.title;
      const iconCanvas = document.createElement('canvas');
      const size = 64; iconCanvas.width = size; iconCanvas.height = size;
      const ctx = iconCanvas.getContext('2d');
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '48px system-ui, -apple-system, Segoe UI Emoji, Noto Color Emoji, sans-serif';
      ctx.fillText('🍊', size / 2, size / 2 + 2);
      const link = document.createElement('link'); link.rel = 'icon'; link.href = iconCanvas.toDataURL('image/png');
      const old = document.querySelector('link[rel="icon"]'); if (old) old.remove(); document.head.appendChild(link);
    } catch (_) {}

    const btnEncrypt = document.getElementById('btnEncrypt');
    const btnDecrypt = document.getElementById('btnDecrypt');
    const panelEncrypt = document.getElementById('panelEncrypt');
    const panelDecrypt = document.getElementById('panelDecrypt');
    const encryptInput = document.getElementById('encryptInput');
    const encryptKey = document.getElementById('encryptKey');
    const encryptBtn = document.getElementById('encryptBtn');
    const encryptError = document.getElementById('encryptError');
    const encryptOutputContainer = document.getElementById('encryptOutputContainer');
    const encryptOutput = document.getElementById('encryptOutput');
    const copyEncrypt = document.getElementById('copyEncrypt');
    const encryptCount = document.getElementById('encryptCount');
    const decryptInput = document.getElementById('decryptInput');
    const decryptKey = document.getElementById('decryptKey');
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptError = document.getElementById('decryptError');
    const decryptOutputContainer = document.getElementById('decryptOutputContainer');
    const decryptOutput = document.getElementById('decryptOutput');
    const copyDecrypt = document.getElementById('copyDecrypt');
    const toast = document.getElementById('toast');
    const ignoreWhitespace = document.getElementById('ignoreWhitespace');
    const btnPasteEnc = document.getElementById('btnPasteEnc');
    const btnClearEnc = document.getElementById('btnClearEnc');
    const btnPasteDec = document.getElementById('btnPasteDec');
    const btnClearDec = document.getElementById('btnClearDec');

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
    }
    function expandOutput(container) {
      container.classList.add('show');
      requestAnimationFrame(() => { container.style.maxHeight = container.scrollHeight + 'px'; });
    }
    function collapseOutput(container) {
      container.style.maxHeight = '0px';
      container.classList.remove('show');
    }

    function setActive(tab) {
      const indicator = document.getElementById('toggleIndicator');
      if (tab === 'encrypt') {
        btnEncrypt.classList.add('active');
        btnDecrypt.classList.remove('active');
        panelEncrypt.classList.add('active');
        panelDecrypt.classList.remove('active');
        if (indicator) indicator.style.transform = 'translateX(0%)';
        localStorage.setItem('mode', 'encrypt');
      } else {
        btnDecrypt.classList.add('active');
        btnEncrypt.classList.remove('active');
        panelEncrypt.classList.remove('active');
        panelDecrypt.classList.add('active');
        if (indicator) indicator.style.transform = 'translateX(100%)';
        localStorage.setItem('mode', 'decrypt');
      }
    }
    btnEncrypt.addEventListener('click', () => setActive('encrypt'));
    btnDecrypt.addEventListener('click', () => setActive('decrypt'));

    function handleShortcut(e) {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return;
      if (btnEncrypt.classList.contains('active')) encryptBtn.click(); else decryptBtn.click();
    }
    encryptInput.addEventListener('keydown', handleShortcut);
    encryptKey.addEventListener('keydown', handleShortcut);
    decryptInput.addEventListener('keydown', handleShortcut);
    decryptKey.addEventListener('keydown', handleShortcut);

    function attachCopyHandler(button, target) {
      const originalHTML = button.innerHTML;
      function flashCopied() {
        button.classList.add('copied');
        button.disabled = true;
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>已复制';
        clearTimeout(flashCopied._t);
        flashCopied._t = setTimeout(() => {
          button.classList.remove('copied');
          button.disabled = false;
          button.innerHTML = originalHTML;
        }, 1200);
      }
      button.addEventListener('click', () => {
        const text = target.value;
        if (!text) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)
            .then(() => { flashCopied(); showToast('已复制到剪贴板'); })
            .catch(() => showToast('复制失败'));
        } else {
          target.select();
          try { document.execCommand('copy'); flashCopied(); showToast('已复制到剪贴板'); }
          catch { showToast('复制失败'); }
        }
      });
    }
    attachCopyHandler(copyEncrypt, encryptOutput);
    attachCopyHandler(copyDecrypt, decryptOutput);

    function attachPaste(btn, target) {
      btn.addEventListener('click', async () => {
        if (navigator.clipboard && navigator.clipboard.readText) {
          try { const text = await navigator.clipboard.readText(); target.value = text; target.dispatchEvent(new Event('input')); showToast('已粘贴'); }
          catch { showToast('无法读取剪贴板'); }
        } else { showToast('不支持剪贴板 API'); }
      });
    }
    function attachClear(btn, target) { btn.addEventListener('click', () => { target.value = ''; target.dispatchEvent(new Event('input')); }); }
    attachPaste(btnPasteEnc, encryptInput); attachClear(btnClearEnc, encryptInput);
    attachPaste(btnPasteDec, decryptInput); attachClear(btnClearDec, decryptInput);

    encryptBtn.addEventListener('click', async () => {
      encryptError.textContent = ''; encryptError.classList.remove('show'); collapseOutput(encryptOutputContainer);
      if (encryptCount) { encryptCount.style.display = 'none'; encryptCount.textContent = ''; }
      const text = encryptInput.value.trim(); const key = encryptKey.value;
      if (!text) { encryptError.textContent = '请输入要加密的内容'; encryptError.classList.add('show'); return; }
      encryptBtn.classList.add('loading');
      try {
        await new Promise(r => setTimeout(r, 150));
        const result = encodeEmoji(text, key);
        encryptOutput.value = result;
        if (encryptCount) { const count = Array.from(result).length; encryptCount.textContent = '共生成 ' + count + ' 个表情符号'; encryptCount.style.display = 'block'; }
        expandOutput(encryptOutputContainer);
      } catch (err) {
        encryptError.textContent = '加密过程中发生错误：' + (err && err.message || String(err)); encryptError.classList.add('show');
      } finally { encryptBtn.classList.remove('loading'); }
    });

    decryptBtn.addEventListener('click', async () => {
      decryptError.textContent = ''; decryptError.classList.remove('show'); collapseOutput(decryptOutputContainer);
      const raw = decryptInput.value.trim(); const text = (ignoreWhitespace && ignoreWhitespace.checked) ? raw.replace(/\s+/g, '') : raw; const key = decryptKey.value;
      if (!text) { decryptError.textContent = '请输入要解密的内容'; decryptError.classList.add('show'); return; }
      decryptBtn.classList.add('loading');
      try {
        await new Promise(r => setTimeout(r, 150));
        const result = decodeEmoji(text, key); decryptOutput.value = result; expandOutput(decryptOutputContainer);
      } catch (err) {
        decryptError.textContent = (err && err.message) || '解密过程中发生错误'; decryptError.classList.add('show');
      } finally { decryptBtn.classList.remove('loading'); }
    });

    const savedMode = localStorage.getItem('mode');
    const savedEnc = localStorage.getItem('encInput');
    const savedDec = localStorage.getItem('decInput');
    if (typeof savedEnc === 'string') encryptInput.value = savedEnc;
    if (typeof savedDec === 'string') decryptInput.value = savedDec;
    if (savedMode === 'decrypt') setActive('decrypt'); else setActive('encrypt');
    encryptInput.addEventListener('input', () => localStorage.setItem('encInput', encryptInput.value));
    decryptInput.addEventListener('input', () => localStorage.setItem('decInput', decryptInput.value));
  });
})();

