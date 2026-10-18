/* Loaded by the generated service worker. Every push must show a notification. */
self.addEventListener('push', (event) => {
    const payload = {
        title: 'Waraqah',
        body: 'You have a business update.',
        url: '/',
        tag: 'waraqah',
    };
    try {
        if (event.data) {
            Object.assign(payload, event.data.json());
        }
    } catch {
        /* keep the fallback copy */
    }

    event.waitUntil(self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa/icon-192.png',
        badge: '/pwa/icon-192.png',
        tag: payload.tag || 'waraqah',
        data: { url: payload.url || '/' },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetPath = event.notification.data?.url || '/';
    const targetUrl = new URL(targetPath, self.location.origin).href;

    event.waitUntil((async () => {
        const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windowClients) {
            if (!client.url.startsWith(self.location.origin)) continue;
            if ('focus' in client) await client.focus();
            if ('navigate' in client) {
                try {
                    await client.navigate(targetUrl);
                } catch {
                    /* an open tab is enough */
                }
            }
            return;
        }
        await self.clients.openWindow(targetUrl);
    })());
});
