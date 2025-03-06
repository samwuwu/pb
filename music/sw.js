// 缓存名称和版本
const CACHE_NAME = 'music-player-cache-v1';

// 需要缓存的资源列表
const urlsToCache = [
  './',
  './song.html',
  './manifest.json',
  './album-cover.jpg',
  './随音而行.mp3',
  './sw.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
  // 执行安装步骤
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 确保新的Service Worker立即激活
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  // 清理旧缓存
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 确保新的Service Worker控制所有客户端
  );
});

// 处理fetch请求
self.addEventListener('fetch', event => {
  // 对于媒体文件，优先使用网络请求，失败时回退到缓存
  if (event.request.url.includes('.mp3') || event.request.url.includes('.jpg')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 克隆响应，因为响应流只能使用一次
          const responseToCache = response.clone();
          
          // 更新缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // 网络请求失败时，尝试从缓存获取
          return caches.match(event.request);
        })
    );
  } else {
    // 对于其他资源，优先使用缓存，失败时回退到网络请求
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // 缓存命中，返回缓存的响应
          if (response) {
            return response;
          }
          
          // 缓存未命中，发起网络请求
          return fetch(event.request)
            .then(response => {
              // 检查是否是有效的响应
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应，因为响应流只能使用一次
              const responseToCache = response.clone();
              
              // 更新缓存
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
});

// 处理后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-media-state') {
    event.waitUntil(syncMediaState());
  }
});

// 同步媒体状态的函数
function syncMediaState() {
  // 这里可以实现媒体状态的同步逻辑
  return Promise.resolve();
}

// 处理推送通知
self.addEventListener('push', event => {
  const title = '随音而行';
  const options = {
    body: '您的音乐播放器有新消息',
    icon: './album-cover.jpg',
    badge: './album-cover.jpg'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./song.html')
  );
}); 