self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Couple Space 💕', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      renotify: true,
      data: { url: data.url || '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url); return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
