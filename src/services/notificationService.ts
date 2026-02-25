import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Initialize Firebase Messaging
let messaging: any = null;

// Only initialize if supported (not in SSR, service workers available)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
        const { app } = require('../lib/firebase');
        messaging = getMessaging(app);
    } catch (error) {
        console.warn('Firebase Messaging not available:', error);
    }
}

export interface NotificationData {
    userId: string;
    title: { en: string; bn: string } | string;
    body: { en: string; bn: string } | string;
    type: 'order' | 'message' | 'system' | 'promotion' | 'ride_request' | 'product';
    relatedId?: string;
    priority?: 'normal' | 'high' | 'critical';
    data?: {
        orderId?: string;
        messageId?: string;
        productId?: string;
        [key: string]: any;
    };
    link?: string;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

/**
 * Get FCM token and save to Firestore
 */
export async function subscribeToPushNotifications(userId: string): Promise<string | null> {
    if (!messaging) {
        console.warn('Messaging not initialized');
        return null;
    }

    try {
        // Request permission first
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.log('Notification permission denied');
            return null;
        }

        // Get VAPID key from environment
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error('VAPID key not found. Please add VITE_FIREBASE_VAPID_KEY to .env');
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);

        // Get FCM token
        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('FCM Token:', token);

            // Save token to Firestore
            await setDoc(doc(db, 'users', userId), {
                fcmToken: token,
                fcmTokenUpdatedAt: serverTimestamp()
            }, { merge: true });

            return token;
        }

        return null;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

/**
 * Listen for foreground messages
 */
export function listenToForegroundMessages(callback: (payload: any) => void) {
    if (!messaging) {
        console.warn('Messaging not initialized');
        return () => { };
    }

    return onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);

        // Show browser notification for foreground messages
        if (Notification.permission === 'granted') {
            const title = payload.notification?.title || 'Sakhipur Bazar';
            const options = {
                body: payload.notification?.body || '',
                icon: '/logo192.png',
                badge: '/logo192.png',
                data: payload.data
            };

            const notification = new Notification(title, options);
            notification.onclick = (event) => {
                event.preventDefault(); // Prevent standard behavior
                notification.close();

                // Handle navigation logic here
                const data = payload.data;
                let url = '/';

                if (data?.orderId) url = `/profile?tab=orders`;
                else if (data?.messageId) url = `/inbox`;
                else if (data?.productId) url = `/product/${data.productId}`;
                else if (data?.link) url = data.link;

                // Navigate
                window.location.href = url; // or use React Router if within context
                window.focus();
            };
        }

        callback(payload);
    });
}

/**
 * Create notification in Firestore (will be read by user)
 */
export async function createNotification(notificationData: NotificationData): Promise<void> {
    try {
        const userId = notificationData.userId;
        if (!userId) {
            console.error('UserId is required for notification');
            return;
        }

        // We write to the user-specific subcollection as expected by ChatContext/Subscriptions
        const userNotifRef = collection(db, 'users', userId, 'notifications');

        await addDoc(userNotifRef, {
            ...notificationData,
            priority: notificationData.priority || 'normal',
            read: false,
            createdAt: serverTimestamp()
        });

        // Also optionally write to a global collection for admin auditing if needed
        // but the primary one for UI is the subcollection
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(userId: string): Promise<void> {
    await createNotification({
        userId,
        title: 'Test Notification',
        body: 'This is a test notification from Sakhipur Bazar!',
        type: 'system'
    });

    // Also show browser notification
    if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
            body: 'This is a test notification from Sakhipur Bazar!',
            icon: '/logo192.png'
        });
    }
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
}
