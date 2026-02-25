

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { ChevronLeftIcon, SearchIcon } from '../components/icons';

interface SearchResultsPageProps {
    query?: string; // Made optional
}

import { useRecentSearches } from '../src/hooks/useRecentSearches';

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ query: propQuery }) => {
    const { language, products, vendors } = useApp();
    const navigate = useNavigate();
    const { addSearchTerm } = useRecentSearches();
    const [searchParams] = useSearchParams();
    const urlQuery = searchParams.get('q') || '';
    const query = propQuery || urlQuery; // Effective query

    const [searchQuery, setSearchQuery] = useState(query);

    useEffect(() => {
        setSearchQuery(query);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim() && searchQuery.trim() !== query) {
            addSearchTerm(searchQuery.trim());
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    }

    const lowerCaseQuery = (query || '').toLowerCase();

    const filteredProducts = query ? products.filter(product =>
        product.status === 'Approved' && (
            (product.name?.en || '').toLowerCase().includes(lowerCaseQuery) ||
            (product.name?.bn || '').toLowerCase().includes(lowerCaseQuery) ||
            (product.category?.en || '').toLowerCase().includes(lowerCaseQuery) ||
            (product.category?.bn || '').toLowerCase().includes(lowerCaseQuery) ||
            (product.description && (
                (product.description.en || '').toLowerCase().includes(lowerCaseQuery) ||
                (product.description.bn || '').toLowerCase().includes(lowerCaseQuery)
            ))
        )
    ) : [];

    const filteredVendors = query ? vendors.filter(vendor =>
        (vendor.name?.en || '').toLowerCase().includes(lowerCaseQuery) ||
        (vendor.name?.bn || '').toLowerCase().includes(lowerCaseQuery) ||
        (vendor.category?.en || '').toLowerCase().includes(lowerCaseQuery) ||
        (vendor.category?.bn || '').toLowerCase().includes(lowerCaseQuery)
    ) : [];

    const content = {
        en: {
            title: "Search Results for",
            products: "Products",
            shops: "Shops",
            noResults: "No results found for",
            tryDifferentQuery: "Please try a different search term.",
            back: "Back",
            searchPageTitle: "Search",
            searchPlaceholder: "Search for products, shops, and more..."
        },
        bn: {
            title: "এর জন্য অনুসন্ধানের ফলাফল",
            products: "পণ্য",
            shops: "দোকান",
            noResults: "এর জন্য কোনো ফলাফল পাওয়া যায়নি",
            tryDifferentQuery: "অনুগ্রহ করে একটি ভিন্ন অনুসন্ধান শব্দ চেষ্টা করুন।",
            back: "ফিরে যান",
            searchPageTitle: "অনুসন্ধান",
            searchPlaceholder: "পণ্য, দোকান এবং আরও অনেক কিছুর জন্য অনুসন্ধান করুন..."
        }
    };

    if (!query) {
        return (
            <div className="container mx-auto px-4 py-8">
                <button onClick={() => navigate('/')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    {content[language].back}
                </button>
                <div className="max-w-xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200 mb-8">{content[language].searchPageTitle}</h1>
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder={content[language].searchPlaceholder}
                            className="w-full rounded-full py-3 px-6 text-lg dark:bg-slate-800 dark:text-white dark:placeholder-gray-400 border dark:border-slate-700 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFB6B6] text-white rounded-full p-2 hover:bg-[#e6a4a4]">
                            <SearchIcon className="h-6 w-6" />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => navigate('/')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                {content[language].back}
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-[#795548] dark:text-rose-200 mb-6">
                {language === 'en' ? `${content[language].title} "${query}"` : `"${query}" ${content[language].title}`}
            </h1>

            {filteredProducts.length === 0 && filteredVendors.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{language === 'en' ? `${content[language].noResults} "${query}"` : `"${query}" ${content[language].noResults}`}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{content[language].tryDifferentQuery}</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {filteredProducts.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200 mb-4">{content[language].products} ({filteredProducts.length})</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </section>
                    )}

                    {filteredVendors.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200 mb-4">{content[language].shops} ({filteredVendors.length})</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                {filteredVendors.map(vendor => (
                                    <ShopCard key={vendor.id} vendor={vendor} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;