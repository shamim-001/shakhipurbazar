import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { CurrencyDollarIcon, LinkIcon, ShareIcon, ChartBarIcon, ClipboardDocumentCheckIcon, UserGroupIcon, TrendingUpIcon, ShoppingBagIcon, PlusIcon, TrashIcon, ChatBubbleLeftRightIcon } from '../components/icons';

const ResellerDashboardPage = () => {
    const { language, currentUser, users, orders, products, deleteProduct, chatThreads, vendors } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'myListings' | 'inbox'>('overview');
    const [copied, setCopied] = useState(false);

    if (!currentUser) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">Please log in to access the Reseller Dashboard.</p>
            </div>
        );
    }

    if (!currentUser.isReseller) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 p-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <ShareIcon className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            {language === 'en' ? 'Become a Reseller' : 'রিসেলার হন'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            {language === 'en'
                                ? 'You need to enable Reseller Mode to access this dashboard. Go to your profile to activate it.'
                                : 'এই ড্যাশবোর্ড অ্যাক্সেস করতে আপনাকে রিসেলার মোড সক্রিয় করতে হবে। এটি সক্রিয় করতে আপনার প্রোফাইলে যান।'}
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg"
                        >
                            {language === 'en' ? 'Go to Profile' : 'প্রোফাইলে যান'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate statistics
    const referralLink = `${window.location.origin}?ref=${currentUser.referralCode}`;

    // Find orders made with this user's referral code
    const referredOrders = useMemo(() =>
        orders.filter(o => o.referralCode === currentUser.referralCode),
        [orders, currentUser.referralCode]
    );

    // Standard Commission Rate (Should match EconomicsService)
    const RESELLER_COMMISSION_RATE = 0.05;

    const totalEarnings = currentUser.resellerEarnings || 0;
    const pendingEarnings = referredOrders
        .filter(o => ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.status))
        .reduce((sum, o) => sum + (o.total * RESELLER_COMMISSION_RATE), 0);

    const completedOrders = referredOrders.filter(o => o.status === 'Delivered').length;
    const totalReferrals = referredOrders.length;

    // Find referred customers
    const referredCustomers = useMemo(() => {
        const customerIds = new Set(referredOrders.map(o => o.customerId));
        return users.filter(u => customerIds.has(u.id));
    }, [users, referredOrders]);

    // Find my own listed products
    const myProducts = useMemo(() =>
        products.filter(p => p.sellerId === currentUser.id && p.productType === 'resell'),
        [products, currentUser.id]
    );

    // Filter chat threads related to my resell products
    const myInquiries = useMemo(() => {
        const myProductIds = new Set(myProducts.map(p => p.id));
        return chatThreads.filter(t =>
            t.participantIds.includes(currentUser.id) &&
            t.metadata?.productId &&
            myProductIds.has(t.metadata.productId)
        );
    }, [chatThreads, myProducts, currentUser.id]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareSocial = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
        const message = encodeURIComponent(`Check out Sakhipur Bazar! Use my link to get started: ${referralLink}`);
        const urls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
            twitter: `https://twitter.com/intent/tweet?text=${message}`,
            whatsapp: `https://wa.me/?text=${message}`
        };
        window.open(urls[platform], '_blank', 'width=600,height=400');
    };

    const content = {
        en: {
            title: 'Reseller Dashboard',
            greeting: `Welcome back, ${currentUser.name}!`,
            subtitle: 'Earn 5% commission on every sale made through your referral link',
            stats: {
                earnings: 'Total Earnings',
                pending: 'Pending Earnings',
                orders: 'Successful Referrals',
                customers: 'Referred Customers'
            },
            linkSection: {
                title: 'Your Referral Link',
                description: 'Share this link with friends and earn commission on their purchases',
                copy: copied ? 'Copied!' : 'Copy Link',
                share: 'Share on Social Media'
            },
            history: {
                title: 'Recent Referral Orders',
                noOrders: 'No referral orders yet. Start sharing your link!',
                orderId: 'Order ID',
                customer: 'Customer',
                amount: 'Amount',
                commission: 'Your Commission',
                status: 'Status',
                date: 'Date'
            },
            products: {
                title: 'Top Products to Promote',
                promote: 'Get Link'
            },
            myListings: {
                title: 'My Published Items',
                add: 'Post Used Item',
                noItems: 'You haven\'t listed any items for sale yet.',
                status: 'Status',
                price: 'Price',
                actions: 'Actions'
            },
            tabs: {
                overview: 'Affiliate Overview',
                listings: 'My Listings',
                inbox: 'Inbox & Inquiries'
            }
        },
        bn: {
            title: 'রিসেলার ড্যাশবোর্ড',
            greeting: `স্বাগতম, ${currentUser.name}!`,
            subtitle: 'আপনার রেফারেল লিংকের মাধ্যমে প্রতিটি বিক্রয়ে ৫% কমিশন অর্জন করুন',
            stats: {
                earnings: 'মোট আয়',
                pending: 'অপেক্ষমাণ আয়',
                orders: 'সফল রেফারেল',
                customers: 'রেফার করা গ্রাহক'
            },
            linkSection: {
                title: 'আপনার রেফারেল লিংক',
                description: 'বন্ধুদের সাথে এই লিংক শেয়ার করুন এবং তাদের ক্রয়ে কমিশন অর্জন করুন',
                copy: copied ? 'কপি হয়েছে!' : 'লিংক কপি করুন',
                share: 'সোশ্যাল মিডিয়ায় শেয়ার করুন'
            },
            history: {
                title: 'সাম্প্রতিক রেফারেল অর্ডার',
                noOrders: 'এখনও কোনো রেফারেল অর্ডার নেই। আপনার লিংক শেয়ার করা শুরু করুন!',
                orderId: 'অর্ডার আইডি',
                customer: 'গ্রাহক',
                amount: 'পরিমাণ',
                commission: 'আপনার কমিশন',
                status: 'স্ট্যাটাস',
                date: 'তারিখ'
            },
            products: {
                title: 'প্রচারের জন্য শীর্ষ পণ্য',
                promote: 'লিংক পান'
            },
            myListings: {
                title: 'আমার প্রকাশিত আইটেম',
                add: 'ব্যবহৃত আইটেম পোস্ট করুন',
                noItems: 'আপনি এখনও বিক্রয়ের জন্য কোনো আইটেম তালিকাভুক্ত করেননি।',
                status: 'অবস্থা',
                price: 'মূল্য',
                actions: 'ক্রিয়াকলাপ'
            },
            tabs: {
                overview: 'অ্যাফিলিয়েট ওভারভিউ',
                listings: 'আমার লিস্টিং',
                inbox: 'ইনবক্স এবং অনুসন্ধান'
            }
        }
    };

    const t = content[language];

    // Top products (featured or promoted)
    const topProducts = products.filter(p => p.status === 'Approved').slice(0, 6);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        {t.title}
                    </h1>
                    <p className="text-xl text-gray-700 dark:text-gray-300">{t.greeting}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 bg-white/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-purple-600'}`}
                    >
                        {t.tabs.overview}
                    </button>
                    <button
                        onClick={() => setActiveTab('myListings')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'myListings' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-purple-600'}`}
                    >
                        {t.tabs.listings}
                    </button>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'inbox' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-purple-600'}`}
                    >
                        {t.tabs.inbox}
                    </button>
                </div>

                {activeTab === 'inbox' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 min-h-[50vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
                                {t.tabs.inbox}
                            </h2>
                            <button
                                onClick={() => navigate('/inbox')}
                                className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                            >
                                {language === 'en' ? 'Open Full Inbox' : 'সম্পূর্ণ ইনবক্স খুলুন'}
                            </button>
                        </div>

                        {myInquiries.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-xl">
                                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {language === 'en' ? 'No inquiries yet' : 'এখনও কোনো অনুসন্ধান নেই'}
                                </h3>
                                <p className="text-gray-500 mt-2">
                                    {language === 'en' ? 'Messages from interested buyers will appear here.' : 'আগ্রহী ক্রেতাদের বার্তা এখানে দেখাবে।'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myInquiries.map(thread => {
                                    const otherId = thread.participantIds.find(id => id !== currentUser.id);
                                    const otherUser = users.find(u => u.id === otherId);
                                    const product = myProducts.find(p => p.id === thread.metadata?.productId);
                                    const isUnread = (thread.unreadCount?.[currentUser.id] || 0) > 0;

                                    return (
                                        <div
                                            key={thread.id}
                                            onClick={() => navigate(`/chat/${thread.id}`)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isUnread
                                                ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800'
                                                : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 hover:border-purple-300'
                                                }`}
                                        >
                                            <div className="relative">
                                                <img src={otherUser?.image || 'https://ui-avatars.com/api/?name=User'} className="w-12 h-12 rounded-full object-cover" />
                                                {isUnread && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{otherUser?.name || 'Unknown User'}</h4>
                                                    <span className="text-xs text-gray-500">
                                                        {thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString() : ''}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                    {thread.lastMessage}
                                                </p>
                                                {product && (
                                                    <div className="mt-2 flex items-center gap-2 text-xs bg-gray-100 dark:bg-slate-700/50 w-fit px-2 py-1 rounded">
                                                        <ShoppingBagIcon className="w-3 h-3 text-purple-500" />
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            Inquiry about: {product.name[language]}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'overview' ? (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.stats.earnings}</span>
                                    <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">৳{totalEarnings.toFixed(2)}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.stats.pending}</span>
                                    <ChartBarIcon className="w-8 h-8 text-yellow-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">৳{pendingEarnings.toFixed(2)}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.stats.orders}</span>
                                    <ShoppingBagIcon className="w-8 h-8 text-blue-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{completedOrders}</p>
                                <p className="text-xs text-gray-400 mt-1">{totalReferrals} total orders</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{t.stats.customers}</span>
                                    <UserGroupIcon className="w-8 h-8 text-purple-500" />
                                </div>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{referredCustomers.length}</p>
                            </div>
                        </div>

                        {/* Referral Link Section */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <LinkIcon className="w-8 h-8" />
                                <h2 className="text-2xl font-bold">{t.linkSection.title}</h2>
                            </div>
                            <p className="mb-6 opacity-90">{t.linkSection.description}</p>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={referralLink}
                                        readOnly
                                        className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/60 font-mono text-sm"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        {copied ? <ClipboardDocumentCheckIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                        {t.linkSection.copy}
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleShareSocial('facebook')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleShareSocial('twitter')}
                                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                    Twitter
                                </button>
                                <button
                                    onClick={() => handleShareSocial('whatsapp')}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                    WhatsApp
                                </button>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingUpIcon className="w-6 h-6 text-purple-600" />
                                {t.history.title}
                            </h2>

                            {referredOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">{t.history.noOrders}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.orderId}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.customer}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.amount}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.commission}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.status}</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t.history.date}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                            {referredOrders.slice(0, 10).map(order => {
                                                const customer = users.find(u => u.id === order.customerId);
                                                const commission = order.commissionAmount || (order.status === 'Delivered' ? order.total * 0.05 : 0);
                                                return (
                                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">#{order.id.slice(-6)}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{customer?.name || 'Unknown'}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">৳{order.total}</td>
                                                        <td className="px-4 py-3 text-sm font-bold text-green-600">
                                                            {order.status === 'Delivered' ? `৳${commission.toFixed(2)}` : 'Pending'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Top Products to Promote */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t.products.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {topProducts.map(product => {
                                    const productLink = `${window.location.origin}/product/${product.slug || product.id}?ref=${currentUser.referralCode}`;
                                    return (
                                        <div key={product.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-xl transition-all">
                                            <img src={product.images[0]} alt={product.name[language]} className="w-full h-40 object-cover" />
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">{product.name[language]}</h3>
                                                <p className="text-lg font-bold text-purple-600 mb-3">৳{product.price}</p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(productLink);
                                                        alert('Product link copied!');
                                                    }}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    {t.products.promote}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.myListings.title}</h2>
                            <button
                                onClick={() => navigate('/add-product?type=resell')}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-md flex items-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5" />
                                {t.myListings.add}
                            </button>
                        </div>

                        {myProducts.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 text-center">
                                <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{t.myListings.noItems}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myProducts.map(product => (
                                    <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col">
                                        <div className="relative h-48">
                                            <img src={product.images[0]} alt={product.name[language]} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full shadow-sm ${product.status === 'Approved' ? 'bg-green-500 text-white' :
                                                    product.status === 'Rejected' ? 'bg-red-500 text-white' :
                                                        'bg-yellow-500 text-white'
                                                    }`}>
                                                    {product.status === 'Approved' ? (language === 'en' ? 'Live' : 'লাইভ') :
                                                        product.status === 'Rejected' ? (language === 'en' ? 'Rejected' : 'প্রত্যাখ্যাত') :
                                                            (language === 'en' ? 'Pending' : 'অপেক্ষমাণ')}
                                                </span>
                                                {product.negotiable && (
                                                    <span className="px-2 py-1 text-[8px] font-bold rounded-full bg-amber-500 text-white shadow-sm">
                                                        Negotiable
                                                    </span>
                                                )}
                                                {product.authenticityVerified && (
                                                    <span className="px-2 py-1 text-[8px] font-bold rounded-full bg-blue-500 text-white shadow-sm">
                                                        Authenticity Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">{product.name[language]}</h3>
                                            <div className="flex justify-between items-center mb-4 mt-auto">
                                                <p className="text-xl font-extrabold text-purple-600">৳{product.price}</p>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {product.condition}
                                                </span>
                                            </div>

                                            {product.status === 'Rejected' && product.rejectionReason && (
                                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
                                                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">
                                                        {language === 'en' ? 'Rejection Reason:' : 'প্রত্যাখ্যানের কারণ:'}
                                                    </p>
                                                    <p className="text-xs text-red-700 dark:text-red-300 italic">
                                                        "{product.rejectionReason}"
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/edit-product/${product.id}`)}
                                                    className="flex-1 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-100 font-bold py-2 rounded-lg text-sm transition-all"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => confirm(language === 'en' ? 'Delete this item?' : 'এই আইটেমটি মুছবেন?') && deleteProduct(product.id)}
                                                    className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-all"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResellerDashboardPage;
