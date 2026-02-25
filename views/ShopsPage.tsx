
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import ShopCard from '../components/ShopCard';
import { ChevronLeftIcon, SearchIcon, CategoryIcon, LocationIcon, StarIcon, ChevronDownIcon, BuildingStorefrontIcon } from '../components/icons';
import ComingSoon from '../components/ComingSoon';

const ShopsPage: React.FC = () => {
    const { language, vendors, platformSettings } = useApp();
    const navigate = useNavigate();
    const showFeatured = platformSettings.showFeaturedShops !== false;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [selectedRating, setSelectedRating] = useState(0); // 0 for all
    const [openFilter, setOpenFilter] = useState<string | null>(null); // 'category', 'location', 'rating'
    const filterRef = useRef<HTMLDivElement>(null);



    // Calculate scores and determine featured shops
    const processedShops = useMemo(() => {
        return vendors
            .filter(v => v.status === 'Active')
            .map(v => {
                const joinedDays = Math.floor((new Date().getTime() - new Date(v.joined).getTime()) / (1000 * 60 * 60 * 24));
                // Score = (Rating * 10) + (JoinedDays * 0.1)
                const autoScore = (v.rating * 10) + (joinedDays * 0.1);

                return {
                    ...v,
                    autoScore,
                    isManuallyFeatured: v.featuredData?.status === 'manual' || (v.featuredData?.status === undefined && v.isFeatured),
                    priority: v.featuredData?.priority || 0
                };
            });
    }, [vendors]);

    const featuredShops = useMemo(() => {
        if (!showFeatured) return [];

        return [...processedShops]
            .filter(v => v.isManuallyFeatured || v.autoScore > 45) // Threshold for auto-featuring
            .sort((a, b) => {
                // 1. Manual first
                if (a.isManuallyFeatured && !b.isManuallyFeatured) return -1;
                if (!a.isManuallyFeatured && b.isManuallyFeatured) return 1;

                // 2. If both manual, sort by priority
                if (a.isManuallyFeatured && b.isManuallyFeatured) {
                    return b.priority - a.priority;
                }

                // 3. Otherwise sort by autoScore
                return b.autoScore - a.autoScore;
            })
            .slice(0, 8); // Limit to top 8
    }, [processedShops, showFeatured]);

    const filteredShops = useMemo(() => {
        return processedShops
            .filter(v =>
                v.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.name.bn.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .filter(v => selectedCategory === 'All' || v.category.en === selectedCategory)
            .filter(v => selectedLocation === 'All' || v.location === selectedLocation)
            .filter(v => v.rating >= selectedRating);
    }, [processedShops, searchQuery, selectedCategory, selectedLocation, selectedRating]);

    const categories = useMemo(() => ['All', ...Array.from(new Set(vendors.map(v => v.category.en)))], [vendors]);
    const locations = useMemo(() => ['All', ...Array.from(new Set(vendors.map(v => v.location)))], [vendors]);
    const ratings = [
        { label: { en: 'All Ratings', bn: 'সব রেটিং' }, value: 0 },
        { label: { en: '4 Stars & Up', bn: '৪ স্টার ও উপরে' }, value: 4 },
        { label: { en: '3 Stars & Up', bn: '৩ স্টার ও উপরে' }, value: 3 },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setOpenFilter(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const content = {
        en: {
            title: "Shops",
            searchPlaceholder: "Search shops...",
            category: "Category",
            location: "Location",
            rating: "Rating",
            featured: "Featured",
            allShops: "All Shops",
            noShopsFound: "No shops found matching your criteria.",
        },
        bn: {
            title: "দোকান",
            searchPlaceholder: "দোকান খুঁজুন...",
            category: "ক্যাটাগরি",
            location: "অবস্থান",
            rating: "রেটিং",
            featured: "বৈশিষ্ট্যযুক্ত",
            allShops: "সব দোকান",
            noShopsFound: "আপনার মানদণ্ডের সাথে মেলে এমন কোনো দোকান পাওয়া যায়নি।",
        }
    }

    const getCategoryName = (catEn: string) => {
        if (catEn === 'All') return language === 'en' ? 'All Categories' : 'সব ক্যাটাগরি';
        const vendor = vendors.find(v => v.category.en === catEn);
        return vendor ? vendor.category[language] : catEn;
    }

    const renderFilterDropdown = (type: 'category' | 'location' | 'rating') => {
        let options;
        switch (type) {
            case 'category':
                options = categories.map(c => ({ value: c, label: getCategoryName(c) }));
                break;
            case 'location':
                options = locations.map(l => ({ value: l, label: l === 'All' ? (language === 'en' ? 'All Locations' : 'সব অবস্থান') : l }));
                break;
            case 'rating':
                options = ratings.map(r => ({ value: r.value, label: r.label[language] }));
                break;
        }

        return (
            <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-10 border dark:border-slate-700">
                {options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            if (type === 'category') setSelectedCategory(option.value as string);
                            if (type === 'location') setSelectedLocation(option.value as string);
                            if (type === 'rating') setSelectedRating(option.value as number);
                            setOpenFilter(null);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg"
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        );
    }

    // If no vendors/shops at all, show Coming Soon (MOVED AFTER HOOKS)
    if (vendors.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
                <div className="container mx-auto px-4 py-6">
                    <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <ComingSoon icon={BuildingStorefrontIcon} title={language === 'en' ? 'Shops' : 'দোকান'} />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center mb-4">
                    <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold text-center flex-grow text-gray-800 dark:text-gray-100">{content[language].title}</h1>
                    <div className="w-6"></div> {/* Spacer */}
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={content[language].searchPlaceholder}
                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 dark:text-gray-200"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                {/* Filters */}
                <div ref={filterRef} className="flex items-center justify-center space-x-2 md:space-x-4 mb-8">
                    <div className="relative">
                        <button onClick={() => setOpenFilter(openFilter === 'category' ? null : 'category')} className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200">
                            <CategoryIcon className="h-4 w-4" />
                            <span>{content[language].category}</span>
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </button>
                        {openFilter === 'category' && renderFilterDropdown('category')}
                    </div>
                    <div className="relative">
                        <button onClick={() => setOpenFilter(openFilter === 'location' ? null : 'location')} className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200">
                            <LocationIcon className="h-4 w-4" />
                            <span>{content[language].location}</span>
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </button>
                        {openFilter === 'location' && renderFilterDropdown('location')}
                    </div>
                    <div className="relative">
                        <button onClick={() => setOpenFilter(openFilter === 'rating' ? null : 'rating')} className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm text-sm text-gray-700 dark:text-gray-200">
                            <StarIcon className="h-4 w-4" />
                            <span>{content[language].rating}</span>
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                        </button>
                        {openFilter === 'rating' && renderFilterDropdown('rating')}
                    </div>
                </div>

                {/* Featured Shops */}
                {showFeatured && featuredShops.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200 mb-4">{content[language].featured}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {featuredShops.map(vendor => (
                                <ShopCard key={vendor.id} vendor={vendor} />
                            ))}
                        </div>
                    </section>
                )}

                {/* All Shops */}
                <section>
                    <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200 mb-4">{content[language].allShops}</h2>
                    {filteredShops.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {filteredShops.map(vendor => (
                                <ShopCard key={vendor.id} vendor={vendor} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">{content[language].noShopsFound}</h3>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ShopsPage;
