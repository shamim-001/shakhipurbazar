import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { ShoppingBagIcon, SparklesIcon, BellIcon, ChatBubbleLeftRightIcon, ChevronLeftIcon, LifebuoyIcon } from '../components/icons';
import { toast } from 'react-hot-toast';
import { Notification } from '../types';
import { getPagePath } from '../src/utils/navigation';

const InboxPage = () => {
    const { language, notifications, chatThreads, currentUser, users, vendors, markNotificationAsRead, markAllNotificationsAsRead, markAllMessagesAsRead } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');

    if (!currentUser) {
        return (
            <div className="p-8 text-center bg-gray-50 dark:bg-slate-900 min-h-screen">
                <p className="text-gray-600 dark:text-gray-300 mb-4">Please log in to view your inbox.</p>
                <button onClick={() => navigate('/login')} className="bg-rose-500 text-white px-6 py-2 rounded-full font-bold">Log In</button>
            </div>
        );
    }

    const unreadNotifCount = notifications.filter(n => !n.read).length;
    const unreadChatCount = chatThreads.filter(t => (t.unreadCount?.[currentUser.id] || 0) > 0).length;

    const handleNotificationClick = (notification: Notification) => {
        markNotificationAsRead(notification.id);
        if (notification.link) {
            navigate(getPagePath(notification.link));
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        const className = "h-6 w-6";
        switch (type) {
            case 'order': return <ShoppingBagIcon className={`${className} text-blue-500`} />;
            case 'promo': return <SparklesIcon className={`${className} text-yellow-500`} />;
            case 'new_product': return <SparklesIcon className={`${className} text-green-500`} />;
            default: return <BellIcon className={`${className} text-gray-500`} />;
        }
    };

    const myThreads = chatThreads.filter(t => t.participantIds.includes(currentUser.id));

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">
            <div className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'Inbox' : 'ইনবক্স'}</h1>
                </div>
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-3 text-sm font-medium text-center relative ${activeTab === 'notifications' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'Notifications' : 'বিজ্ঞপ্তি'}
                        {unreadNotifCount > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadNotifCount}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`flex-1 py-3 text-sm font-medium text-center relative ${activeTab === 'messages' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'Messages' : 'মেসেজ'}
                        {unreadChatCount > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadChatCount}</span>}
                    </button>
                </div>
                {activeTab === 'notifications' && unreadNotifCount > 0 && (
                    <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={() => {
                                markAllNotificationsAsRead();
                                toast.success(language === 'en' ? 'All notifications marked as read' : 'সব বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত করা হয়েছে');
                            }}
                            className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                        >
                            <BellIcon className="h-3 w-3" />
                            {language === 'en' ? 'Mark all as read' : 'সব পঠিত হিসেবে চিহ্নিত করুন'}
                        </button>
                    </div>
                )}
                {activeTab === 'messages' && unreadChatCount > 0 && (
                    <div className="bg-white dark:bg-slate-800 px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-end">
                        <button
                            onClick={markAllMessagesAsRead}
                            className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                        >
                            <ChatBubbleLeftRightIcon className="h-3 w-3" />
                            {language === 'en' ? 'Mark all as read' : 'সব পঠিত হিসেবে চিহ্নিত করুন'}
                        </button>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 py-4">
                {activeTab === 'notifications' && (
                    <div className="space-y-3">
                        {notifications.length > 0 ? notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`flex items-start gap-4 p-4 rounded-xl shadow-sm cursor-pointer border transition-all ${notif.read
                                    ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                                    : 'bg-blue-50 dark:bg-slate-700/50 border-blue-100 dark:border-slate-600'
                                    }`}
                            >
                                <div className="flex-shrink-0 bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm">
                                    {getNotificationIcon(notif.type)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <p className={`text-sm font-semibold ${notif.read ? 'text-gray-800 dark:text-gray-200' : 'text-gray-900 dark:text-white'}`}>
                                            {notif.title[language]}
                                        </p>
                                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message[language]}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                                        {new Date(notif.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">No notifications yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="space-y-3">
                        {myThreads.length > 0 ? myThreads.map(thread => {
                            const isSupport = thread.contextType === 'support';
                            const otherId = thread.participantIds.find(id => id !== currentUser.id);
                            const otherUser = users.find(u => u.id === otherId);
                            const vendorId = otherUser?.shopId || otherUser?.driverId || thread.vendorId;
                            const vendor = vendorId ? vendors.find(v => v.id === vendorId) : null;

                            const name = isSupport
                                ? (language === 'en' ? 'Help & Support' : 'হেল্প ও সাপোর্ট')
                                : vendor ? vendor.name[language] : otherUser?.name || "Unknown";

                            const image = isSupport ? null : (vendor ? vendor.logo : otherUser?.image);
                            const isUnread = (thread.unreadCount?.[currentUser.id] || 0) > 0;
                            const subject = thread.metadata?.subject || thread.subject;

                            return (
                                <div
                                    key={thread.id}
                                    onClick={() => navigate(`/chat/${thread.id}`)}
                                    className={`flex items-center gap-4 p-4 rounded-xl shadow-sm cursor-pointer border transition-all ${isUnread
                                        ? 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-900/50 ring-1 ring-rose-100 dark:ring-rose-900/20'
                                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                                        } ${isSupport ? 'border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="relative">
                                        {isSupport ? (
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                <LifebuoyIcon className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <img src={image} alt={name} className="w-12 h-12 rounded-full border border-gray-100 dark:border-slate-700 object-cover" />
                                        )}
                                        {isUnread && <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                            {thread.unreadCount![currentUser.id]}
                                        </div>}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <p className={`font-bold truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>{name}</p>
                                                {isSupport && subject && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium truncate max-w-[100px]">{subject}</span>}
                                            </div>
                                            {thread.lastMessageAt && (
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {thread.lastSenderId === currentUser.id ? (language === 'en' ? 'You: ' : 'আপনি: ') : ''}{thread.lastMessage || (language === 'en' ? 'Support request initiated' : 'সাপোর্ট রিকোয়েস্ট শুরু হয়েছে')}
                                        </p>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div className="text-center py-10">
                                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxPage;