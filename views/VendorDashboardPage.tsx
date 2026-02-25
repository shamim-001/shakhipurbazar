import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPagePath } from '../src/utils/navigation';
import toast from 'react-hot-toast';
import { useApp } from '../src/context/AppContext';
import { Product, Order, OrderStatus, UserReview, Vendor } from '../types';
import { ChartBarIcon, ShoppingBagIcon, CogIcon, UserGroupIcon, PlusIcon, TrashIcon, PencilIcon, ArchiveBoxIcon, ClockIcon, SearchIcon, FilterIcon, XIcon, CheckCircleIcon, CreditCardIcon, TrendingUpIcon, CalendarIcon, CurrencyDollarIcon, QuestionMarkCircleIcon, PhoneIcon, MapPinIcon, GlobeAltIcon, StarIcon, TruckIcon, ChevronLeftIcon, ChevronRightIcon, UserIcon, ChatBubbleLeftRightIcon, ArrowUpOnSquareIcon, ExclamationTriangleIcon, ArrowPathIcon, PhotoIcon } from '../components/icons';
import { ImageService } from '../src/services/imageService';
import PromotionsTab from './PromotionsTab';
import VendorTeamManagement from './VendorTeamManagement';
import RevenueChart from '../components/analytics/RevenueChart';
import WithdrawalModal from '../src/components/WithdrawalModal';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { Transaction, CategoryCommission, Invitation } from '../types';
import { EconomicsService } from '../src/services/economics';
import { OrderService } from '../src/services/orderService';
import { DeliveryService } from '../src/services/deliveryService';
import InboxPage from './InboxPage';

type VendorTab = 'overview' | 'products' | 'drafts' | 'orders' | 'earnings' | 'promotions' | 'team' | 'logistics' | 'reviews';

