document.addEventListener('DOMContentLoaded', function() {
  const urlInput = document.getElementById('url-input');
  const clearBtn = document.getElementById('clear-btn');
  const generateBtn = document.getElementById('generate-btn');
  const qrCard = document.getElementById('qr-card');
  const qrCode = document.getElementById('qr-code');
  const copyBtn = document.getElementById('copy-btn');
  const downloadBtn = document.getElementById('download-btn');
  const successMessage = document.getElementById('success-message');
  const spinner = generateBtn.querySelector('.spinner');
  const btnText = generateBtn.querySelector('.btn-text');

  // 输入框事件监听
  urlInput.addEventListener('input', function () {
    clearBtn.style.display = this.value ? 'flex' : 'none';
    generateBtn.disabled = !isValidUrl(this.value);
  });

  // 清除按钮事件
  clearBtn.addEventListener('click', function () {
    urlInput.value = '';
    clearBtn.style.display = 'none';
    generateBtn.disabled = true;
    qrCard.style.display = 'none';
  });

  // 动态加载脚本工具与确保库可用
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureQRCodeLib() {
    if (window.QRCode) return;
    const cdns = [
      // 同源本地文件（推荐将库放到仓库的 lib/qrcode.min.js）
      './lib/qrcode.min.js',
      '/lib/qrcode.min.js',
      // 备用 CDN（若 CSP/网络允许）
      'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
    ];
    for (const url of cdns) {
      try {
        await loadScript(url);
        if (window.QRCode) return;
      } catch (e) {
        console.warn('加载二维码库失败，尝试下一个源：', url, e);
      }
    }
    throw new Error('二维码库未加载（可能被 CSP 或网络拦截）');
  }

  // 生成二维码（前端本地生成，不再请求外部服务）
  generateBtn.addEventListener('click', async function () {
    const url = urlInput.value.trim();
    if (!url || !isValidUrl(url)) return;

    // 显示加载状态
    btnText.textContent = '生成中...';
    spinner.style.display = 'block';
    generateBtn.disabled = true;

    try {
      await ensureQRCodeLib();
      // 使用 qrcodejs 生成到临时容器，再提取 DataURL
      const temp = document.createElement('div');
      temp.style.position = 'absolute';
      temp.style.left = '-9999px';
      document.body.appendChild(temp);
      const qropts = { width: 256, height: 256, correctLevel: window.QRCode.CorrectLevel.M };
      const qrobj = new window.QRCode(temp, qropts);
      qrobj.makeCode(url);
      let dataUrl = '';
      const node = temp.querySelector('canvas, img');
      if (node && node.tagName.toLowerCase() === 'canvas') {
        dataUrl = node.toDataURL('image/png');
      } else if (node && node.tagName.toLowerCase() === 'img') {
        dataUrl = node.src;
      } else {
        throw new Error('生成器未返回图像/画布');
      }
      document.body.removeChild(temp);

      // 设置二维码图片（本地 data URL）
      qrCode.onerror = function () {
        alert('二维码图片被安全策略拦截，请在 CSP 的 img-src 中加入 data:');
      };
      qrCode.onload = null;
      qrCode.src = dataUrl;
      qrCard.style.display = 'block';
      qrCode.style.opacity = '1';
    } catch (error) {
      console.error('生成二维码失败:', error);
      alert('生成二维码失败：' + (error && error.message ? error.message : '请重试'));
    } finally {
      // 恢复按钮状态
      btnText.textContent = '生成二维码';
      spinner.style.display = 'none';
      generateBtn.disabled = false;
    }
  });

  // 复制二维码
  copyBtn.addEventListener('click', async function () {
    try {
      const response = await fetch(qrCode.src);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);

      // 显示成功消息
      successMessage.classList.add('show');
      setTimeout(() => {
        successMessage.classList.remove('show');
      }, 2000);
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动保存图片');
    }
  });

  // 下载二维码
  downloadBtn.addEventListener('click', function () {
    const link = document.createElement('a');
    link.href = qrCode.src;
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // 验证URL格式
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // 页面加载时聚焦输入框
  urlInput.focus();
});

