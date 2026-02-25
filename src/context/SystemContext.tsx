import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, Page, Theme, PlatformSettings, HeroSlide, HomepageSection, NewsItem, Product } from '../../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

interface SystemContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: Theme;
    toggleTheme: () => void;
    platformSettings: PlatformSettings;
    updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
    heroSlides: HeroSlide[];
    homepageSections: HomepageSection[];
    newsItems: NewsItem[];
    wishlist: Product[];
    recentlyViewed: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isProductInWishlist: (productId: string) => boolean;
    addRecentlyViewed: (product: Product) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [language, setLanguage] = useState<Language>('en');
    const [theme, setTheme] = useState<Theme>('light');
    const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
        deliveryFee: 60,
        freeDeliveryThreshold: 1000,
        defaultCommission: 10,
        appName: 'Sakhipur Bazar',
        supportEmail: 'support@sakhipurbazar.com',
        supportPhone: '01700000000',
        maintenanceMode: { enabled: false, message: { en: 'Maintenance Mode', bn: 'রক্ষণাবেক্ষণ মোড' } },
        moduleToggles: { wholesale: true, resell: true, rentacar: true, flights: true, delivery: true },
        themeSettings: {
            light: { bgPrimary: '#FFFFFF', bgSecondary: '#F9FAFB', textPrimary: '#111827', textSecondary: '#6B7280', accentPrimary: '#F43F5E', accentSecondary: '#E11D48' },
            dark: { bgPrimary: '#111827', bgSecondary: '#1F2937', textPrimary: '#F9FAFB', textSecondary: '#9CA3AF', accentPrimary: '#F43F5E', accentSecondary: '#E11D48' }
        },
        homepageSections: {
            hero: { show: true, order: 1, title: { en: 'Welcome', bn: 'স্বাগতম' }, subtitle: { en: '', bn: '' }, placeholder: { en: 'Search...', bn: 'খুঁজুন...' } },
            promotions: { show: true, order: 2, title: { en: 'Offers', bn: 'অফার' } },
            categories: { show: true, order: 3, title: { en: 'Categories', bn: 'ক্যাটাগরি' } },
            featured: { show: true, order: 4, title: { en: 'Featured', bn: 'জনপ্রিয়' } }
        },
        socialLinks: { facebook: '', twitter: '', instagram: '', youtube: '' },
        footerDescription: { en: 'The multi-service digital platform of Sakhipur.', bn: 'সখিপুরের মাল্টি-সার্ভিস ডিজিটাল প্ল্যাটফর্ম।' },
        copyrightText: { en: '© 2026 Sakhipur Bazar. All rights reserved.', bn: '© ২০২৬ সখিপুর বাজার। সর্বস্বত্ব সংরক্ষিত।' },
        customProductSections: [],
        mainTabs: {}
    } as any as PlatformSettings);
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [homepageSections, setHomepageSections] = useState<HomepageSection[]>([]);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [wishlist, setWishlist] = useState<Product[]>(() => JSON.parse(localStorage.getItem('wishlist') || '[]'));
    const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => JSON.parse(localStorage.getItem('recentlyViewed') || '[]'));

    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    useEffect(() => {
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }, [recentlyViewed]);

    // Apply dark mode class to HTML element
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const addToWishlist = useCallback((product: Product) => {
        setWishlist(prev => prev.find(p => p.id === product.id) ? prev : [...prev, product]);
    }, []);

    const removeFromWishlist = useCallback((productId: string) => {
        setWishlist(prev => prev.filter(p => p.id !== productId));
    }, []);

    const isProductInWishlist = useCallback((productId: string) => !!wishlist.find(p => p.id === productId), [wishlist]);

    const addRecentlyViewed = useCallback((product: Product) => {
        setRecentlyViewed(prev => [product, ...prev.filter(p => p.id !== product.id)].slice(0, 10));
    }, []);


    useEffect(() => {
        // Hero Slides Subscription
        const unsubSlides = onSnapshot(collection(db, 'heroSlides'), (snap) => {
            setHeroSlides(snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroSlide)));
        });

        // Platform Settings Subscription
        const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
            if (snap.exists()) setPlatformSettings(snap.data() as PlatformSettings);
        });

        return () => { unsubSlides(); unsubSettings(); };
    }, []);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const updatePlatformSettings = (settings: Partial<PlatformSettings>) => setPlatformSettings(prev => ({ ...prev, ...settings }));
    const updateHeroSlides = (slides: HeroSlide[]) => setHeroSlides(slides);

    return (
        <SystemContext.Provider value={{
            language, setLanguage, theme, toggleTheme,
            platformSettings, updatePlatformSettings, heroSlides, updateHeroSlides, homepageSections,
            newsItems, wishlist, recentlyViewed, addToWishlist, removeFromWishlist, isProductInWishlist, addRecentlyViewed
        }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (!context) throw new Error('useSystem must be used within a SystemProvider');
    return context;
};
