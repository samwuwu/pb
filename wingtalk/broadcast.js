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
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }
    
    // 添加文件到列表
    addFiles(files) {
        files.forEach(file => {
            if (this.isAudioFile(file)) {
                const fileData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    url: URL.createObjectURL(file),
                    isLocalFile: true
                };
                this.uploadedFiles.push(fileData);
                this.renderFileItem(fileData);
            }
        });
    }
    
    // 检查是否为音频文件
    isAudioFile(file) {
        const audioTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
        return audioTypes.includes(file.type) || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name);
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
        
        // 停止当前播放
        this.stopPlayback();
        
        // 设置新的音频源
        this.audioPlayer.src = fileData.url;
        this.currentTrack.textContent = fileData.name;
        
        // 更新当前按钮
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        const playBtn = fileItem.querySelector('.file-play-btn');
        this.currentButton = playBtn;
        
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
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            const fileInput = document.getElementById('audioFileInput');
            if (fileInput) {
                // 优化移动端文件输入属性
                fileInput.setAttribute('capture', 'microphone');
                fileInput.setAttribute('accept', 'audio/*,.mp3,.wav,.ogg,.m4a');
                
                // 添加移动端特定的触摸事件处理
                fileInput.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.showMobileFileSelectionHint();
                });
            }
        }
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