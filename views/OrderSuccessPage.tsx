import React from 'react';
import { useApp } from '../src/context/AppContext';
import { AnalyticsService } from '../src/services/analyticsService';
import { CheckCircleIcon, ShoppingBagIcon, HomeIcon } from '../components/icons';

import { useSearchParams, useNavigate } from 'react-router-dom';

const OrderSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderIdsStr = searchParams.get('orders');
    const orderIds = React.useMemo(() => orderIdsStr ? orderIdsStr.split(',') : [], [orderIdsStr]);

    // Add cart to destructuring to check its length before clearing
    const { language, orders, clearCart, cart, currentUser } = useApp();

    const navigate = useNavigate();
    const trackedOrdersRef = React.useRef<Set<string>>(new Set());

    // Analytics: Track Purchase & Clear Cart
    React.useEffect(() => {
        if (orderIds.length > 0) {
            // Clear cart on successful order landing - Avoid infinite loop by checking if cart is already empty
            if (cart.length > 0) {
                clearCart();
            }

            if (orders.length > 0) {
                orderIds.forEach(id => {
                    // Prevent duplicate tracking for the same order ID
                    if (trackedOrdersRef.current.has(id)) return;

                    const order = orders.find(o => o.id === id);
                    if (order) {
                        // Pass current user (if logged in) or best available info
                        AnalyticsService.trackPurchase(order, currentUser);
                        trackedOrdersRef.current.add(id);
                    }
                });
            }
        }
    }, [orderIds, orders, clearCart, cart]);


    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {language === 'en' ? 'Order Confirmed!' : 'অর্ডার নিশ্চিত হয়েছে!'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    {language === 'en'
                        ? 'Thank you for your purchase. Your order has been received and is being processed.'
                        : 'আপনার ক্রয়ের জন্য ধন্যবাদ। আপনার অর্ডার গ্রহণ করা হয়েছে এবং প্রক্রিয়া করা হচ্ছে।'}
                </p>

                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 mb-8 text-left border border-gray-200 dark:border-slate-600">
                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200 dark:border-slate-600">
                        <div className="w-12 h-12 bg-[#795548]/10 rounded-full flex items-center justify-center">
                            <ShoppingBagIcon className="w-6 h-6 text-[#795548]" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
                                {language === 'en' ? 'Customer' : 'গ্রাহক'}
                            </p>
                            <p className="font-bold text-gray-800 dark:text-gray-100">
                                {currentUser?.name || (orderIds.length > 0 && orders.find(o => o.id === orderIds[0])?.deliveryAddress && typeof orders.find(o => o.id === orderIds[0])?.deliveryAddress !== 'string' ? (orders.find(o => o.id === orderIds[0])?.deliveryAddress as any).recipientName : 'Guest Customer')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
                                {language === 'en' ? 'Total Amount' : 'মোট পরিমাণ'}
                            </p>
                            <p className="text-xl font-black text-[#795548]">
                                ৳{orderIds.reduce((sum, id) => sum + (orders.find(o => o.id === id)?.total || 0), 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
                                {language === 'en' ? 'Payment Method' : 'পেমেন্ট পদ্ধতি'}
                            </p>
                            <p className="font-bold text-gray-700 dark:text-gray-300">
                                {orderIds.length > 0 ? orders.find(o => o.id === orderIds[0])?.payment : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-3">
                            {language === 'en' ? 'Order IDs' : 'অর্ডার আইডি'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {orderIds.map(id => (
                                <div key={id} className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 py-1.5 px-3 rounded-lg border border-rose-100 dark:border-rose-800/50">
                                    #{id}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/profile?tab=orders')}
                        className="w-full bg-[#795548] text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                    >
                        <ShoppingBagIcon className="w-5 h-5" />
                        {language === 'en' ? 'Track My Order' : 'আমার অর্ডার ট্র্যাক করুন'}
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-transparent border-2 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <HomeIcon className="w-5 h-5" />
                        {language === 'en' ? 'Continue Shopping' : 'কেনাকাটা চালিয়ে যান'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;
