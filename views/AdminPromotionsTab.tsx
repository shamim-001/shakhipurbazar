import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { ProductPromotion } from '../types';
import { SparklesIcon, CheckCircleIcon, XIcon, EyeIcon, CurrencyDollarIcon } from '../components/icons';

const AdminPromotionsTab: React.FC = () => {
    const { language, productPromotions, products, vendors, users, updatePromotion } = useApp();
    const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'pending_approval'>('all');

    const filteredPromotions = productPromotions.filter(promo => {
        if (filter === 'all') return true;
        return promo.status === filter;
    }).sort((a, b) => b.priority - a.priority);

    const getProductName = (productId: string) => {
        const product = products.find(p => p.id === productId);
        return product?.name[language] || 'Unknown Product';
    };

    const getVendorName = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId);
        return vendor?.name[language] || 'Unknown Vendor';
    };

    const totalActivePromotions = productPromotions.filter(p => p.status === 'active').length;
    const totalRevenue = productPromotions.reduce((sum, p) => sum + p.totalSpent, 0);
    const totalRemainingBudget = productPromotions.filter(p => p.status === 'active')
        .reduce((sum, p) => sum + p.remainingBudget, 0);

    const content = {
        en: {
            title: 'Promotion Management',
            subtitle: 'Monitor and manage all vendor promotions',
            overview: 'Overview',
            activePromos: 'Active Promotions',
            totalRevenue: 'Total Revenue',
            remainingBudget: 'Total Remaining Budget',
            filters: 'Filters',
            all: 'All',
            active: 'Active',
            paused: 'Paused',
            pending: 'Pending Approval',
            product: 'Product',
            vendor: 'Vendor',
            dailyBudget: 'Daily Budget',
            spent: 'Spent',
            remaining: 'Remaining',
            priority: 'Priority',
            status: 'Status',
            actions: 'Actions',
            view: 'View Details',
            noPromotions: 'No promotions found'
        },
        bn: {
            title: 'প্রচার ব্যবস্থাপনা',
            subtitle: 'সমস্ত বিক্রেতার প্রচার নিরীক্ষণ এবং পরিচালনা করুন',
            overview: 'সংক্ষিপ্ত বিবরণ',
            activePromos: 'সক্রিয় প্রচার',
            totalRevenue: 'মোট রাজস্ব',
            remainingBudget: 'মোট অবশিষ্ট বাজেট',
            filters: 'ফিল্টার',
            all: 'সব',
            active: 'সক্রিয়',
            paused: 'বিরতি',
            pending: 'অনুমোদনের অপেক্ষায়',
            product: 'পণ্য',
            vendor: 'বিক্রেতা',
            dailyBudget: 'দৈনিক বাজেট',
            spent: 'ব্যয়িত',
            remaining: 'অবশিষ্ট',
            priority: 'অগ্রাধিকার',
            status: 'অবস্থা',
            actions: 'ক্রিয়া',
            view: 'বিস্তারিত দেখুন',
            noPromotions: 'কোন প্রচার পাওয়া যায়নি'
        }
    };

    const t = content[language];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <SparklesIcon className="h-7 w-7 text-yellow-500" />
                    {t.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">{t.activePromos}</p>
                            <p className="text-3xl font-bold mt-1">{totalActivePromotions}</p>
                        </div>
                        <SparklesIcon className="h-12 w-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">{t.totalRevenue}</p>
                            <p className="text-3xl font-bold mt-1">৳{totalRevenue.toLocaleString()}</p>
                        </div>
                        <CurrencyDollarIcon className="h-12 w-12 opacity-50" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90">{t.remainingBudget}</p>
                            <p className="text-3xl font-bold mt-1">৳{totalRemainingBudget.toLocaleString()}</p>
                        </div>
                        <CurrencyDollarIcon className="h-12 w-12 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.filters}</h3>
                <div className="flex gap-2 flex-wrap">
                    {(['all', 'active', 'paused', 'pending_approval'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {t[status]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Promotions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.product}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.vendor}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.dailyBudget}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.spent}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.remaining}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.priority}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.status}</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {filteredPromotions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        {t.noPromotions}
                                    </td>
                                </tr>
                            ) : (
                                filteredPromotions.map(promo => {
                                    const product = products.find(p => p.id === promo.productId);
                                    return (
                                        <tr key={promo.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product && (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={getProductName(promo.productId)}
                                                            className="w-10 h-10 rounded object-cover"
                                                        />
                                                    )}
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {getProductName(promo.productId)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {getVendorName(promo.vendorId)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-semibold">
                                                ৳{promo.dailyBudget}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                ৳{promo.totalSpent}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                ৳{promo.remainingBudget}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">
                                                    #{promo.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${promo.status === 'active'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : promo.status === 'paused'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                    }`}>
                                                    {promo.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                {promo.status === 'pending_approval' && (
                                                    <>
                                                        <button
                                                            onClick={() => updatePromotion(promo.id, { status: 'active' })}
                                                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                                                            title="Approve"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => updatePromotion(promo.id, { status: 'ended' })} // Or Rejected
                                                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                            title="Reject"
                                                        >
                                                            <XIcon className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                                {(promo.status === 'active' || promo.status === 'paused') && (
                                                    <button className="text-blue-500 hover:underline text-xs">Manage</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPromotionsTab;
