// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: "AIzaSyDZ8TXqe7gLFOlQkKhd0gZ-nDqnPwsumLM",
    authDomain: "sakhipur-bazar.firebaseapp.com",
    projectId: "sakhipur-bazar",
    storageBucket: "sakhipur-bazar.firebasestorage.app",
    messagingSenderId: "190926854",
    appId: "1:190926854:web:09a44e8cdc59b4f5bae11e"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Sakhipur Bazar';
    const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'You have a new notification',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        data: payload.data,
        tag: payload.data?.type || 'general',
        requireInteraction: true,
        actions: payload.data?.orderId ? [
            {
                action: 'view',
                title: 'View Order'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ] : undefined
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click received.', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Determine URL based on notification data
    let url = '/';
    if (event.notification.data?.orderId) {
        url = `/profile?tab=orders`; // Go to orders tab
    } else if (event.notification.data?.messageId) {
        url = `/inbox`;
    } else if (event.notification.data?.productId) {
        url = `/product/${event.notification.data.productId}`;
    } else if (event.notification.data?.link) {
        url = event.notification.data.link;
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (let client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(client => client.navigate(url));
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
