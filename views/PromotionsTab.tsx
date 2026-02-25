import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { Product, ProductPromotion } from '../types';
import { SparklesIcon, XIcon, PlusIcon, CurrencyDollarIcon, CheckCircleIcon } from '../components/icons';

const PromotionsTab: React.FC<{ vendorId: string }> = ({ vendorId }) => {
    const {
        language, products, productPromotions, createPromotion, pausePromotion,
        resumePromotion, cancelPromotion, updatePromotion, minimumPromotionBid
    } = useApp();

    const [isCreating, setIsCreating] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [dailyBudget, setDailyBudget] = useState(minimumPromotionBid);
    const [totalBudget, setTotalBudget] = useState(500);

    // Get vendor's products that can be promoted
    const eligibleProducts = products.filter(p =>
        p.vendorId === vendorId &&
        p.status === 'Approved' &&
        p.stock > 0 &&
        !p.isPromoted
    );

    // Get vendor's active/paused promotions
    const vendorPromotions = productPromotions.filter(p =>
        p.vendorId === vendorId && p.status !== 'ended'
    ).sort((a, b) => b.priority - a.priority);

    const handleCreatePromotion = async () => {
        if (!selectedProductId) {
            alert('Please select a product to promote');
            return;
        }

        const result = await createPromotion({
            productId: selectedProductId,
            vendorId: vendorId,
            dailyBudget: dailyBudget,
            remainingBudget: totalBudget,
            totalSpent: 0,
            startDate: new Date().toISOString(),
            priority: dailyBudget
        });

        if (result) {
            setIsCreating(false);
            setSelectedProductId('');
            setDailyBudget(minimumPromotionBid);
            setTotalBudget(500);
        }
    };

    const handleAddBudget = (promotionId: string) => {
        const amount = prompt('Enter amount to add to budget (৳):');
        if (!amount || isNaN(Number(amount))) return;

        const promotion = productPromotions.find(p => p.id === promotionId);
        if (!promotion) return;

        updatePromotion(promotionId, {
            remainingBudget: promotion.remainingBudget + Number(amount)
        });

        alert(`Successfully added ৳${amount} to promotion budget`);
    };

    const getProductName = (productId: string) => {
        const product = products.find(p => p.id === productId);
        return product?.name[language] || 'Unknown Product';
    };

    const content = {
        en: {
            title: 'Product Promotions',
            subtitle: 'Boost your products visibility with targeted advertising',
            active: 'Active Promotions',
            create: 'Create New Promotion',
            selectProduct: 'Select Product',
            dailyBudget: 'Daily Budget',
            totalBudget: 'Total Budget',
            minBudget: 'Minimum',
            submit: 'Create Promotion',
            cancel: 'Cancel',
            noEligible: 'No eligible products available to promote',
            noActive: 'No active promotions',
            pause: 'Pause',
            resume: 'Resume',
            cancelPromo: 'Cancel',
            addBudget: 'Add Budget',
            spent: 'Spent',
            remaining: 'Remaining',
            priority: 'Priority',
            status: 'Status'
        },
        bn: {
            title: 'পণ্য প্রচার',
            subtitle: 'লক্ষ্যযুক্ত বিজ্ঞাপনের মাধ্যমে আপনার পণ্যের দৃশ্যমানতা বাড়ান',
            active: 'সক্রিয় প্রচার',
            create: 'নতুন প্রচার তৈরি করুন',
            selectProduct: 'পণ্য নির্বাচন করুন',
            dailyBudget: 'দৈনিক বাজেট',
            totalBudget: 'মোট বাজেট',
            minBudget: 'ন্যূনতম',
            submit: 'প্রচার তৈরি করুন',
            cancel: 'বাতিল',
            noEligible: 'প্রচার করার জন্য কোন যোগ্য পণ্য উপলব্ধ নেই',
            noActive: 'কোন সক্রিয় প্রচার নেই',
            pause: 'বিরতি',
            resume: 'পুনরায় শুরু',
            cancelPromo: 'বাতিল',
            addBudget: 'বাজেট যোগ করুন',
            spent: 'ব্যয়িত',
            remaining: 'অবশিষ্ট',
            priority: 'অগ্রাধিকার',
            status: 'অবস্থা'
        }
    };

    const t = content[language];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <SparklesIcon className="h-7 w-7 text-yellow-500" />
                        {t.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
                </div>

                {!isCreating && eligibleProducts.length > 0 && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        {t.create}
                    </button>
                )}
            </div>

            {/* Create Promotion Form */}
            {isCreating && (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.create}</h3>

                    {/* Product Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.selectProduct}
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{t.selectProduct}</option>
                            {eligibleProducts.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name[language]} - ৳{p.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Daily Budget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.dailyBudget} ({t.minBudget}: ৳{minimumPromotionBid})
                        </label>
                        <input
                            type="number"
                            min={minimumPromotionBid}
                            value={dailyBudget}
                            onChange={(e) => setDailyBudget(Number(e.target.value))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Higher daily budget = Higher priority in listings
                        </p>
                    </div>

                    {/* Total Budget */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.totalBudget}
                        </label>
                        <input
                            type="number"
                            min={dailyBudget}
                            value={totalBudget}
                            onChange={(e) => setTotalBudget(Number(e.target.value))}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Duration: ~{Math.floor(totalBudget / dailyBudget)} days
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreatePromotion}
                            className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
                        >
                            {t.submit}
                        </button>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setSelectedProductId('');
                            }}
                            className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                            {t.cancel}
                        </button>
                    </div>
                </div>
            )}

            {/* Active Promotions */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t.active}</h3>

                {vendorPromotions.length === 0 ? (
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-8 text-center">
                        <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">{t.noActive}</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {vendorPromotions.map(promo => {
                            const product = products.find(p => p.id === promo.productId);
                            if (!product) return null;

                            return (
                                <div
                                    key={promo.id}
                                    className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-l-4 border-rose-500"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={product.images[0]}
                                                alt={product.name[language]}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-white">
                                                    {product.name[language]}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-2 text-sm">
                                                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                                        <CurrencyDollarIcon className="h-4 w-4" />
                                                        ৳{promo.dailyBudget}/day
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${promo.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                        }`}>
                                                        {promo.status === 'active' ? 'Active' : 'Paused'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {promo.status === 'active' ? (
                                                <button
                                                    onClick={() => pausePromotion(promo.id)}
                                                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors font-medium"
                                                >
                                                    {t.pause}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => resumePromotion(promo.id)}
                                                    className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors font-medium"
                                                >
                                                    {t.resume}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => cancelPromotion(promo.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title={t.cancelPromo}
                                            >
                                                <XIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Budget Info */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.spent}</p>
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                ৳{promo.totalSpent}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.remaining}</p>
                                            <p className="text-lg font-semibold text-gray-800 dark:text-white">
                                                ৳{promo.remainingBudget}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.priority}</p>
                                            <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                                                #{promo.priority}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Add Budget Button */}
                                    <button
                                        onClick={() => handleAddBudget(promo.id)}
                                        className="mt-4 w-full bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                                    >
                                        + {t.addBudget}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* No Eligible Products Message */}
            {eligibleProducts.length === 0 && !isCreating && vendorPromotions.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
                    <p className="text-blue-800 dark:text-blue-300">{t.noEligible}</p>
                </div>
            )}
        </div>
    );
};

export default PromotionsTab;
