

import React, { useState, useMemo } from 'react';
import { useApp } from '../src/context/AppContext';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { CategoryIcon, UserIcon, CalendarIcon, ArchiveBoxIcon } from '../components/icons';

import { useParams } from 'react-router-dom';
import SEO from '../src/components/SEO';
import { SEOService } from '../src/services/seoService';

const VendorPage: React.FC = () => {
    const { vendorId } = useParams<{ vendorId: string }>();
    const { language, products, vendors } = useApp();
    const vendor = vendors.find(v => v.id === vendorId || v.slug === vendorId);
    const vendorProducts = products.filter(p => vendor && p.vendorId === vendor.id && p.status === 'Approved');

    const [selectedCategory, setSelectedCategory] = useState('All');

    const vendorCategories = useMemo(() => {
        const categories = new Set(vendorProducts.map(p => p.category.en));
        return ['All', ...Array.from(categories)];
    }, [vendorProducts]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') {
            return vendorProducts;
        }
        return vendorProducts.filter(p => p.category.en === selectedCategory);
    }, [vendorProducts, selectedCategory]);

    const totalVendorReviews = useMemo(() => {
        return vendorProducts.reduce((sum, p) => sum + (p.reviews?.length || 0), 0);
    }, [vendorProducts]);

    if (!vendor) {
        return <div className="text-center py-20 dark:text-white">Vendor not found.</div>;
    }

    const getCategoryName = (catEn: string) => {
        if (catEn === 'All') return language === 'en' ? 'All Products' : 'সব পণ্য';
        const product = vendorProducts.find(p => p.category.en === catEn);
        return product ? product.category[language] : catEn;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
            {/* Hero Banner with Gradient Overlay */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url(${vendor.bannerImage || '/placeholder-banner.jpg'})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                </div>
            </div>

            <SEO
                title={vendor.name[language]}
                description={`${vendor.name[language]} in ${vendor.location}. ${vendor.category[language]} products and services.`}
                image={vendor.logo}
                url={`https://sakhipur-bazar.web.app/vendor/${vendor.slug || vendor.id}`}
                schema={SEOService.generateVendorSchema(vendor, totalVendorReviews)}
            />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative -mt-24 z-10">
                {/* Vendor Profile Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">

                            {/* Logo */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-sm"></div>
                                <img
                                    src={vendor.logo}
                                    alt={vendor.name[language]}
                                    className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-lg object-cover bg-white"
                                />
                                {vendor.rating >= 4.5 && (
                                    <div className="absolute bottom-2 right-2 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm" title="Top Rated">
                                        <StarRating rating={1} className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Info Area */}
                            <div className="flex-grow pt-2">
                                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight" style={{ fontFamily: 'Noto Sans Bengali, Poppins, sans-serif' }}>
                                            {vendor.name[language]}
                                        </h1>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-100 dark:border-rose-800">
                                                <CategoryIcon className="w-3.5 h-3.5 mr-1.5" />
                                                {vendor.category[language]}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
                                                <StarRating rating={vendor.rating} className="h-3 w-3 mr-1" />
                                                {vendor.rating} ({totalVendorReviews > 0 ? `${totalVendorReviews} reviews` : 'New'})
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-100 dark:border-green-800">
                                                {vendor.onlineStatus === 'Online' ? '● Online' : '○ Offline'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-2xl mb-6 leading-relaxed">
                                    {language === 'en' ? `Welcome to ${vendor.name[language]}, your trusted source for quality products.` : `${vendor.name[language]} এ আপনাকে স্বাগতম।`}
                                </p>

                                {/* Meta Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 dark:border-slate-700 pt-6 mt-2">
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-600 dark:text-gray-400 group hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                                        <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-colors">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">{language === 'en' ? 'Owner' : 'মালিক'}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{vendor.owner}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-600 dark:text-gray-400 group hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                                        <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-colors">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">{language === 'en' ? 'Joined' : 'যোগদান'}</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{new Date(vendor.joined).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-3 text-sm text-gray-600 dark:text-gray-400 group hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                                        <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg group-hover:bg-rose-50 dark:group-hover:bg-rose-900/20 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs text-gray-400 uppercase font-semibold">{language === 'en' ? 'Location' : 'অবস্থান'}</p>
                                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]" title={vendor.location}>{vendor.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Section */}
                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="bg-[#795548] w-2 h-8 rounded-full inline-block"></span>
                                {language === 'en' ? "Shop Products" : "দোকানের পণ্যসমূহ"}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm ml-4">
                                {filteredProducts.length} {language === 'en' ? 'items available' : 'টি পণ্য উপলব্ধ'}
                            </p>
                        </div>

                        {vendorCategories.length > 1 && (
                            <div className="flex flex-wrap justify-end gap-2">
                                {vendorCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 shadow-sm ${selectedCategory === cat
                                            ? 'bg-[#795548] text-white shadow-md transform scale-105'
                                            : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                                            }`}
                                    >
                                        {getCategoryName(cat)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-slate-700">
                            <div className="mx-auto w-24 h-24 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                                <ArchiveBoxIcon className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-1">
                                {language === 'en' ? 'No products found' : 'কোনো পণ্য পাওয়া যায়নি'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {language === 'en' ? 'Try changing the category filter or come back later.' : 'ক্যাটাগরি পরিবর্তন করে দেখুন অথবা পরে আবার আসুন।'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorPage;