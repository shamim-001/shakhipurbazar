
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { ImageService } from '../src/services/imageService';
import { Order, Product, OrderStatus } from '../types';
import toast from 'react-hot-toast';
import { CheckCircleIcon, XIcon, TruckIcon, UserIcon, MapPinIcon, CurrencyDollarIcon, PlusIcon, TrashIcon, NavigationIcon, ChatBubbleLeftRightIcon, PhoneIcon, ClockIcon, CreditCardIcon, CalendarIcon, ShieldCheckIcon, StarIcon, TrendingUpIcon, ArrowUpOnSquareIcon, BoltIcon } from '../components/icons';
import WithdrawalModal from '../src/components/WithdrawalModal';
import RevenueChart from '../components/analytics/RevenueChart';
import PromotionsTab from './PromotionsTab';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../src/lib/firebase';
import { DeliveryService } from '../src/services/deliveryService';
import { DriverService } from '../src/services/DriverService';
import { OrderService } from '../src/services/orderService';
import InboxPage from './InboxPage';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
};

const RiderDashboardPage = () => {
    const { language, currentUser, orders, updateOrderStatus, updateVendorOnlineStatus, updateVendorServiceMode, updateVendor, vendors, users, products, addProduct, deleteProduct, startChat, updateDriverLocation, requestRefund, cancelOrder, acceptDeliveryRequest, rejectDeliveryRequest, platformSettings, requestVendorPayout } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dispatch' | 'history' | 'wallet' | 'vehicles' | 'promotions' | 'deliveries' | 'deliveryRequests' | 'messages'>('dispatch');
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [driverLoc, setDriverLoc] = useState<{ lat: number, lng: number } | null>(null);

    const [uploadingProfile, setUploadingProfile] = useState(false);

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !driver) return;

        setUploadingProfile(true);
        const toastId = toast.loading("Updating profile picture...");

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `rider_profiles/${driver.id}_${Date.now()}`
            );

            await updateVendor(driver.id, { logo: downloadUrl });
            toast.success("Profile picture updated!", { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image.", { id: toastId });
        } finally {
            setUploadingProfile(false);
        }
    };

    // Real-time synchronization
    const myRides = useMemo(() => {
        if (!currentUser?.driverId) return [];
        return orders.filter(o => o.vendorId === currentUser.driverId);
    }, [orders, currentUser?.driverId]);

    const rideRequests = useMemo(() => {
        return orders.filter(o => o.status === 'Ride Requested');
    }, [orders]);

    // Derived state for display
    // Merge all distinct streams
    const displayOrders = useMemo(() => {
        const combined = [...myRides, ...rideRequests];
        // Remove duplicates if any (e.g. if a ride is also assigned)
        const unique = new Map();
        combined.forEach(o => unique.set(o.id, o));

        return Array.from(unique.values()).sort((a, b) => {
            // Priority 1: Ambulance (Emergency)
            if (a.isEmergency && !b.isEmergency) return -1;
            if (!a.isEmergency && b.isEmergency) return 1;

            // Priority 2: Date
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
    }, [myRides, rideRequests]);






    // REAL-TIME GPS TRACKING
    React.useEffect(() => {
        if (!currentUser?.driverId) return;

        // Only track if online
        const myDriverProfile = vendors.find(v => v.id === currentUser.driverId);
        if (myDriverProfile?.onlineStatus !== 'Online') return;

        const UPDATE_INTERVAL = 10000; // 10 seconds
        let lastUpdate = 0;

        const watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setDriverLoc({ lat: latitude, lng: longitude });
                const now = Date.now();
                if (now - lastUpdate > UPDATE_INTERVAL) {
                    // Update Vendor Profile Location (Global Availability)
                    await DriverService.updateDeliveryManLocation(currentUser.driverId!, latitude, longitude);
                    lastUpdate = now;
                }
            },
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [currentUser?.driverId, vendors, displayOrders]);

    if (!currentUser || !currentUser.driverId) {
        return <div className="p-8 text-center text-red-500">Access Denied. You are not a registered rider.</div>;
    }

    const driver = vendors.find(v => v.id === currentUser.driverId);

    if (!driver) {
        return <div className="p-8 text-center text-red-500">Driver Profile Not Found. Data consistency error.</div>;
    }

    // Determine active requests vs history
    // Determine active requests vs history (Using displayOrders)
    const allRequests = (rideRequests.length > 0 ? rideRequests : displayOrders).filter(o => o.status === 'Ride Requested' && o.items[0]?.rentalDetails);

    const myActiveRides = displayOrders.filter(o =>
        o.vendorId === driver.id &&
        ['Ride Accepted', 'Ride Started', 'Payment Processing'].includes(o.status)
    );

    // Combine for the 'Requests' tab logic
    const rideRequestsList = useMemo(() => {
        const list = [...allRequests, ...myActiveRides];

        if (!driverLoc) return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return list.sort((a, b) => {
            // Emergency first
            if (a.isEmergency && !b.isEmergency) return -1;
            if (!a.isEmergency && b.isEmergency) return 1;

            const distA = a.items[0]?.rentalDetails?.pickupLat ? calculateDistance(driverLoc.lat, driverLoc.lng, a.items[0].rentalDetails.pickupLat, a.items[0].rentalDetails.pickupLng) : 999;
            const distB = b.items[0]?.rentalDetails?.pickupLat ? calculateDistance(driverLoc.lat, driverLoc.lng, b.items[0].rentalDetails.pickupLat, b.items[0].rentalDetails.pickupLng) : 999;

            return distA - distB;
        });
    }, [allRequests, myActiveRides, driverLoc]);

    // Only use rideRequestsList for the 'rideRequests' filtered view:
    // But verify the previous logic: 
    // const rideRequests = orders.filter(o => (o.status === 'Ride Requested' || (o.vendorId === driver.id && ...)))

    const history = displayOrders.filter(o => o.vendorId === driver.id && (o.status === 'Ride Completed' || o.status === 'Cancelled' || o.status === 'Refund Requested')).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const myVehicles = products.filter(p => p.vendorId === driver.id && p.productType === 'rental');



    // Helper to update status with history



    const handleAcceptRide = async (orderId: string) => {
        try {
            const order = (rideRequests.length > 0 ? rideRequests : displayOrders).find(o => o.id === orderId);
            if (!order) return;

            // Set VendorID and update status
            await OrderService.updateOrder(orderId, {
                status: 'Ride Accepted',
                vendorId: driver.id
            });

            // Trigger global logic for notifications and toasts
            await updateOrderStatus(orderId, 'Ride Accepted');

            // Initialize driver location (simulated for now)
            await updateDriverLocation(orderId, 24.3396, 90.1760);

            toast.success(language === 'en' ? "Ride accepted!" : "রাইড গ্রহণ করা হয়েছে!");
        } catch (error) {
            console.error("Error accepting ride:", error);
            toast.error("Failed to accept ride");
        }
    };

    const handleRejectRide = async (orderId: string) => {
        if (confirm(language === 'en' ? "Are you sure you want to decline this request?" : "আপনি কি এই অনুরোধটি প্রত্যাখ্যান করতে চান?")) {
            await updateOrderStatus(orderId, 'Cancelled');
        }
    };

    const handleStartRide = async (orderId: string) => {
        await updateOrderStatus(orderId, 'Ride Started');
    };

    const handleRequestPayment = async (orderId: string) => {
        await updateOrderStatus(orderId, 'Payment Processing');
    };

    const handleChat = async (order: Order) => {
        const threadId = await startChat(order.customerId, {
            type: 'order',
            id: order.id,
            orderId: order.id
        });
        if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
    };

    const handleCancelRide = async (orderId: string) => {
        if (confirm(language === 'en' ? "Are you sure you want to cancel this ride? The customer will be notified." : "আপনি কি এই রাইডটি বাতিল করতে চান? গ্রাহককে জানানো হবে।")) {
            await updateOrderStatus(orderId, 'Cancelled');
            setActiveTab('history');
        }
    };

    const handleReportProblem = async (orderId: string) => {
        const reason = prompt(language === 'en' ? "Please describe the problem:" : "অনুগ্রহ করে সমস্যাটি বর্ণনা করুন:");
        if (reason) {
            await updateOrderStatus(orderId, 'Refund Requested');
            toast.success(language === 'en' ? "Report submitted to admin." : "রিপোর্ট অ্যাডমিনের কাছে পাঠানো হয়েছে।");
            setActiveTab('history');
        }
    };

    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    const handleRequestPayout = () => {
        setIsWithdrawalModalOpen(true);
    };

    const handleWithdrawalSubmit = (amount: number, methodDetails: any) => {
        if (!driver) return;
        requestVendorPayout(driver.id, amount, methodDetails);
    };

    const content = {
        en: {
            title: "Driver Dashboard",
            online: "Online",
            offline: "Offline",
            dispatch: "Dispatch Center",
            requests: "Ride Requests",
            history: "Ride History",
            wallet: "Wallet",
            vehicles: "Vehicles",
            addVehicle: "Add Vehicle",
            noVehicles: "No vehicles added yet.",
            myVehicles: "My Vehicles",
            vehicleName: "Vehicle Name",
            seats: "Seats",
            rate: "Rate",
            actions: "Actions",
            type: "Type",
            license: "License Plate",
            save: "Save Vehicle",
            cancel: "Cancel",
            totalEarnings: "Total Earnings",
            tripsCompleted: "Trips Completed",
            today: "Today's Earnings",
            withdraw: "Withdraw",
            messages: "Messages",
            backProfile: "Back to Profile"
        },
        bn: {
            title: "ড্রাইভার ড্যাশবোর্ড",
            online: "অনলাইন",
            offline: "অফলাইন",
            dispatch: "ডিসপ্যাচ সেন্টার",
            requests: "অনুরোধ",
            history: "ইতিহাস",
            wallet: "ওয়ালেট",
            vehicles: "গাড়ি",
            addVehicle: "গাড়ি যোগ করুন",
            noVehicles: "এখনও কোন গাড়ি যোগ করা হয়নি।",
            myVehicles: "আমার গাড়ি",
            vehicleName: "গাড়ির নাম",
            seats: "আসন",
            rate: "ভাড়া",
            actions: "ক্রিয়াকলাপ",
            type: "ধরন",
            license: "লাইসেন্স প্লেট",
            save: "সংরক্ষণ করুন",
            cancel: "বাতিল",
            totalEarnings: "মোট আয়",
            tripsCompleted: "সম্পন্ন ট্রিপ",
            today: "আজকের আয়",
            withdraw: "উত্তোলন",
            messages: "মেসেজ",
            backProfile: "প্রোফাইলে ফিরে যান"
        }
    };

    const renderContent = () => {
        switch (activeTab) {


            case 'dispatch':
                const activeRequests = rideRequestsList.filter(o => o.status === 'Ride Requested');
                const myJobs = rideRequestsList.filter(o => o.status !== 'Ride Requested');

                return (
                    <div className="space-y-6">
                        {/* Dispatcher Stats Bar */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                                <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600">
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Pending</p>
                                    <p className="text-lg font-black text-gray-800 dark:text-gray-100">{activeRequests.length}</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600">
                                    <BoltIcon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">My Jobs</p>
                                    <p className="text-lg font-black text-gray-800 dark:text-gray-100">{myJobs.length}</p>
                                </div>
                            </div>
                        </div>

                        {rideRequestsList.length === 0 ? (
                            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                                <div className="bg-white dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <NavigationIcon className="w-10 h-10 opacity-30" />
                                </div>
                                <p className="font-semibold text-lg">Dispatcher Idle</p>
                                <p className="text-sm mt-2 opacity-70">Standby for new incoming requests...</p>
                            </div>
                        ) : (
                            rideRequestsList.map(order => {
                                const item = order.items[0];
                                const rental = item.rentalDetails;
                                const isNewRequest = order.status === 'Ride Requested';
                                const isAmbulance = order.isEmergency || rental?.vehicleType === 'Ambulance';

                                return (
                                    <div key={order.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${isAmbulance ? 'border-red-500 animate-pulse-subtle' : 'border-gray-100 dark:border-slate-700'}`}>
                                        {isAmbulance && (
                                            <div className="bg-red-600 text-white text-[10px] font-black py-1 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-2">
                                                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                                Emergency Ambulance Request
                                                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                            </div>
                                        )}
                                        <div className={`px-5 py-3 flex justify-between items-center text-white ${isAmbulance ? 'bg-red-500' : (isNewRequest ? 'bg-amber-500' : (order.status === 'Payment Processing' ? 'bg-indigo-500' : 'bg-[#2c3e50]'))}`}>
                                            <span className="text-xs font-bold uppercase tracking-wider">{isAmbulance ? '🚨 EMERGENCY' : order.status}</span>
                                            <span className="text-xs font-mono">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        <div className="h-32 bg-gray-200 dark:bg-slate-700 relative w-full overflow-hidden">
                                            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/city-map.png')]"></div>
                                            <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-400 dark:bg-gray-500 rounded-full -translate-y-1/2">
                                                <div className="absolute -left-1 -top-1.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                                <div className="absolute -right-1 -top-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                                            </div>
                                            <div className="absolute bottom-2 right-3 bg-white dark:bg-black/60 px-2 py-1 rounded text-[10px] font-black shadow-lg text-sky-600 dark:text-sky-400">
                                                {driverLoc && rental?.pickupLat ? (
                                                    `~${calculateDistance(driverLoc.lat, driverLoc.lng, rental.pickupLat, rental.pickupLng)} km away`
                                                ) : (
                                                    'Distance Hidden'
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5">
                                            {rental && (
                                                <div className="space-y-4 mb-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex flex-col items-center mt-1">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                            <div className="w-0.5 h-8 bg-gray-200 dark:bg-slate-600 my-1"></div>
                                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">PICK UP</p>
                                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{rental.from}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">DROP OFF</p>
                                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{rental.to}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase">CUSTOMER</p>
                                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                                                                    {users.find(u => u.id === order.customerId)?.name || order.customerId || 'Guest'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">EARNING</p>
                                                            <p className="text-xl font-extrabold text-[#2c3e50] dark:text-white">৳{order.total}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {order.status === 'Ride Requested' && (
                                                <div className="flex gap-3">
                                                    <button onClick={() => handleRejectRide(order.id)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                                                        Decline
                                                    </button>
                                                    <button onClick={() => handleAcceptRide(order.id)} className={`flex-[2] py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex justify-center items-center gap-2 ${isAmbulance ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce' : 'bg-[#2c3e50] hover:bg-[#34495e] text-white'}`}>
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                        {isAmbulance ? 'RESPOND NOW' : 'Accept'}
                                                    </button>
                                                </div>
                                            )}

                                            {(order.status === 'Ride Accepted' || order.status === 'Ride Started' || order.status === 'Payment Processing') && (
                                                <div className="space-y-3">
                                                    <div className="flex gap-3 mb-2">
                                                        <button onClick={() => handleChat(order)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                                            <ChatBubbleLeftRightIcon className="w-4 h-4" /> Chat
                                                        </button>
                                                        <a href="tel:+8801700000000" className="flex-1 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                                            <PhoneIcon className="w-4 h-4" /> Call
                                                        </a>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCancelRide(order.id)}
                                                            className="flex-1 text-xs py-2 bg-red-50 dark:bg-red-900/20 text-red-500 font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                                                        >
                                                            Cancel Ride
                                                        </button>
                                                        <button
                                                            onClick={() => handleReportProblem(order.id)}
                                                            className="flex-1 text-xs py-2 bg-gray-100 dark:bg-slate-700 text-gray-500 font-bold rounded-lg hover:bg-gray-200"
                                                        >
                                                            Report Problem
                                                        </button>
                                                    </div>

                                                    {order.status === 'Ride Accepted' && (
                                                        <div className="flex gap-2">
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&origin=${driverLoc?.lat},${driverLoc?.lng}&destination=${rental?.pickupLat},${rental?.pickupLng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 font-bold text-sm flex justify-center items-center gap-2 border border-sky-100 dark:border-sky-800"
                                                            >
                                                                <MapPinIcon className="w-5 h-5" /> Navigate
                                                            </a>
                                                            <button onClick={() => handleStartRide(order.id)} className="flex-[2] py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 shadow-md transition-colors flex justify-center items-center gap-2">
                                                                <NavigationIcon className="w-5 h-5" />
                                                                Start Trip
                                                            </button>
                                                        </div>
                                                    )}
                                                    {order.status === 'Ride Started' && (
                                                        <div className="flex gap-2">
                                                            <a
                                                                href={`https://www.google.com/maps/dir/?api=1&origin=${driverLoc?.lat},${driverLoc?.lng}&destination=${rental?.dropoffLat},${rental?.dropoffLng}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 py-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 font-bold text-sm flex justify-center items-center gap-2 border border-sky-100 dark:border-sky-800"
                                                            >
                                                                <MapPinIcon className="w-5 h-5" /> Guide
                                                            </a>
                                                            <button onClick={() => handleRequestPayment(order.id)} className="flex-[2] py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 shadow-md transition-colors flex justify-center items-center gap-2">
                                                                <CurrencyDollarIcon className="w-5 h-5" />
                                                                Request Pay
                                                            </button>
                                                        </div>
                                                    )}
                                                    {order.status === 'Payment Processing' && (
                                                        <div className="w-full py-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-bold text-sm text-center flex justify-center items-center gap-2 border border-indigo-200 dark:border-indigo-800 animate-pulse">
                                                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                            Payment Pending...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                );

            case 'wallet':
                const totalEarnings = history.reduce((sum, order) => sum + order.total, 0);
                return (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">{content[language].totalEarnings}</p>
                            <h2 className="text-4xl font-extrabold mb-4">৳{totalEarnings.toLocaleString()}</h2>
                            <div className="flex gap-4 border-t border-white/20 pt-4">
                                <div>
                                    <p className="text-xs text-blue-100 uppercase">{content[language].tripsCompleted}</p>
                                    <p className="text-xl font-bold">{history.filter(h => h.status === 'Ride Completed').length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-blue-100 uppercase">{content[language].today}</p>
                                    <p className="text-xl font-bold">৳{history.filter(h => new Date(h.date).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.total, 0)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-green-500" />
                                {language === 'en' ? 'Earnings Trend' : 'আয়ের প্রবণতা'}
                            </h3>
                            <RevenueChart orders={history} period="daily" />
                        </div>

                        <button
                            onClick={handleRequestPayout}
                            disabled={(driver.walletBalance || 0) <= 500 || driver.payoutRequested}
                            className={`w-full font-bold py-3 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-colors ${driver.payoutRequested
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'
                                : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-white hover:bg-gray-50'
                                }`}
                        >
                            <CreditCardIcon className="w-5 h-5" />
                            {driver.payoutRequested ? 'Withdrawal Requested' : content[language].withdraw}
                        </button>

                        <WithdrawalModal
                            isOpen={isWithdrawalModalOpen}
                            onClose={() => setIsWithdrawalModalOpen(false)}
                            onSubmit={handleWithdrawalSubmit}
                            maxAmount={driver.walletBalance || 0}
                            currentBalance={driver.walletBalance || 0}
                            language={language}
                        />
                    </div>
                );

            case 'vehicles':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{content[language].myVehicles}</h2>
                            <button onClick={() => setIsAddingVehicle(true)} className="bg-[#2c3e50] text-white p-2 rounded-full shadow-lg"><PlusIcon className="w-5 h-5" /></button>
                        </div>

                        {isAddingVehicle && (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 mb-4 animate-fade-in">
                                <h3 className="font-bold mb-4 text-gray-800 dark:text-gray-100">{content[language].addVehicle}</h3>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const newVehicle: Product = {
                                        id: `VHC-${Date.now()}`,
                                        name: { en: (form.elements.namedItem('vName') as HTMLInputElement).value, bn: (form.elements.namedItem('vName') as HTMLInputElement).value },
                                        category: { en: 'Rent a Car', bn: 'রেন্ট-এ-কার' },
                                        price: Number((form.elements.namedItem('vPrice') as HTMLInputElement).value),
                                        stock: 1,
                                        vendorId: driver.id,
                                        rating: 0,
                                        description: { en: 'Driver vehicle', bn: 'ড্রাইভারের গাড়ি' },
                                        images: ['https://picsum.photos/400/200?car'],
                                        productType: 'rental',
                                        status: 'Pending',
                                        vehicleDetails: {
                                            type: (form.elements.namedItem('vType') as HTMLSelectElement).value as any,
                                            seats: Number((form.elements.namedItem('vSeats') as HTMLInputElement).value),
                                            ac: false,
                                            fuelType: 'Petrol',
                                            driverIncluded: true,
                                            driverName: driver.name.en,
                                            isVerified: false
                                        }
                                    };
                                    addProduct(newVehicle);
                                    setIsAddingVehicle(false);
                                }}>
                                    <div className="space-y-3">
                                        <input name="vName" type="text" placeholder={content[language].vehicleName} required className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2c3e50]" />
                                        <div className="flex gap-2">
                                            <select name="vType" className="w-1/2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2c3e50]">
                                                <option value="Sedan">Sedan</option>
                                                <option value="Microbus">Microbus</option>
                                                <option value="SUV">SUV</option>
                                                <option value="CNG">CNG</option>
                                                <option value="Bike">Bike</option>
                                                <option value="Ambulance">Ambulance</option>
                                            </select>
                                            <input name="vSeats" type="number" placeholder={content[language].seats} required className="w-1/2 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2c3e50]" />
                                        </div>
                                        <input name="vPrice" type="number" placeholder={content[language].rate} required className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2c3e50]" />
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setIsAddingVehicle(false)} className="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-slate-600">{content[language].cancel}</button>
                                            <button type="submit" className="flex-1 bg-[#2c3e50] text-white py-2 rounded-lg font-bold text-sm hover:bg-[#34495e]">{content[language].save}</button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {myVehicles.length > 0 ? (
                            myVehicles.map(vehicle => (
                                <div key={vehicle.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <img src={vehicle.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-200" />
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-gray-100">{vehicle.name[language]}</h4>
                                            <p className="text-xs text-gray-500">{vehicle.vehicleDetails?.type} • {vehicle.vehicleDetails?.seats} Seats</p>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteProduct(vehicle.id)} className="text-red-400 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5" /></button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">{content[language].noVehicles}</p>
                        )}
                    </div>
                );
            case 'promotions':
                return (
                    <div className="space-y-4">
                        <PromotionsTab vendorId={driver.id} />
                    </div>
                );
            case 'messages':
                return <InboxPage />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            {/* Header */}
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
                                    {driver.logo ? (
                                        <img src={driver.logo} alt={currentUser.name} className="w-full h-full object-cover" />
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
                                <p className="font-bold text-lg">{currentUser.name}</p>
                                <div className="flex items-center gap-1 text-green-300 text-xs font-bold">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    {driver.onlineStatus === 'Online' ? content[language].online : content[language].offline}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                            <div className="flex bg-black/20 rounded-lg p-1 mr-2 px-3 text-white/70 text-sm font-bold">
                                <TruckIcon className="w-4 h-4 mr-1" /> Rider Mode
                            </div>

                            <button
                                onClick={() => DriverService.toggleDriverStatus(driver.id, driver.onlineStatus === 'Online' ? 'Offline' : 'Online')}
                                className={`px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 ${driver.onlineStatus === 'Online' ? 'bg-green-500 text-white' : 'bg-gray-500 text-gray-200'}`}
                            >
                                {driver.onlineStatus === 'Online' ? 'Go Offline' : 'Go Online'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="container mx-auto px-4 -mt-8 relative z-10 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 flex justify-around items-center">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Earnings</p>
                        <p className="text-xl font-extrabold text-[#2c3e50] dark:text-white">৳{history.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Trips</p>
                        <p className="text-xl font-extrabold text-[#2c3e50] dark:text-white">{history.filter(h => h.status === 'Ride Completed').length}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-slate-700"></div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
                        <p className="text-xl font-extrabold text-[#2c3e50] dark:text-white flex items-center gap-1">4.9 <StarIcon className="w-3 h-3 text-orange-400 fill-current" /></p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="container mx-auto px-4 mb-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-1 flex shadow-sm border border-gray-100 dark:border-slate-700 overflow-x-auto">
                    {/* Dynamic Tabs based on Service Mode */}
                    {['dispatch', 'messages', 'vehicles', 'history', 'wallet', 'promotions'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 py-2 px-2 whitespace-nowrap rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-[#2c3e50] text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab === 'dispatch' ? content[language].dispatch :
                                tab === 'vehicles' ? content[language].vehicles :
                                    tab === 'history' ? content[language].history :
                                        tab === 'wallet' ? content[language].wallet :
                                            tab === 'messages' ? content[language].messages :
                                                'Promotions'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                {renderContent()}
            </div>
        </div>
    );
};

export default RiderDashboardPage;
