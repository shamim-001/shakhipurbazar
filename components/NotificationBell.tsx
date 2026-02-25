import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { BellIcon, XIcon } from './icons';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: 'order' | 'message' | 'system' | 'promotion';
    read: boolean;
    createdAt: any;
    data?: {
        orderId?: string;
        messageId?: string;
    };
}

interface NotificationBellProps {
    userId: string;
    onNavigate?: (url: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, onNavigate }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        // Listen to user's notifications
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs: Notification[] = [];
            snapshot.forEach((doc) => {
                notifs.push({ id: doc.id, ...doc.data() } as Notification);
            });
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleMarkAsRead = async (notificationId: string) => {
        await updateDoc(doc(db, 'notifications', notificationId), {
            read: true
        });
    };

    const handleNotificationClick = (notification: Notification) => {
        handleMarkAsRead(notification.id);

        // Navigate based on type
        if (notification.data?.orderId && onNavigate) {
            onNavigate('/profile'); // Orders are in profile
        } else if (notification.data?.messageId && onNavigate) {
            onNavigate(`/chat/${notification.data.messageId}`);
        }

        setShowPanel(false);
    };

    const handleMarkAllAsRead = async () => {
        const batch = notifications.filter(n => !n.read);
        await Promise.all(batch.map(n => handleMarkAsRead(n.id)));
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
                <BellIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {showPanel && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPanel(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPanel(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                    <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-4 text-left border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'
                                                }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                                    {notification.body}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    {notification.createdAt?.toDate ? new Date(notification.createdAt.toDate()).toLocaleTimeString() : 'Just now'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
