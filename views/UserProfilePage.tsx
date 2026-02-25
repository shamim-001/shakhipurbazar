import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPagePath } from '../src/utils/navigation';
import { PaymentService } from '../services/paymentService'; // Added
import { useApp } from '../src/context/AppContext';
import { Order, User, Product, Transaction, SupportCategory, SupportTicket } from '../types';
import { SupportService } from '../src/services/supportService';
import { ImageService } from '../src/services/imageService';
import {
    ShoppingBagIcon, HeartIcon, UserIcon, MapPinIcon, CogIcon,
    TruckIcon, CheckCircleIcon, XIcon,
    NavigationIcon, PhoneIcon, ChatBubbleLeftRightIcon, StarIcon,
    ShieldCheckIcon, CurrencyDollarIcon, PencilIcon, TrashIcon,
    PowerIcon, ChevronRightIcon, SunIcon, MoonIcon,
    HomeIcon, CalendarIcon, KeyIcon, StoreIcon, ClockIcon, TagIcon,
    PaperAirplaneIcon, TicketIcon, GlobeAltIcon, WalletIcon, PlusIcon,
    CarIcon, CheckIcon, LinkIcon, PrinterIcon, ArrowUpOnSquareIcon,
    QuestionMarkCircleIcon, LifebuoyIcon, ChevronLeftIcon, ArrowUturnLeftIcon, KeyIcon as KeyIconSolid, SparklesIcon, PaperClipIcon
} from '../components/icons';
import { Address } from '../types';

import { toast } from 'react-hot-toast';
import { OrderService } from '../src/services/orderService';
import ProductCard from '../components/ProductCard';
import AddReviewModal from '../components/AddReviewModal';
import InvoiceModal from '../src/components/InvoiceModal';