// ... OrderDetailsModal component (same as before) ...
const VendorReviewsTab: React.FC<{ vendorId: string }> = ({ vendorId }) => {
    const { language, currentUser } = useApp();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!vendorId) return;
        const q = query(
            collection(db, 'reviews'),
            where('vendorId', '==', vendorId),
            orderBy('date', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReview)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [vendorId]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading reviews...</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Product Reviews' : 'পণ্যের রিভিউ সমূহ'}
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {reviews.map(review => (
                    <div key={review.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0">
                            <img src={review.customerImage} alt={review.customerName} className="w-12 h-12 rounded-full border-2 border-gray-100" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{review.customerName}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <StarIcon key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${review.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                    review.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {review.status}
                                </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                {review.comment[language] || review.comment.en}
                            </p>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                <ShoppingBagIcon className="w-3 h-3" />
                                Product ID: {review.productId}
                            </div>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <StarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews found</h3>
                        <p className="text-gray-500">Reviews for your products will appear here once customers submit them.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const OrderDetailsModal: React.FC<{ order: Order; onClose: () => void; onStatusChange: (orderId: string, status: OrderStatus) => void; }> = ({ order, onClose, onStatusChange }) => {
    const { language, users, startChat } = useApp();
    const navigate = useNavigate();
    const [isPodExpanded, setIsPodExpanded] = useState(false);
    const customer = users.find(u => u.id === order.customerId);
    const availableStatuses: OrderStatus[] = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4 mb-4">
                        <h2 className="text-xl font-bold">Order Details #{order.id.split('-')[1]}</h2>
                        <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">Customer Info</h3>
                                <button onClick={async () => {
                                    const threadId = await startChat(order.customerId, { type: 'order', id: order.id, orderId: order.id, vendorId: order.vendorId });
                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                    <ChatBubbleLeftRightIcon className="w-3 h-3" /> Chat
                                </button>
                            </div>
                            <p><strong>Name:</strong> {customer?.name}</p>
                            <p><strong>Address:</strong> {
                                typeof order.deliveryAddress === 'object'
                                    ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.area}`
                                    : (order.deliveryAddress || customer?.address || 'N/A')
                            }</p>
                            <p><strong>Phone:</strong> {order.deliveryPhone || customer?.phone}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Order Items</h3>
                            {order.items.map(item => (
                                <div key={item.productId} className="flex gap-4 py-2 border-b dark:border-slate-700 last:border-b-0">
                                    <img src={item.productImage} alt={item.productName[language]} className="w-16 h-16 rounded-md" />
                                    <div>
                                        <p className="font-semibold">{item.productName[language]}</p>
                                        <p className="text-sm">Qty: {item.quantity} x ৳{item.priceAtPurchase}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                            <div className="text-right font-bold text-lg">
                                Total: ৳{order.total}
                            </div>
                            <div className="flex gap-4">
                                {order.pickupCode && (order.status === 'Confirmed' || order.status === 'Preparing') && (
                                    <div className="text-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Pickup Code</p>
                                        <p className="text-xl font-mono font-bold text-blue-600 tracking-widest">{order.pickupCode}</p>
                                    </div>
                                )}
                                {order.deliveryCode && order.assignedDeliveryManId === order.vendorId && (order.status === 'Out for Delivery') && (
                                    <div className="text-center bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-2 rounded-lg">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Delivery Code</p>
                                        <p className="text-xl font-mono font-bold text-green-600 tracking-widest">{order.deliveryCode}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {order.podUrl && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl relative overflow-hidden group">
                                <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5" />
                                    {language === 'en' ? 'Proof of Delivery (Verified)' : 'ডেলিভারি প্রমাণ (যাচাইকৃত)'}
                                </h3>

                                <div
                                    className="relative cursor-pointer group/pod"
                                    onClick={() => setIsPodExpanded(!isPodExpanded)}
                                >
                                    <img
                                        src={order.podUrl}
                                        alt="Proof of Delivery"
                                        className={`w-full rounded-lg border dark:border-slate-700 transition-all duration-300 ${isPodExpanded ? 'max-h-[80vh] object-contain shadow-2xl' : 'max-h-48 object-cover shadow-sm hover:shadow-md'}`}
                                    />
                                    {!isPodExpanded && (
                                        <div className="absolute inset-0 bg-black/0 group-hover/pod:bg-black/10 flex items-center justify-center transition-all rounded-lg">
                                            <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full opacity-0 group-hover/pod:opacity-100 transition-opacity shadow-lg">
                                                <PhotoIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity ${isPodExpanded ? 'opacity-100' : 'opacity-0'}`}
                                        onClick={(e) => { e.stopPropagation(); setIsPodExpanded(false); }}
                                    >
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 italic mt-2 text-right">
                                    {language === 'en' ? 'Click to expand image' : 'ছবি বড় করতে ক্লিক করুন'}
                                </p>
                            </div>
                        )}
                        {order.status === 'Cancelled' && (order.cancellationReason || order.cancelledBy) && (
                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-lg">
                                <h3 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    Cancellation Info
                                </h3>
                                {order.cancelledBy && <p className="text-sm dark:text-gray-300"><strong>Cancelled By:</strong> {order.cancelledBy.charAt(0).toUpperCase() + order.cancelledBy.slice(1)}</p>}
                                {order.cancellationReason && <p className="text-sm dark:text-gray-300"><strong>Reason:</strong> {order.cancellationReason}</p>}
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold mb-2">Update Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {availableStatuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => onStatusChange(order.id, status)}
                                        disabled={order.status === status}
                                        className={`px-3 py-1 text-sm rounded-full ${order.status === status ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const VendorDashboardPage = () => {
    const { language, currentUser } = useApp();
    const navigate = useNavigate();
    const vendorId = currentUser?.shopId || currentUser?.driverId || currentUser?.deliveryManId || currentUser?.agencyId || currentUser?.employerVendorId;
    const [activeTab, setActiveTab] = useState<VendorTab>('products');

    if (!currentUser || !vendorId) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border dark:border-slate-700 max-w-md">
                    <ExclamationTriangleIcon className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You do not have a vendor profile or associated shop ID.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: { en: 'Overview', bn: 'একনজরে' } },
        { id: 'products', label: { en: 'Products', bn: 'পণ্য' } },
        { id: 'drafts', label: { en: 'Drafts', bn: 'খসড়া' } },
        { id: 'orders', label: { en: 'Orders', bn: 'অর্ডার' } },
        { id: 'promotions', label: { en: 'Promotions', bn: 'প্রচার' } },
        { id: 'messages', label: { en: 'Messages', bn: 'মেসেজ' } },
        { id: 'logistics', label: { en: 'My Delivery Team', bn: 'আমার ডেলিভারি টিম' } },
        { id: 'team', label: { en: 'Staff', bn: 'স্টাফ' } },
        { id: 'reviews', label: { en: 'Reviews', bn: 'রিভিউ' } },
        { id: 'earnings', label: { en: 'Earnings', bn: 'উপার্জন' } },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <VendorOverviewTab vendorId={vendorId} />;
            case 'products': return <VendorProductsTab vendorId={vendorId} />;
            case 'drafts': return <VendorDraftsTab vendorId={vendorId} />;
            case 'orders': return <VendorOrdersTab vendorId={vendorId} />;
            case 'promotions': return <PromotionsTab vendorId={vendorId} />;
            case 'messages': return <InboxPage />;
            case 'team':
                return <VendorTeamManagement vendorId={vendorId} />;
            case 'reviews':
                return <VendorReviewsTab vendorId={vendorId} />;
            case 'logistics': return <VendorLogisticsTab vendorId={vendorId} />;
            case 'earnings': return <VendorEarningsTab vendorId={vendorId} />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen p-4 md:p-8">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200">{language === 'en' ? 'Vendor Dashboard' : 'বিক্রেতার ড্যাশবোর্ড'}</h1>
                    <button onClick={() => navigate('/profile')} className="text-sm flex items-center gap-1 text-rose-500 hover:underline">
                        <UserIcon className="w-4 h-4" />
                        <span>{language === 'en' ? 'Back to Profile' : 'প্রোফাইলে ফিরে যান'}</span>
                    </button>
                </div>
                <div className="mb-6 border-b border-gray-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as VendorTab)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-rose-500 text-rose-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                                    }`}
                            >
                                {tab.label[language]}
                            </button>
                        ))}
                    </nav>
                </div>

                <div>{renderContent()}</div>
            </div>
        </div>
    );
};

// Overview Tab Component
const VendorOverviewTab = ({ vendorId }: { vendorId: string }) => {
    const { language, vendors, products, orders, updateVendorOnlineStatus, updateVendor } = useApp();
    const navigate = useNavigate();
    const vendor = vendors.find(v => v.id === vendorId);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Name Edit State
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [newNameEn, setNewNameEn] = useState(vendor?.name.en || '');
    const [newNameBn, setNewNameBn] = useState(vendor?.name.bn || '');

    const handleNameUpdate = async () => {
        if (!vendor || !newNameEn.trim()) return;
        try {
            await updateVendor(vendor.id, {
                name: {
                    en: newNameEn.trim(),
                    bn: newNameBn.trim() || newNameEn.trim()
                }
            });
            toast.success(language === 'en' ? 'Shop name updated!' : 'দোকানের নাম আপডেট করা হয়েছে!');
            setIsEditNameOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update name');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bannerImage') => {
        const file = e.target.files?.[0];
        if (!file || !vendor) return;

        const isLogo = type === 'logo';
        if (isLogo) setUploadingLogo(true);
        else setUploadingBanner(true);

        const toastId = toast.loading(`Uploading ${type}...`);

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `vendor_assets/${vendor.id}_${type}_${Date.now()}`
            );

            await updateVendor(vendor.id, { [type]: downloadUrl });
            toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} updated!`, { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error(`Failed to upload ${type}.`, { id: toastId });
        } finally {
            if (isLogo) setUploadingLogo(false);
            else setUploadingBanner(false);
        }
    };

    if (!vendor) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <p className="text-red-500 font-bold mb-2">Vendor Profile Not Found</p>
                <p className="text-gray-500 text-sm">Could not locate vendor data for ID: {vendorId}</p>
            </div>
        );
    }
    const vendorProducts = products.filter(p => p.vendorId === vendorId);
    const vendorOrders = orders.filter(o => o.vendorId === vendorId);
    const totalRevenue = vendorOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrdersCount = vendorOrders.filter(o => o.status === 'Pending').length;
    const recentOrders = vendorOrders.slice(0, 5);
    const lowStockProducts = vendorProducts.filter(p => p.stock > 0 && p.stock < 5);

    const [deliveryMode, setDeliveryMode] = useState<'shop' | 'platform'>('shop');

    const stats = [
        { title: { en: 'Total Revenue', bn: 'মোট আয়' }, value: `৳${totalRevenue.toLocaleString()}`, icon: CurrencyDollarIcon },
        { title: { en: 'Total Products', bn: 'মোট পণ্য' }, value: vendorProducts.length, icon: ArchiveBoxIcon },
        { title: { en: 'Pending Orders', bn: 'বিচারাধীন অর্ডার' }, value: pendingOrdersCount, icon: ShoppingBagIcon },
    ];

    const handleStatusToggle = () => {
        const newStatus = vendor.onlineStatus === 'Online' ? 'Offline' : 'Online';
        updateVendorOnlineStatus(vendorId, newStatus);
    };

    return (
        <div className="space-y-8">
            {/* Banner Section */}
            <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gray-100 group">
                <img
                    src={vendor.bannerImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200'}
                    alt="Store Banner"
                    className="w-full h-full object-cover"
                />
                {uploadingBanner && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <label className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 p-2 rounded-lg cursor-pointer shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                    <ArrowUpOnSquareIcon className="w-5 h-5 text-rose-500" />
                    {language === 'en' ? 'Change Cover' : 'কভার পরিবর্তন করুন'}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bannerImage')} disabled={uploadingBanner} />
                </label>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 -mt-16 sm:-mt-20 px-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                    <div className="relative">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-white">
                            <img src={vendor.logo} alt={vendor.name[language]} className="w-full h-full object-cover" />
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-rose-600 transition-transform hover:scale-110">
                            <ArrowUpOnSquareIcon className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} disabled={uploadingLogo} />
                        </label>
                    </div>
                    <div className="pb-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-sm">{vendor.name[language]}</h1>
                            <button
                                onClick={() => {
                                    setNewNameEn(vendor.name.en);
                                    setNewNameBn(vendor.name.bn);
                                    setIsEditNameOpen(true);
                                }}
                                className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                            <span className={`w-3 h-3 rounded-full ${vendor.onlineStatus === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></span>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {vendor.onlineStatus === 'Online' ? (language === 'en' ? 'Shop Online' : 'দোকান অনলাইন') : (language === 'en' ? 'Shop Offline' : 'দোকান অফলাইন')}
                            </span>
                        </div>
                    </div>
                </div>

                {isEditNameOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setIsEditNameOpen(false)}>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-4 dark:text-white">{language === 'en' ? 'Edit Shop Name' : 'দোকানের নাম পরিবর্তন করুন'}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Shop Name (English)' : 'দোকানের নাম (ইংরেজি)'}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newNameEn}
                                        onChange={e => setNewNameEn(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Shop Name (Bengali)' : 'দোকানের নাম (বাংলা)'}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        value={newNameBn}
                                        onChange={e => setNewNameBn(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setIsEditNameOpen(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200">
                                    {language === 'en' ? 'Cancel' : 'বাতিল'}
                                </button>
                                <button onClick={handleNameUpdate} className="flex-1 py-2 rounded-lg bg-rose-500 text-white font-bold">
                                    {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col items-start sm:items-end gap-3">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'en' ? 'Accepting Orders' : 'অর্ডার গ্রহণ করছেন'}</span>
                        <button onClick={handleStatusToggle} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${vendor.onlineStatus === 'Online' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${vendor.onlineStatus === 'Online' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                        <div className="bg-rose-100 dark:bg-rose-900/50 p-3 rounded-full">
                            <stat.icon className="h-7 w-7 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title[language]}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Delivery Preferences (New Feature) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-rose-500" />
                    {language === 'en' ? 'Delivery Preferences' : 'ডেলিভারি পছন্দ'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setDeliveryMode('shop')}
                        className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${deliveryMode === 'shop'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                            }`}
                    >
                        <span className="block font-bold text-gray-800 dark:text-gray-100 mb-1">{language === 'en' ? 'Shop Managed' : 'দোকান দ্বারা পরিচালিত'}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'You handle your own deliveries.' : 'আপনি আপনার নিজের ডেলিভারি পরিচালনা করেন।'}</span>
                    </button>
                    <button
                        onClick={() => setDeliveryMode('platform')}
                        className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${deliveryMode === 'platform'
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                            : 'border-gray-200 dark:border-slate-700 hover:border-rose-300'
                            }`}
                    >
                        <span className="block font-bold text-gray-800 dark:text-gray-100 mb-1">{language === 'en' ? 'Platform Managed' : 'প্ল্যাটফর্ম দ্বারা পরিচালিত'}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{language === 'en' ? 'We assign riders for you.' : 'আমরা আপনার জন্য রাইডার নিয়োগ করি।'}</span>
                    </button>
                </div>
            </div>

            {/* "Requires Action" Section - Critical for Moderation Loop */}
            {vendorProducts.some(p => p.status === 'ReviewRequested') && (
                <div className="bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-200 dark:border-rose-800/20 p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-500 text-white rounded-lg">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-rose-800 dark:text-rose-200">
                            {language === 'en' ? 'Review Requested by Admin' : 'অ্যাডমিন দ্বারা রিভিউ অনুরোধ করা হয়েছে'}
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {vendorProducts.filter(p => p.status === 'ReviewRequested').map(product => (
                            <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img src={product.images[0]} alt={product.name[language]} className="w-12 h-12 rounded-lg object-cover" />
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{product.name[language]}</p>
                                        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium italic">
                                            Feedback: {product.reviewRequestReason || (language === 'en' ? 'Please check details' : 'বিস্তারিত চেক করুন')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/edit-product/${product.id}`)}
                                    className="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-lg hover:bg-rose-600 grow sm:grow-0"
                                >
                                    {language === 'en' ? 'View & Edit' : 'দেখুন এবং এডিট করুন'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">{language === 'en' ? 'Performance Feed' : 'পারফরম্যান্স ফিড'}</h3>
                        <TrendingUpIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {recentOrders.map(order => (
                            <div key={order.id} className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl flex items-center gap-4 group cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-blue-500">
                                    <ShoppingBagIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-gray-900 dark:text-white">Order #{order.id.slice(-6)}</p>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(order.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">৳{order.total} • {order.items.length} items</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                            }`}>{order.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <div className="py-10 text-center text-gray-400 italic text-sm">No recent orders yet.</div>
                        )}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100">{language === 'en' ? 'Critical Alerts' : 'গুরুত্বপূর্ণ সতর্কতা'}</h3>
                        <ExclamationTriangleIcon className="w-6 h-6 text-rose-500" />
                    </div>
                    <div className="space-y-4">
                        {lowStockProducts.map(product => (
                            <div key={product.id} className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-rose-500">
                                    <ArchiveBoxIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white">{product.name[language]}</p>
                                    <p className="text-sm text-rose-600 font-medium">{product.stock} {language === 'en' ? 'units remaining' : 'ইউনিট বাকি'}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/edit-product/${product.id}`)}
                                    className="p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {lowStockProducts.length === 0 && (
                            <div className="py-14 text-center bg-gray-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-slate-800 flex flex-col items-center">
                                <CheckCircleIcon className="w-10 h-10 text-green-500/30 mb-2" />
                                <p className="text-sm text-gray-500">All products have healthy stock levels.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Products Tab Component
const VendorProductsTab = ({ vendorId }: { vendorId: string }) => {
    const { language, products, deleteProduct, updateProductStatus } = useApp();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const PRODUCTS_PER_PAGE = 10;

    const vendorProducts = products.filter(p => p.vendorId === vendorId);

    const totalPages = Math.ceil(vendorProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = vendorProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

    const getStatusChip = (status: Product['status']) => {
        const styleMap: { [key in NonNullable<Product['status']>]: string } = {
            Approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
            Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
            Rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
            ReviewRequested: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styleMap[status || 'Pending']}`}>{status || 'Pending'}</span>;
    };

    const handleResubmit = async (product: Product) => {
        if (!confirm(language === 'en' ? 'Resubmit this product for approval?' : 'এই পণ্যটি অনুমোদনের জন্য পুনরায় জমা দেবেন?')) return;
        try {
            await updateProductStatus(product.id, 'Pending');
            toast.success(language === 'en' ? 'Product resubmitted!' : 'পণ্য পুনরায় জমা দেওয়া হয়েছে!');
        } catch (error) {
            console.error("Resubmit failed", error);
            toast.error("Failed to resubmit product");
        }
    };

    const showReason = (product: Product) => {
        const reason = product.rejectionReason || product.reviewRequestReason || 'No details provided.';
        const title = product.status === 'Rejected' ? 'Rejection Reason' : 'Review Request Note';
        toast((t) => (
            <div className="max-w-md">
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{reason}</p>
                <div className="mt-2 text-xs text-gray-400">ID: {product.id}</div>
            </div>
        ), { duration: 5000, icon: <QuestionMarkCircleIcon className="w-6 h-6 text-blue-500" /> });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'My Products' : 'আমার পণ্য'}</h2>
                <button onClick={() => navigate('/add-product')} className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 text-sm">{language === 'en' ? 'Add New Product' : 'নতুন পণ্য যোগ করুন'}</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">{language === 'en' ? 'Product' : 'পণ্য'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Price' : 'মূল্য'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Stock' : 'স্টক'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'ক্রিয়াকলাপ'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map(product => (
                            <tr key={product.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                    <img src={product.images[0]} alt={product.name[language]} className="w-10 h-10 rounded-md object-cover" />
                                    <span>{product.name[language]}</span>
                                </td>
                                <td className="px-6 py-4">৳{product.price}</td>
                                <td className="px-6 py-4">{product.stock}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getStatusChip(product.status)}
                                        {(product.status === 'Rejected' || product.status === 'ReviewRequested') && (
                                            <button
                                                onClick={() => showReason(product)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title={language === 'en' ? 'View Reason' : 'কারণ দেখুন'}
                                            >
                                                <QuestionMarkCircleIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button onClick={() => navigate(`/edit-product/${product.id}`)} className="text-blue-500 hover:text-blue-700" title="Edit">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    {(product.status === 'Rejected' || product.status === 'ReviewRequested') && (
                                        <button
                                            onClick={() => handleResubmit(product)}
                                            className="text-green-500 hover:text-green-700"
                                            title={language === 'en' ? 'Resubmit for Approval' : 'অনুমোদনের জন্য পুনরায় জমা দিন'}
                                        >
                                            <ArrowPathIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button onClick={() => deleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Delete">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-between items-center pt-4">
                <span className="text-sm text-gray-700 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
};

// VendorDraftsTab Component
const VendorDraftsTab = ({ vendorId }: { vendorId: string }) => {
    const { language } = useApp();
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const q = query(collection(db, 'product_drafts'), where('vendorId', '==', vendorId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedDrafts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setDrafts(fetchedDrafts);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [vendorId]);

    const handleDeleteDraft = async (draftId: string) => {
        if (!confirm(language === 'en' ? 'Delete this draft?' : 'এই খসড়া মুছবেন?')) return;
        try {
            await import('firebase/firestore').then(mod => mod.deleteDoc(mod.doc(db, 'product_drafts', draftId)));
            toast.success("Draft deleted");
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete draft");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'Product Drafts' : 'পণ্য খসড়া'}</h2>
                <button onClick={() => navigate('/add-product')} className="bg-rose-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-rose-600 text-sm flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" /> {language === 'en' ? 'Create New Draft' : 'নতুন খসড়া তৈরি করুন'}
                </button>
            </div>
            {loading ? <p>Loading...</p> : drafts.length === 0 ? <p className="text-gray-500">No drafts found.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">{language === 'en' ? 'Draft Name' : 'খসড়া নাম'}</th>
                                <th className="px-6 py-3">{language === 'en' ? 'Last Updated' : 'সর্বশেষ আপডেট'}</th>
                                <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'ক্রিয়াকলাপ'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drafts.map(draft => (
                                <tr key={draft.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                        {draft.images?.[0] && <img src={draft.images[0]} className="w-8 h-8 rounded" />}
                                        {draft.name.en || 'Untitled'}
                                    </td>
                                    <td className="px-6 py-4">{draft.updatedAt ? new Date((draft.updatedAt as any).seconds ? (draft.updatedAt as any).seconds * 1000 : draft.updatedAt as string).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 flex gap-4">
                                        <button onClick={() => navigate(`/edit-product/${draft.id}`)} className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                                            <PencilIcon className="w-5 h-5" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteDraft(draft.id)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// VendorLogisticsTab Component
const VendorLogisticsTab = ({ vendorId }: { vendorId: string }) => {
    const { language, vendors, startChat } = useApp();
    const navigate = useNavigate();
    const currentVendor = vendors.find(v => v.id === vendorId);
    const [subTab, setSubTab] = useState<'team' | 'recruit'>('team');

    // State
    const [myTeam, setMyTeam] = useState<any[]>([]);
    const [availableRiders, setAvailableRiders] = useState<any[]>([]);
    const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch My Team
    React.useEffect(() => {
        const q = query(
            collection(db, 'vendors'),
            where('type', '==', 'deliveryMan'),
            where('vendorId', '==', vendorId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMyTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((d: any) => d.status !== 'Suspended'));
        });
        return () => unsubscribe();
    }, [vendorId]);

    // Fetch Available Riders (Independent) & Sent Invites
    React.useEffect(() => {
        if (subTab === 'recruit') {
            setLoading(true);
            // 1. Fetch Independent Riders (client-side filter for simplicity as query for null/missing field is tricky)
            const qRiders = query(collection(db, 'vendors'), where('type', '==', 'deliveryMan'));
            const unsubRiders = onSnapshot(qRiders, (snapshot) => {
                const allRiders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                // Filter: No vendorId OR vendorId is 'platform' (if we use that) OR vendorId is empty
                const independent = allRiders.filter(r => (!r.vendorId || r.vendorId === 'platform') && r.status !== 'Suspended');
                setAvailableRiders(independent);
                setLoading(false);
            });

            // 2. Fetch Sent Invites
            const qInvites = query(
                collection(db, 'invitations'),
                where('fromVendorId', '==', vendorId),
                where('status', '==', 'pending')
            );
            const unsubInvites = onSnapshot(qInvites, (snapshot) => {
                setSentInvites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
            });

            return () => {
                unsubRiders();
                unsubInvites();
            };
        }
    }, [subTab, vendorId]);

    const handleInvite = async (riderId: string) => {
        if (!currentVendor) return;
        try {
            await addDoc(collection(db, 'invitations'), {
                type: 'team_join',
                fromVendorId: vendorId,
                fromVendorName: currentVendor.name,
                toDeliveryManId: riderId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            toast.success(language === 'en' ? 'Invitation Sent!' : 'আমন্ত্রণ পাঠানো হয়েছে!');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send invitation");
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        try {
            await deleteDoc(doc(db, 'invitations', inviteId));
            toast.success("Invitation Cancelled");
        } catch (error) {
            toast.error("Failed to cancel");
        }
    };

    const handleRemoveMember = async (riderId: string) => {
        if (!confirm(language === 'en' ? 'Remove this member from your team?' : 'এই সদস্যকে আপনার দল থেকে সরিয়ে দেবেন?')) return;
        try {
            await updateDoc(doc(db, 'vendors', riderId), {
                vendorId: null // Release to independent pool
            });
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <TruckIcon className="w-6 h-6 text-rose-500" />
                    {language === 'en' ? 'Logistics Management' : 'লজিস্টিক ব্যবস্থাপনা'}
                </h2>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setSubTab('team')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'team' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {language === 'en' ? 'My Team' : 'আমার দল'}
                    </button>
                    <button
                        onClick={() => setSubTab('recruit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${subTab === 'recruit' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {language === 'en' ? 'Recruit / Hire' : 'নিয়োগ করুন'}
                    </button>
                </div>
            </div>

            {subTab === 'team' ? (
                <div>
                    {myTeam.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                            <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">{language === 'en' ? 'No delivery men in your team.' : 'আপনার দলে কোন ডেলিভারি ম্যান নেই।'}</p>
                            <button onClick={() => setSubTab('recruit')} className="mt-4 text-rose-500 hover:underline font-medium">
                                {language === 'en' ? 'Recruit someone now' : 'এখনই কাউকে নিয়োগ করুন'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myTeam.map(man => (
                                <div key={man.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 relative group">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRemoveMember(man.id)}
                                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                            title="Remove from team"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <img src={man.logo || `https://ui-avatars.com/api/?name=${man.name?.en}`} className="w-14 h-14 rounded-full object-cover" />
                                        <div className="w-full">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-lg">{man.name?.en}</h3>
                                                <button onClick={async () => {
                                                    const threadId = await startChat(man.id);
                                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                }} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Chat with Team Member">
                                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500">{man.phone}</p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${man.onlineStatus === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{man.onlineStatus || 'OFFLINE'}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-yellow-500">
                                                <StarIcon className="w-3 h-3" />
                                                <span>{man.deliveryManProfile?.rating || 0} ({man.deliveryManProfile?.totalDeliveries || 0})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200 flex items-start gap-3">
                        <QuestionMarkCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{language === 'en'
                            ? "These are independent delivery men available for hire. Sending an invitation does not add them immediately; they must accept your invitation."
                            : "এরা ভাড়ার জন্য উপলব্ধ স্বাধীন ডেলিভারি ম্যান। আমন্ত্রণ পাঠালে তারা তাৎক্ষণিকভাবে যুক্ত হয় না; তাদের আপনার আমন্ত্রণ গ্রহণ করতে হবে।"}</p>
                    </div>

                    {loading ? <p className="text-center py-8">Loading available riders...</p> : availableRiders.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No independent riders available.</p>
                    ) : (
                        <div className="space-y-4">
                            {availableRiders.map(rider => {
                                const existingInvite = sentInvites.find(i => i.toDeliveryManId === rider.id);
                                return (
                                    <div key={rider.id} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <img src={rider.logo || `https://ui-avatars.com/api/?name=${rider.name?.en}`} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-gray-200">{rider.name?.en}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>{rider.phone}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1 text-yellow-500"><StarIcon className="w-3 h-3" /> {rider.deliveryManProfile?.rating || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {existingInvite ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                                                    {language === 'en' ? 'Invitation Sent' : 'আমন্ত্রণ পাঠানো হয়েছে'}
                                                </span>
                                                <button
                                                    onClick={() => handleCancelInvite(existingInvite.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                    title="Cancel Invite"
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleInvite(rider.id)}
                                                className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                {language === 'en' ? 'Invite to Team' : 'দলে আমন্ত্রণ জানান'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Delivery Request Modal Component

// Delivery Request Modal Component - UPDATED
const DeliveryRequestModal = ({ order, vendorId, onClose }: { order: Order; vendorId: string; onClose: () => void }) => {
    const { language, vendors, platformSettings } = useApp();
    const [selectedTab, setSelectedTab] = useState<'team' | 'marketplace'>('marketplace');
    const [myTeam, setMyTeam] = useState<any[]>([]);
    const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
    const [requesting, setRequesting] = useState(false);

    // Filter available delivery men (Marketplace)
    const marketplaceDrivers = useMemo(() => vendors.filter(v =>
        v.type === 'deliveryMan' &&
        v.deliveryManProfile?.isAvailable &&
        v.onlineStatus === 'Online' &&
        !v.vendorId // Independent drivers only
    ), [vendors]);

    // Fetch My Team
    useEffect(() => {
        const team = vendors.filter(v => v.type === 'deliveryMan' && v.vendorId === vendorId);
        setMyTeam(team);
    }, [vendors, vendorId]);

    const activeList = selectedTab === 'team' ? myTeam : marketplaceDrivers;
    const commissionRate = platformSettings.features?.deliveryCommissionRate || 10;

    const toggleDriver = (id: string) => {
        setSelectedDrivers(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    const handleSendRequests = async () => {
        if (selectedDrivers.length === 0) {
            toast.error("Please select at least one driver.");
            return;
        }
        setRequesting(true);
        try {
            // Create a map of IDs to Names for the service
            const namesMap: Record<string, string> = {};
            selectedDrivers.forEach(id => {
                const driver = vendors.find(v => v.id === id);
                if (driver) namesMap[id] = driver.name[language] || driver.name['en'];
            });

            await DeliveryService.requestDeliveryBroadcast(order.id, selectedDrivers, namesMap);
            toast.success(`Sent requests to ${selectedDrivers.length} drivers!`);
            onClose();
        } catch (error) {
            console.error("Error requesting delivery", error);
            toast.error("Failed to send requests.");
        } finally {
            setRequesting(false);
        }
    };

    const handleSelfDelivery = async () => {
        try {
            await DeliveryService.assignSelfDelivery(order.id, vendorId);
            toast.success("Assigned to yourself!");
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to assign self.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {language === 'en' ? 'Request Delivery' : 'ডেলিভারি অনুরোধ'}
                        </h2>
                        <p className="text-sm text-gray-500">Order #{order.id.slice(-6)} • ৳{order.total}</p>
                    </div>
                    <button onClick={onClose}><XIcon className="w-6 h-6 text-gray-500 hover:text-red-500 transition-colors" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setSelectedTab('marketplace')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${selectedTab === 'marketplace' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        Marketplace ({marketplaceDrivers.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('team')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${selectedTab === 'team' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        My Team ({myTeam.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30 dark:bg-slate-900/20">
                    {/* Self Delivery Option */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-800 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                                <TruckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-800 dark:text-blue-200">Deliver Myself</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-300 opacity-80">Skip the search and handle this delivery personally.</p>
                            </div>
                        </div>
                        <button onClick={handleSelfDelivery} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
                            Assign to Me
                        </button>
                    </div>

                    <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 px-1 text-sm uppercase tracking-wide">
                        Select Drivers to Request ({selectedDrivers.length})
                    </h4>

                    {activeList.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                            <TruckIcon className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500">No {selectedTab === 'team' ? 'team members' : 'marketplace drivers'} available currently.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeList.map(driver => (
                                <div key={driver.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedDrivers.includes(driver.id) ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}
                                    onClick={() => toggleDriver(driver.id)}
                                >
                                    <div className={`w-6 h-6 rounded-md border flex items-center justify-center mr-4 transition-colors ${selectedDrivers.includes(driver.id) ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {selectedDrivers.includes(driver.id) && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                    </div>
                                    <img src={driver.logo || `https://ui-avatars.com/api/?name=${driver.name.en}`} className="w-12 h-12 rounded-full object-cover mr-4 border border-gray-100 dark:border-slate-600" />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 dark:text-white text-base">{driver.name[language]}</p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><StarIcon className="w-3 h-3 text-yellow-500" /> {driver.deliveryManProfile?.rating || 0}</span>
                                            <span>•</span>
                                            <span>{driver.deliveryManProfile?.totalDeliveries || 0} Deliveries</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
                    <div className="text-sm">
                        <span className="text-gray-500">Selected:</span>
                        <span className="font-bold text-gray-800 dark:text-white ml-1 text-lg">{selectedDrivers.length}</span>
                    </div>
                    <button
                        onClick={handleSendRequests}
                        disabled={requesting || selectedDrivers.length === 0}
                        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30 transition-all transform active:scale-95"
                    >
                        {requesting ? 'Sending...' : 'Send Requests'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Orders Tab Component
const VendorOrdersTab = ({ vendorId }: { vendorId: string }) => {
    const { language, orders, users, updateOrderStatus, vendors, requestDelivery, confirmHandover, startChat, products } = useApp();
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [requestModalOrder, setRequestModalOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [orderFilter, setOrderFilter] = useState<'all' | 'retail' | 'wholesale' | 'history'>('all');
    const ORDERS_PER_PAGE = 10;

    const [realtimeOrders, setRealtimeOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Real-time subscription
    React.useEffect(() => {
        const q = query(
            collection(db, 'orders'),
            where('vendorId', '==', vendorId),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setRealtimeOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching realtime orders:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [vendorId]);

    // Filter Logic
    const allOrders = realtimeOrders.length > 0 ? realtimeOrders : (isLoading ? [] : orders.filter(o => o.vendorId === vendorId));

    const filteredOrders = useMemo(() => {
        if (orderFilter === 'all') return allOrders;
        if (orderFilter === 'history') return allOrders.filter(o => o.status === 'Delivered');

        return allOrders.filter(order => {
            // Determine if order is wholesale based on items
            // We check if ANY item in the order matches a wholesale product
            const isWholesale = order.items.some(item => {
                const product = products.find(p => p.id === item.productId);
                return product?.productType === 'wholesale' || product?.wholesaleEnabled;
            });

            return orderFilter === 'wholesale' ? isWholesale : !isWholesale;
        });
    }, [allOrders, orderFilter, products]);

    const displayOrders = filteredOrders;

    // Pagination based on displayOrders
    const totalPages = Math.ceil(displayOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = displayOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{language === 'en' ? 'Manage Orders' : 'অর্ডার পরিচালনা করুন'}</h2>

                {/* Filter Tabs */}
                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => { setOrderFilter('all'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orderFilter === 'all' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'All' : 'সব'}
                    </button>
                    <button
                        onClick={() => { setOrderFilter('retail'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orderFilter === 'retail' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'Retail' : 'খুচরা'}
                    </button>
                    <button
                        onClick={() => { setOrderFilter('wholesale'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orderFilter === 'wholesale' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'Wholesale' : 'পাইকারি'}
                    </button>
                    <button
                        onClick={() => { setOrderFilter('history'); setCurrentPage(1); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orderFilter === 'history' ? 'bg-white dark:bg-slate-600 shadow text-rose-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {language === 'en' ? 'History' : 'ইতিহাস'}
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">{language === 'en' ? 'Order ID' : 'অর্ডার আইডি'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Customer' : 'গ্রাহক'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Date' : 'তারিখ'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Total' : 'মোট'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Delivery' : 'ডেলিভারি'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Status' : 'স্ট্যাটাস'}</th>
                            <th className="px-6 py-3">{language === 'en' ? 'Actions' : 'কর্ম'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(order => (
                            <tr key={order.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600/50">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.id.split('-')[1]}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {users.find(u => u.id === order.customerId)?.name}
                                        <button onClick={async () => {
                                            const threadId = await startChat(order.customerId, { type: 'order', id: order.id, orderId: order.id, vendorId: order.vendorId });
                                            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                        }} className="text-blue-500 hover:text-blue-700" title="Chat with Customer">
                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">৳{order.total}</td>
                                <td className="px-6 py-4">
                                    {order.assignedDeliveryManId ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-[#2c3e50] dark:text-gray-300">
                                                {vendors.find(v => v.id === order.assignedDeliveryManId)?.name.en || 'Unknown Rider'}
                                            </span>
                                            {(order.status === 'Confirmed' || order.status === 'Preparing') && order.pickupCode && (
                                                <div className="mt-1 bg-blue-50 border border-blue-200 rounded px-2 py-1 text-center">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pickup Code</p>
                                                    <p className="text-base font-mono font-bold text-blue-600 tracking-widest">{order.pickupCode}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Show Request Delivery button if order is Confirmed/Preparing and no delivery request */}
                                            {(order.status === 'Confirmed' || order.status === 'Preparing') && !order.deliveryRequest ? (
                                                <button
                                                    onClick={() => setRequestModalOrder(order)}
                                                    className="bg-green-500 text-white hover:bg-green-600 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                >
                                                    Request Delivery
                                                </button>
                                            ) : order.deliveryRequest?.status === 'pending' ? (
                                                <span className="text-xs text-yellow-600 font-bold">Waiting Response...</span>
                                            ) : order.deliveryRequest?.status === 'rejected' ? (
                                                <button
                                                    onClick={() => setRequestModalOrder(order)}
                                                    className="bg-orange-500 text-white hover:bg-orange-600 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                >
                                                    Request Again
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Pending Assignment</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {order.status}
                                        {order.podUrl && (
                                            <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1" title="Proof of Delivery Available">
                                                <PhotoIcon className="w-3 h-3" /> PoD
                                            </span>
                                        )}
                                        {order.refundInfo?.status === 'Requested' && <span className="text-xs font-bold text-orange-500">(Refund)</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedOrder(order)} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-lg text-xs hover:bg-blue-600">{language === 'en' ? 'Manage' : 'পরিচালনা'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Refund Requests Sub-section */}
            {displayOrders.some(o => o.refundInfo?.status === 'Requested') && (
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                        <ArchiveBoxIcon className="w-5 h-5" />
                        {language === 'en' ? 'Action Required: Refund Requests' : 'কর্ম প্রয়োজন: রিফান্ড অনুরোধ'}
                    </h3>
                    <div className="grid gap-4">
                        {displayOrders.filter(o => o.refundInfo?.status === 'Requested').map(order => (
                            <div key={`refund-${order.id}`} className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-gray-100">Order #{order.id.slice(-6)} - ৳{order.total}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">Reason: "{order.refundInfo?.reason}"</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'Refund Approved')}
                                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => updateOrderStatus(order.id, 'Refund Rejected')}
                                        className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center pt-8">
                <span className="text-sm text-gray-700 dark:text-gray-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
            </div>
            {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onStatusChange={updateOrderStatus} />}
            {requestModalOrder && <DeliveryRequestModal order={requestModalOrder} vendorId={vendorId} onClose={() => setRequestModalOrder(null)} />}
        </div>
    );
};

// Imports for Firestore - Moved to top
// import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'; // Already at top or will be moved
// import { db } from '../src/lib/firebase';
// import { Transaction, CategoryCommission } from '../types';
// import { EconomicsService } from '../src/services/economics';


// ... (Existing Imports remain detailed in full file, but I'm replacing the Tab component)

// FinancialSettingsForm Component
const FinancialSettingsForm: React.FC<{ vendor: Vendor; language: 'en' | 'bn'; onUpdate: () => void }> = ({ vendor, language, onUpdate }) => {
    const { updateVendor } = useApp();
    const settings = vendor.payoutSettings;

    const [method, setMethod] = useState(settings?.method || 'bKash');
    const [accountType, setAccountType] = useState(settings?.accountType || 'Personal');
    const [accountNumber, setAccountNumber] = useState(settings?.accountNumber || '');
    const [bankName, setBankName] = useState(settings?.bankDetails?.bankName || '');
    const [branchName, setBranchName] = useState(settings?.bankDetails?.branchName || '');
    const [accountName, setAccountName] = useState(settings?.bankDetails?.accountName || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateVendor(vendor.id, {
                payoutSettings: {
                    method: method as any,
                    accountType: accountType as any,
                    accountNumber,
                    bankDetails: method === 'Bank Transfer' ? { bankName, branchName, accountName } : undefined,
                    lastUpdated: new Date().toISOString()
                }
            });
            toast.success(language === 'en' ? 'Payout settings updated!' : 'পেমেন্ট সেটিংস আপডেট হয়েছে!');
            onUpdate();
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {language === 'en' ? 'Method' : 'পদ্ধতি'}
                    </label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as any)}
                        className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl"
                    >
                        <option value="bKash">bKash</option>
                        <option value="Nagad">Nagad</option>
                        <option value="Rocket">Rocket</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                </div>
                {method !== 'Bank Transfer' && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            {language === 'en' ? 'Account Type' : 'অ্যাকাউন্টের ধরন'}
                        </label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value as any)}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl"
                        >
                            <option value="Personal">Personal</option>
                            <option value="Agent">Agent</option>
                        </select>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'en' ? 'Account Number' : 'অ্যাকাউন্ট নম্বর'}
                </label>
                <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="017..."
                    className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl"
                />
            </div>

            {method === 'Bank Transfer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-700">
                    <input placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border rounded-xl" />
                    <input placeholder="Branch Name" value={branchName} onChange={e => setBranchName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border rounded-xl" />
                    <input placeholder="Account Name" value={accountName} onChange={e => setAccountName(e.target.value)} required className="p-3 bg-white dark:bg-slate-800 border rounded-xl" />
                </div>
            )}

            <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400"
            >
                {saving ? 'Saving...' : (language === 'en' ? 'Save Payout Details' : 'পেমেন্ট তথ্য সংরক্ষণ করুন')}
            </button>
        </form>
    );
};

// VendorEarningsTab Component
const VendorEarningsTab = ({ vendorId }: { vendorId: string }) => {
    const { language, vendors, requestVendorPayout, orders } = useApp();
    const vendor = vendors.find(v => v.id === vendorId);

    if (!vendor) return <div>Vendor data not found</div>;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showPayoutSettings, setShowPayoutSettings] = useState(false);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    const vendorOrders = useMemo(() => orders.filter(o => o.vendorId === vendorId), [orders, vendorId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'transactions'),
                    where('userId', '==', vendorId),
                    orderBy('date', 'desc'),
                    limit(20)
                );
                const snapshot = await getDocs(q);
                setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
            } catch (error) {
                console.error("Error fetching transactions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [vendorId, refreshTrigger]);

    const pendingAmount = useMemo(() => {
        return transactions
            .filter(t => t.status === 'Pending' && t.type !== 'withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const isPayoutLocked = useMemo(() => {
        if (!vendor.payoutSettings?.lastUpdated) return false;
        const lastUpdate = new Date(vendor.payoutSettings.lastUpdated).getTime();
        const now = new Date().getTime();
        return (now - lastUpdate) < 24 * 60 * 60 * 1000;
    }, [vendor.payoutSettings]);

    const handleWithdrawalSubmit = (amount: number, methodDetails: any) => {
        requestVendorPayout(vendorId, amount, methodDetails);
    };

    return (
        <div className="space-y-6">
            {/* Main Balance Card */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-8 rounded-[2rem] text-white shadow-xl shadow-green-100 dark:shadow-none relative overflow-hidden animate-scale-up">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <CurrencyDollarIcon className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-green-100 text-sm font-bold uppercase tracking-widest mb-2">
                                {language === 'en' ? 'Available Balance' : 'আপনার ব্যালেন্স'}
                            </p>
                            <h2 className="text-5xl font-black">৳{(vendor.walletBalance || 0).toLocaleString()}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-widest mb-1">
                                {language === 'en' ? 'Pending Clearance' : 'বিচারাধীন'}
                            </p>
                            <p className="text-2xl font-bold">৳{pendingAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsWithdrawalModalOpen(true)}
                                disabled={(vendor.walletBalance || 0) <= 500 || vendor.payoutRequested || isPayoutLocked}
                                className="bg-white text-green-700 font-black py-4 px-10 rounded-2xl hover:bg-green-50 disabled:bg-white/50 disabled:text-white/50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                            >
                                {vendor.payoutRequested ?
                                    (language === 'en' ? 'Requested' : 'অনুরোধ করা হয়েছে') :
                                    (language === 'en' ? 'Withdraw Funds' : 'টাকা উত্তোলন করুন')
                                }
                            </button>
                            <button
                                onClick={() => setShowPayoutSettings(!showPayoutSettings)}
                                className="bg-green-500/30 text-white font-bold py-4 px-6 rounded-2xl hover:bg-green-500/50 transition-all border border-white/20 flex items-center gap-2"
                            >
                                <CogIcon className="w-5 h-5" />
                                {language === 'en' ? 'Settings' : 'সেটিংস'}
                            </button>
                        </div>
                        {isPayoutLocked && (
                            <div className="flex items-center gap-2 text-rose-100 font-bold text-xs bg-rose-500/30 px-4 py-2 rounded-xl border border-rose-400/30">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {language === 'en' ? 'Locked for 24h due to settings change' : 'নিরাপত্তার জন্য ২৪ ঘণ্টা উত্তোলন বন্ধ'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPayoutSettings ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CreditCardIcon className="w-6 h-6 text-blue-600" />
                            {language === 'en' ? 'Payout Destination' : 'টাকা গ্রহণের মাধ্যম'}
                        </h3>
                        <button onClick={() => setShowPayoutSettings(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-6 h-6" /></button>
                    </div>
                    <FinancialSettingsForm vendor={vendor} language={language} onUpdate={() => setRefreshTrigger(p => p + 1)} />
                </div>
            ) : (
                <>
                    {/* Analytics Chart */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-green-500" />
                            {language === 'en' ? 'Revenue Analytics' : 'আয়ের পরিসংখ্যান'}
                        </h3>
                        <RevenueChart orders={vendorOrders} period="daily" />
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6">{language === 'en' ? 'Recent Activity' : 'সাম্প্রতিক লেনদেন'}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[10px] text-gray-400 uppercase tracking-widest border-b dark:border-slate-700">
                                    <tr>
                                        <th className="pb-4 px-2 font-bold">Date</th>
                                        <th className="pb-4 px-2 font-bold">Type</th>
                                        <th className="pb-4 px-2 font-bold">Description</th>
                                        <th className="pb-4 px-2 font-bold text-right">Amount</th>
                                        <th className="pb-4 px-2 font-bold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                                    {loading ? (
                                        <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading activity...</td></tr>
                                    ) : transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="py-4 px-2 text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="py-4 px-2"><span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md text-[10px] font-bold uppercase">{tx.type.replace('_', ' ')}</span></td>
                                            <td className="py-4 px-2 font-medium text-gray-800 dark:text-gray-200">{tx.description}</td>
                                            <td className={`py-4 px-2 text-right font-black ${tx.amount > 0 ? 'text-green-600' : 'text-rose-500'}`}>
                                                {tx.amount > 0 ? '+' : ''}৳{Math.abs(tx.amount).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-2 text-center">
                                                <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${tx.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                    tx.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <WithdrawalModal
                isOpen={isWithdrawalModalOpen}
                onClose={() => setIsWithdrawalModalOpen(false)}
                onSubmit={handleWithdrawalSubmit}
                maxAmount={vendor.walletBalance || 0}
                currentBalance={vendor.walletBalance || 0}
                language={language}
                payoutSettings={vendor.payoutSettings}
            />
        </div>
    );
};


export default VendorDashboardPage;
