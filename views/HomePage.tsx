import React, { useState, useMemo, useEffect } from 'react';
import { Product, HomepageSection } from '../types';
import ProductCard from '../components/ProductCard';
import ProductSkeleton from '../components/ProductSkeleton';
import { useApp } from '../src/context/AppContext';
import { SearchIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from '../components/icons';
import SEO from '../src/components/SEO';
import { useNavigate } from 'react-router-dom';

import { useRecentSearches } from '../src/hooks/useRecentSearches';

const HeroBanner = () => {
    const { language, heroSlides, platformSettings } = useApp();
    const navigate = useNavigate();
    const { addSearchTerm } = useRecentSearches();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);

    const { title, subtitle, placeholder } = platformSettings.homepageSections.hero;

    useEffect(() => {
        if (heroSlides.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % heroSlides.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [heroSlides.length]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (searchQuery.trim() !== '') {
            addSearchTerm(searchQuery.trim());
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    if (heroSlides.length > 0) {
        return (
            <div className="relative h-96 w-full overflow-hidden">
                {heroSlides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="absolute inset-0 bg-black/40 z-10"></div>
                        <img src={slide.image} alt={slide.title[language]} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center text-white px-4">
                            <h1 className="text-3xl md:text-5xl font-bold mb-4 drop-shadow-lg">{slide.title[language]}</h1>
                            <p className="text-xl md:text-2xl mb-8 drop-shadow-md">{slide.subtitle[language]}</p>
                            <form onSubmit={handleSearchSubmit} className="max-w-xl w-full relative">
                                <input
                                    type="text"
                                    placeholder={placeholder[language]}
                                    className="w-full rounded-full py-3 px-6 text-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFB6B6] text-white rounded-full p-2 hover:bg-[#e6a4a4]">
                                    <SearchIcon className="h-6 w-6" />
                                </button>
                            </form>
                        </div>
                    </div>
                ))}

                {heroSlides.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center gap-2">
                        {heroSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`w-3 h-3 rounded-full transition-colors ${idx === currentSlide ? 'bg-rose-500' : 'bg-white/50 hover:bg-white'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-[#FFF3E0] dark:bg-slate-800 py-20 md:py-32 text-center">
            <div className="container mx-auto px-4 flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-bold text-[#795548] dark:text-rose-200 mb-6 font-poppins drop-shadow-sm">{title[language]}</h1>
                <p className="text-lg md:text-xl text-[#795548]/80 dark:text-rose-100/70 max-w-2xl mx-auto mb-10 leading-relaxed">{subtitle[language]}</p>
                <form onSubmit={handleSearchSubmit} className="max-w-2xl w-full relative shadow-2xl rounded-full overflow-hidden transition-transform hover:scale-[1.01]">
                    <input
                        type="text"
                        placeholder={placeholder[language]}
                        className="w-full rounded-full py-4 px-8 text-xl dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-rose-300/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-full p-3 hover:from-rose-500 hover:to-rose-600 shadow-md transition-all">
                        <SearchIcon className="h-6 w-6" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const PromotionsSection = () => {
    const { language, platformSettings, products } = useApp();
    const navigate = useNavigate();

    // Dynamically derive promotions from promoted products if no dedicated promotions exist
    const promotions = useMemo(() => {
        const promotedProducts = products.filter(p => p.isPromoted && p.status === 'Approved').slice(0, 4);

        return promotedProducts.map((p, idx) => ({
            id: p.id,
            type: idx === 0 ? 'banner' : 'card',
            category: p.category.en,
            image: p.images[0],
            title: p.name,
            discountText: {
                en: `Special Offer on ${p.name.en}`,
                bn: `${p.name.bn} এ বিশেষ ছাড়`
            },
            bgColorClass: ['bg-rose-50', 'bg-blue-50', 'bg-green-50', 'bg-amber-50'][idx % 4]
        }));
    }, [products]);

    const bannerPromo = useMemo(() => promotions.find(p => p.type === 'banner'), [promotions]);
    const cardPromos = useMemo(() => promotions.filter(p => p.type === 'card'), [promotions]);

    if (promotions.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            {bannerPromo && (
                <div
                    className="bg-rose-500 text-white rounded-xl shadow-lg overflow-hidden mb-8 cursor-pointer relative group"
                    onClick={() => navigate(`/product/${bannerPromo.id}`)}
                >
                    <img src={bannerPromo.image} alt={bannerPromo.title[language]} className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end md:items-center justify-start md:justify-center">
                        <div className="text-left md:text-center p-6 md:p-8">
                            <h2 className="text-2xl md:text-4xl font-bold drop-shadow-lg">{bannerPromo.title[language]}</h2>
                            <p className="text-sm md:text-lg mt-2 font-medium bg-rose-400/30 backdrop-blur-sm inline-block px-4 py-1 rounded-full">{bannerPromo.discountText[language]}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="md:hidden">
                <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200 mb-4">{platformSettings.homepageSections.promotions.title[language]}</h2>
                <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                    {/* Style block removed - using scrollbar-hide class */}
                    {cardPromos.slice(0, 3).map((promo, idx) => (
                        <div
                            key={promo.id || idx}
                            className={`flex-shrink-0 w-40 rounded-xl overflow-hidden shadow-sm group cursor-pointer ${promo.bgColorClass} dark:bg-opacity-20`}
                            onClick={() => navigate(`/category/${promo.category}`)}
                        >
                            <div className="p-4 flex flex-col items-center text-center">
                                <img src={promo.image} alt={promo.title[language]} className="w-24 h-24 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300" />
                                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm h-10 flex items-center">{promo.discountText[language]}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {cardPromos.map((promo, idx) => (
                    <div
                        key={promo.id || idx}
                        className={`rounded-xl overflow-hidden shadow-sm group cursor-pointer ${promo.bgColorClass} dark:bg-opacity-20`}
                        onClick={() => navigate(`/category/${promo.category}`)}
                    >
                        <div className="p-4 flex flex-col items-center text-center">
                            <img src={promo.image} alt={promo.title[language]} className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg mb-3 transform group-hover:scale-105 transition-transform duration-300" />
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base">{promo.discountText[language]}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CategoryNavigationProps {
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    activeSubCategory: string;
    setActiveSubCategory: (subCategory: string) => void;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({ activeCategory, setActiveCategory, activeSubCategory, setActiveSubCategory }) => {
    const { language, products, categoryCommissions, platformSettings } = useApp();
    const navigate = useNavigate();
    const [activeMainTab, setActiveMainTab] = useState('Category');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const mainTabs = useMemo(() => {
        if (!platformSettings.mainTabs) return [];
        // Default order
        const order = ['Category', 'Shop', 'Wholesale', 'Resell', 'Rent a Car', 'Flight Ticket'];

        // Filter and map
        return order
            .filter(key => key === 'Category' || platformSettings.mainTabs[key]?.show)
            .map(key => ({
                key: key,
                label: key === 'Category'
                    ? (language === 'en' ? 'Category' : 'ক্যাটাগরি')
                    : platformSettings.mainTabs[key]?.label[language] || key
            }));
    }, [platformSettings.mainTabs, language]);

    const mainCategories = useMemo(() => {
        const getIcon = (category: string) => {
            const lower = category.toLowerCase();
            if (lower.includes('cake') || lower.includes('bakery') || lower.includes('pastry') || lower.includes('dessert')) return '🎂';
            if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dining') || lower.includes('pizza') || lower.includes('burger')) return '🍕';
            if (lower.includes('baby') || lower.includes('mom') || lower.includes('child') || lower.includes('kid')) return '🍼';
            if (lower.includes('grocery') || lower.includes('vegetable') || lower.includes('fruit') || lower.includes('fish') || lower.includes('meat')) return '🥬';
            if (lower.includes('beverage') || lower.includes('drink') || lower.includes('coffee') || lower.includes('tea') || lower.includes('juice')) return '☕';
            if (lower.includes('electronics') || lower.includes('mobile') || lower.includes('gadget') || lower.includes('computer') || lower.includes('laptop')) return '📱';
            if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('wear') || lower.includes('shirt') || lower.includes('shoe')) return '👕';
            if (lower.includes('book') || lower.includes('stationery') || lower.includes('pen') || lower.includes('paper')) return '📚';
            if (lower.includes('medicine') || lower.includes('health') || lower.includes('pharmacy') || lower.includes('doctor')) return '💊';
            if (lower.includes('vehicle') || lower.includes('car') || lower.includes('bike') || lower.includes('motor') || lower.includes('cycle')) return '🚗';
            if (lower.includes('home') || lower.includes('living') || lower.includes('decor') || lower.includes('furniture')) return '🏠';
            if (lower.includes('beauty') || lower.includes('cosmetic') || lower.includes('makeup') || lower.includes('skin')) return '💄';
            if (lower.includes('gift') || lower.includes('toy') || lower.includes('game')) return '🎁';
            if (lower.includes('pet') || lower.includes('animal') || lower.includes('dog') || lower.includes('cat')) return '🐾';
            if (lower.includes('sport') || lower.includes('gym') || lower.includes('fitness')) return '⚽';
            return '🛍️';
        };

        // Filter inactive categories and sort by order
        return [...categoryCommissions]
            .filter(comm => comm.isActive)
            .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
            .map(comm => ({
                en: comm.category.en,
                bn: comm.category.bn,
                icon: comm.icon || getIcon(comm.category.en)
            }));

    }, [categoryCommissions]);

    const subCategoriesByCategory = useMemo(() => {
        const subCatMap = new Map<string, { en: string; bn: string }[]>();

        categoryCommissions.forEach(comm => {
            if (comm.isActive && comm.subCategories && comm.subCategories.length > 0) {
                // Filter out inactive subcategories
                const activeSubs = comm.subCategories
                    .filter(sub => sub.isActive !== false)
                    .map(sub => sub.name);

                if (activeSubs.length > 0) {
                    subCatMap.set(comm.category.en, activeSubs);
                }
            }
        });

        return subCatMap;
    }, [categoryCommissions]);

    const handleMainTabClick = (tabKey: string) => {
        if (tabKey === 'Shop') navigate('/shops');
        else if (tabKey === 'Wholesale') navigate('/wholesale');
        else if (tabKey === 'Resell') navigate('/resell');
        else if (tabKey === 'Rent a Car') navigate('/rentacar');
        else if (tabKey === 'Flight Ticket') navigate('/flights');
        else setActiveMainTab(tabKey);
    };

    const handleMainCategoryClick = (categoryEn: string) => {
        if (categoryEn === 'Rent a Car') {
            navigate('/rentacar');
            return;
        }
        if (categoryEn === 'Flights') {
            navigate('/flights');
            return;
        }
        setActiveCategory(categoryEn);
        setActiveSubCategory('All');
        if (subCategoriesByCategory.has(categoryEn)) {
            setExpandedCategory(prev => (prev === categoryEn ? null : categoryEn));
        } else {
            setExpandedCategory(null);
        }
    };

    const handleSubCategoryClick = (subCategoryEn: string) => {
        setActiveSubCategory(subCategoryEn);
    };

    return (
        <div className="container mx-auto px-4 py-4">
            <div className="border-b dark:border-slate-700">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {mainTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleMainTabClick(tab.key)}
                            className={`${activeMainTab === tab.key
                                ? 'border-red-400 text-red-500'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 pb-2">
                {mainCategories.map(cat => (
                    <div key={cat.en}>
                        <button
                            onClick={() => handleMainCategoryClick(cat.en)}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${activeCategory === cat.en
                                ? 'bg-[#795548] text-white'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span>{cat.icon}</span>
                            <span>{cat[language]}</span>
                            {subCategoriesByCategory.has(cat.en) && <ChevronDownIcon className={`h-4 w-4 transition-transform ${expandedCategory === cat.en ? 'rotate-180' : ''}`} />}
                        </button>
                    </div>
                ))}
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategory ? 'max-h-[200px]' : 'max-h-0'}`}>
                {expandedCategory && subCategoriesByCategory.has(expandedCategory) && (
                    <div className="mt-2 flex flex-wrap gap-2 border-t dark:border-slate-700 pt-3 pb-2">
                        <button
                            onClick={() => handleSubCategoryClick('All')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeSubCategory === 'All'
                                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {language === 'en' ? 'All' : 'সব'}
                        </button>
                        {subCategoriesByCategory.get(expandedCategory)!.map(subCat => (
                            <button
                                key={subCat.en}
                                onClick={() => handleSubCategoryClick(subCat.en)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeSubCategory === subCat.en
                                    ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {subCat[language]}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


interface ProductGridProps {
    activeCategory: string;
    activeSubCategory: string;
    title?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ activeCategory, activeSubCategory, title }) => {
    const { language, products, platformSettings } = useApp();
    const [visibleProductsCount, setVisibleProductsCount] = useState(10);

    const filteredProducts = useMemo(() => {
        // If a category is selected, show ALL products in that category.
        // If no category is selected (default view), show only 'new' (Featured) products.
        let filtered = products.filter(p => p.status === 'Approved');

        if (!activeCategory) {
            filtered = filtered.filter(p => p.productType === 'new');
        }

        if (activeCategory) {
            filtered = filtered.filter(p => p.category.en === activeCategory);
        }

        if (activeSubCategory && activeSubCategory !== 'All') {
            filtered = filtered.filter(p => p.subCategory && p.subCategory.en === activeSubCategory);
        }

        // Separate promoted and non-promoted products
        const promoted = filtered.filter(p => p.isPromoted);
        const regular = filtered.filter(p => !p.isPromoted);

        // Sort promoted by priority (higher priority first)
        promoted.sort((a, b) => {
            const aPriority = products.find(p => p.id === a.id)?.isPromoted ? 100 : 0;
            const bPriority = products.find(p => p.id === b.id)?.isPromoted ? 100 : 0;
            return bPriority - aPriority;
        });

        // Promoted products first, then regular products
        return [...promoted, ...regular];
    }, [activeCategory, activeSubCategory, products]);

    const productsToShow = useMemo(() => {
        return filteredProducts.slice(0, visibleProductsCount);
    }, [filteredProducts, visibleProductsCount]);

    const loadMore = () => {
        setVisibleProductsCount(prev => Math.min(prev + 5, filteredProducts.length));
    };

    // Use provided title or fallback to the Featured Section title setting
    const displayTitle = title || platformSettings.homepageSections.featured.title[language];

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#795548] dark:text-rose-200 mb-8">{displayTitle}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {products.length === 0 ? (
                    Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)
                ) : (
                    productsToShow.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>
            {productsToShow.length === 0 && (
                <div className="text-center py-10 col-span-full">
                    <p className="text-gray-500 dark:text-gray-400">No products found for this selection.</p>
                </div>
            )}
            {visibleProductsCount < filteredProducts.length && (
                <div className="text-center mt-12">
                    <button
                        onClick={loadMore}
                        className="bg-[#795548] text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors"
                    >
                        {language === 'en' ? 'Load More' : 'আরও দেখুন'}
                    </button>
                </div>
            )}
        </div>
    );
};


const HomepageAnnouncement = () => {
    const { platformSettings, language } = useApp();

    if (!platformSettings.announcement?.show) return null;

    return (
        <div className="bg-[#795548] dark:bg-rose-900 text-white py-2 px-4 text-center text-sm font-medium animate-fade-in relative z-50">
            {platformSettings.announcement.message[language]}
            {platformSettings.announcement.link && (
                <a href={platformSettings.announcement.link} className="ml-2 underline hover:text-rose-200">
                    {language === 'en' ? 'Learn More' : 'আরও জানুন'} &rarr;
                </a>
            )}
        </div>
    );
};

const FeaturedCategorySection: React.FC<{ section: HomepageSection }> = ({ section }) => {
    const { language, products, categoryCommissions } = useApp();

    const sectionProducts = useMemo(() => {
        let filtered = products.filter(p => p.productType === 'new' && p.status === 'Approved');

        if (section.targetCategoryId.includes('::')) {
            const [catId, subNameEn] = section.targetCategoryId.split('::');
            // Support subcategory specifically
            filtered = filtered.filter(p => {
                // Find parent category to ensure we match correctly
                const parentCat = categoryCommissions.find(c => c.id === catId);
                return parentCat && p.category.en === parentCat.category.en && p.subCategory?.en === subNameEn;
            });
        } else {
            const targetCat = categoryCommissions.find(c => c.id === section.targetCategoryId);
            if (targetCat) {
                filtered = filtered.filter(p => p.category.en === targetCat.category.en);
            } else {
                return [];
            }
        }

        return filtered.slice(0, section.displayLimit || 8);
    }, [products, categoryCommissions, section.targetCategoryId, section.displayLimit]);

    const isInitialLoading = products.length === 0;

    if (!isInitialLoading && sectionProducts.length === 0) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <SparklesIcon className="h-6 w-6 text-amber-500 mr-2" />
                    {section.title[language]}
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {isInitialLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
                ) : (
                    sectionProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>
            {sectionProducts.length === 0 && !isInitialLoading && (
                <div className="text-center py-8 text-gray-500">
                    No products found in this section.
                </div>
            )}
        </div>
    );
};

const HomePage = () => {
    const [activeCategory, setActiveCategory] = useState('');
    const [activeSubCategory, setActiveSubCategory] = useState('All');
    const { platformSettings, language, products: allProducts } = useApp(); // Used for Custom Sections

    useEffect(() => {
        setActiveSubCategory('All');
    }, [activeCategory]);


    return (
        <div className="bg-white dark:bg-slate-800/20">
            <SEO
                title={language === 'en' ? "Home" : "হোম"}
                description={language === 'en' ? "Your one-stop local marketplace for everything in Sakhipur." : "সখিপুরে আপনার প্রয়োজনীয় সবকিছুর জন্য একমাত্র স্থানীয় মার্কেটপ্লেস।"}
            />
            <HomepageAnnouncement />

            {import.meta.env.MODE !== 'production' && (
                <div className="bg-amber-500 text-white text-[10px] font-bold py-0.5 px-2 text-center uppercase tracking-wider sticky top-0 z-[100] shadow-sm select-none pointer-events-none">
                    Development Environment
                </div>
            )}

            {platformSettings.homepageSections.hero.show && (
                <HeroBanner />
            )}

            {platformSettings.homepageSections.promotions.show && (
                <PromotionsSection />
            )}

            {platformSettings.homepageSections.categories.show && (
                <CategoryNavigation
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    activeSubCategory={activeSubCategory}
                    setActiveSubCategory={setActiveSubCategory}
                />
            )}

            {platformSettings.homepageSections.featured.show && (
                <ProductGrid
                    activeCategory={activeCategory}
                    activeSubCategory={activeSubCategory}
                />
            )}

            {/* Dynamic Featured Category Sections */}
            {useApp().homepageSections
                .filter(section => section.isActive)
                .sort((a, b) => (a.priority || 0) - (b.priority || 0))
                .map(section => (
                    <FeaturedCategorySection key={section.id} section={section} />
                ))
            }


            {/* Custom Product Sections */}
            {(platformSettings.customProductSections || []).map(section => section.show && (
                <div key={section.id} className="container mx-auto px-4 py-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center">
                        <SparklesIcon className="h-6 w-6 text-[#795548] dark:text-rose-400 mr-2" />
                        {section.title[language]}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                        {allProducts.filter(p => section.productIds.includes(p.id)).map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                        {allProducts.filter(p => section.productIds.includes(p.id)).length === 0 && (
                            <p className="col-span-full text-center text-gray-500">No products selected for this section yet.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HomePage;
