import { encodeEmoji, decodeEmoji } from './emoji-cipher.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnEncrypt = document.getElementById('btnEncrypt');
  const btnDecrypt = document.getElementById('btnDecrypt');
  const slide = document.getElementById('slide');
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
      slide.style.transform = 'translateX(0)';
      if (indicator) indicator.style.transform = 'translateX(0%)';
      localStorage.setItem('mode', 'encrypt');
    } else {
      btnDecrypt.classList.add('active');
      btnEncrypt.classList.remove('active');
      slide.style.transform = 'translateX(-50%)';
      if (indicator) indicator.style.transform = 'translateX(100%)';
      localStorage.setItem('mode', 'decrypt');
    }
  }

  btnEncrypt.addEventListener('click', () => setActive('encrypt'));
  btnDecrypt.addEventListener('click', () => setActive('decrypt'));

  function handleShortcut(e) {
    if (!(e.metaKey || e.ctrlKey) || e.key !== 'Enter') return;
    if (btnEncrypt.classList.contains('active')) encryptBtn.click();
    else decryptBtn.click();
  }
  encryptInput.addEventListener('keydown', handleShortcut);
  encryptKey.addEventListener('keydown', handleShortcut);
  decryptInput.addEventListener('keydown', handleShortcut);
  decryptKey.addEventListener('keydown', handleShortcut);

  function attachCopyHandler(button, target) {
    button.addEventListener('click', () => {
      const text = target.value;
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板')).catch(() => showToast('复制失败'));
      } else {
        target.select();
        try { document.execCommand('copy'); showToast('已复制到剪贴板'); }
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
  function attachClear(btn, target) {
    btn.addEventListener('click', () => { target.value = ''; target.dispatchEvent(new Event('input')); });
  }
  attachPaste(btnPasteEnc, encryptInput);
  attachClear(btnClearEnc, encryptInput);
  attachPaste(btnPasteDec, decryptInput);
  attachClear(btnClearDec, decryptInput);

  encryptBtn.addEventListener('click', async () => {
    encryptError.textContent = '';
    encryptError.classList.remove('show');
    collapseOutput(encryptOutputContainer);
    if (encryptCount) { encryptCount.style.display = 'none'; encryptCount.textContent = ''; }
    const text = encryptInput.value.trim();
    const key = encryptKey.value;
    if (!text) { encryptError.textContent = '请输入要加密的内容'; encryptError.classList.add('show'); return; }
    encryptBtn.classList.add('loading');
    try {
      await new Promise(r => setTimeout(r, 150));
      const result = encodeEmoji(text, key);
      encryptOutput.value = result;
      if (encryptCount) {
        const count = Array.from(result).length;
        encryptCount.textContent = '共生成 ' + count + ' 个表情符号';
        encryptCount.style.display = 'block';
      }
      expandOutput(encryptOutputContainer);
    } catch (err) {
      encryptError.textContent = '加密过程中发生错误：' + err.message;
      encryptError.classList.add('show');
    } finally { encryptBtn.classList.remove('loading'); }
  });

  decryptBtn.addEventListener('click', async () => {
    decryptError.textContent = '';
    decryptError.classList.remove('show');
    collapseOutput(decryptOutputContainer);
    const raw = decryptInput.value.trim();
    const text = (ignoreWhitespace && ignoreWhitespace.checked) ? raw.replace(/\s+/g, '') : raw;
    const key = decryptKey.value;
    if (!text) { decryptError.textContent = '请输入要解密的内容'; decryptError.classList.add('show'); return; }
    decryptBtn.classList.add('loading');
    try {
      await new Promise(r => setTimeout(r, 150));
      const result = decodeEmoji(text, key);
      decryptOutput.value = result;
      expandOutput(decryptOutputContainer);
    } catch (err) {
      decryptError.textContent = err.message || '解密过程中发生错误';
      decryptError.classList.add('show');
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

