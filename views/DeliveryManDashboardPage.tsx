
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { ImageService } from '../src/services/imageService';
import { Order, Product, OrderStatus, Address } from '../types';
import { CheckCircleIcon, XIcon, TruckIcon, UserIcon, MapPinIcon, CreditCardIcon, StarIcon, TrendingUpIcon, PhoneIcon, ChatBubbleLeftRightIcon, ArrowUpOnSquareIcon } from '../components/icons';
import WithdrawalModal from '../src/components/WithdrawalModal';
import RevenueChart from '../components/analytics/RevenueChart';
import PromotionsTab from './PromotionsTab';
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '../src/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DeliveryService } from '../src/services/deliveryService';
import { DriverService } from '../src/services/DriverService';
import { OrderService } from '../src/services/orderService';
import { LoggerService } from '../src/services/loggerService';
import { Invitation } from '../types';
import toast from 'react-hot-toast';
import InboxPage from './InboxPage';

const DeliveryManDashboardPage = () => {
    const { language, currentUser, orders, vendors, users, updateVendor, updateOrderStatus, startChat, platformSettings, requestVendorPayout } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'requests' | 'active' | 'history' | 'wallet' | 'promotions' | 'messages'>('requests');
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [podFiles, setPodFiles] = useState<{ [key: string]: File | null }>({});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingProfile, setUploadingProfile] = useState(false);

    // Handshake & Rejection State
    const [pickupCodes, setPickupCodes] = useState<{ [key: string]: string }>({});
    const [deliveryCodes, setDeliveryCodes] = useState<{ [key: string]: string }>({});
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [rejectionOrder, setRejectionOrder] = useState<Order | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const deliveryMan = vendors.find(v => v.id === currentUser?.deliveryManId);

    // Name Edit State
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [newNameEn, setNewNameEn] = useState(deliveryMan?.name?.en || '');
    const [newNameBn, setNewNameBn] = useState(deliveryMan?.name?.bn || '');

    const handleNameUpdate = async () => {
        if (!deliveryMan || !newNameEn.trim()) return;
        try {
            await updateVendor(deliveryMan.id, {
                name: {
                    en: newNameEn.trim(),
                    bn: newNameBn.trim() || newNameEn.trim()
                }
            });
            toast.success(language === 'en' ? 'Name updated!' : 'নাম আপডেট করা হয়েছে!');
            setIsEditNameOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update name');
        }
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !deliveryMan) return;

        setUploadingProfile(true);
        const toastId = toast.loading("Updating profile picture...");

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `delivery_profiles/${deliveryMan.id}_${Date.now()}`
            );

            await updateVendor(deliveryMan.id, { logo: downloadUrl });
            toast.success("Profile picture updated!", { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image.", { id: toastId });
        } finally {
            setUploadingProfile(false);
        }
    };

    // Real-time synchronization for Delivery Man
    const myDeliveries = useMemo(() => {
        if (!currentUser?.deliveryManId) return [];
        return orders.filter(o =>
            // 1. Assigned to me (Active/History)
            o.assignedDeliveryManId === currentUser.deliveryManId ||
            // 2. Broadcast request to me AND not yet assigned to anyone (New Requests)
            (!o.assignedDeliveryManId && o.deliveryRequests?.some(r => r.deliveryManId === currentUser.deliveryManId && r.status === 'pending'))
        );
    }, [orders, currentUser?.deliveryManId]);

    // INVITATIONS LOGIC
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    React.useEffect(() => {
        if (!currentUser?.deliveryManId) return;
        const q = query(
            collection(db, 'invitations'),
            where('toDeliveryManId', '==', currentUser.deliveryManId),
            where('status', '==', 'pending')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
        });
        return () => unsubscribe();
    }, [currentUser?.deliveryManId]);

    const handleAcceptInvite = async (invite: Invitation) => {
        if (!currentUser?.deliveryManId) return;
        try {
            // 1. Update my profile to link to vendor
            await updateDoc(doc(db, 'vendors', currentUser.deliveryManId), {
                vendorId: invite.fromVendorId
            });
            // 2. Update invitation status
            await updateDoc(doc(db, 'invitations', invite.id), { status: 'accepted' });
            toast.success(`Joined ${invite.fromVendorName.en}'s team!`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to accept invitation");
        }
    };

    const handleRejectInvite = async (inviteId: string) => {
        try {
            await updateDoc(doc(db, 'invitations', inviteId), { status: 'rejected' });
            toast.success("Invitation rejected");
        } catch (error) {
            toast.error("Failed to reject");
        }
    };

    // LOCATION TRACKING LOGIC
    // We isolate the specific online status to prevent re-running on every vendor update
    const myOnlineStatus = vendors.find(v => v.id === currentUser?.deliveryManId)?.onlineStatus;

    React.useEffect(() => {
        const deliveryManId = currentUser?.deliveryManId;

        if (!deliveryManId || myOnlineStatus !== 'Online') return;

        LoggerService.debug("Starting GPS Tracking...");

        let lastUpdateTime = 0;
        const UPDATE_INTERVAL = 30 * 1000; // 30 seconds

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const now = Date.now();
                if (now - lastUpdateTime > UPDATE_INTERVAL) {
                    const { latitude, longitude } = position.coords;
                    LoggerService.debug(`Updating Location: ${latitude}, ${longitude}`);

                    try {
                        await DriverService.updateDeliveryManLocation(deliveryManId, latitude, longitude);
                        lastUpdateTime = now;
                    } catch (err) {
                        LoggerService.error("Failed to update location", err);
                    }
                }
            },
            (error) => {
                LoggerService.error("Geolocation Error", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        return () => {
            LoggerService.debug("Stopping GPS Tracking...");
            navigator.geolocation.clearWatch(watchId);
        };
    }, [currentUser?.deliveryManId, myOnlineStatus]);

    const displayOrders = useMemo(() => {
        return myDeliveries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [myDeliveries]);

    if (!currentUser || !currentUser.deliveryManId) {
        return (
            <div className="p-12 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block mb-4 font-bold">Access Denied</div>
                <p>You are not a registered Delivery Man.</p>
                <button onClick={() => navigate('/delivery/register')} className="mt-4 text-blue-500 underline">Register Here</button>
            </div>
        );
    }



    if (!deliveryMan) {
        return <div className="p-12 text-center text-red-500">Delivery Man Profile Not Found.</div>;
    }

    // Pending Requests (assigned but not accepted yet by me)
    // Note: In some flows, admin assigns and it's auto-accepted, or I see a pool. 
    // Based on previous logic: deliveryRequest.status === 'pending' AND assignedDeliveryManId === me
    // Pending Requests Logic (Broadcast & Direct)
    const deliveryRequests = displayOrders.filter(o => {
        // Broadcast requests: specific entry for me is pending AND order is not assigned
        const myRequest = o.deliveryRequests?.find(r => r.deliveryManId === deliveryMan.id);
        if (myRequest && myRequest.status === 'pending' && !o.assignedDeliveryManId) return true;

        // Legacy/Direct requests
        if (o.assignedDeliveryManId === deliveryMan.id && o.deliveryRequest?.status === 'pending') return true;

        return false;
    });

    // Active Deliveries (Accepted)
    const activeDeliveries = displayOrders.filter(o => {
        const isAssignedToMe = o.assignedDeliveryManId === deliveryMan.id;
        const isAcceptedLegacy = o.deliveryRequest?.status === 'accepted';
        const isAcceptedInArray = o.deliveryRequests?.some(r => r.deliveryManId === deliveryMan.id && r.status === 'accepted');

        return isAssignedToMe &&
            (isAcceptedLegacy || isAcceptedInArray) &&
            ['Confirmed', 'Preparing', 'Out for Delivery', 'Ready for Pickup', 'Picked Up', 'In Transit'].includes(o.status);
    });

    const history = displayOrders.filter(o =>
        o.assignedDeliveryManId === deliveryMan.id &&
        (o.status === 'Delivered' || o.status === 'Cancelled' || o.status === 'Returned')
    );

    // Helper to update status with history

    const handlePickup = async (orderId: string, correctCode: string) => {
        const inputCode = pickupCodes[orderId];

        // Normalize both codes to strings and trim whitespace for robust comparison
        const normalizedInput = String(inputCode || '').replace(/\D/g, '');
        const normalizedCorrect = String(correctCode || '').replace(/\D/g, '');

        if (normalizedInput !== normalizedCorrect) {
            // Pickup Validation Failed
            toast.error("Incorrect Pickup Code! Please ask the Vendor for the 4-digit code.");
            return;
        }

        try {
            // Find the delivery document for this order
            const deliveriesSnap = await getDocs(query(collection(db, 'deliveries'), where('orderId', '==', orderId)));

            if (deliveriesSnap.empty) {
                // FALLBACK: If no delivery record exists, just update order status
                await updateOrderStatus(orderId, 'Out for Delivery');
            } else {
                const deliveryId = deliveriesSnap.docs[0].id;
                await DeliveryService.updateStatus(deliveryId, 'picked_up');
                // Also ensure order status is updated
                await updateOrderStatus(orderId, 'Out for Delivery');
            }

            toast.success("Pickup verified! Status updated to 'Out for Delivery'.");

            setPickupCodes(prev => {
                const next = { ...prev };
                delete next[orderId];
                return next;
            });
        } catch (error) {
            console.error("Pickup Error:", error);
            toast.error("Failed to verify pickup. Please try again.");
        }
    };

    const handleDelivery = async (orderId: string, correctCode: string) => {
        const inputCode = deliveryCodes[orderId];
        // Only require code if it exists on the order (backward compatibility)
        const normalizedInput = String(inputCode || '').replace(/\D/g, '');
        const normalizedCorrect = String(correctCode || '').replace(/\D/g, '');

        // Only require code if it exists on the order (backward compatibility)
        if (normalizedCorrect && normalizedInput !== normalizedCorrect) {
            toast.error("Incorrect Delivery Code! Ask Customer.");
            return;
        }

        let podUrl = "";
        const podFile = podFiles[orderId];
        if (podFile) {
            setIsUploading(true);
            try {
                const storageRef = ref(storage, `pod/${orderId}_${Date.now()}.jpg`);
                await uploadBytes(storageRef, podFile);
                podUrl = await getDownloadURL(storageRef);
            } catch (error) {
                console.error("Error uploading POD:", error);
                toast.error(language === 'en' ? "Failed to upload photo. Delivering without photo." : "ছবি আপলোড করতে ব্যর্থ হয়েছে। ছবি ছাড়াই ডেলিভারি করা হচ্ছে।");
            }
            setIsUploading(false);
        }

        if (confirm(language === 'en' ? "Confirm successful delivery?" : "ডেলিভারি সফল হয়েছে নিশ্চিত করবেন?")) {
            try {
                // Update Delivery Doc with POD if it exists
                const deliveriesSnap = await getDocs(query(collection(db, 'deliveries'), where('orderId', '==', orderId)));
                if (!deliveriesSnap.empty) {
                    const deliveryId = deliveriesSnap.docs[0].id;
                    await DeliveryService.updateStatus(deliveryId, 'delivered', 'Delivered by delivery man', podUrl);
                }

                // CRITICAL: Always call updateOrderStatus to trigger revenue distribution and notifications
                await updateOrderStatus(orderId, 'Delivered', podUrl);

                setPodFiles(prev => {
                    const next = { ...prev };
                    delete next[orderId];
                    return next;
                });
                toast.success(language === 'en' ? "Order Delivered Successfully!" : "অর্ডার সফলভাবে ডেলিভারি করা হয়েছে!");
            } catch (error) {
                console.error("Delivery Error:", error);
                toast.error("Failed to mark as delivered.");
            }
        }
    };

    const handleCustomerReject = async () => {
        if (!rejectionOrder || !rejectionReason) return;

        try {
            await updateOrderStatus(rejectionOrder.id, 'Returned to Vendor'); // Or 'Customer Rejected'
            // Update Delivery Doc
            const deliveriesSnap = await getDocs(query(collection(db, 'deliveries'), where('orderId', '==', rejectionOrder.id)));
            if (!deliveriesSnap.empty) {
                const deliveryId = deliveriesSnap.docs[0].id;
                await DeliveryService.updateStatus(deliveryId, 'cancelled', rejectionReason);
            }

            toast.success("Order marked as Returned.");
            setIsRejectionModalOpen(false);
            setRejectionOrder(null);
            setRejectionReason('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update status.");
        }
    };

    const content = {
        en: {
            title: "Delivery Dashboard",
            online: "Online",
            offline: "Offline",
            requests: "New Requests",
            active: "Active",
            history: "History",
            wallet: "Wallet",
            promotions: "Promotions",
            totalEarnings: "Total Earnings",
            deliveriesCompleted: "Deliveries Completed",
            today: "Today's Earnings",
            withdraw: "Withdraw",
            backProfile: "Back to Profile"
        },
        bn: {
            title: "ডেলিভারি ড্যাশবোর্ড",
            online: "অনলাইন",
            offline: "অফলাইন",
            requests: "নতুন অনুরোধ",
            active: "সক্রিয়",
            history: "ইতিহাস",
            wallet: "ওয়ালেট",
            promotions: "অফার",
            totalEarnings: "মোট আয়",
            deliveriesCompleted: "সম্পন্ন ডেলিভারি",
            today: "আজকের আয়",
            withdraw: "উত্তোলন",
            backProfile: "প্রোফাইলে ফিরে যান",
            enterPickupCode: "সেলার থেকে পিকআপ কোড নিন",
            enterDeliveryCode: "কাস্টমার থেকে ডেলিভারি কোড নিন",
            verifyPickup: "পিকআপ ভেরিফাই করুন",
            completeDelivery: "ডেলিভারি সম্পন্ন করুন",
            proofOfDelivery: "ডেলিভারি প্রমাণ (ছবি নিন)",
            uploading: "আপলোড হচ্ছে...",
            incorrectPickup: "ভুল পিকআপ কোড! সেলার থেকে আইডি জিজ্ঞাসা করুন।",
            incorrectDelivery: "ভুল ডেলিভারি কোড! কাস্টমার থেকে জিজ্ঞাসা করুন।",
            pickupSuccess: "পিকআপ সম্পন্ন! যাত্রা শুরু করুন।",
            deliverySuccess: "অর্ডার সফলভাবে ডেলিভারি করা হয়েছে!"
        }
    };

    const t = (key: keyof (typeof content)['en']) => {
        return (content[language] as any)[key] || (content['en'] as any)[key];
    };

    const completedDeliveries = displayOrders.filter(o =>
        o.assignedDeliveryManId === deliveryMan.id &&
        ['Delivered', 'Cancelled', 'Returned to Vendor', 'Ride Completed'].includes(o.status)
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'requests':
                return (
                    <div className="space-y-4">
                        {/* Invitations Section */}
                        {invitations.length > 0 && (
                            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    {language === 'en' ? 'Team Invitations' : 'দলের আমন্ত্রণ'}
                                </h3>
                                <div className="space-y-3">
                                    {invitations.map(invite => (
                                        <div key={invite.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white">
                                                    {invite.fromVendorName[language]}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {language === 'en' ? 'Invited you to join their fleet.' : 'আপনাকে তাদের দলে যোগ দেওয়ার আমন্ত্রণ জানিয়েছে।'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleAcceptInvite(invite)}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
                                                >
                                                    {language === 'en' ? 'Accept' : 'গ্রহণ করুন'}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectInvite(invite.id)}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-gray-800 dark:text-white rounded-lg font-bold text-sm transition-colors"
                                                >
                                                    {language === 'en' ? 'Reject' : 'প্রত্যাখ্যান'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <h3 className="font-bold text-lg dark:text-white mb-4">New Requests ({deliveryRequests.length})</h3>
                        {deliveryRequests.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No new delivery requests.</p>
                        ) : (
                            deliveryRequests.map(order => (
                                <div key={order.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-yellow-200 dark:border-yellow-900 animation-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                                        FASTEST FINGER FIRST
                                    </div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg dark:text-white">Order #{order.id.slice(-6)}</h4>
                                            <p className="text-xs text-gray-400">{new Date(order.date).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600">৳{order.deliveryFee || 50}</p>
                                            <p className="text-xs text-gray-400">{order.payment}</p>
                                        </div>
                                    </div>

                                    {/* Location Details */}
                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">PICKUP FROM</p>
                                            <p className="font-bold text-sm dark:text-gray-200">{vendors.find(v => v.id === order.vendorId)?.name.en || 'Unknown Vendor'}</p>
                                        </div>
                                        <div className="flex-1 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100 dark:border-slate-600">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">DELIVER TO</p>
                                            <p className="font-bold text-sm dark:text-gray-200">
                                                Customer (Hidden)
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {typeof order.deliveryAddress === 'string'
                                                    ? 'Address hidden until accepted'
                                                    : (order.deliveryAddress as any)?.area || 'Area hidden'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Financials Preview */}
                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl mb-4 border border-green-100 dark:border-green-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Total Order Value:</span>
                                            <span className="font-bold dark:text-white">৳{order.total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-1 border-t border-green-200 dark:border-green-800 pt-1">
                                            <span className="text-green-700 dark:text-green-400 font-bold">Your Earnings (Est.):</span>
                                            <span className="font-bold text-green-700 dark:text-green-400">৳{(order.deliveryFee || 50) * 0.9}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await DeliveryService.acceptDeliveryRequest(order.id, deliveryMan.id);
                                                    toast.success("Job Accepted! Head to pickup.");
                                                    setActiveTab('active');
                                                } catch (e: any) {
                                                    console.error(e);
                                                    if (e.message.includes("assigned")) {
                                                        toast.error("Too late! Another driver accepted it.");
                                                    } else {
                                                        toast.error("Failed to accept job.");
                                                    }
                                                }
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircleIcon className="w-5 h-5" /> Accept Job
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm("Reject this job? It will be removed from your list.")) {
                                                    await DeliveryService.rejectDeliveryRequest(order.id, deliveryMan.id);
                                                    toast.success("Job Rejected.");
                                                }
                                            }}
                                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <XIcon className="w-5 h-5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );
            case 'history':
                return (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg dark:text-white mb-4">Delivery History ({completedDeliveries.length})</h3>
                        {completedDeliveries.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No completed deliveries yet.</p>
                        ) : (
                            completedDeliveries.map(order => (
                                <div key={order.id} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold dark:text-white">#{order.id.slice(-6)}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Date: {new Date(order.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Earning: ৳{(order.deliveryFee || 50) * 0.9}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                );
            case 'active':
                return (
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl mb-4 text-[#2c3e50] dark:text-white">Active Deliveries</h3>
                        {activeDeliveries.length === 0 ? (
                            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl">
                                <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No active deliveries.</p>
                            </div>
                        ) : (
                            activeDeliveries.map(order => (
                                <div key={order.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-[#2c3e50] dark:text-white">Order #{order.id.slice(-6)}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase ${order.status === 'Out for Delivery' ? 'bg-purple-500' :
                                                    (order.status === 'Confirmed' || order.status === 'Preparing') ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`}>
                                                    {(order.status === 'Confirmed' || order.status === 'Preparing') ? 'Ready for Pickup' : order.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{new Date(order.date).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-right flex gap-2 justify-end">
                                                <button onClick={async () => {
                                                    const threadId = await startChat(order.vendorId, { type: 'order', id: order.id, orderId: order.id, vendorId: order.vendorId });
                                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                }} className="text-blue-600 bg-blue-50 p-2 rounded-full">
                                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => window.open(`tel:${vendors.find(v => v.id === order.vendorId)?.payment}`, '_self')} className="text-green-600 bg-green-50 p-2 rounded-full">
                                                    <PhoneIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">PICKUP</p>
                                            <p className="font-bold text-[#2c3e50] dark:text-white truncate">
                                                {vendors.find(v => v.id === order.vendorId)?.name.en || 'Store'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">DROP</p>
                                            <p className="font-bold text-[#2c3e50] dark:text-white truncate">
                                                {typeof order.deliveryAddress === 'object'
                                                    ? order.deliveryAddress.recipientName || users.find(u => u.id === order.customerId)?.name || 'Customer'
                                                    : users.find(u => u.id === order.customerId)?.name || 'Customer'}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                                {typeof order.deliveryAddress === 'object'
                                                    ? `${order.deliveryAddress.addressLine}, ${order.deliveryAddress.area}`
                                                    : (order.deliveryAddress || 'Customer Address')}
                                            </p>
                                            {/* Chat/Call Controls */}
                                            <div className="flex gap-2">
                                                <button onClick={async () => {
                                                    const threadId = await startChat(order.customerId, { type: 'order', id: order.id, orderId: order.id });
                                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                }} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                                                    <ChatBubbleLeftRightIcon className="w-3 h-3" /> Chat
                                                </button>
                                                <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                                    <PhoneIcon className="w-3 h-3" /> Call
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {!['Out for Delivery', 'Picked Up', 'In Transit'].includes(order.status) ? (
                                            <div className="flex-1 space-y-3">
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 uppercase flex items-center gap-1">
                                                        <TruckIcon className="w-3.5 h-3.5" />
                                                        {language === 'en' ? 'Step 1: Verify Pickup from Vendor' : 'ধাপ ১: বিক্রেতার কাছ থেকে পিকআপ ভেরিফাই করুন'}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            maxLength={4}
                                                            placeholder="0000"
                                                            className="flex-1 px-3 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-center font-mono text-lg font-bold tracking-[0.5em] focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={pickupCodes[order.id] || ''}
                                                            onChange={(e) => setPickupCodes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                        />
                                                        <button
                                                            onClick={() => handlePickup(order.id, order.pickupCode || '0000')}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                                                        >
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                            {language === 'en' ? 'Verify' : 'নিশ্চিত করুন'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 space-y-4">
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                                    <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-2 uppercase flex items-center gap-1">
                                                        <MapPinIcon className="w-3.5 h-3.5" />
                                                        {language === 'en' ? 'Step 2: Verify Delivery to Customer' : 'ধাপ ২: কাস্টমারের কাছে ডেলিভারি ভেরিফাই করুন'}
                                                    </p>
                                                    <input
                                                        type="text"
                                                        maxLength={4}
                                                        placeholder="0000"
                                                        className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-center font-mono text-xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-green-500 outline-none"
                                                        value={deliveryCodes[order.id] || ''}
                                                        onChange={(e) => setDeliveryCodes(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                                        <ArrowUpOnSquareIcon className="w-3 h-3" />
                                                        {language === 'en' ? 'Proof of Delivery (Optional Photo)' : 'ডেলিভারি প্রমাণ (ঐচ্ছিক ছবি)'}
                                                    </label>
                                                    <div className="relative group">
                                                        <input
                                                            type="file"
                                                            id={`pod-${order.id}`}
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={(e) => setPodFiles(prev => ({ ...prev, [order.id]: e.target.files?.[0] || null }))}
                                                            className="hidden"
                                                        />
                                                        <label
                                                            htmlFor={`pod-${order.id}`}
                                                            className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${podFiles[order.id] ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-blue-400'}`}
                                                        >
                                                            {podFiles[order.id] ? (
                                                                <>
                                                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                                                    <span className="text-sm font-bold text-green-700 dark:text-green-300 truncate max-w-[200px]">{podFiles[order.id]?.name}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ArrowUpOnSquareIcon className="w-5 h-5 text-gray-400" />
                                                                    <span className="text-sm text-gray-500">{language === 'en' ? 'Take Photo' : 'ছবি তুলুন'}</span>
                                                                </>
                                                            )}
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {!['Out for Delivery', 'Picked Up', 'In Transit'].includes(order.status) && (
                                                        <button
                                                            onClick={() => { setRejectionOrder(order); setIsRejectionModalOpen(true); }}
                                                            className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-600 hover:bg-red-100 py-3 rounded-xl font-bold text-sm transition-all border border-red-100 dark:border-red-900/30"
                                                        >
                                                            {language === 'en' ? 'Rejected' : 'প্রত্যাখ্যাত'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelivery(order.id, order.deliveryCode)}
                                                        disabled={isUploading}
                                                        className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-400"
                                                    >
                                                        {isUploading ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>{language === 'en' ? 'Finishing...' : 'শেষ হচ্ছে...'}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <CheckCircleIcon className="w-5 h-5" />
                                                                {language === 'en' ? 'Complete Delivery' : 'ডেলিভারি সম্পন্ন করুন'}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'wallet':
                // Calculate logic
                const commissionRate = platformSettings.features?.deliveryCommissionRate || 10;
                const totalDeliveryEarnings = history.reduce((sum, order) => {
                    const fee = order.deliveryFee || 50;
                    return sum + (fee * (1 - (commissionRate / 100)));
                }, 0);

                return (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
                            <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider mb-2">
                                {language === 'en' ? 'Current Wallet Balance' : 'বর্তমান ওয়ালেট ব্যালেন্স'}
                            </p>
                            <h2 className="text-4xl font-extrabold mb-1">৳{(deliveryMan.walletBalance || 0).toLocaleString()}</h2>
                            <p className="text-xs text-emerald-200 mb-4">
                                {language === 'en' ? 'Available for Withdrawal' : 'উত্তোলনের জন্য উপলব্ধ'}
                            </p>

                            <div className="flex gap-6 border-t border-white/20 pt-4">
                                <div>
                                    <p className="text-xs text-emerald-100 uppercase mb-1">
                                        {language === 'en' ? 'Lifetime Earnings (Est.)' : 'আজীবন আয় (আনুমানিক)'}
                                    </p>
                                    <p className="text-lg font-bold">৳{totalDeliveryEarnings.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-100 uppercase mb-1">{content[language].deliveriesCompleted}</p>
                                    <p className="text-lg font-bold">{history.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-green-500" />
                                Analytics
                            </h3>
                            {/* Note: RevenueChart currently uses order total. For Delivery Men, this should ideally show their specific earnings (fee).
                                    Scope: Future Enhancement. Current implementation gives a general activity trend. 
                                 */}
                            <RevenueChart orders={history} period="daily" />
                        </div>

                        <button
                            onClick={() => setIsWithdrawalModalOpen(true)}
                            className="w-full bg-white dark:bg-slate-800 text-gray-800 dark:text-white font-bold py-3 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2"
                        >
                            <CreditCardIcon className="w-5 h-5" /> {deliveryMan.payoutRequested ? 'Withdrawal Requested' : content[language].withdraw}
                        </button>

                        <WithdrawalModal
                            isOpen={isWithdrawalModalOpen}
                            onClose={() => setIsWithdrawalModalOpen(false)}
                            onSubmit={(amount, methodDetails) => requestVendorPayout(deliveryMan.id, amount, methodDetails)}
                            maxAmount={deliveryMan.walletBalance || 0}
                            currentBalance={deliveryMan.walletBalance || 0}
                            language={language}
                        />
                    </div>
                );

            case 'promotions':
                return <PromotionsTab vendorId={deliveryMan.id} />;

            case 'messages':
                return <InboxPage />;

            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">

            {/* Header */}
            <div className="bg-[#2c3e50] text-white pt-6 pb-12 rounded-b-[2rem] shadow-lg relative">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-2xl font-bold">{content[language].title}</h1>
                        <button onClick={() => navigate('/profile')} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                            {content[language].backProfile}
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 overflow-hidden">
                                    {deliveryMan.logo ? (
                                        <img src={deliveryMan.logo} alt={currentUser.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-7 h-7 text-white" />
                                    )}
                                    {uploadingProfile && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 bg-white text-[#2c3e50] p-1 rounded-lg cursor-pointer shadow-lg hover:bg-gray-100 transition-transform hover:scale-110">
                                    <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} disabled={uploadingProfile} />
                                </label>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-lg">{deliveryMan.name ? deliveryMan.name[language] : currentUser.name}</p>
                                    <button
                                        onClick={() => {
                                            setNewNameEn(deliveryMan.name?.en || currentUser.name);
                                            setNewNameBn(deliveryMan.name?.bn || '');
                                            setIsEditNameOpen(true);
                                        }}
                                        className="p-1 px-2 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors flex items-center gap-1"
                                    >
                                        <ArrowUpOnSquareIcon className="w-3 h-3" />
                                        {language === 'en' ? 'Edit' : 'এডিট'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 text-green-300 text-xs font-bold">
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${deliveryMan.onlineStatus === 'Online' ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                                    {deliveryMan.onlineStatus === 'Online' ? content[language].online : content[language].offline}
                                </div>
                            </div>
                        </div>

                        {isEditNameOpen && (
                            <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setIsEditNameOpen(false)}>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-gray-800" onClick={e => e.stopPropagation()}>
                                    <h3 className="font-bold text-lg mb-4 dark:text-white">{language === 'en' ? 'Edit Display Name' : 'নাম পরিবর্তন করুন'}</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Name (English)' : 'নাম (ইংরেজি)'}</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                value={newNameEn}
                                                onChange={e => setNewNameEn(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Name (Bengali)' : 'নাম (বাংলা)'}</label>
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
                                        <button onClick={handleNameUpdate} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold">
                                            {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => DriverService.toggleDriverStatus(deliveryMan.id, deliveryMan.onlineStatus === 'Online' ? 'Offline' : 'Online')}
                            className={`w-full md:w-auto px-6 py-2 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 ${deliveryMan.onlineStatus === 'Online' ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-200'}`}
                        >
                            {deliveryMan.onlineStatus === 'Online' ? 'Go Offline' : 'Go Online'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 -mt-6 relative z-10">
                <div className="flex overflow-x-auto p-1 bg-gray-100 dark:bg-slate-700 rounded-xl mb-6">
                    {(['requests', 'messages', 'active', 'history', 'wallet', 'promotions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-4 py-3 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab
                                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                            {tab === 'requests' && deliveryRequests.length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                    {deliveryRequests.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                {renderTabContent()}
            </div>
            {/* Rejection Modal */}
            {isRejectionModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4 dark:text-white">Reason for Return/Rejection</h3>
                        <textarea
                            className="w-full p-3 border rounded-lg mb-4 dark:bg-slate-700 dark:text-white"
                            rows={3}
                            placeholder="e.g. Wrong Item, Damaged, Customer Unreachable..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsRejectionModalOpen(false)} className="flex-1 py-2 bg-gray-200 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleCustomerReject} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Confirm Return</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryManDashboardPage;
