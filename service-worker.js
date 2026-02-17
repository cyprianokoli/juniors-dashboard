// Service Worker for Dashboard - Offline-First with Background Sync
const CACHE_NAME = 'dashboard-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './stats.html',
  './settings.html',
  './manifest.json',
  './icon.svg',
  './apple-touch-icon.png',
  './apple-touch-icon-120x120.png',
  './apple-touch-icon-precomposed.png'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached version but also fetch in background to update
        fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }
      
      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Network failed - return offline page if it's navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Background Sync: Queue offline actions
const SYNC_QUEUE_KEY = 'sync-queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const queue = await getSyncQueue();
  const failed = [];
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method || 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data)
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
    } catch (error) {
      failed.push(item);
    }
  }
  
  // Save failed items back to retry later
  await saveSyncQueue(failed);
  
  // Notify client of sync completion
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      failed: failed.length
    });
  });
}

async function getSyncQueue() {
  // This runs in SW context - can't access localStorage directly
  // Data is passed from main thread via postMessage
  return self.syncQueue || [];
}

async function saveSyncQueue(queue) {
  self.syncQueue = queue;
}

// Message handler for queue updates
self.addEventListener('message', (event) => {
  if (event.data.type === 'QUEUE_SYNC') {
    self.syncQueue = event.data.queue || [];
    
    // Try to sync immediately if online
    if (navigator.onLine) {
      self.registration.sync.register('sync-data').catch(() => {
        // Background sync not supported, process directly
        processSyncQueue();
      });
    }
  }
  
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(event.data.notification);
  }
});

// Notification scheduling
let notificationTimers = {};

function scheduleNotification(notification) {
  const { id, title, body, timestamp, tag } = notification;
  const delay = timestamp - Date.now();
  
  // Clear existing timer for this ID
  if (notificationTimers[id]) {
    clearTimeout(notificationTimers[id]);
  }
  
  if (delay > 0) {
    notificationTimers[id] = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag,
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon-120x120.png',
        requireInteraction: true,
        actions: [
          { action: 'open', title: 'Open Dashboard' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      });
      
      // Notify clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'NOTIFICATION_SHOWN', id });
        });
      });
    }, delay);
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('./index.html');
        }
      })
    );
  }
});

// Periodic sync for background updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-check') {
    event.waitUntil(sendDailyReminder());
  }
});

async function sendDailyReminder() {
  self.registration.showNotification('Daily Check', {
    body: 'Time to review your goals for today!',
    icon: './apple-touch-icon.png',
    badge: './apple-touch-icon-120x120.png'
  });
}
