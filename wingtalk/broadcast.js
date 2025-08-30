class BroadcastSystem {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playButtons = document.querySelectorAll('.play-btn');
        this.stopBtn = document.getElementById('stopBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.currentTrack = document.getElementById('currentTrack');
        this.currentTime = document.getElementById('currentTime');
        this.duration = document.getElementById('duration');
        this.progressFill = document.getElementById('progressFill');
        this.playingStatus = document.getElementById('playingStatus');
        this.playingIcon = document.querySelector('.playing-icon i');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.selectedFiles = document.getElementById('selectedFiles');
        
        this.currentButton = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.uploadedFiles = [];
        
        this.init();
    }
    
    init() {
        // 绑定播放按钮事件
        this.playButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handlePlayClick(e));
        });
        
        // 绑定情景标签页事件
        this.sceneTabs = document.querySelectorAll('.scene-tab');
        this.sceneTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleSceneTabClick(e));
        });
        
        // 绑定停止按钮事件
        this.stopBtn.addEventListener('click', () => this.stopPlayback());
        
        // 绑定音量控制事件
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e));
        
        // 绑定音频播放器事件
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioPlayer.addEventListener('ended', () => this.handleTrackEnd());
        this.audioPlayer.addEventListener('error', (e) => this.handleError(e));
        
        // 绑定文件选择事件
        this.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // 设置初始音量
        this.audioPlayer.volume = 0.5;
        
        // 添加页面加载动画
        this.addLoadingAnimations();
        
        // 添加键盘快捷键支持
        this.addKeyboardSupport();
        
        // 添加拖拽上传支持
        this.addDragDropSupport();
        
        // 初始化情景选择
        this.initSceneSelector();
    }
    
    handlePlayClick(e) {
        const button = e.currentTarget;
        const audioSrc = button.dataset.audio;
        const trackTitle = button.dataset.title;
        
        // 如果点击的是当前正在播放的按钮
        if (this.currentButton === button) {
            if (this.isPlaying) {
                this.pausePlayback();
            } else {
                this.resumePlayback();
            }
            return;
        }
        
        // 停止当前播放
        if (this.isPlaying) {
            this.stopPlayback();
        }
        
        // 开始新的播放
        this.startPlayback(button, audioSrc, trackTitle);
    }
    
    startPlayback(button, audioSrc, trackTitle) {
        try {
            // 如果有其他音频在播放，先停止
            if (this.isPlaying && this.currentButton !== button) {
                this.stopPlayback();
            }
            
            // 设置音频源和标题
            if (audioSrc) {
                this.audioPlayer.src = audioSrc;
            }
            if (trackTitle) {
                this.currentTrack.textContent = trackTitle;
            }
            
            // 播放音频
            this.audioPlayer.play().then(() => {
                this.isPlaying = true;
                this.isPaused = false;
                this.currentButton = button;
                this.updateButtonState(button, true);
                this.playingStatus.textContent = '正在播放';
                this.playingIcon.className = 'fas fa-music';
                
                // 添加脉冲效果
                if (button) {
                    this.addPulseEffect(button);
                }
            }).catch(error => {
                console.error('播放失败:', error);
                this.handleError(error);
            });
        } catch (error) {
            console.error('启动播放失败:', error);
            this.handleError(error);
        }
    }
    
    pausePlayback() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.isPaused = true;
        this.playingStatus.textContent = '已暂停';
        
        // 更新按钮状态
        if (this.currentButton) {
            const icon = this.currentButton.querySelector('i');
            icon.className = 'fas fa-play';
            this.currentButton.querySelector('.btn-text').textContent = '播放';
        }
        
        // 移除播放动画
        this.playingIcon.classList.remove('playing-animation');
    }
    
    resumePlayback() {
        this.audioPlayer.play()
            .then(() => {
                this.isPlaying = true;
                this.isPaused = false;
                this.playingStatus.textContent = '正在播放...';
                
                // 更新按钮状态
                if (this.currentButton) {
                    const icon = this.currentButton.querySelector('i');
                    icon.className = 'fas fa-pause';
                    this.currentButton.querySelector('.btn-text').textContent = '暂停';
                }
                
                // 添加播放动画
                this.playingIcon.classList.add('playing-animation');
            })
            .catch(error => {
                console.error('恢复播放失败:', error);
                this.playingStatus.textContent = '播放失败';
            });
    }
    
    stopPlayback() {
        // 停止音频
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        
        // 重置状态
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTrack.textContent = '准备播放...';
        this.playingStatus.textContent = '等待中';
        
        // 重置进度条
        this.progressFill.style.width = '0%';
        this.currentTime.textContent = '0:00';
        
        // 重置按钮状态
        if (this.currentButton) {
            this.updateButtonState(this.currentButton, false);
        }
        
        // 移除播放动画
        this.playingIcon.classList.remove('playing-animation');
        
        this.currentButton = null;
    }
    
    updateButtonState(button, isPlaying) {
        const icon = button.querySelector('i');
        const btnText = button.querySelector('.btn-text');
        
        if (isPlaying) {
            button.classList.add('playing');
            icon.className = 'fas fa-pause';
            btnText.textContent = '暂停';
            
            // 添加脉冲动画
            this.addPulseEffect(button);
        } else {
            button.classList.remove('playing');
            icon.className = 'fas fa-play';
            btnText.textContent = '播放';
        }
    }
    
    updateVolume(e) {
        const volume = e.target.value / 100;
        this.audioPlayer.volume = volume;
        this.volumeValue.textContent = e.target.value + '%';
        
        // 更新音量滑块的视觉效果
        const percentage = e.target.value;
        e.target.style.background = `linear-gradient(90deg, #40e0d0 0%, #40e0d0 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
    }
    
    updateProgress() {
        if (this.audioPlayer.duration) {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.progressFill.style.width = progress + '%';
            this.currentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }
    
    updateDuration() {
        this.duration.textContent = this.formatTime(this.audioPlayer.duration);
    }
    
    handleTrackEnd() {
        this.playingStatus.textContent = '播放完成';
        this.isPlaying = false;
        
        // 重置按钮状态
        if (this.currentButton) {
            this.updateButtonState(this.currentButton, false);
        }
        
        // 移除播放动画
        this.playingIcon.classList.remove('playing-animation');
        
        // 重置进度条
        setTimeout(() => {
            this.progressFill.style.width = '0%';
            this.currentTime.textContent = '0:00';
            this.currentTrack.textContent = '准备播放...';
            this.playingStatus.textContent = '等待中';
        }, 1000);
    }
    
    handleError(e) {
        console.error('音频播放错误:', e);
        this.playingStatus.textContent = '加载失败';
        
        if (this.currentButton) {
            this.updateButtonState(this.currentButton, false);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
    
    addPulseEffect(button) {
        // 创建脉冲动画元素
        const pulse = document.createElement('div');
        pulse.style.position = 'absolute';
        pulse.style.top = '50%';
        pulse.style.left = '50%';
        pulse.style.width = '0';
        pulse.style.height = '0';
        pulse.style.background = 'rgba(64, 224, 208, 0.6)';
        pulse.style.borderRadius = '50%';
        pulse.style.transform = 'translate(-50%, -50%)';
        pulse.style.animation = 'pulseEffect 2s ease-out';
        pulse.style.pointerEvents = 'none';
        pulse.style.zIndex = '0';
        
        button.appendChild(pulse);
        
        // 动画结束后移除元素
        setTimeout(() => {
            if (pulse.parentNode) {
                pulse.parentNode.removeChild(pulse);
            }
        }, 2000);
    }
    
    addLoadingAnimations() {
        // 为广播卡片添加渐入动画
        const cards = document.querySelectorAll('.broadcast-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
        
        // 为播放器区域添加延迟动画
        const nowPlaying = document.querySelector('.now-playing');
        nowPlaying.style.animationDelay = `${cards.length * 0.1 + 0.2}s`;
        nowPlaying.classList.add('fade-in');
    }
    
    addKeyboardSupport() {
        // 空格键暂停/播放
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target !== this.volumeSlider) {
                e.preventDefault();
                
                if (this.isPlaying) {
                    this.pausePlayback();
                } else if (this.isPaused) {
                    this.resumePlayback();
                } else if (this.currentButton) {
                    this.resumePlayback();
                }
            }
            
            // S键停止播放
            if (e.code === 'KeyS') {
                this.stopPlayback();
            }
            
            // 上下箭头调节音量
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                const currentVolume = parseInt(this.volumeSlider.value);
                const newVolume = Math.min(100, currentVolume + 5);
                this.volumeSlider.value = newVolume;
                this.updateVolume({ target: this.volumeSlider });
            }
            
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                const currentVolume = parseInt(this.volumeSlider.value);
                const newVolume = Math.max(0, currentVolume - 5);
                this.volumeSlider.value = newVolume;
                this.updateVolume({ target: this.volumeSlider });
            }
        });    }
    
    // 处理文件选择
    handleFileSelect(event) {
        event.preventDefault();
        const files = Array.from(event.target.files);
        if (files.length === 0) {
            this.showNotification('请选择音频文件', 'warning');
            return;
        }
        console.log('选择的文件:', files);
        this.addFiles(files);
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }
    
    // 添加文件到列表
    addFiles(files) {
        files.forEach(file => {
            console.log('处理文件:', file.name, file.type, file.size);
            if (this.isAudioFile(file)) {
                try {
                    // 处理中文文件名编码
                    const fileName = this.decodeFileName(file.name);
                    const fileUrl = URL.createObjectURL(file);
                    
                    const fileData = {
                        id: Date.now() + Math.random(),
                        file: file,
                        name: fileName,
                        originalName: file.name,
                        size: this.formatFileSize(file.size),
                        url: fileUrl,
                        isLocalFile: true
                    };
                    
                    this.uploadedFiles.push(fileData);
                    this.renderFileItem(fileData);
                    
                    console.log('文件添加成功:', fileName);
                } catch (error) {
                    console.error('文件处理失败:', error);
                    this.showNotification(`文件 "${file.name}" 处理失败`, 'error');
                }
            } else {
                this.showNotification(`文件 "${file.name}" 不是支持的音频格式`, 'warning');
            }
        });
    }
    
    // 解码文件名（处理中文编码问题）
    decodeFileName(fileName) {
        try {
            // 尝试解码URL编码的文件名
            if (fileName.includes('%')) {
                return decodeURIComponent(fileName);
            }
            // 尝试处理UTF-8编码
            const decoder = new TextDecoder('utf-8');
            const encoder = new TextEncoder();
            const encoded = encoder.encode(fileName);
            const decoded = decoder.decode(encoded);
            return decoded;
        } catch (error) {
            console.warn('文件名解码失败，使用原始文件名:', error);
            return fileName;
        }
    }
    
    // 检查是否为音频文件
    isAudioFile(file) {
        const audioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/x-wav', 'audio/x-m4a'];
        const fileName = file.name.toLowerCase();
        
        // 检查MIME类型
        if (file.type && audioTypes.includes(file.type)) {
            return true;
        }
        
        // 检查文件扩展名
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];
        return audioExtensions.some(ext => fileName.endsWith(ext));
    }
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 渲染文件项
    renderFileItem(fileData) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item custom-file-item';
        fileItem.dataset.fileId = fileData.id;
        
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas fa-music"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${fileData.name}</div>
                <div class="file-size">${fileData.size} • 本地文件</div>
            </div>
            <div class="file-actions">
                <button class="file-play-btn" onclick="broadcastSystem.playFile('${fileData.id}')">
                    <i class="fas fa-play"></i>
                </button>
                <button class="file-remove-btn" onclick="broadcastSystem.removeFile('${fileData.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        this.selectedFiles.appendChild(fileItem);
        
        // 添加文件加载完成提示
        this.showNotification(`文件 "${fileData.name}" 已加载，可直接播放`);
    }
    
    // 播放指定文件
    playFile(fileId) {
        const fileData = this.uploadedFiles.find(f => f.id == fileId);
        if (!fileData) return;
        
        console.log('播放文件:', fileData);
        
        // 停止当前播放
        this.stopPlayback();
        
        // 设置新的音频源
        this.audioPlayer.src = fileData.url;
        
        // 使用解码后的文件名显示
        const displayName = fileData.name || fileData.originalName;
        this.currentTrack.textContent = displayName;
        
        // 更新当前按钮
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!fileItem) {
            this.showNotification('找不到对应的文件项', 'error');
            return;
        }
        
        const playBtn = fileItem.querySelector('.file-play-btn');
        if (!playBtn) {
            this.showNotification('找不到播放按钮', 'error');
            return;
        }
        
        this.currentButton = playBtn;
        
        // 添加错误处理
        this.audioPlayer.onerror = (e) => {
            console.error('音频播放错误:', e);
            this.showNotification('音频文件播放失败，请检查文件格式', 'error');
            this.updateButtonState(playBtn, false);
        };
        
        // 开始播放
        this.startPlayback();
    }
    
    // 移除文件
    removeFile(fileId) {
        const fileIndex = this.uploadedFiles.findIndex(f => f.id == fileId);
        if (fileIndex === -1) return;
        
        const fileData = this.uploadedFiles[fileIndex];
        
        // 如果正在播放这个文件，先停止
        if (this.audioPlayer.src === fileData.url) {
            this.stopPlayback();
        }
        
        // 释放URL对象
        if (fileData.url) {
            URL.revokeObjectURL(fileData.url);
        }
        
        // 从数组中移除
        this.uploadedFiles.splice(fileIndex, 1);
        
        // 从DOM中移除
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.remove();
        }
        
        this.showNotification(`文件 "${fileData.name}" 已移除`);
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 自动移除通知
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 添加拖拽上传支持
    addDragDropSupport() {
        const uploadArea = document.querySelector('.file-upload-area');
        if (!uploadArea) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
        });
        
        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.addFiles(files);
        }, false);
    }
    
    // iOS Safari 强力文件选择
    forceIOSFileSelect() {
        console.log('开始 iOS Safari 强力文件选择');
        
        try {
            // 方案1: 使用动态创建的 input
            this.createDynamicFileInput('audio/*,.mp3,.wav,.ogg,.m4a,.aac');
        } catch (error) {
            console.error('方案1失败:', error);
            
            try {
                // 方案2: 分阶段触发
                this.phasedTriggerFileSelect();
            } catch (error2) {
                console.error('方案2失败:', error2);
                
                // 方案3: 显示用户指导
                this.showiOSFileSelectionGuide();
            }
        }
    }
    
    // 创建动态文件输入元素
    createDynamicFileInput(accept) {
        console.log('创建动态文件输入:', accept);
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = accept;
        fileInput.multiple = true;
        fileInput.style.cssText = 'position: fixed; top: -9999px; left: -9999px; opacity: 0; width: 1px; height: 1px;';
        
        const changeHandler = (e) => {
            console.log('动态文件输入触发:', e.target.files);
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                setTimeout(() => {
                    this.addFiles(files);
                }, 50);
            }
            document.body.removeChild(fileInput);
        };
        
        fileInput.addEventListener('change', changeHandler);
        document.body.appendChild(fileInput);
        
        // 多次触发尝试
        setTimeout(() => fileInput.click(), 10);
        setTimeout(() => fileInput.click(), 100);
        setTimeout(() => fileInput.click(), 300);
        
        // 设置超时清理
        setTimeout(() => {
            if (document.body.contains(fileInput)) {
                document.body.removeChild(fileInput);
            }
        }, 5000);
    }
    
    // 分阶段触发文件选择
    phasedTriggerFileSelect() {
        return new Promise((resolve, reject) => {
            console.log('开始分阶段文件选择');
            
            const phase1 = () => {
                try {
                    const input1 = this.createHiddenFileInput('audio/mp3,audio/mpeg');
                    if (input1) {
                        this.checkFileInputSuccess(input1, phase2, reject);
                    } else {
                        phase2();
                    }
                } catch (error) {
                    console.error('阶段1失败:', error);
                    phase2();
                }
            };
            
            const phase2 = () => {
                try {
                    const input2 = this.createHiddenFileInput('audio/*,.mp3,.wav,.ogg');
                    if (input2) {
                        this.checkFileInputSuccess(input2, phase3, reject);
                    } else {
                        phase3();
                    }
                } catch (error) {
                    console.error('阶段2失败:', error);
                    phase3();
                }
            };
            
            const phase3 = () => {
                try {
                    const input3 = this.createHiddenFileInput('*/*');
                    if (input3) {
                        this.checkFileInputSuccess(input3, resolve, reject);
                    } else {
                        reject(new Error('所有文件选择方案都失败'));
                    }
                } catch (error) {
                    console.error('阶段3失败:', error);
                    reject(error);
                }
            };
            
            phase1();
        });
    }
    
    // 创建隐藏的文件输入
    createHiddenFileInput(accept) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.style.cssText = 'position: fixed; top: -9999px; left: -9999px; opacity: 0; width: 1px; height: 1px;';
        
        const handler = () => {
            input.removeEventListener('change', handler);
            return input;
        };
        
        input.addEventListener('change', handler);
        document.body.appendChild(input);
        input.click();
        
        // 如果5秒内没有响应，返回null
        setTimeout(() => {
            if (document.body.contains(input) && !input.value) {
                document.body.removeChild(input);
                return null;
            }
        }, 5000);
        
        return handler;
    }
    
    // 检查文件输入是否成功
    checkFileInputSuccess(input, successCallback, rejectCallback) {
        const checkInterval = setInterval(() => {
            if (input.value) {
                clearInterval(checkInterval);
                successCallback(input);
            }
        }, 100);
        
        // 5秒后检查
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!input.value) {
                if (document.body.contains(input)) {
                    document.body.removeChild(input);
                }
                rejectCallback(new Error('文件选择超时'));
            }
        }, 5000);
    }
    
    // 显示iOS文件选择指导
    showiOSFileSelectionGuide() {
        console.log('显示iOS文件选择指导');
        
        const guide = document.createElement('div');
        guide.className = 'ios-file-guide';
        guide.innerHTML = `
            <div class="guide-container">
                <div class="guide-icon">
                    <i class="fab fa-apple"></i>
                </div>
                <h3>iOS Safari 文件选择指南</h3>
                <div class="guide-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <h4>点击"从音乐库选择"</h4>
                            <p>选择iOS音乐应用中的音频文件</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <h4>点击"从文件选择"</h4>
                            <p>使用iOS文件管理器选择文件</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <h4>拖拽文件</h4>
                            <p>将音频文件拖拽到下方区域</p>
                        </div>
                    </div>
                </div>
                <div class="guide-tips">
                    <h4>提示：</h4>
                    <ul>
                        <li>请确保允许Safari访问文件</li>
                        <li>支持的格式：MP3、WAV、OGG、M4A、AAC</li>
                        <li>如果仍然无法选择，请尝试重启Safari</li>
                    </ul>
                </div>
                <button class="guide-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                    关闭
                </button>
            </div>
        `;
        
        document.body.appendChild(guide);
        
        // 自动关闭
        const autoClose = setTimeout(() => {
            if (document.body.contains(guide)) {
                guide.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(guide)) {
                        document.body.removeChild(guide);
                    }
                }, 300);
            }
        }, 30000);
        
        // 点击关闭时清除自动关闭
        const closeBtn = guide.querySelector('.guide-close');
        closeBtn.onclick = () => {
            clearTimeout(autoClose);
            if (document.body.contains(guide)) {
                document.body.removeChild(guide);
            }
        };
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // 处理情景标签页点击
    handleSceneTabClick(e) {
        const tab = e.currentTarget;
        const sceneName = tab.dataset.scene;
        
        // 更新标签页状态
        this.sceneTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 更新情景面板显示
        const scenePanels = document.querySelectorAll('.scene-panel');
        scenePanels.forEach(panel => {
            if (panel.dataset.scene === sceneName) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
        
        // 添加切换动画效果
        this.addSceneTransitionEffect(sceneName);
    }
    
    // 初始化情景选择器
    initSceneSelector() {
        // 默认显示第一个情景
        const firstTab = this.sceneTabs[0];
        if (firstTab) {
            firstTab.classList.add('active');
        }
        
        const firstPanel = document.querySelector('.scene-panel');
        if (firstPanel) {
            firstPanel.classList.add('active');
        }
        
        // 优化移动端文件选择体验
        this.optimizeMobileFileSelection();
    }
    
    // 添加情景切换动画效果
    addSceneTransitionEffect(sceneName) {
        const activePanel = document.querySelector('.scene-panel.active');
        if (activePanel) {
            // 移除所有动画类
            activePanel.classList.remove('scene-transition-in');
            // 强制重绘
            activePanel.offsetHeight;
            // 添加动画类
            activePanel.classList.add('scene-transition-in');
        }
    }
    
    // 优化移动端文件选择体验
    optimizeMobileFileSelection() {
        // 检测设备类型
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = isIOS || isAndroid;
        
        console.log('设备检测:', { isIOS, isAndroid, isMobile, userAgent });
        
        // 检测iOS版本
        const iOSVersion = isIOS ? this.getIOSVersion(userAgent) : null;
        console.log('iOS版本:', iOSVersion);
        
        // 显示对应的文件选择界面
        this.setupFileSelectionInterface(isIOS, isAndroid);
        
        const fileInput = document.getElementById('audioFileInput');
        if (!fileInput) {
            console.error('找不到文件输入元素');
            return;
        }
        
        // 移除可能存在的旧事件监听器
        fileInput.removeEventListener('change', this.handleFileSelectBound);
        this.handleFileSelectBound = this.handleFileSelect.bind(this);
        fileInput.addEventListener('change', this.handleFileSelectBound);
        
        // 根据设备类型优化文件输入
        this.optimizeFileInputForDevice(fileInput, isIOS, isAndroid, iOSVersion);
        
        // 添加拖拽支持
        this.setupDragAndDrop();
        
        console.log('文件选择器初始化完成');
    }
    
    // 获取iOS版本
    getIOSVersion(userAgent) {
        const iosMatch = userAgent.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
        if (iosMatch) {
            return parseInt(iosMatch[1]);
        }
        return null;
    }
    
    // 设置文件选择界面
    setupFileSelectionInterface(isIOS, isAndroid) {
        const iosArea = document.getElementById('iosFileUploadArea');
        const standardArea = document.getElementById('standardFileUploadArea');
        const dropZone = document.getElementById('dropZone');
        
        if (isIOS) {
            // iOS设备：显示iOS专用界面
            if (iosArea) iosArea.style.display = 'block';
            if (standardArea) standardArea.style.display = 'none';
            if (dropZone) dropZone.style.display = 'none';
            
            console.log('显示iOS专用文件选择界面');
        } else {
            // 非iOS设备：显示标准界面
            if (iosArea) iosArea.style.display = 'none';
            if (standardArea) standardArea.style.display = 'block';
            if (dropZone) dropZone.style.display = 'flex';
            
            console.log('显示标准文件选择界面');
        }
    }
    
    // 根据设备类型优化文件输入
    optimizeFileInputForDevice(fileInput, isIOS, isAndroid, iOSVersion) {
        // 基础音频文件类型
        const audioTypes = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac';
        
        if (isIOS) {
            // iOS特殊处理
            fileInput.setAttribute('accept', audioTypes);
            fileInput.removeAttribute('capture');
            
            // iOS 13+ 支持更好的文件选择
            if (iOSVersion && iOSVersion >= 13) {
                fileInput.setAttribute('webkitdirectory', '');
                fileInput.setAttribute('multiple', '');
            }
            
            // 添加iOS特定的点击处理
            fileInput.addEventListener('click', (e) => {
                console.log('iOS文件输入被点击');
                e.preventDefault();
                this.showIOSFileSelectionHelp();
            });
            
            // 添加触摸处理
            fileInput.addEventListener('touchstart', (e) => {
                console.log('iOS文件输入触摸开始');
                e.preventDefault();
            });
            
        } else if (isAndroid) {
            // Android处理
            fileInput.setAttribute('accept', audioTypes);
            fileInput.removeAttribute('capture');
            
        } else {
            // 桌面浏览器
            fileInput.setAttribute('accept', audioTypes);
        }
        
        // 确保文件输入可交互
        fileInput.style.display = 'block';
        fileInput.style.opacity = '0';
        fileInput.style.position = 'absolute';
        fileInput.style.width = '100%';
        fileInput.style.height = '100%';
        fileInput.style.top = '0';
        fileInput.style.left = '0';
        fileInput.style.zIndex = '1000';
    }
    
    // 设置拖拽上传
    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            console.log('拖拽文件:', files);
            this.addFiles(files);
        }, false);
    }
    
    // 触发文件选择（统一入口）
    triggerFileSelect(source = 'standard') {
        console.log('触发文件选择，来源:', source);
        
        const fileInput = document.getElementById('audioFileInput');
        if (!fileInput) {
            this.showNotification('文件选择器初始化失败', 'error');
            return;
        }
        
        // 根据来源设置不同的accept属性
        this.setupFileInputForSource(fileInput, source);
        
        // 触发文件选择
        try {
            fileInput.click();
        } catch (error) {
            console.error('文件选择失败:', error);
            this.showNotification('文件选择对话框打开失败', 'error');
            
            // iOS 备用方案
            if (this.isIOSDevice()) {
                this.triggerIOSFileSelect(source);
            }
        }
    }
    
    // 根据来源设置文件输入
    setupFileInputForSource(fileInput, source) {
        switch (source) {
            case 'music':
                fileInput.setAttribute('accept', 'audio/mp3,audio/mpeg');
                break;
            case 'files':
                fileInput.setAttribute('accept', 'audio/*,.mp3,.wav,.ogg,.m4a,.aac');
                break;
            default:
                fileInput.setAttribute('accept', 'audio/*,.mp3,.wav,.ogg,.m4a,.aac');
        }
        
        fileInput.removeAttribute('capture');
        fileInput.setAttribute('multiple', '');
    }
    
    // iOS 专用文件选择
    triggerIOSFileSelect(mode = 'music') {
        console.log('iOS文件选择，模式:', mode);
        
        try {
            // 创建隐藏的文件输入
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.position = 'fixed';
            fileInput.style.left = '-9999px';
            fileInput.style.opacity = '0';
            
            // iOS Safari 特殊处理
            if (mode === 'music') {
                // 音乐库模式 - iOS Safari 需要特殊处理
                fileInput.setAttribute('accept', 'audio/mp3,audio/mpeg');
                
                // 添加额外的 iOS Safari 优化属性
                fileInput.setAttribute('capture', 'user');
                fileInput.setAttribute('webkitdirectory', '');
                
                // 尝试使用 iOS Safari 特有的音乐库 API
                if (window.webkit && window.webkit.messageHandlers) {
                    // iOS 15+ 支持的 API
                    console.log('尝试使用 iOS 音乐库 API');
                    // 这里可以添加与原生应用的交互
                }
            } else {
                // 文件选择模式
                fileInput.setAttribute('accept', 'audio/*,.mp3,.wav,.ogg,.m4a,.aac');
                fileInput.setAttribute('multiple', '');
                
                // iOS Safari 优化
                fileInput.removeAttribute('capture');
                
                // 添加 iOS Safari 特殊触发
                fileInput.setAttribute('webkitdirectory', '');
            }
            
            // 添加事件监听
            const changeHandler = (e) => {
                console.log('iOS文件选择触发');
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    console.log('iOS选择文件成功:', files);
                    
                    // 延迟处理，确保文件完全加载
                    setTimeout(() => {
                        this.addFiles(files);
                        document.body.removeChild(fileInput);
                    }, 100);
                } else {
                    console.log('iOS文件选择被取消');
                    document.body.removeChild(fileInput);
                }
                
                // 移除事件监听
                fileInput.removeEventListener('change', changeHandler);
            };
            
            fileInput.addEventListener('change', changeHandler);
            
            // 多次触发尝试（iOS Safari 需要）
            const triggerClick = () => {
                console.log('触发 iOS 文件选择');
                
                // 创建并点击一个临时的触发按钮
                const triggerBtn = document.createElement('button');
                triggerBtn.textContent = '选择文件';
                triggerBtn.style.position = 'fixed';
                triggerBtn.style.top = '-100px';
                triggerBtn.style.left = '-100px';
                triggerBtn.style.opacity = '0';
                triggerBtn.onclick = () => {
                    fileInput.click();
                    document.body.removeChild(triggerBtn);
                };
                
                document.body.appendChild(triggerBtn);
                triggerBtn.click();
                
                // 延迟清理
                setTimeout(() => {
                    if (triggerBtn.parentNode) {
                        document.body.removeChild(triggerBtn);
                    }
                }, 1000);
            };
            
            // 添加到DOM
            document.body.appendChild(fileInput);
            
            // 使用多种触发方式
            triggerClick();
            
            // 延迟再次尝试
            setTimeout(() => {
                fileInput.click();
            }, 50);
            
            // 最终尝试
            setTimeout(() => {
                triggerClick();
            }, 200);
            
        } catch (error) {
            console.error('iOS文件选择失败:', error);
            this.showNotification('iOS文件选择失败，请使用其他方式', 'error');
        }
    }
    
    // 检测是否为iOS设备
    isIOSDevice() {
        const userAgent = navigator.userAgent;
        return /iPad|iPhone|iPod/.test(userAgent);
    }
    
    // 显示iOS文件选择帮助
    showIOSFileSelectionHelp() {
        const help = document.createElement('div');
        help.className = 'ios-file-help';
        help.innerHTML = `
            <div class="help-content">
                <i class="fab fa-apple"></i>
                <div>
                    <h4>iOS 文件选择指南</h4>
                    <p><strong>方法一：</strong>使用下方"从音乐库选择"按钮</p>
                    <p><strong>方法二：</strong>使用"从文件选择"按钮</p>
                    <p><strong>方法三：</strong>将音频文件拖拽到指定区域</p>
                    <p style="margin-top: 12px; font-size: 0.8rem; opacity: 0.8;">
                        提示：iOS 13+ 版本支持更好的文件选择体验
                    </p>
                </div>
                <button class="help-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(help);
        
        // 自动移除
        setTimeout(() => {
            if (help.parentNode) {
                help.style.opacity = '0';
                setTimeout(() => {
                    if (help.parentNode) {
                        help.parentNode.removeChild(help);
                    }
                }, 300);
            }
        }, 15000);
    }
    
    // 显示移动端文件选择提示
    showMobileFileSelectionHint() {
        const hint = document.createElement('div');
        hint.className = 'mobile-file-hint';
        hint.innerHTML = `
            <div class="hint-content">
                <i class="fas fa-info-circle"></i>
                <div>
                    <h4>文件选择提示</h4>
                    <p>请选择您手机中的音频文件进行播放</p>
                    <p>支持格式：MP3、WAV、OGG、M4A</p>
                </div>
                <button class="hint-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(hint);
        
        // 自动移除提示
        setTimeout(() => {
            if (hint.parentNode) {
                hint.style.opacity = '0';
                setTimeout(() => {
                    if (hint.parentNode) {
                        hint.parentNode.removeChild(hint);
                    }
                }, 300);
            }
        }, 8000);
    }
}

// 添加脉冲动画的CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulseEffect {
        0% {
            width: 0;
            height: 0;
            opacity: 1;
        }
        100% {
            width: 200px;
            height: 200px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化广播系统
document.addEventListener('DOMContentLoaded', () => {
    window.broadcastSystem = new BroadcastSystem();
    
    // 添加触摸设备支持
    if ('ontouchstart' in window) {
        document.querySelectorAll('button, .broadcast-card').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
    
    // 控制台欢迎信息
    console.log('🎵 广播系统已加载完成');
    console.log('📱 支持键盘快捷键：');
    console.log('   空格键: 暂停/播放');
    console.log('   S键: 停止播放');
    console.log('   ↑/↓箭头: 调节音量');
});