// 0. Simple Order Details Modal (For non-ride orders)
const SimpleOrderModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Order Details</h2>
                        <p className="text-sm text-gray-500">#{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 dark:bg-slate-700 p-2 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5 text-gray-500" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Status History Timeline */}
                    <div className="mb-6 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Order Journey</h4>
                        <div className="space-y-4">
                            {(order.statusHistory || []).map((step, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className="relative">
                                        <div className={`w-3 h-3 rounded-full mt-1 ${idx === 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
                                        {idx < (order.statusHistory?.length || 0) - 1 && (
                                            <div className="absolute top-4 left-1.5 w-0.5 h-6 bg-gray-200 dark:bg-slate-700" />
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${idx === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {step.status}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {new Date(step.date).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4">
                                <img src={item.productImage} alt={item.productName.en} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm line-clamp-2 dark:text-white">{item.productName.en}</h4>
                                    <p className="text-sm text-gray-500">{item.quantity} x ৳{item.priceAtPurchase}</p>
                                </div>
                                <p className="font-bold dark:text-white">৳{item.quantity * item.priceAtPurchase}</p>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 border-t border-gray-100 dark:border-slate-700 pt-4">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>৳{order.total - (order.deliveryFee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Delivery Fee</span>
                            <span>৳{order.deliveryFee || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg dark:text-white pt-2">
                            <span>Total</span>
                            <span>৳{order.total}</span>
                        </div>
                    </div>
                </div>
                {order.podUrl && (
                    <div className="px-6 pb-6">
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4" />
                                Proof of Delivery
                            </h4>
                            <img
                                src={order.podUrl}
                                alt="Proof of Delivery"
                                className="w-full h-48 object-cover rounded-lg border border-green-100 dark:border-green-800"
                                onClick={() => window.open(order.podUrl, '_blank')}
                            />
                            <p className="text-[10px] text-center text-gray-500 mt-2">Tap photo to view full size</p>
                        </div>
                    </div>
                )}
                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
                    <div className={`flex-1 p-3 rounded-xl text-center font - bold text-sm ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                        } `}>
                        Status: {order.status}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RideTrackerModal: React.FC<{ order: Order; onClose: () => void }> = ({ order: initialOrder, onClose }) => {
    const { language, vendors, startChat, orders, updateOrderStatus, cancelOrder, requestRefund } = useApp();
    const navigate = useNavigate();

    // Subscribe to global order updates to react to status changes in real-time
    const order = orders.find(o => o.id === initialOrder.id) || initialOrder;

    // Check if it's a Ride or a Product Delivery
    const isRide = !!order.items[0]?.rentalDetails;
    const vehicle = order.items[0];
    const rentalDetails = vehicle?.rentalDetails;

    // Determine Driver/Delivery Man ID
    const serviceType = isRide ? 'Rider' : 'Delivery Man';
    const driverId = order.assignedDeliveryManId || order.vendorId;
    const driverVendor = vendors.find(v => v.id === driverId);

    const driverName = driverVendor?.name?.[language] || (isRide ? 'Driver' : 'Delivery Partner');
    const driverRating = 4.8;
    const plateNumber = isRide ? 'Dhaka-Metro-Ga-12-3456' : null;

    const isAccepted = ['Ride Accepted', 'Ride Started', 'Payment Processing', 'Ride Completed', 'Out for Delivery'].includes(order.status);
    const isSearching = order.status === 'Ride Requested';
    const isCompleted = ['Ride Completed', 'Delivered'].includes(order.status);

    const [eta, setEta] = useState(15);
    const [progress, setProgress] = useState(0);
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');

    // Calculate Distance & ETA using Real Driver Location
    useEffect(() => {
        if (isAccepted && !isCompleted && driverVendor?.deliveryManProfile?.currentLocation) {
            const driverLoc = driverVendor.deliveryManProfile.currentLocation;
            // Target Location (Mock Sakhipur Center or geocoded address if we had it)
            const destLat = 24.3396;
            const destLng = 90.1760;

            const diffLat = Math.abs(driverLoc.lat - destLat);
            const diffLng = Math.abs(driverLoc.lng - destLng);
            const dist = Math.sqrt(diffLat * diffLat + diffLng * diffLng) * 111; // km approximation

            setEta(Math.ceil(dist * 3) + 2); // 3 min per km + buffer

            // Progress Update (Mock based on 5km catchment area)
            const totalDist = 5;
            const currentProgress = Math.min(100, Math.max(0, ((totalDist - dist) / totalDist) * 100));
            setProgress(currentProgress);
        }
    }, [driverVendor, isAccepted, isCompleted]);

    useEffect(() => {
        if (order.status === 'Cancelled') onClose();
    }, [order.status, onClose]);

    const handleCancelRequest = () => {
        if (confirm(isRide ? "Are you sure you want to cancel the ride?" : "Cancel this delivery request?")) {
            cancelOrder(order.id, 'customer');
            onClose();
        }
    };

    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleContactDriver = async () => {
        if (driverId) {
            setIsChatLoading(true);
            try {
                const tid = await startChat(driverId, {
                    type: 'order',
                    id: order.id,
                    orderId: order.id,
                    vendorId: order.vendorId
                });
                if (tid) {
                    navigate(`/chat/${tid}`);
                    onClose();
                }
            } catch (e) {
                console.error(e);
                setIsChatLoading(false);
            }
        } else {
            alert("Contact not available yet.");
        }
    };

    const handleConfirmPayment = () => {
        updateOrderStatus(order.id, isRide ? 'Ride Completed' : 'Delivered');
    };

    const submitReport = () => {
        if (reportReason) {
            requestRefund(order.id, reportReason);
            setShowReportForm(false);
            alert("Issue reported to admin.");
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-end md:items-center p-0 md:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] relative" onClick={e => e.stopPropagation()}>

                {/* Visual Map Header */}
                <div className="h-56 bg-gradient-to-b from-blue-50 to-white dark:from-slate-700 dark:to-slate-800 relative w-full overflow-hidden border-b dark:border-slate-700">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/city-map.png')] grayscale"></div>

                    {/* Pulsing Target Location */}
                    <div className="absolute top-1/2 right-[15%] transform -translate-y-1/2 flex flex-col items-center z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
                            <div className="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                        </div>
                        <p className="mt-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Destination</p>
                    </div>

                    {/* Animated Service Icon (Car or Truck) */}
                    {isAccepted && !isCompleted && (
                        <div
                            className="absolute top-1/2 transform -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-in-out z-20"
                            style={{ left: `${15 + (progress * 0.7)}% ` }}
                        >
                            <div className="relative mb-2">
                                <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20 shadow-xl"></div>
                                <div className="relative bg-white dark:bg-slate-900 p-2 rounded-xl shadow-xl border border-rose-100 dark:border-rose-900/50">
                                    {isRide ? <CarIcon className="h-6 w-6 text-rose-500" /> : <TruckIcon className="h-6 w-6 text-rose-500" />}
                                </div>
                            </div>
                            <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full shadow-lg">
                                {driverName.split(' ')[0]}
                            </div>
                        </div>
                    )}

                    {/* Route Path */}
                    <svg className="absolute top-1/2 left-[15%] right-[15%] w-[70%] h-4 -translate-y-2 pointer-events-none opacity-30">
                        <line x1="0" y1="8" x2="100%" y2="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-gray-400" />
                    </svg>

                    {/* Top Controls */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                        <button onClick={onClose} className="bg-white/90 dark:bg-black/40 backdrop-blur-md p-2 rounded-full shadow-lg pointer-events-auto hover:scale-110 transition-transform">
                            <XIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {driverVendor?.deliveryManProfile?.currentLocation && (
                            <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse flex items-center gap-1.5 pointer-events-auto">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                LIVE TRACKING
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 -mt-6 rounded-t-3xl relative z-30 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]">
                    {isSearching ? (
                        <div className="text-center py-4">
                            <div className="relative w-16 h-16 mx-auto mb-4">
                                <div className="absolute inset-0 bg-rose-100 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-rose-500 rounded-full h-16 w-16 flex items-center justify-center">
                                    <NavigationIcon className="h-8 w-8 text-white animate-pulse" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Searching for nearby drivers...</h2>
                            <p className="text-gray-500 text-sm">Connecting you to the best driver</p>

                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <button
                                    onClick={handleCancelRequest}
                                    className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        </div>
                    ) : isCompleted ? (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircleIcon className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{isRide ? 'Ride Completed!' : 'Order Delivered!'}</h2>
                            <p className="text-gray-500 mb-6">{isRide ? 'Thank you for using Sakhipur Bazar.' : 'Your items have been delivered successfully.'}</p>
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-300">Total Paid</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">৳{order.total}</span>
                            </div>
                            <button onClick={onClose} className="w-full bg-[#795548] text-white font-bold py-3 rounded-xl">Close</button>
                        </div>
                    ) : (
                        <div>
                            {/* Product Items Section */}
                            {!isRide && (
                                <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Items</h3>
                                    <div className="space-y-3">
                                        {order.items.map((item, idx) => (
                                            <div
                                                key={`${item.productId}-${idx}`}
                                                className="flex items-center gap-3 cursor-pointer group"
                                                onClick={() => {
                                                    navigate(getPagePath({ name: 'product', productId: item.productId }));
                                                    onClose();
                                                }}
                                            >
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                                                    <img src={item.productImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate group-hover:text-rose-500 transition-colors">
                                                        {item.productName[language]}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} • ৳{item.priceAtPurchase}</p>
                                                </div>
                                                <div className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Driver Info Card */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden">
                                    <UserIcon className="w-full h-full p-2 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{driverName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="flex items-center text-orange-500 font-bold"><StarIcon className="w-3 h-3 fill-current mr-1" /> {driverRating}</span>
                                        <span>• {plateNumber}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-bold uppercase">ETA</p>
                                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{eta} min</p>
                                </div>
                            </div>

                            {/* Address Details for Non-Ride Orders */}
                            {!rentalDetails && (
                                <div className="mb-4 bg-gray-50 p-3 rounded-lg text-sm">
                                    <p className="font-bold">Delivering to:</p>
                                    <p className="text-gray-600">{order.address || 'Saved Address'}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <button onClick={handleContactDriver} disabled={isChatLoading} className="col-span-3 bg-[#2c3e50] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#34495e] disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isChatLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    )}
                                    {isChatLoading ? 'Starting Chat...' : 'Chat with Driver'}
                                </button>
                                <a href="tel:+8801700000000" className="bg-green-100 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-200">
                                    <PhoneIcon className="w-6 h-6" />
                                </a>
                            </div>

                            {/* Status or Payment */}
                            {order.status === 'Payment Processing' ? (
                                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-pulse">
                                    <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-2">Payment Pending</h3>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-4">Please confirm payment.</p>
                                    <div className="flex justify-between items-center mb-4 text-lg font-bold text-gray-800 dark:text-white border-b border-indigo-200 pb-2">
                                        <span>Total</span>
                                        <span>৳{order.total}</span>
                                    </div>
                                    <button onClick={handleConfirmPayment} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg">
                                        Confirm Payment
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                        <ShieldCheckIcon className="w-5 h-5 text-blue-500" />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-gray-500 uppercase">STATUS</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.status}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between gap-3 pt-2">
                                        <button onClick={() => setShowReportForm(true)} className="text-xs text-gray-500 hover:text-gray-700 font-medium py-2 px-4">Report Issue</button>
                                        <button onClick={handleCancelRequest} className="text-xs text-red-500 hover:text-red-700 font-medium py-2 px-4">Cancel Order</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Report Issue Modal Overlay */}
            {showReportForm && (
                <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">Report an Issue</h3>
                        <textarea
                            className="w-full p-3 border rounded-lg mb-4 dark:bg-slate-700 dark:text-white"
                            rows={4}
                            placeholder="Describe the problem..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                        ></textarea>
                        <div className="flex gap-2">
                            <button onClick={() => setShowReportForm(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">Cancel</button>
                            <button onClick={submitReport} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const WalletTab = () => {
    const { currentUser, walletTransactions, topUpWallet, updateUser, platformSettings } = useApp();
    const [topUpAmount, setTopUpAmount] = useState('');
    const [selectedMethodId, setSelectedMethodId] = useState('new');
    const [newMethodType, setNewMethodType] = useState('bKash');

    // Feature Flag Check
    const isWalletEnabled = platformSettings.features?.enableWalletPayments ?? true; // Default to true if not set

    // Payment Method Form State
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Added
    const [newMethodDetails, setNewMethodDetails] = useState({
        type: 'bKash' as 'bKash' | 'Nagad' | 'Bank Card',
        identifier: '',
        bankName: '',
        accountName: ''
    });

    if (!currentUser) return null;

    const savedMethods = currentUser.paymentMethods || [];

    const handleAddMethod = (e: React.FormEvent) => {
        // ... (existing logic) ...
        e.preventDefault();
        const newMethod: any = {
            id: `pm_${Date.now()} `,
            type: newMethodDetails.type,
            identifier: newMethodDetails.identifier,
        };

        if (newMethodDetails.type === 'Bank Card') {
            newMethod.details = {
                bankName: newMethodDetails.bankName,
                accountName: newMethodDetails.accountName
            };
        }

        const updatedMethods = [...savedMethods, newMethod];
        updateUser({ paymentMethods: updatedMethods });
        setShowAddMethod(false);
        setNewMethodDetails({ type: 'bKash', identifier: '', bankName: '', accountName: '' });
        alert('Payment method saved successfully!');
    };

    const handleDeleteMethod = (id: string) => {
        if (confirm('Are you sure you want to remove this payment method?')) {
            const updatedMethods = savedMethods.filter(m => m.id !== id);
            updateUser({ paymentMethods: updatedMethods });
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        // ... (existing logic) ...
        e.preventDefault();
        const amount = Number(topUpAmount);

        let paymentMethod: string;
        if (selectedMethodId === 'new') {
            paymentMethod = newMethodType;
        } else {
            const method = savedMethods.find(m => m.id === selectedMethodId);
            paymentMethod = method ? method.type : newMethodType; // Fallback if method not found, though it shouldn't happen
        }

        if (amount > 0) {
            // New Real Payment Flow
            setIsProcessing(true);
            try {
                // 1. Create Payment
                // alert(`Redirecting to ${ paymentMethod } Gateway...`); // Optional UX
                const createResp = await PaymentService.createPayment(amount, paymentMethod as any);

                // 2. Simulate Redirect & User Action (Mocking the browser behavior)
                // In real app: window.location.href = createResp.redirectURL;
                // Redirect URL: createResp.redirectURL

                const confirmed = confirm(`Redirected to ${paymentMethod} Gateway.\n\nSimulating Payment of ৳${amount}?\n(Click OK to Pay, Cancel to Abort)`);

                if (confirmed) {
                    // 3. Execute Payment
                    const execResp = await PaymentService.executePayment(createResp.paymentID, amount, paymentMethod);
                    if (execResp.success) {
                        alert(`Payment Successful! TRX ID: ${execResp.trxID} `);
                        // Update local state to reflect change immediately (optional, as listener will likely catch it)
                        // topUpWallet(amount, paymentMethod); // We might keep this for optimistic UI or remove if we trust the listener completely.
                        // Ideally: Listener updates balance. We just clear form.
                        setTopUpAmount('');
                    } else {
                        alert("Payment Execution Failed.");
                    }
                } else {
                    alert("Payment Cancelled by User.");
                }

            } catch (error) {
                console.error("TopUp Error:", error);
                alert("Payment Failed. Check console.");
            } finally {
                setIsProcessing(false);
            }
            // topUpWallet(amount, paymentMethod); // Removed manual update, relying on real flow or simulated real flow
            // Actually, keep it for specific demo purposes if the simulate function doesn't auto-update context yet?
            // "executePayment" updates Firestore. "useAuth" syncs profile. So context should update automatically.
            // But topUpWallet function in AppContext is client-side mock. We should probably prefer the backend flow now.
            // For safety in this demo helper:
            topUpWallet(amount, paymentMethod);
            setTopUpAmount('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <p className="text-violet-200 text-sm font-medium uppercase tracking-wider mb-1">Available Balance</p>
                <h2 className="text-4xl font-extrabold mb-6">৳{currentUser.walletBalance.toLocaleString()}</h2>

                <div className="flex gap-3">
                    <button
                        onClick={() => document.getElementById('topup-input')?.focus()}
                        disabled={!isWalletEnabled}
                        className={`bg-white/20 hover: bg-white/30 backdrop - blur - sm px - 4 py - 2 rounded-lg text-sm font - bold flex items-center gap-2 ${!isWalletEnabled ? 'opacity-50 cursor-not-allowed' : ''} `}
                    >
                        <PlusIcon className="w-4 h-4" /> Add Money
                    </button>
                </div>
            </div>

            {!isWalletEnabled && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {/* Warning Icon */}
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                Wallet top-up is currently disabled for maintenance. Please check back later.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Up Form - Conditionally Rendered */}
                {isWalletEnabled && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="font-bold text-lg dark:text-white mb-4 flex items-center gap-2">
                            <WalletIcon className="w-5 h-5 text-green-500" /> Top Up Wallet
                        </h3>
                        <form onSubmit={handleTopUp} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Amount (৳)</label>
                                <input
                                    id="topup-input"
                                    type="number"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    className="w-full p-3 mt-1 bg-gray-50 dark:bg-slate-700 rounded-xl border-0 focus:ring-2 focus:ring-violet-500 dark:text-white font-bold"
                                    placeholder="500"
                                    required
                                />
                            </div>
                            <div className="pt-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Method</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {['bKash', 'Nagad', 'Bank Card'].map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => { setSelectedMethodId('new'); setNewMethodType(m); }}
                                            className={`p-2 rounded-lg text-sm font - bold border-2 transition - all ${selectedMethodId === 'new' && newMethodType === m ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-transparent bg-gray-100 text-gray-500'} `}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button disabled={isProcessing} className="w-full bg-violet-600 text-white font-bold py-3.5 rounded-xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 dark:shadow-none mt-4">
                                {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                            </button>
                        </form>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg dark:text-white">Saved Payment Methods</h3>
                            <button onClick={() => setShowAddMethod(true)} className="text-violet-600 text-sm font-bold bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-lg">+ Add New</button>
                        </div>
                        <div className="space-y-3">
                            {savedMethods.length > 0 ? savedMethods.map(method => (
                                <div key={method.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-slate-700 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font - bold ${method.type === 'bKash' ? 'bg-pink-500' : method.type === 'Nagad' ? 'bg-orange-500' : 'bg-blue-500'} `}>
                                            {method.type === 'Bank Card' ? 'VISA' : method.type.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm dark:text-white">{method.type}</p>
                                            <p className="text-xs text-gray-500">{method.identifier}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteMethod(method.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-center text-sm italic">No saved methods.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h3 className="font-bold text-lg dark:text-white mb-4">History</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {walletTransactions.length > 0 ? walletTransactions.map(txn => (
                                <div key={txn.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-bold text-sm dark:text-gray-200">{txn.description}</p>
                                        <p className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`font - bold ${['deposit', 'refund'].includes(txn.type) ? 'text-green-500' : 'text-red-500'} `}>
                                        {['deposit', 'refund'].includes(txn.type) ? '+' : ''}৳{Math.abs(txn.amount)}
                                    </span>
                                </div>
                            )) : <p className="text-gray-400 text-center italic py-4">No transactions yet.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Method Modal */}
            {showAddMethod && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddMethod(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add Payment Method</h3>
                        <form onSubmit={handleAddMethod} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Method Type</label>
                                <select
                                    value={newMethodDetails.type}
                                    onChange={(e) => setNewMethodDetails({ ...newMethodDetails, type: e.target.value as any })}
                                    className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                >
                                    <option value="bKash">bKash</option>
                                    <option value="Nagad">Nagad</option>
                                    <option value="Bank Card">Bank Card</option>
                                </select>
                            </div>

                            {newMethodDetails.type === 'Bank Card' ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMethodDetails.bankName}
                                            onChange={(e) => setNewMethodDetails({ ...newMethodDetails, bankName: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="e.g. City Bank"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Card Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMethodDetails.identifier}
                                            onChange={(e) => setNewMethodDetails({ ...newMethodDetails, identifier: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="XXXX XXXX XXXX 1234"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Cardholder Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMethodDetails.accountName}
                                            onChange={(e) => setNewMethodDetails({ ...newMethodDetails, accountName: e.target.value })}
                                            className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            placeholder="Name on Card"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newMethodDetails.identifier}
                                        onChange={(e) => setNewMethodDetails({ ...newMethodDetails, identifier: e.target.value })}
                                        className="w-full p-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                        placeholder="017..."
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddMethod(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700">Save Method</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const WishlistTab = () => {
    const { wishlist } = useApp();
    if (wishlist.length === 0) {
        return (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl">
                <HeartIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Your wishlist is empty.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlist.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

const ResellTab = () => {
    const { currentUser, products, deleteResellItem, language } = useApp();
    const navigate = useNavigate();
    const myItems = products.filter(p => p.sellerId === currentUser?.id);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">My Resell Listings</h3>
                    <p className="text-sm text-gray-500">Manage your secondhand items</p>
                </div>
                <button
                    onClick={() => navigate(getPagePath({ name: 'resell' }))}
                    className="bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-600 transition-colors"
                >
                    Post New Ad
                </button>
            </div>

            {myItems.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl">
                    <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">You haven't listed any items yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myItems.map(item => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm flex gap-4">
                            <img src={item.images[0]} alt={item.name[language]} className="w-20 h-20 object-cover rounded-lg" />
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white line-clamp-1">{item.name[language]}</h4>
                                <p className="text-rose-500 font-bold">৳{item.price}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${item.resellStatus === 'sold' ? 'bg-gray-200 text-gray-600' :
                                    item.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    } `}>
                                    {item.resellStatus === 'sold' ? 'Sold' : item.status === 'Pending' ? 'Pending Approval' : 'Active'}
                                </span>
                            </div>
                            <button onClick={() => deleteResellItem(item.id)} className="text-red-400 hover:text-red-600 self-start">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AddressBookTab = () => {
    const { currentUser, updateUser } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState<Partial<Address>>({
        label: 'Home',
        recipientName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        addressLine: '',
        area: 'Sakhipur Center',
        isDefault: false
    });

    const addresses = currentUser?.addressBook || [];

    const handleSave = async () => {
        if (!formData.addressLine || !formData.phone || !formData.recipientName) {
            toast.error("Please fill required fields");
            return;
        }

        const newAddress: Address = {
            id: editingAddress ? editingAddress.id : `addr_${Date.now()}`,
            label: formData.label || 'Home',
            recipientName: formData.recipientName,
            phone: formData.phone,
            addressLine: formData.addressLine,
            area: formData.area || 'Sakhipur Center',
            isDefault: formData.isDefault || false
        };

        let updatedAddresses = [...addresses];

        if (newAddress.isDefault) {
            updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
        } else if (updatedAddresses.length === 0) {
            newAddress.isDefault = true;
        }

        if (editingAddress) {
            updatedAddresses = updatedAddresses.map(a => a.id === newAddress.id ? newAddress : a);
        } else {
            updatedAddresses.push(newAddress);
        }

        await updateUser({ addressBook: updatedAddresses });
        toast.success("Address Saved!");
        setShowModal(false);
        setEditingAddress(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this address?")) {
            const updatedAddresses = addresses.filter(a => a.id !== id);
            await updateUser({ addressBook: updatedAddresses });
        }
    };

    const handleSetDefault = async (id: string) => {
        const updatedAddresses = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        await updateUser({ addressBook: updatedAddresses });
        toast.success("Default Address Updated");
    };

    const openEdit = (addr: Address) => {
        setEditingAddress(addr);
        setFormData(addr);
        setShowModal(true);
    };

    const openAdd = () => {
        setEditingAddress(null);
        setFormData({
            label: 'Home',
            recipientName: currentUser?.name || '',
            phone: currentUser?.phone || '',
            addressLine: '',
            area: 'Sakhipur Center',
            isDefault: addresses.length === 0
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-rose-500" /> My Addresses
                    </h3>
                    <p className="text-sm text-gray-500">Manage shipping addresses for checkout.</p>
                </div>
                <button onClick={openAdd} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-rose-200 dark:shadow-none flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Add New
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                        <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No saved addresses found.</p>
                        <button onClick={openAdd} className="mt-4 text-rose-600 font-bold hover:underline">Add your first address</button>
                    </div>
                ) : (
                    addresses.map(addr => (
                        <div key={addr.id} className={`p-5 rounded-xl border-2 transition-all relative group ${addr.isDefault ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-transparent bg-white dark:bg-slate-800 shadow-sm hover:border-gray-200 dark:hover:border-slate-600'}`}>
                            {addr.isDefault && (
                                <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Default</span>
                            )}
                            <div className="mb-3">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${addr.label === 'Home' ? 'bg-blue-100 text-blue-700' : addr.label === 'Office' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {addr.label}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100">{addr.recipientName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{addr.phone}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{addr.addressLine}, {addr.area}</p>

                            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(addr)} className="flex-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 bg-white dark:bg-slate-700 py-2 rounded border border-gray-200 dark:border-slate-600">Edit</button>
                                <button onClick={() => handleDelete(addr.id)} className="flex-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-red-600 bg-white dark:bg-slate-700 py-2 rounded border border-gray-200 dark:border-slate-600">Delete</button>
                                {!addr.isDefault && (
                                    <button onClick={() => handleSetDefault(addr.id)} className="flex-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-slate-700 py-2 rounded border border-rose-100 dark:border-slate-600">Set Default</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full"><XIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
                                    <select value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-none font-medium dark:text-white">
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Area</label>
                                    <select value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-none font-medium dark:text-white">
                                        <option value="Sakhipur Center">Sakhipur Center</option>
                                        <option value="Boheratoil">Boheratoil</option>
                                        <option value="Kachua">Kachua</option>
                                        <option value="Gohailbari">Gohailbari</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name</label>
                                <input type="text" value={formData.recipientName} onChange={e => setFormData({ ...formData, recipientName: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-none dark:text-white" placeholder="e.g. John Doe" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-none dark:text-white" placeholder="017..." />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Address Details</label>
                                <textarea rows={3} value={formData.addressLine} onChange={e => setFormData({ ...formData, addressLine: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-none dark:text-white" placeholder="House #, Road #, Village..." />
                            </div>

                            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <input type="checkbox" id="isDefault" checked={formData.isDefault} onChange={e => setFormData({ ...formData, isDefault: e.target.checked })} className="w-5 h-5 text-rose-500 rounded focus:ring-rose-500" />
                                <label htmlFor="isDefault" className="text-sm font-bold text-blue-900 dark:text-blue-100 cursor-pointer">Set as Default Delivery Address</label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                            <button onClick={handleSave} className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-none">Save Address</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RecentTab = () => {
    const { recentlyViewed } = useApp();
    if (recentlyViewed.length === 0) {
        return (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recently viewed items.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentlyViewed.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};



const SettingsTab = () => {
    const { currentUser, updateUser, theme, toggleTheme, language, setLanguage } = useApp();
    const [name, setName] = useState(currentUser?.name || '');
    const [phone, setPhone] = useState(currentUser?.phone || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [password, setPassword] = useState('');

    const [uploading, setUploading] = useState(false);

    const handleUpdateProfile = async () => {
        try {
            await updateUser({ name, phone, email });
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error("Failed to update profile.");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser) return;

        setUploading(true);
        const toastId = toast.loading("Uploading image...");

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `profile_pictures/${currentUser.id}_${Date.now()}`
            );

            await updateUser({ image: downloadUrl });
            toast.success("Profile picture updated!", { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image.", { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-rose-500" /> Profile Information
                </h3>
                <div className="space-y-6 max-w-md">
                    <div className="flex items-center gap-6 mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-md overflow-hidden bg-gray-100">
                                <img
                                    src={currentUser?.image}
                                    alt={currentUser?.name}
                                    className="w-full h-full object-cover"
                                />
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-rose-500 text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-rose-600 transition-colors">
                                <ArrowUpOnSquareIcon className="w-4 h-4" />
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-white">Profile Photo</h4>
                            <p className="text-xs text-gray-500">Update your avatar displayed across the app.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                        </div>
                        <button onClick={handleUpdateProfile} className="bg-[#2c3e50] text-white px-6 py-2 rounded-lg text-sm font-bold">Update Profile</button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-rose-500" /> Security
                </h3>
                <div className="space-y-4 max-w-md">
                    <input type="password" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    <button onClick={() => { setPassword(''); alert("Password changed!"); }} className="w-full border border-rose-500 text-rose-500 px-6 py-2 rounded-lg text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20">Change Password</button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <CogIcon className="w-5 h-5 text-rose-500" /> App Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {theme === 'light' ? <SunIcon className="w-5 h-5 text-orange-500" /> : <MoonIcon className="w-5 h-5 text-blue-300" />}
                            <span className="text-sm font-medium dark:text-gray-200">Dark Mode</span>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline - flex items-center h-6 rounded-full w-11 transition - colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'} `}
                        >
                            <span className={`inline - block w-4 h-4 transform bg-white rounded-full transition - transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'} `} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <GlobeAltIcon className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-medium dark:text-gray-200">Language (বাংলা)</span>
                        </div>
                        <button
                            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                            className={`relative inline - flex items-center h-6 rounded-full w-11 transition - colors ${language === 'bn' ? 'bg-green-500' : 'bg-gray-300'} `}
                        >
                            <span className={`inline - block w-4 h-4 transform bg-white rounded-full transition - transform ${language === 'bn' ? 'translate-x-6' : 'translate-x-1'} `} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 1. Chat Ticket Modal (New)
const SupportTicketModal: React.FC<{ ticket: SupportTicket; onClose: () => void }> = ({ ticket, onClose }) => {
    const { currentUser } = useApp();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [ticket.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !currentUser || isSending) return;

        setIsSending(true);
        try {
            let attachmentUrl = undefined;
            let attachmentType: 'image' | 'file' | undefined = undefined;

            if (file) {
                const isImage = file.type.startsWith('image/');
                attachmentType = isImage ? 'image' : 'file';
                attachmentUrl = await ImageService.uploadImage(file, `support/${ticket.id}/${Date.now()}_${file.name}`);
            }

            await SupportService.addMessage(ticket.id, {
                senderId: currentUser.id,
                senderName: currentUser.name || 'User',
                content: newMessage,
                isAdmin: false,
                attachmentUrl,
                attachmentType
            });
            setNewMessage('');
            setFile(null);
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`} />
                            <h3 className="font-bold text-gray-800 dark:text-white line-clamp-1">{ticket.subject}</h3>
                        </div>
                        <p className="text-xs text-gray-500 ml-4.5">Ticket #{ticket.id.slice(-6).toUpperCase()} • {ticket.category}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/20">
                    <div className="flex justify-center">
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {new Date(ticket.createdAt).toLocaleDateString()} • Ticket Created
                        </span>
                    </div>

                    {/* Initial Description as first message */}
                    <div className="flex justify-end">
                        <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm">
                            <p className="text-sm">{ticket.description}</p>
                            <p className="text-[10px] text-blue-100 mt-1 text-right">
                                {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    {(ticket.messages || []).map((msg, idx) => {
                        const isMe = !msg.isAdmin; // Assuming current user is "Me" user-side
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 shadow-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border dark:border-slate-600'
                                    }`}>
                                    <p className="text-sm font-bold text-[10px] mb-0.5 opacity-80">{msg.senderName}</p>

                                    {msg.attachmentUrl && (
                                        <div className="mb-2">
                                            {msg.attachmentType === 'image' ? (
                                                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer">
                                                    <img src={msg.attachmentUrl} alt="Attachment" className="max-w-full h-auto rounded-lg max-h-48 object-cover border-2 border-white/20" />
                                                </a>
                                            ) : (
                                                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/10 p-2 rounded-lg hover:bg-black/20 transition-colors">
                                                    <PaperClipIcon className="w-4 h-4" />
                                                    <span className="text-xs underline truncate max-w-[150px]">View Attachment</span>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                    {ticket.status === 'Resolved' ? (
                        <div className="text-center py-2 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
                            <p className="text-sm text-gray-500 font-medium">This ticket has been resolved.</p>
                            <button className="text-xs text-rose-500 font-bold hover:underline mt-1">Re-open Ticket</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                            {file && (
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 p-2 rounded-lg self-start">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-md">
                                        <PaperClipIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{file.name}</span>
                                    <button type="button" onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                                    disabled={isSending}
                                >
                                    <PaperClipIcon className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    accept="image/*,.pdf,.doc,.docx"
                                />
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-gray-100 dark:bg-slate-900 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    disabled={isSending}
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !file) || isSending}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-0.5 -translate-y-0.5" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const SupportTab = () => {
    const { language, platformSettings, currentUser, startSupportChat, sendMessage } = useApp();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
    const [showContactForm, setShowContactForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    useEffect(() => {
        if (currentUser) {
            const unsub = SupportService.subscribeToUserTickets(currentUser.id, setTickets);
            return () => unsub();
        }
    }, [currentUser]);

    // Update selected ticket in real-time if it's open
    useEffect(() => {
        if (selectedTicket) {
            const updated = tickets.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }
    }, [tickets]);

    const categories: { id: SupportCategory; label: string; icon: any }[] = [
        { id: 'Help Center', label: language === 'en' ? 'Help Center' : 'সাহায্য কেন্দ্র', icon: QuestionMarkCircleIcon },
        { id: 'Contact Customer Care', label: language === 'en' ? 'Contact Customer Care' : 'কাস্টমার কেয়ার', icon: ChatBubbleLeftRightIcon },
        { id: 'Shipping & Delivery', label: language === 'en' ? 'Shipping & Delivery' : 'শিপিং এবং ডেলিভারি', icon: TruckIcon },
        { id: 'Order', label: language === 'en' ? 'Order' : 'অর্ডার', icon: ShoppingBagIcon },
        { id: 'Payment', label: language === 'en' ? 'Payment' : 'পেমেন্ট', icon: CurrencyDollarIcon },
        { id: 'Returns & Refunds', label: language === 'en' ? 'Returns & Refunds' : 'রিটার্ন এবং রিফান্ড', icon: ArrowUturnLeftIcon },
    ];

    const handleSubmitTicket = async () => {
        if (!currentUser || !subject.trim() || !description.trim()) return;
        const toastId = toast.loading('Opening ticket...');
        try {
            const threadId = await startSupportChat(subject);

            // Send the description as the first message
            await sendMessage(threadId, `[${selectedCategory || 'Support'}] ${description}`);

            setSubject('');
            setDescription('');
            setShowContactForm(false);
            toast.success('Support chat started!', { id: toastId });

            // Navigate to the chat
            navigate(`/chat/${threadId}`);
        } catch (error) {
            toast.error('Failed to start support chat', { id: toastId });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            {!selectedCategory && !showContactForm ? (
                <>
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold dark:text-white mb-2">{platformSettings.helpCenterContent?.title?.[language] || 'How can we help you?'}</h2>
                        <p className="text-gray-500">{platformSettings.helpCenterContent?.description?.[language]}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => cat.id === 'Contact Customer Care' ? setShowContactForm(true) : setSelectedCategory(cat.id)}
                                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-rose-200 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <cat.icon className="w-6 h-6 text-rose-500" />
                                </div>
                                <h4 className="font-bold dark:text-white">{cat.label}</h4>
                            </button>
                        ))}
                    </div>

                    {tickets.length > 0 && (
                        <div className="mt-12">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Active Support Tickets</h3>
                            <div className="space-y-4">
                                {tickets.map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 cursor-pointer hover:border-blue-300 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {ticket.status}
                                                    </span>
                                                    {ticket.messages && ticket.messages.length > 0 && (
                                                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            <ChatBubbleLeftRightIcon className="w-3 h-3" /> {ticket.messages.length} replies
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold dark:text-white group-hover:text-blue-600 transition-colors">{ticket.subject}</h4>
                                                <p className="text-xs text-gray-500">{ticket.category} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                                                <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : selectedCategory ? (
                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border dark:border-slate-700">
                    <div className="p-6 border-b dark:border-slate-700 flex items-center gap-4">
                        <button onClick={() => setSelectedCategory(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                            <ChevronLeftIcon className="w-6 h-6 dark:text-white" />
                        </button>
                        <h2 className="text-xl font-bold dark:text-white">{selectedCategory}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {platformSettings.faqs?.filter(f => f.category === selectedCategory).map(faq => (
                            <div key={faq.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/50">
                                <h4 className="font-bold mb-1 dark:text-white">{faq.question[language]}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{faq.answer[language]}</p>
                            </div>
                        )) || <p className="text-center text-gray-500 py-12">No FAQs found for this category.</p>}

                        <div className="pt-6 text-center border-t dark:border-slate-700">
                            <p className="text-sm text-gray-500 mb-4">Still need help?</p>
                            <button onClick={() => { setShowContactForm(true); setSelectedCategory(null); }} className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-600">
                                Contact Us
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border dark:border-slate-700">
                    <div className="p-6 border-b dark:border-slate-700 flex items-center gap-4">
                        <button onClick={() => setShowContactForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                            <ChevronLeftIcon className="w-6 h-6 dark:text-white" />
                        </button>
                        <h2 className="text-xl font-bold dark:text-white">Contact Customer Care</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1 uppercase">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Briefly describe your issue"
                                    className="w-full bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-1 uppercase">How can we help?</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    placeholder="Provide more details about your request..."
                                    className="w-full bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleSubmitTicket}
                                className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                            >
                                Submit Request
                            </button>
                            <div className="flex items-center gap-4 justify-center">
                                <a href={`tel:${platformSettings.supportPhone}`} className="flex items-center gap-2 text-rose-500 font-bold px-4 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                    <PhoneIcon className="w-5 h-5" /> Call Support
                                </a>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <a href={`mailto:${platformSettings.supportEmail}`} className="flex items-center gap-2 text-rose-500 font-bold px-4 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20">
                                    <ChatBubbleLeftRightIcon className="w-5 h-5" /> Email Us
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket Chat Modal */}
            {selectedTicket && (
                <SupportTicketModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                />
            )}
        </div>
    );
};

const OrdersTab = () => {
    const { orders, currentUser, products, language, cancelOrder, requestRefund, confirmOrderReceipt, extendReviewPeriod, platformSettings, startChat, vendors } = useApp();
    const navigate = useNavigate();
    const [subTab, setSubTab] = useState<'all' | 'returns' | 'cancellations' | 'reviews'>('all');

    const myOrders = orders.filter(o => o.customerId === currentUser?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Aggregated Reviews from all products
    const myReviews = products.flatMap(p =>
        (p.reviews || []).filter(r => r.customerName === currentUser?.name).map(r => ({ ...r, product: p }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredOrders = myOrders.filter(order => {
        if (subTab === 'returns') return order.refundInfo || ['Refund Requested', 'Refund Approved', 'Refund Rejected', 'Refunded'].includes(order.status);
        if (subTab === 'cancellations') return order.status === 'Cancelled';
        return true;
    });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [refundOrder, setRefundOrder] = useState<Order | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

    const handleTrackOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsTrackerOpen(true);
    };

    const handleCancelOrder = (order: Order) => {
        setOrderToCancel(order);
        setIsCancelModalOpen(true);
    };

    const confirmCancellation = () => {
        if (orderToCancel && cancelReason.trim()) {
            cancelOrder(orderToCancel.id, 'customer', cancelReason);
            setIsCancelModalOpen(false);
            setOrderToCancel(null);
            setCancelReason('');
        } else if (orderToCancel) {
            toast.error(language === 'en' ? "Please provide a reason for cancellation" : "অর্ডার বাতিলের কারণ প্রদান করুন");
        }
    };

    const submitRefundRequest = () => {
        if (refundOrder && refundReason) {
            requestRefund(refundOrder.id, refundReason);
            setRefundOrder(null);
            setRefundReason('');
        }
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Sub-tabs */}
            <div className="flex bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl w-fit">
                {[
                    { id: 'all', label: language === 'en' ? 'All Orders' : 'সব অর্ডার' },
                    { id: 'returns', label: language === 'en' ? 'Returns' : 'রিটার্ন' },
                    { id: 'cancellations', label: language === 'en' ? 'Cancellations' : 'বাতিল' },
                    { id: 'reviews', label: language === 'en' ? 'My Reviews' : 'আমার রিভিউ' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${subTab === tab.id ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'} `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {subTab === 'reviews' ? (
                <div className="space-y-4">
                    {myReviews.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">You haven't written any reviews yet.</p>
                        </div>
                    ) : (
                        myReviews.map((review, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border dark:border-slate-700 flex gap-4">
                                <img
                                    src={review.product.images[0]}
                                    alt={review.product.name[language]}
                                    className="w-16 h-16 rounded-xl object-cover cursor-pointer"
                                    onClick={() => navigate(getPagePath({ name: 'product', productId: review.product.id }))}
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4
                                            className="font-bold text-gray-800 dark:text-gray-200 cursor-pointer hover:text-rose-500"
                                            onClick={() => navigate(getPagePath({ name: 'product', productId: review.product.id }))}
                                        >
                                            {review.product.name[language]}
                                        </h4>
                                        <div className="flex items-center text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-gray-300'} `} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{review.comment[language]}"</p>
                                    <p className="text-[10px] text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                    <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No orders found in this category.</p>
                </div>
            ) : (
                filteredOrders.map(order => {
                    const firstItem = order.items[0];
                    const firstProduct = products.find(p => p.id === firstItem.productId);
                    const isRide = firstProduct?.productType === 'rental';
                    const isFlight = firstProduct?.productType === 'flight';

                    return (
                        <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6 pb-4 border-b dark:border-slate-700">
                                <div className="flex gap-3 text-sm">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRide ? 'bg-blue-50 text-blue-600' : isFlight ? 'bg-sky-50 text-sky-600' : 'bg-rose-50 text-rose-600'} `}>
                                        {isRide ? <TruckIcon className="w-5 h-5" /> : isFlight ? <PaperAirplaneIcon className="w-5 h-5" /> : <ShoppingBagIcon className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {isRide ? 'Ride Booking' : isFlight ? 'Flight Tickets' : 'Packaged Order'}
                                        </p>
                                        <p className="text-gray-500 text-[10px]">#{order.id.slice(-8).toUpperCase()} • {new Date(order.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 text-[10px] rounded-full font-bold uppercase ${order.status === 'Completed' || order.status === 'Ride Completed' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-blue-100 text-blue-700'
                                        } `}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Order Items List */}
                            <div className="space-y-4 mb-6">
                                {order.items.map((item, idx) => {
                                    const prod = products.find(p => p.id === item.productId);
                                    return (
                                        <div key={idx} className="flex items-center gap-4 group">
                                            <div
                                                className="w-14 h-14 bg-gray-50 dark:bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                                                onClick={() => navigate(getPagePath({ name: 'product', productId: item.productId }))}
                                            >
                                                <img src={item.productImage || prod?.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5
                                                    className="font-bold text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-rose-500"
                                                    onClick={() => navigate(getPagePath({ name: 'product', productId: item.productId }))}
                                                >
                                                    {item.productName[language]}
                                                </h5>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity} x ৳{item.priceAtPurchase}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="font-bold text-gray-800 dark:text-white">৳{item.quantity * item.priceAtPurchase}</p>
                                                {order.status === 'Completed' && (
                                                    <button
                                                        onClick={() => setReviewProduct(prod || null)}
                                                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded"
                                                    >
                                                        {language === 'en' ? 'Review product' : 'রিভিউ দিন'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Delivery Code Display for Handshake */}
                            {order.deliveryCode && ['Out for Delivery', 'picked_up', 'Picked Up'].includes(order.status) && (
                                <div className="mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none animate-pulse">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                                                <ShieldCheckIcon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Order Verification OTP</p>
                                                <p className="text-xs text-white/80">Only share with rider at delivery</p>
                                            </div>
                                        </div>
                                        <div className="bg-white px-4 py-2 rounded-lg text-blue-600 font-mono text-2xl font-black tracking-widest shadow-inner">
                                            {order.deliveryCode}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total Paid</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">৳{order.total}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const threadId = await startChat(order.vendorId, {
                                                type: 'order',
                                                id: order.id,
                                                orderId: order.id,
                                                vendorId: order.vendorId,
                                                contextType: 'order',
                                                contextId: order.id,
                                                prefilledMessage: language === 'en' ? `Hi, regarding Order #${order.id.slice(-6)}` : `হাই, অর্ডার #${order.id.slice(-6)} সম্পর্কে কিছু কথা ছিল`
                                            });
                                            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                        }}
                                        className="px-3 py-2 text-gray-600 text-xs font-bold bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg flex items-center gap-2"
                                    >
                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                        {language === 'en' ? 'Chat' : 'চ্যাট'}
                                    </button>
                                    {!isRide && !isFlight && (
                                        <>
                                            {['Pending', 'Confirmed'].includes(order.status) && (
                                                <button onClick={() => handleCancelOrder(order)} className="px-3 py-2 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                    Cancel
                                                </button>
                                            )}
                                            {order.status === 'Delivered' && (
                                                <button onClick={() => confirmOrderReceipt(order.id)} className="px-3 py-2 text-green-600 text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                                                    Confirm Receipt
                                                </button>
                                            )}
                                            {(() => {
                                                if (order.refundInfo || ['Refund Requested', 'Refund Approved', 'Refund Rejected', 'Refunded'].includes(order.status)) return null;
                                                if (!order.deliveredAt) return null;

                                                const vendor = vendors.find(v => v.id === order.vendorId);
                                                const deliveredAt = new Date(order.deliveredAt).getTime();
                                                const now = Date.now();
                                                const ageHours = (now - deliveredAt) / (1000 * 60 * 60);

                                                // Logic: 24h delay, then 3-day window (or vendor guarantee)
                                                const delayHours = 24;
                                                const guaranteeDays = vendor?.guaranteePeriod || 3;
                                                const windowHours = guaranteeDays * 24;

                                                if (ageHours > delayHours && ageHours < (delayHours + windowHours)) {
                                                    return (
                                                        <button onClick={() => setRefundOrder(order)} className="px-3 py-2 text-orange-500 text-xs font-bold hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg">
                                                            Refund {guaranteeDays > 0 ? `(${guaranteeDays}d)` : ''}
                                                        </button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            {order.status === 'Completed' && (
                                                <div className="flex items-center gap-2 text-green-600 text-[10px] font-bold">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    {language === 'en' ? 'Review each item above' : 'পণ্যগুলোর রিভিউ দিন'}
                                                </div>
                                            )}
                                            {(order.status === 'Completed' || order.status === 'Delivered') && (
                                                <button onClick={() => setInvoiceOrder(order)} className="px-3 py-2 text-violet-600 text-xs font-bold bg-white dark:bg-slate-800 shadow-sm border dark:border-slate-700 rounded-lg flex items-center gap-1">
                                                    <PrinterIcon className="w-3 h-3" /> Invoice
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {(isRide ?
                                        (order.status === 'Ride Requested' || order.status === 'Ride Accepted' || order.status === 'Ride Started' || order.status === 'Payment Processing') :
                                        (order.status === 'Out for Delivery' || order.status === 'Preparing' || order.status === 'Confirmed')
                                    ) && (
                                            <button onClick={() => handleTrackOrder(order)} className="bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-rose-600 shadow-md">
                                                <MapPinIcon className="w-3 h-3" /> Track
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {selectedOrder && isTrackerOpen && (
                <RideTrackerModal order={selectedOrder} onClose={() => setIsTrackerOpen(false)} />
            )}

            {refundOrder && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRefundOrder(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 dark:text-white">Request Refund</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Tell us why you want to return this item. This will create a <strong>Support Ticket</strong> and our team will assist you within 24 hours.
                        </p>
                        <textarea
                            className="w-full p-4 bg-gray-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl mb-6 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            rows={4}
                            placeholder="Reason for refund..."
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setRefundOrder(null)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                            <button onClick={submitRefundRequest} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 dark:shadow-none">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            {isCancelModalOpen && orderToCancel && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsCancelModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-xl mb-4 dark:text-white">Cancel Order</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            We're sorry to see you go. Please tell us why you are cancelling this order.
                        </p>
                        <textarea
                            className="w-full p-4 bg-gray-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl mb-6 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                            rows={4}
                            placeholder="Write your reason here..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsCancelModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                            <button
                                onClick={confirmCancellation}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-none"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reviewProduct && (
                <AddReviewModal
                    product={reviewProduct}
                    onClose={() => setReviewProduct(null)}
                />
            )}

            {invoiceOrder && (
                <InvoiceModal
                    order={invoiceOrder}
                    onClose={() => setInvoiceOrder(null)}
                    language={language as 'en' | 'bn'}
                    platformSettings={platformSettings}
                />
            )}
        </div>
    );
};

// Main Profile Page Component
const UserProfilePage: React.FC = () => {
    const { language, currentUser, logout, products } = useApp();
    const navigate = useNavigate();

    // DEV TOOL: Test Order Generator (Phase A)
    const handleCreateTestOrder = async () => {
        if (!currentUser) {
            toast.error("Please login first");
            return;
        }

        const toastId = toast.loading("Generating Phase A Test Order...");
        try {
            // 1. Find a Retail Product (Not Wholesale, Not Resell, Stock > 0)
            const retailProduct = products.find(p => p.productType !== 'wholesale' && p.productType !== 'resell' && p.stock > 0);

            if (!retailProduct) {
                toast.error("No retail products found to test.", { id: toastId });
                return;
            }

            // 2. Create Order Object
            const testOrder: any = {
                id: `TEST-ORD-${Date.now()}`,
                customerId: currentUser.id,
                vendorId: retailProduct.vendorId,
                items: [{
                    productId: retailProduct.id,
                    productName: retailProduct.name,
                    productImage: retailProduct.images[0],
                    quantity: 1,
                    priceAtPurchase: retailProduct.price,
                    category: retailProduct.category || 'General',
                    productType: 'retail'
                }],
                total: retailProduct.price + 50, // Price + Delivery
                deliveryFee: 50,
                status: 'Confirmed', // Skip 'Pending' to jump straight to assignment flow testing
                payment: 'Cash On Delivery',
                date: new Date().toISOString(),
                address: "Test Address: Sakhipur Bazar Center",
                deliveryAddress: {
                    addressLine: "Test Address: Sakhipur Bazar Center",
                    area: "Sakhipur",
                    recipientName: currentUser.name || "Test User",
                    recipientPhone: currentUser.phone || "01700000000"
                },
                statusHistory: [
                    { status: 'Pending', date: new Date().toISOString() },
                    { status: 'Confirmed', date: new Date().toISOString() }
                ]
            };

            await OrderService.createOrder(testOrder);
            toast.success("Test Order Created! Check Vendor Dashboard.", { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error("Test Order Failed", { id: toastId });
        }
    };
    const [searchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab');

    const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');

    useEffect(() => {
        if (tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    if (!currentUser) {
        return <div className="p-8 text-center text-red-500">Please log in to view your profile.</div>;
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: HomeIcon },
        { id: 'orders', label: 'My Orders', icon: ShoppingBagIcon },
        { id: 'wallet', label: 'Wallet', icon: WalletIcon },
        { id: 'wishlist', label: 'Wishlist', icon: HeartIcon },
        { id: 'reseller', label: 'Reseller', icon: TagIcon },
        { id: 'recent', label: 'Recent', icon: ClockIcon },
        { id: 'address', label: 'Address Book', icon: MapPinIcon },
        { id: 'settings', label: 'Settings', icon: CogIcon },
        { id: 'support', label: 'Support', icon: LifebuoyIcon },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'orders': return <OrdersTab />;
            case 'wallet': return <WalletTab />;
            case 'wishlist': return <WishlistTab />;
            case 'reseller': return <ResellerTab />;
            case 'recent': return <RecentTab />;
            case 'address': return <AddressBookTab />;
            case 'settings': return <SettingsTab />;
            case 'support': return <SupportTab />;
            default: return <OverviewTab />;
        }
    }

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">
            {/* Profile Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20">
                <div className="bg-gradient-to-r from-[#795548] to-rose-400 h-32 relative">
                    <div className="absolute -bottom-8 left-4 flex items-end">
                        <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-gray-200">
                            <img src={currentUser.image} alt={currentUser.name} className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
                <div className="pt-10 px-4 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{currentUser.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
                        </div>
                        <div className="flex gap-2">
                            {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                                <button onClick={() => navigate(getPagePath({ name: 'adminDashboard' }))} className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100" title="Admin Dashboard">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </button>
                            )}
                            {currentUser.shopId && (
                                <button onClick={() => navigate(getPagePath({ name: 'vendorDashboard' }))} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                                    <StoreIcon className="w-5 h-5" />
                                </button>
                            )}
                            {currentUser.driverId && (
                                <button onClick={() => navigate(getPagePath({ name: 'riderDashboard' }))} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                    <TruckIcon className="w-5 h-5" />
                                </button>
                            )}
                            {currentUser.agencyId && (
                                <button onClick={() => navigate(getPagePath({ name: 'agencyDashboard' }))} className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100">
                                    <GlobeAltIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Horizontal Navigation */}
                <div className="px-4 border-t border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-6">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py - 4 text-sm font - medium whitespace - nowrap border-b-2 transition - colors ${activeTab === tab.id
                                    ? 'border-rose-500 text-rose-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                    } `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        <button onClick={logout} className="flex items-center gap-2 py-4 text-sm font-medium text-red-500 hover:text-red-700 whitespace-nowrap">
                            <PowerIcon className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="container mx-auto px-4 py-6">
                {renderTabContent()}
            </div>
        </div>
    );
};

// Reseller Tab
const ResellerTab = () => {
    const { language, currentUser, enableResellerMode, generateReferralCode } = useApp();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    if (!currentUser) return null;

    const handleEnableReseller = () => {
        if (confirm(language === 'en'
            ? 'Enable Reseller Mode? You will earn 5% commission on all referred sales.'
            : 'রিসেলার মোড সক্রিয় করবেন? আপনি সমস্ত রেফার করা বিক্রয়ে ৫% কমিশন অর্জন করবেন।')) {
            enableResellerMode(currentUser.id);
        }
    };

    const referralLink = currentUser.referralCode
        ? `${window.location.origin}?ref = ${currentUser.referralCode} `
        : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {!currentUser.isReseller ? (
                // Not a reseller yet - Show activation card
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <TagIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            {language === 'en' ? 'Become a Reseller' : 'রিসেলার হন'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                            {language === 'en'
                                ? 'Start earning 5% commission on every sale made through your unique referral link. Share products with friends and earn money effortlessly!'
                                : 'আপনার অনন্য রেফারেল লিংকের মাধ্যমে প্রতিটি বিক্রয়ে ৫% কমিশন অর্জন করা শুরু করুন। বন্ধুদের সাথে পণ্য শেয়ার করুন এবং সহজেই অর্থ উপার্জন করুন!'}
                        </p>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">
                                {language === 'en' ? 'How It Works:' : 'এটি কীভাবে কাজ করে:'}
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4 text-left">
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 dark:text-purple-300 font-bold">1</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                                            {language === 'en' ? 'Get Your Link' : 'আপনার লিংক পান'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {language === 'en' ? 'Activate reseller mode' : 'রিসেলার মোড সক্রিয় করুন'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 dark:text-purple-300 font-bold">2</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                                            {language === 'en' ? 'Share Products' : 'পণ্য শেয়ার করুন'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {language === 'en' ? 'Share with friends' : 'বন্ধুদের সাথে শেয়ার করুন'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 dark:text-purple-300 font-bold">3</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                                            {language === 'en' ? 'Earn Commission' : 'কমিশন অর্জন করুন'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {language === 'en' ? 'Get 5% on each sale' : 'প্রতিটি বিক্রয়ে ৫% পান'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleEnableReseller}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            {language === 'en' ? 'Enable Reseller Mode' : 'রিসেলার মোড সক্রিয় করুন'}
                        </button>
                    </div>
                </div>
            ) : (
                // Already a reseller - Show dashboard overview
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                    {language === 'en' ? 'Reseller Dashboard' : 'রিসেলার ড্যাশবোর্ড'}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {language === 'en' ? 'Manage your referrals and earnings' : 'আপনার রেফারেল এবং আয় পরিচালনা করুন'}
                                </p>
                            </div>
                            <button
                                onClick={() => navigate(getPagePath({ name: 'resellerDashboard' }))}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all"
                            >
                                {language === 'en' ? 'Full Dashboard' : 'সম্পূর্ণ ড্যাশবোর্ড'}
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <CurrencyDollarIcon className="w-10 h-10 text-green-600" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {language === 'en' ? 'Total Earnings' : 'মোট আয়'}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                            ৳{(currentUser.resellerEarnings || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-3">
                                    <TagIcon className="w-10 h-10 text-purple-600" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {language === 'en' ? 'Referral Code' : 'রেফারেল কোড'}
                                        </p>
                                        <p className="text-lg font-mono font-bold text-gray-800 dark:text-white">
                                            {currentUser.referralCode}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referral Link */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                            <h3 className="font-bold mb-3 flex items-center gap-2">
                                <LinkIcon className="w-5 h-5" />
                                {language === 'en' ? 'Your Referral Link' : 'আপনার রেফারেল লিংক'}
                            </h3>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    value={referralLink}
                                    readOnly
                                    className="flex-1 bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-white font-mono text-sm"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="bg-white text-purple-600 hover:bg-gray-100 font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                    {copied
                                        ? (language === 'en' ? 'Copied!' : 'কপি হয়েছে!')
                                        : (language === 'en' ? 'Copy Link' : 'লিংক কপি করুন')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
                            {language === 'en' ? '💡 Pro Tips' : '💡 প্রো টিপস'}
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <li>• {language === 'en' ? 'Share your link on social media for maximum reach' : 'সর্বাধিক পৌঁছানোর জন্য সোশ্যাল মিডিয়ায় আপনার লিংক শেয়ার করুন'}</li>
                            <li>• {language === 'en' ? 'Promote products you genuinely recommend' : 'আপনি যে পণ্যগুলি সত্যিই সুপারিশ করেন সেগুলি প্রচার করুন'}</li>
                            <li>• {language === 'en' ? 'Track your earnings in the full Reseller Dashboard' : 'সম্পূর্ণ রিসেলার ড্যাশবোর্ডে আপনার আয় ট্র্যাক করুন'}</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

const OverviewTab = () => {
    const { currentUser, orders, wishlist, products } = useApp();
    const navigate = useNavigate();

    // DEV TOOL: Test Order Generator (Phase A)
    const handleCreateTestOrder = async () => {
        if (!currentUser) {
            toast.error("Please login first");
            return;
        }

        const toastId = toast.loading("Generating Phase A Test Order...");
        try {
            // 1. Find a Retail Product (Not Wholesale, Not Resell, Stock > 0)
            const retailProduct = products.find(p => p.productType !== 'wholesale' && p.productType !== 'resell' && p.stock > 0);

            if (!retailProduct) {
                toast.error("No retail products found to test.", { id: toastId });
                return;
            }

            // 2. Create Order Object
            const testOrder: any = {
                id: `TEST-ORD-${Date.now()}`,
                customerId: currentUser.id,
                vendorId: retailProduct.vendorId,
                items: [{
                    productId: retailProduct.id,
                    productName: retailProduct.name,
                    productImage: retailProduct.images[0],
                    quantity: 1,
                    priceAtPurchase: retailProduct.price,
                    category: retailProduct.category || 'General',
                    productType: 'retail'
                }],
                total: retailProduct.price + 50, // Price + Delivery
                deliveryFee: 50,
                status: 'Confirmed', // Skip 'Pending' to jump straight to assignment flow testing
                payment: 'Cash On Delivery',
                date: new Date().toISOString(),
                address: "Test Address: Sakhipur Bazar Center",
                deliveryAddress: {
                    addressLine: "Test Address: Sakhipur Bazar Center",
                    area: "Sakhipur",
                    recipientName: currentUser.name || "Test User",
                    recipientPhone: currentUser.phone || "01700000000"
                },
                statusHistory: [
                    { status: 'Pending', date: new Date().toISOString() },
                    { status: 'Confirmed', date: new Date().toISOString() }
                ]
            };

            await OrderService.createOrder(testOrder);
            toast.success("Test Order Created! Check Vendor Dashboard.", { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error("Test Order Failed", { id: toastId });
        }
    };
    const [showDashboards, setShowDashboards] = useState(true);

    const menuItems = [
        {
            id: 'admin',
            title: 'Admin Dashboard',
            subtitle: 'Platform Administration',
            icon: ShieldCheckIcon,
            color: 'purple',
            action: () => navigate(getPagePath({ name: 'adminDashboard' })),
            active: currentUser.role === 'admin' || currentUser.role === 'super_admin',
            hidden: !(currentUser.role === 'admin' || currentUser.role === 'super_admin')
        },
        {
            id: 'vendor',
            title: currentUser?.shopId ? 'Seller Dashboard' : 'Become a Vendor',
            subtitle: currentUser?.shopId ? 'Manage your shop' : 'Open your own shop',
            icon: StoreIcon,
            color: 'rose',
            action: () => navigate(getPagePath({ name: currentUser?.shopId ? 'vendorDashboard' : 'vendorRegister' })),
            active: !!currentUser?.shopId,
            hidden: false
        },
        {
            id: 'rider',
            title: currentUser?.driverId ? 'Rider Dashboard' : 'Become a Rider',
            subtitle: currentUser?.driverId ? 'Manage Rent-a-Car & Rides' : 'Earn by driving car/cng',
            icon: TruckIcon,
            color: 'blue',
            action: () => navigate(getPagePath({ name: currentUser?.driverId ? 'riderDashboard' : 'riderRegister' })),
            active: !!currentUser?.driverId,
            hidden: false
        },
        {
            id: 'delivery',
            title: currentUser?.deliveryManId ? 'Delivery Dashboard' : 'Become a Delivery Man',
            subtitle: currentUser?.deliveryManId ? 'Manage Deliveries' : 'Earn by delivering products',
            icon: TruckIcon,
            color: 'green',
            action: () => navigate(getPagePath({ name: currentUser?.deliveryManId ? 'deliveryManDashboard' : 'deliveryManRegister' })),
            active: !!currentUser?.deliveryManId,
            hidden: false
        },
        {
            id: 'agency',
            title: currentUser?.agencyId ? 'Agency Dashboard' : 'Become an Agent',
            subtitle: currentUser?.agencyId ? 'Manage flight bookings' : 'Start travel agency',
            icon: GlobeAltIcon,
            color: 'sky',
            action: () => navigate(getPagePath({ name: currentUser?.agencyId ? 'agencyDashboard' : 'agencyRegister' })),
            active: !!currentUser?.agencyId,
            hidden: false
        },
        {
            id: 'reseller',
            title: currentUser?.isReseller ? 'Reseller Dashboard' : 'Become a Reseller',
            subtitle: currentUser?.isReseller ? 'Check earnings' : 'Earn commissions',
            icon: TagIcon,
            color: 'purple',
            action: () => navigate(getPagePath({ name: 'resell' })),
            active: !!currentUser?.isReseller,
            hidden: false
        }
    ];

    return (
        <div className="space-y-6">

            {/* DEV TOOLS HEADER (Phase A) */}
            {import.meta.env.DEV && (
                <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-xl p-4 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-500 p-2 rounded-lg text-white">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-black text-yellow-600 dark:text-yellow-400">Phase A Testing</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Generate a real order to test delivery flow.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateTestOrder}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-transform active:scale-95"
                    >
                        + Create Retail Order
                    </button>
                </div>
            )}

            {/* Wallet Card */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                <div className="relative z-10">
                    <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mb-1">Wallet Balance</p>
                    <h2 className="text-4xl font-black">৳{currentUser?.walletBalance.toLocaleString()}</h2>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{orders.filter(o => o.customerId === currentUser?.id).length}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Total Orders</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 backdrop-blur-sm">
                    <p className="text-3xl font-black text-gray-800 dark:text-white">{wishlist.length}</p>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Wishlist</p>
                </div>
            </div>

            {/* Professional Dashboards */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">Professional Dashboards</h3>
                        <p className="text-xs text-gray-500">Manage your business & earnings</p>
                    </div>
                    {/* Toggle Switch */}
                    <button
                        onClick={() => setShowDashboards(!showDashboards)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${showDashboards ? 'bg-violet-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${showDashboards ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>

                {showDashboards && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[100px]">
                        {menuItems.filter(item => !item.hidden).length === 0 && (
                            <p className="text-gray-500 text-center col-span-2 py-4">No dashboards available.</p>
                        )}
                        {menuItems.filter(item => !item.hidden).map(item => {
                            const getStyles = () => {
                                switch (item.color) {
                                    case 'purple': return {
                                        activeContainer: 'bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800',
                                        activeIcon: 'bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-none',
                                        inactiveIconHover: 'group-hover:bg-purple-50 group-hover:text-purple-600',
                                        activeText: 'text-purple-700 dark:text-purple-300',
                                        activeLabel: 'bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    };
                                    case 'rose': return {
                                        activeContainer: 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800',
                                        activeIcon: 'bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none',
                                        inactiveIconHover: 'group-hover:bg-rose-50 group-hover:text-rose-600',
                                        activeText: 'text-rose-700 dark:text-rose-300',
                                        activeLabel: 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                                    };
                                    case 'blue': return {
                                        activeContainer: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800',
                                        activeIcon: 'bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-none',
                                        inactiveIconHover: 'group-hover:bg-blue-50 group-hover:text-blue-600',
                                        activeText: 'text-blue-700 dark:text-blue-300',
                                        activeLabel: 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    };
                                    case 'green': return {
                                        activeContainer: 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
                                        activeIcon: 'bg-green-500 text-white shadow-lg shadow-green-200 dark:shadow-none',
                                        inactiveIconHover: 'group-hover:bg-green-50 group-hover:text-green-600',
                                        activeText: 'text-green-700 dark:text-green-300',
                                        activeLabel: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    };
                                    case 'sky': return {
                                        activeContainer: 'bg-sky-50 border-sky-100 dark:bg-sky-900/20 dark:border-sky-800',
                                        activeIcon: 'bg-sky-500 text-white shadow-lg shadow-sky-200 dark:shadow-none',
                                        inactiveIconHover: 'group-hover:bg-sky-50 group-hover:text-sky-600',
                                        activeText: 'text-sky-700 dark:text-sky-300',
                                        activeLabel: 'bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200'
                                    };
                                    default: return {
                                        activeContainer: 'bg-gray-50 border-gray-100 dark:bg-gray-800',
                                        activeIcon: 'bg-gray-500 text-white',
                                        inactiveIconHover: '',
                                        activeText: 'text-gray-700 dark:text-gray-300',
                                        activeLabel: 'bg-gray-200 text-gray-800'
                                    };
                                }
                            };

                            const styles = getStyles();

                            return (
                                <div
                                    key={item.id}
                                    onClick={item.action}
                                    className={`group p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${item.active
                                        ? styles.activeContainer
                                        : 'border-transparent bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex items-start gap-4 sticky z-10">
                                        <div className={`p-3 rounded-lg transition-colors ${item.active
                                            ? styles.activeIcon
                                            : `bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400 ${styles.inactiveIconHover}`
                                            }`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold ${item.active
                                                ? styles.activeText
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {item.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 leading-relaxed">{item.subtitle}</p>
                                        </div>
                                        {item.active && <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${styles.activeLabel}`}>Active</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Access Links (Fallback) */}
            <div className="flex flex-wrap gap-3">
                {menuItems.filter(item => !item.hidden).map(item => (
                    <button
                        key={item.id + '_quick'}
                        onClick={item.action}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        <item.icon className={`w-4 h-4 ${item.active ? 'text-green-500' : 'text-gray-400'}`} />
                        {item.title}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default UserProfilePage;
