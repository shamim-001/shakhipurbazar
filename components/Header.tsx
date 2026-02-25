

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../src/context/AppContext';
import { CartIcon, SearchIcon, UserIcon, SunIcon, MoonIcon, BellIcon, ShoppingBagIcon, SparklesIcon, CogIcon, NewspaperIcon, HomeIcon, ChatBubbleLeftRightIcon, TruckIcon, StoreIcon, PlusIcon } from './icons';
import { Notification, Product, Vendor } from '../types';
import { debounce } from 'lodash';
import { usePWA } from '../hooks/usePWA';
import { useRecentSearches } from '../src/hooks/useRecentSearches';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const {
        language, setLanguage, cart, theme, toggleTheme,
        chatThreads, notifications, markNotificationAsRead, markAllNotificationsAsRead,
        products, currentUser, logout, users, vendors
    } = useApp();
    const { recentSearches, addSearchTerm, removeSearchTerm, clearHistory } = useRecentSearches();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ products: Product[], vendors: Vendor[] }>({ products: [], vendors: [] });
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState<'alerts' | 'messages'>('alerts');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // PWA Hook
    const { isInstallable, install } = usePWA();

    const notificationRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const unreadNotifCount = notifications.filter(n => !n.read).length;
    const unreadChatCount = chatThreads.filter(t =>
        currentUser && t.unreadCount && t.unreadCount[currentUser.id] && t.unreadCount[currentUser.id] > 0
    ).length;
    const totalUnread = unreadNotifCount + unreadChatCount;

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'bn' : 'en');
    };

    const performSearch = (query: string) => {
        if (query.trim() === '') {
            setSearchResults({ products: [], vendors: [] });
            return;
        }

        const lowerCaseQuery = query.toLowerCase();

        const filteredProducts = products.filter(product =>
            product.name.en.toLowerCase().includes(lowerCaseQuery) ||
            product.name.bn.toLowerCase().includes(lowerCaseQuery) ||
            product.category.en.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 5);

        const filteredVendors = vendors.filter(vendor =>
            vendor.name.en.toLowerCase().includes(lowerCaseQuery) ||
            vendor.name.bn.toLowerCase().includes(lowerCaseQuery)
        ).slice(0, 3);

        setSearchResults({ products: filteredProducts, vendors: filteredVendors });
    };

    const debouncedSearch = useCallback(debounce(performSearch, 300), [products]);

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery, debouncedSearch]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim() !== '') {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            addSearchTerm(searchQuery.trim());
            setSearchQuery('');
            setIsSearchFocused(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
        setSearchQuery('');
        setIsSearchFocused(false);
    };

    const handleVendorClick = (vendorId: string) => {
        navigate(`/vendor/${vendorId}`);
        setSearchQuery('');
        setIsSearchFocused(false);
    };

    const handleNotificationClick = (notification: Notification) => {
        markNotificationAsRead(notification.id);

        if (notification.link) {
            // notification.link is typically { name: '...', ... } which was used for setPage
            // We need to map this legacy object to a URL path
            // Or if we stored URL string, use that. Assuming legacy object for now, need manual mapping or if link has a url property?
            // Checking types, Notification.link is PageState.
            const page = notification.link as any;
            if (page.name === 'product' && page.productId) navigate(`/product/${page.productId}`);
            else if (page.name === 'order' && page.orderId) navigate(`/profile?tab=orders`); // simplified
            else if (page.name === 'adminDashboard') navigate('/admin');
            // ... fallback to dashboard based on role logic below if simplified link fails
            else if (page.name === 'vendorDashboard') navigate('/vendor-dashboard');
            else if (page.name === 'riderDashboard') navigate('/rider-dashboard');
            else if (page.name === 'deliveryManDashboard') navigate('/delivery-dashboard');
            else navigate('/'); // safe fallback

        } else if (notification.type === 'order' || notification.type === 'ride_request') {
            // Role-based routing
            if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
                navigate('/admin');
            } else if (currentUser?.deliveryManId && (notification.type === 'order' || notification.type === 'ride_request')) {
                navigate('/delivery-dashboard');
            } else if (currentUser?.shopId && notification.type === 'order') {
                navigate('/vendor-dashboard');
            } else if (currentUser?.driverId && notification.type === 'ride_request') {
                navigate('/rider-dashboard');
            } else {
                // Customer -> Profile History
                navigate('/profile?tab=history');
            }
        } else if (notification.type === 'message') {
            // Try to find thread ID from data if possible, otherwise Inbox
            if (notification.data?.messageId) {
                navigate(`/chat/${notification.data.messageId}`);
            } else {
                navigate('/inbox');
            }
        } else if (notification.type === 'product_approval') {
            navigate('/vendor-dashboard');
        }

        setIsNotificationOpen(false);
    }

    const getNotificationIcon = (type: Notification['type']) => {
        const className = "h-6 w-6";
        switch (type) {
            case 'order': return <ShoppingBagIcon className={`${className} text-blue-500`} />;
            case 'promo': return <SparklesIcon className={`${className} text-yellow-500`} />;
            case 'new_product': return <SparklesIcon className={`${className} text-green-500`} />;
            default: return <BellIcon className={`${className} text-gray-500`} />;
        }
    }

    const handleUserIconClick = () => {
        if (!currentUser) {
            navigate('/login');
        } else {
            setIsUserMenuOpen(prev => !prev);
        }
    };

    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false);
        navigate('/');
    };

    // Filter chat threads for the current user
    const myChatThreads = chatThreads.filter(t => currentUser && t.participantIds.includes(currentUser.id));

    return (
        <header className="bg-white dark:bg-slate-900 shadow-md dark:border-b dark:border-slate-800 sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div
                    className="text-2xl font-bold text-[#795548] dark:text-rose-300 cursor-pointer flex items-center gap-2"
                    onClick={() => navigate('/')}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    {theme === 'light' && useApp().platformSettings.logoUrl ? (
                        <img src={useApp().platformSettings.logoUrl} alt={useApp().platformSettings.appName} className="h-10" />
                    ) : (
                        <span>{useApp().platformSettings.appName || 'Sakhipur Bazar'}</span>
                    )}
                </div>

                <div className="hidden md:flex flex-grow max-w-lg mx-4" ref={searchRef}>
                    <div className="relative w-full">
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                placeholder={language === 'en' ? "Search for cakes, pastries..." : "কেক, পেস্ট্রি খুঁজুন..."}
                                className="w-full bg-[#F9F9F9] dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#FFB6B6] text-gray-800 dark:text-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onKeyDown={handleKeyDown}
                                autoComplete="off"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </form>

                        {isSearchFocused && (
                            <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-50 overflow-hidden">
                                {searchQuery && (searchResults.products.length > 0 || searchResults.vendors.length > 0) ? (
                                    <ul className="max-h-96 overflow-y-auto">
                                        {searchResults.products.length > 0 && (
                                            <li className="px-4 pt-3 pb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{language === 'en' ? 'Products' : 'পণ্য'}</li>
                                        )}
                                        {searchResults.products.map(product => (
                                            <li key={product.id} onClick={() => handleProductClick(product.slug || product.id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                                <img src={product.images[0]} alt={product.name[language]} className="w-10 h-10 object-cover rounded-md" />
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{product.name[language]}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">৳{product.price}</p>
                                                </div>
                                            </li>
                                        ))}
                                        {searchResults.vendors.length > 0 && (
                                            <li className="px-4 pt-3 pb-1 font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t dark:border-slate-700">{language === 'en' ? 'Shops' : 'দোকান'}</li>
                                        )}
                                        {searchResults.vendors.map(vendor => (
                                            <li key={vendor.id} onClick={() => handleVendorClick(vendor.slug || vendor.id)} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                                <img src={vendor.logo} alt={vendor.name[language]} className="w-10 h-10 object-cover rounded-full" />
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{vendor.name[language]}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{vendor.category[language]}</p>
                                                </div>
                                            </li>
                                        ))}
                                        <li onClick={() => handleSearchSubmit()} className="p-3 text-center text-sm font-semibold text-rose-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border-t dark:border-slate-700">
                                            {language === 'en' ? 'View all results' : 'সব ফলাফল দেখুন'}
                                        </li>
                                    </ul>
                                ) : !searchQuery && recentSearches.length > 0 ? (
                                    <div className="py-2">
                                        <div className="px-4 py-2 flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <span>{language === 'en' ? 'Recent Searches' : 'সাম্প্রতিক অনুসন্ধান'}</span>
                                            <button onClick={clearHistory} className="text-rose-500 hover:underline">{language === 'en' ? 'Clear' : 'মুছুন'}</button>
                                        </div>
                                        <ul>
                                            {recentSearches.map((term, idx) => (
                                                <li key={idx} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer group">
                                                    <div className="flex items-center gap-3 flex-grow" onClick={() => { setSearchQuery(term); navigate(`/search?q=${encodeURIComponent(term)}`); setIsSearchFocused(false); addSearchTerm(term); }}>
                                                        <SearchIcon className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{term}</span>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); removeSearchTerm(term); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                        </svg>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : searchQuery && (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        {language === 'en' ? 'No results found' : 'কোনো ফলাফল পাওয়া যায়নি'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-4">
                    <button onClick={() => navigate('/search')} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6]">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                    <button onClick={toggleLanguage} className="text-sm font-semibold text-[#795548] dark:text-gray-300 hover:text-[#FFB6B6] dark:hover:text-[#FFB6B6] transition-colors">
                        {language === 'en' ? 'বাংলা' : 'English'}
                    </button>

                    {isInstallable && (
                        <button
                            onClick={install}
                            className="flex items-center gap-1 bg-[#795548] text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-opacity-90 transition-all shadow-sm"
                        >
                            <PlusIcon className="w-3 h-3" />
                            {language === 'en' ? 'Install' : 'ইনস্টল'}
                        </button>
                    )}

                    <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6]">
                        {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                    </button>

                    {currentUser && (
                        <div ref={notificationRef} className="relative">
                            <button onClick={() => setIsNotificationOpen(prev => !prev)} className="relative text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6]">
                                <BellIcon className="h-6 w-6" />
                                {totalUnread > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                                        {totalUnread}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 z-50 overflow-hidden">
                                    <div className="flex border-b dark:border-slate-700">
                                        <button
                                            onClick={() => setActiveNotifTab('alerts')}
                                            className={`flex-1 py-3 text-sm font-semibold text-center ${activeNotifTab === 'alerts' ? 'text-rose-500 border-b-2 border-rose-500 bg-rose-50 dark:bg-slate-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                        >
                                            {language === 'en' ? 'Notifications' : 'বিজ্ঞপ্তি'}
                                            {unreadNotifCount > 0 && <span className="ml-1 text-xs text-red-500">({unreadNotifCount})</span>}
                                        </button>
                                        <button
                                            onClick={() => setActiveNotifTab('messages')}
                                            className={`flex-1 py-3 text-sm font-semibold text-center ${activeNotifTab === 'messages' ? 'text-rose-500 border-b-2 border-rose-500 bg-rose-50 dark:bg-slate-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                        >
                                            {language === 'en' ? 'Messages' : 'মেসেজ'}
                                            {unreadChatCount > 0 && <span className="ml-1 text-xs text-red-500">({unreadChatCount})</span>}
                                        </button>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
                                        {activeNotifTab === 'alerts' ? (
                                            <>
                                                {notifications.length > 0 ? notifications.map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border-b dark:border-slate-700/50 last:border-b-0"
                                                    >
                                                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>}
                                                        <div className={`flex-shrink-0 ${notif.read ? 'ml-4' : ''}`}>
                                                            {getNotificationIcon(notif.type)}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{notif.title[language]}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{notif.message[language]}</p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'No notifications yet.' : 'এখনও কোন বিজ্ঞপ্তি নেই।'}</p>
                                                )}
                                                {notifications.length > 0 && (
                                                    <div className="p-2 border-t dark:border-slate-700 text-center">
                                                        <button onClick={() => markAllNotificationsAsRead()} className="text-xs text-rose-500 hover:underline">{language === 'en' ? 'Mark all as read' : 'সব পঠিত হিসাবে চিহ্নিত করুন'}</button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {myChatThreads.length > 0 ? myChatThreads.map(thread => {
                                                    const otherId = thread.participantIds.find(id => id !== currentUser.id);
                                                    const otherUser = users.find(u => u.id === otherId);
                                                    const vendor = otherUser?.shopId ? vendors.find(v => v.id === otherUser.shopId) : (otherUser?.driverId ? vendors.find(v => v.id === otherUser.driverId) : null);
                                                    const name = vendor ? vendor.name[language] : otherUser?.name || "Unknown";
                                                    const image = vendor ? vendor.logo : otherUser?.image;
                                                    const lastMessage = thread.history[thread.history.length - 1];

                                                    return (
                                                        <div
                                                            key={thread.id}
                                                            onClick={() => { navigate(`/chat/${thread.id}`); setIsNotificationOpen(false); }}
                                                            className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border-b dark:border-slate-700/50 last:border-b-0"
                                                        >
                                                            <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" />
                                                            <div className="flex-grow min-w-0">
                                                                <div className="flex justify-between items-center">
                                                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{name}</p>
                                                                    {lastMessage && <span className="text-[10px] text-gray-400">{new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                </div>
                                                                {lastMessage && (
                                                                    <p className={`text-xs truncate ${currentUser && thread.unreadCount && thread.unreadCount[currentUser.id] && thread.unreadCount[currentUser.id] > 0 ? 'font-bold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                        {lastMessage.senderId === currentUser.id ? 'You: ' : ''}{lastMessage.text}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {currentUser && thread.unreadCount && thread.unreadCount[currentUser.id] && thread.unreadCount[currentUser.id] > 0 && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                                                        </div>
                                                    );
                                                }) : (
                                                    <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'No messages yet.' : 'এখনও কোন বার্তা নেই।'}</p>
                                                )}
                                                <div className="p-2 border-t dark:border-slate-700 text-center">
                                                    <button onClick={() => { navigate('/inbox'); setIsNotificationOpen(false); }} className="text-xs text-rose-500 hover:underline font-bold">
                                                        {language === 'en' ? 'View All Messages' : 'সব বার্তা দেখুন'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="hidden md:flex items-center space-x-6">
                        {!currentUser?.shopId && !currentUser?.driverId && !currentUser?.deliveryManId && !currentUser?.agencyId && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin' && (
                            <button onClick={() => navigate('/vendor/register')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6]">
                                {language === 'en' ? 'Become a Seller' : 'বিক্রেতা হন'}
                            </button>
                        )}

                        <div className="relative z-50 py-2 px-2" ref={userMenuRef}>
                            <UserIcon onClick={handleUserIconClick} className="h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6] cursor-pointer" />

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && currentUser && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-4 py-2 border-b dark:border-slate-700">
                                        <p className="text-sm text-gray-900 dark:text-white font-medium">{currentUser.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                                    </div>
                                    {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); navigate('/admin'); }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        >
                                            {language === 'en' ? 'Admin Dashboard' : 'অ্যাডমিন ড্যাশবোর্ড'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); navigate('/profile'); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                        {language === 'en' ? 'Profile' : 'প্রোফাইল'}
                                    </button>
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                                    >
                                        {language === 'en' ? 'Sign out' : 'সাইন আউট'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={() => navigate('/cart')} className="relative">
                        <CartIcon className="h-7 w-7 text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-[#FFB6B6]" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#FFB6B6] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div >
            </div >
        </header >
    );
};


export default Header;
