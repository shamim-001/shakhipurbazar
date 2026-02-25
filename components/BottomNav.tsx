
import React from 'react';
import { HomeIcon, CategoryIcon, CartIcon, UserIcon, ChatBubbleLeftRightIcon } from './icons';
import { useApp } from '../src/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = () => {
    const { cart, language, notifications, chatThreads, currentUser, platformSettings } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const unreadNotifCount = notifications.filter(n => !n.read).length;
    const unreadChatCount = chatThreads.filter(t =>
        currentUser && t.unreadCount && t.unreadCount[currentUser.id] && t.unreadCount[currentUser.id] > 0
    ).length;
    const totalInboxUnread = unreadNotifCount + unreadChatCount;

    const navItems = [
        { id: 'home', icon: HomeIcon, label: { en: 'Home', bn: 'হোম' }, path: '/' },
        { id: 'categories', icon: CategoryIcon, label: { en: 'Categories', bn: 'ক্যাটাগরি' }, path: '/categories' },
        ...(platformSettings.moduleToggles?.wholesale !== false ? [] : []),
        { id: 'inbox', icon: ChatBubbleLeftRightIcon, label: { en: 'Inbox', bn: 'ইনবক্স' }, path: '/inbox' },
        { id: 'cart', icon: CartIcon, label: { en: 'Cart', bn: 'কার্ট' }, path: '/cart' },
        { id: 'profile', icon: UserIcon, label: { en: 'Profile', bn: 'প্রোফাইল' }, path: '/profile' },
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${isActive(item.path) ? 'text-[#FFB6B6]' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <div className="relative">
                            <item.icon className="h-6 w-6" />
                            {item.id === 'cart' && cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-3 bg-[#FFB6B6] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                            {item.id === 'inbox' && totalInboxUnread > 0 && (
                                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                                    {totalInboxUnread}
                                </span>
                            )}
                        </div>
                        <span className="text-xs mt-1">{item.label[language]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
