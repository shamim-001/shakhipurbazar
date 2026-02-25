import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { Product } from '../types';
import { ChevronLeftIcon, CarIcon, UserIcon, KeyIcon, FireIcon, CheckCircleIcon, XIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon, NavigationIcon, ChatBubbleLeftRightIcon, StarIcon, WalletIcon, CurrencyDollarIcon, PlusIcon } from '../components/icons';
import StarRating from '../components/StarRating';
import ComingSoon from '../components/ComingSoon';
import SEO from '../src/components/SEO';



const BookingModal: React.FC<{ vehicle: Product; onClose: () => void }> = ({ vehicle, onClose }) => {
    const { language, bookRide, currentUser } = useApp();
    const [bookingDetails, setBookingDetails] = useState({
        date: '',
        time: '',
        from: 'Sakhipur',
        to: '',
        tripType: 'oneWay' as 'oneWay' | 'roundTrip' | 'hourly',
        hours: 1 as number | '',
        message: ''
    });
    const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wallet'>('Cash');

    // Mock fare calculation with debounce
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;

        // Only trigger if we have enough info to calculate
        const hasRoute = bookingDetails.from && bookingDetails.to && bookingDetails.tripType !== 'hourly';
        const hasHourly = bookingDetails.tripType === 'hourly' && bookingDetails.hours;

        if (hasRoute || hasHourly) {
            // Avoid setting state if already true to reduce re-renders
            setIsCalculating(prev => prev ? prev : true);

            timeoutId = setTimeout(() => {
                if (bookingDetails.tripType === 'hourly') {
                    const hrs = Number(bookingDetails.hours) || 0;
                    const hourlyRate = vehicle.vehicleDetails?.type === 'Ambulance' ? 1000 : 500;
                    setEstimatedFare(hourlyRate * hrs);
                } else {
                    const baseFare = vehicle.price;
                    // Deterministic mock distance based on destination length
                    const distance = Math.max(5, (bookingDetails.to.length * 2) % 60);

                    let perKmRate = 25;
                    if (vehicle.vehicleDetails?.type === 'Microbus') perKmRate = 40;
                    if (vehicle.vehicleDetails?.type === 'Truck') perKmRate = 60;
                    if (vehicle.vehicleDetails?.type === 'Ambulance') perKmRate = 80;

                    let fare = baseFare + (distance * perKmRate);

                    if (bookingDetails.tripType === 'roundTrip') fare *= 1.7;

                    setEstimatedFare(Math.round(fare));
                }
                setIsCalculating(false);
            }, 600);
        } else {
            setEstimatedFare(null);
            setIsCalculating(false);
        }

        return () => clearTimeout(timeoutId);
    }, [bookingDetails.from, bookingDetails.to, bookingDetails.tripType, bookingDetails.hours, vehicle.price]);

    const handleBooking = (e: React.FormEvent) => {
        e.preventDefault();
        const rentalInfo = {
            date: `${bookingDetails.date} ${bookingDetails.time}`,
            from: bookingDetails.from,
            to: bookingDetails.tripType === 'hourly' ? `Hourly Rental (${bookingDetails.hours} hrs)` : bookingDetails.to,
            tripType: bookingDetails.tripType,
            estimatedFare: estimatedFare
        };

        bookRide(vehicle, rentalInfo, paymentMethod);
        onClose();
    };

    // Optimized handlers using functional updates to prevent stale state issues during rapid typing
    const handleTextChange = (field: keyof typeof bookingDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setBookingDetails(prev => ({ ...prev, [field]: val }));
    };

    const handleTripTypeChange = (type: 'oneWay' | 'roundTrip' | 'hourly') => {
        setBookingDetails(prev => ({ ...prev, tripType: type }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        setBookingDetails(prev => ({ ...prev, hours: isNaN(val) ? '' : val }));
    };

    const content = {
        en: {
            title: "Request Ride",
            sub: "Fill details to calculate fare",
            date: "Pick-up Date",
            time: "Time",
            from: "From Location",
            to: "Destination",
            tripType: "Trip Type",
            oneWay: "One Way",
            roundTrip: "Round Trip",
            hourly: "Hourly Rental",
            hours: "Hours",
            message: "Note for Driver (Optional)",
            confirm: "Request Booking",
            cancel: "Cancel",
            estFare: "Est. Fare",
            calculating: "Calculating...",
            distance: "Est. Distance"
        },
        bn: {
            title: "রাইড অনুরোধ করুন",
            sub: "ভাড়া গণনা করতে বিবরণ পূরণ করুন",
            date: "তারিখ",
            time: "সময়",
            from: "কোথা থেকে",
            to: "কোথায় যাবেন",
            tripType: "ট্রিপের ধরন",
            oneWay: "একমুখী",
            roundTrip: "রাউন্ড ট্রিপ",
            hourly: "ঘন্টা হিসেবে",
            hours: "ঘন্টা",
            message: "ড্রাইভারের জন্য নোট (ঐচ্ছিক)",
            confirm: "বুকিং অনুরোধ করুন",
            cancel: "বাতিল",
            estFare: "আনুমানিক ভাড়া",
            calculating: "গণনা করা হচ্ছে...",
            distance: "আনুমানিক দূরত্ব"
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end md:items-center p-0 md:p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-t-xl md:rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Map Placeholder Header */}
                <div className="h-32 bg-gray-200 dark:bg-slate-700 relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
                        <MapPinIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="absolute top-1/2 right-1/4 transform -translate-x-1/2 -translate-y-1/2">
                        <MapPinIcon className="h-8 w-8 text-red-500" />
                    </div>
                    {/* Dotted line simulating route */}
                    <div className="absolute top-1/2 left-1/4 right-1/4 border-t-2 border-dashed border-gray-500 dark:border-gray-400 transform -translate-y-1/2"></div>

                    <button onClick={onClose} className="absolute top-4 right-4 bg-white/80 dark:bg-black/50 p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-black/70 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{content[language].title}</h2>
                    <p className="text-xs text-gray-500 mb-6">{content[language].sub}</p>

                    <form onSubmit={handleBooking} className="space-y-4">
                        {/* Trip Type Selector */}
                        <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-4">
                            {(['oneWay', 'roundTrip', 'hourly'] as const).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleTripTypeChange(type)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${bookingDetails.tripType === type
                                        ? 'bg-white dark:bg-slate-600 text-rose-500 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {content[language][type]}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3 relative">
                            {/* Visual connector line */}
                            <div className="absolute left-3.5 top-9 bottom-9 w-0.5 bg-gray-300 dark:bg-slate-600 z-0"></div>

                            <div className="relative z-10">
                                <label className="block text-xs font-medium text-gray-500 mb-1 ml-8">{content[language].from}</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-900/30"></div>
                                    <input
                                        type="text"
                                        value={bookingDetails.from}
                                        required
                                        autoComplete="off"
                                        className="flex-1 p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500 block w-full text-gray-900 dark:text-white"
                                        onChange={handleTextChange('from')}
                                    />
                                </div>
                            </div>

                            {bookingDetails.tripType !== 'hourly' && (
                                <div className="relative z-10">
                                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-8">{content[language].to}</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-900/30"></div>
                                        <select
                                            name="to"
                                            value={bookingDetails.to}
                                            required
                                            className="flex-1 p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500 block w-full text-gray-900 dark:text-white"
                                            onChange={handleTextChange('to')}
                                        >
                                            <option value="">Select Destination</option>
                                            <option value="Sakhipur">Sakhipur</option>
                                            <option value="Bhuapur">Bhuapur</option>
                                            <option value="Gopalpur">Gopalpur</option>
                                            <option value="Basail">Basail</option>
                                            <option value="Madhupur">Madhupur</option>
                                            <option value="Mirzapur">Mirzapur</option>
                                            <option value="Nagarpur">Nagarpur</option>
                                            <option value="Delduar">Delduar</option>
                                            <option value="Dhanbari">Dhanbari</option>
                                            <option value="Ghatail">Ghatail</option>
                                            <option value="Kalihati">Kalihati</option>
                                            <option value="Tangail Sadar">Tangail Sadar</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{content[language].date}</label>
                                <input
                                    type="date"
                                    value={bookingDetails.date}
                                    required
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500 block [color-scheme:light] dark:[color-scheme:dark]"
                                    onChange={handleTextChange('date')}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{content[language].time}</label>
                                <input
                                    type="time"
                                    value={bookingDetails.time}
                                    required
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500 block [color-scheme:light] dark:[color-scheme:dark]"
                                    onChange={handleTextChange('time')}
                                />
                            </div>
                        </div>

                        {bookingDetails.tripType === 'hourly' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{content[language].hours}</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bookingDetails.hours}
                                    required
                                    className="w-full p-2.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-rose-500 focus:border-rose-500 block text-gray-900 dark:text-white"
                                    onChange={handleNumberChange}
                                />
                            </div>
                        )}

                        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-lg flex justify-between items-center mt-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].estFare}</span>
                            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                {isCalculating ? <span className="text-sm font-normal animate-pulse">{content[language].calculating}</span> : `৳${estimatedFare || '-'}`}
                            </span>
                        </div>

                        {/* Payment Method */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Cash')}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'Cash' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-gray-200 dark:border-slate-600 text-gray-500'}`}
                            >
                                <CurrencyDollarIcon className="w-5 h-5" />
                                <span className="text-xs font-bold">Cash</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Wallet')}
                                className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === 'Wallet' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-gray-200 dark:border-slate-600 text-gray-500'}`}
                            >
                                <WalletIcon className="w-5 h-5" />
                                <span className="text-xs font-bold">Wallet Pay</span>
                                {currentUser && <span className="text-[10px]">Bal: ৳{currentUser.walletBalance}</span>}
                            </button>
                        </div>

                        <div className="pt-2">
                            <button type="submit" disabled={isCalculating || !estimatedFare} className="w-full bg-rose-500 text-white py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 dark:shadow-none disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {content[language].confirm}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const RentACarPage: React.FC = () => {
    const { language, products, vendors, users, startChat, currentUser, productPromotions } = useApp();
    const navigate = useNavigate();
    const [selectedType, setSelectedType] = useState('All');
    const [bookingVehicle, setBookingVehicle] = useState<Product | null>(null);

    const rentalCars = useMemo(() => {
        console.log("RentACarPage: Total products from context:", products.length);
        if (products.length > 0) {
            console.log("RentACarPage: Sample product types:", products.slice(0, 5).map(p => ({ id: p.id, type: p.productType, status: p.status })));
        }

        const filtered = products.filter(p => {
            const isRental = p.productType === 'rental' || p.productType === 'vehicle';
            const isApproved = p.status === 'Approved';
            if (isRental) {
                console.log(`RentACarPage: Found vehicle ${p.id}, status: ${p.status}, type: ${p.productType}`);
            }
            return isRental && isApproved;
        });

        console.log("RentACarPage: Filtered rental products:", filtered.length);

        // Sorting based on Promotions & Rating
        return [...filtered].sort((a, b) => {
            const promoA = (productPromotions || []).find(p => p.productId === a.id);
            const promoB = (productPromotions || []).find(p => p.productId === b.id);
            if (promoA && !promoB) return -1;
            if (!promoA && promoB) return 1;
            return (b.rating || 0) - (a.rating || 0);
        });
    }, [products, productPromotions]);

    // If no rental cars at all, show Coming Soon
    if (rentalCars.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">
                <div className="bg-[#2c3e50] text-white pt-6 pb-12 px-4 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                    <div className="container mx-auto relative z-10">
                        <button onClick={() => navigate('/')} className="flex items-center text-white/80 hover:text-white mb-6">
                            <ChevronLeftIcon className="h-5 w-5 mr-1" />
                            {language === 'en' ? 'Back' : 'ফিরে যান'}
                        </button>
                        <h1 className="text-3xl font-bold mb-1">{language === 'en' ? 'Rent a Car' : 'গাড়ি ভাড়া'}</h1>
                    </div>
                </div>
                <ComingSoon icon={CarIcon} />
            </div>
        );
    }

    const vehicleTypes = useMemo(() => ['All', ...Array.from(new Set(rentalCars.map(p => p.vehicleDetails?.type).filter(Boolean)))], [rentalCars]);

    const filteredCars = useMemo(() => {
        if (selectedType === 'All') return rentalCars;
        return rentalCars.filter(p => p.vehicleDetails?.type === selectedType);
    }, [rentalCars, selectedType]);

    const handleStartChat = async (vehicle: Product) => {
        if (!currentUser) {
            alert(language === 'en' ? 'Please login to chat.' : 'চ্যাট করতে অনুগ্রহ করে লগইন করুন।');
            navigate('/login');
            return;
        }

        let driverId: string | undefined;
        // Attempt to find driver ID based on vendor owner or seller ID
        if (vehicle.sellerId) {
            driverId = vehicle.sellerId;
        } else if (vehicle.vendorId) {
            const vendorUser = users.find(u => u.shopId === vehicle.vendorId || u.driverId === vehicle.vendorId);
            driverId = vendorUser?.id;
        }

        if (driverId) {
            const threadId = await startChat(driverId, {
                type: 'product',
                id: vehicle.id,
                productId: vehicle.id,
                vendorId: vehicle.vendorId
            });
            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
        } else {
            alert("Driver contact info not found.");
        }
    };

    const content = {
        en: {
            title: "Rent a Car",
            subtitle: "Safe & Reliable Rides in Sakhipur",
            back: "Back",
            filterType: "Vehicle Type",
            seats: "Seats",
            perTrip: "Base Fare",
            bookNow: "Request Ride",
            noCars: "No vehicles available at the moment.",
            driver: "Driver",
            verified: "Verified",
            trips: "Trips",
            call: "Call",
            chat: "Chat",
            online: "Available",
            busy: "On Trip",
            joinDriver: "Join as Driver"
        },
        bn: {
            title: "গাড়ি ভাড়া",
            subtitle: "সখিপুরে নিরাপদ এবং নির্ভরযোগ্য রাইড",
            back: "ফিরে যান",
            filterType: "গাড়ির ধরন",
            seats: "আসন",
            perTrip: "বেস ভাড়া",
            bookNow: "রাইড অনুরোধ করুন",
            noCars: "এই মুহূর্তে কোনো গাড়ি পাওয়া যাচ্ছে না।",
            driver: "ড্রাইভার",
            verified: "যাচাইকৃত",
            trips: "টিপস",
            call: "কল",
            chat: "চ্যাট",
            online: "উপলব্ধ",
            busy: "ব্যস্ত",
            joinDriver: "ড্রাইভার হিসেবে যোগ দিন"
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            <SEO
                title={content[language].title}
                description={content[language].subtitle}
                url="https://sakhipur-bazar.web.app/rentacar"
                schema={{
                    "@context": "https://schema.org/",
                    "@type": "Service",
                    "name": content[language].title,
                    "description": content[language].subtitle,
                    "provider": {
                        "@type": "LocalBusiness",
                        "name": "Sakhipur Bazar Rent-A-Car",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": "Sakhipur",
                            "addressCountry": "BD"
                        }
                    }
                }}
            />
            {/* App-like Header */}
            <div className="bg-[#2c3e50] text-white pt-6 pb-12 px-4 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8"></div>

                <div className="container mx-auto relative z-10">
                    <button onClick={() => navigate('/')} className="flex items-center text-white/80 hover:text-white mb-6">
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        {content[language].back}
                    </button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">{content[language].title}</h1>
                            <p className="text-white/70 text-sm">{content[language].subtitle}</p>
                        </div>
                        <button
                            onClick={() => navigate('/rider/register')}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm text-sm font-bold flex items-center gap-2"
                        >
                            <NavigationIcon className="w-5 h-5 text-green-300" />
                            {content[language].joinDriver}
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8 relative z-20">
                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-md flex overflow-x-auto gap-2 mb-6 no-scrollbar">
                    {vehicleTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type as string)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${selectedType === type
                                ? 'bg-[#2c3e50] text-white shadow-md'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Car List */}
                {filteredCars.length > 0 ? (
                    <div className="space-y-5 pb-10">
                        {filteredCars.map(car => {
                            const driver = vendors.find(v => v.id === car.vendorId);
                            const isOnline = driver?.onlineStatus === 'Online';
                            const isAmbulance = car.vehicleDetails?.type === 'Ambulance';
                            return (
                                <div key={car.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border overflow-hidden ${isAmbulance ? 'border-red-200 dark:border-red-900/50' : 'border-gray-100 dark:border-slate-700'}`}>
                                    {/* Driver Header */}
                                    <div className={`px-5 py-4 flex justify-between items-center border-b ${isAmbulance ? 'border-red-100 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-slate-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-600 overflow-hidden">
                                                    <UserIcon className="w-full h-full p-2 text-gray-400" />
                                                </div>
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-1">
                                                    {car.vehicleDetails?.driverName || 'Verified Driver'}
                                                    {car.vehicleDetails?.isVerified && <ShieldCheckIcon className="w-4 h-4 text-blue-500" />}
                                                </h4>
                                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                                                    <span className="flex items-center gap-0.5 text-orange-500 font-bold"><StarIcon className="w-3 h-3 fill-current" /> {car.vehicleDetails?.driverRating || 4.5}</span>
                                                    <span>• {car.vehicleDetails?.totalTrips || 100}+ {content[language].trips}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isAmbulance && (
                                                <span className="block mb-1 text-[10px] uppercase font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full w-fit ml-auto">Emergency</span>
                                            )}
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {isOnline ? content[language].online : content[language].busy}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Car Body */}
                                    <div className="p-5 flex gap-4">
                                        <div className="w-1/3">
                                            <img src={car.images[0]} alt={car.name[language]} className="w-full h-24 object-cover rounded-lg bg-gray-100" />
                                        </div>
                                        <div className="w-2/3">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">{car.name[language]}</h3>
                                                {isAmbulance && <PlusIcon className="w-6 h-6 text-red-500" />}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{car.vehicleDetails?.seats} {content[language].seats}</span>
                                                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{car.vehicleDetails?.fuelType}</span>
                                                {car.vehicleDetails?.ac && <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">AC</span>}
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-bold text-[#2c3e50] dark:text-white">৳{car.price}</span>
                                                <span className="text-xs text-gray-500 mb-1">{content[language].perTrip}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="px-5 pb-5 flex gap-3">
                                        <button
                                            onClick={() => handleStartChat(car)}
                                            className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                            {content[language].chat}
                                        </button>
                                        <a href="tel:+8801700000000" className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <PhoneIcon className="w-5 h-5" />
                                            {content[language].call}
                                        </a>
                                        <button
                                            onClick={() => setBookingVehicle(car)}
                                            className={`flex-[2] py-2.5 rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-gray-300 dark:shadow-none ${isAmbulance ? 'bg-red-500 hover:bg-red-600' : 'bg-[#2c3e50] hover:bg-[#34495e]'}`}
                                        >
                                            <NavigationIcon className="w-5 h-5" />
                                            {content[language].bookNow}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <CarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">{content[language].noCars}</p>
                    </div>
                )}
            </div>

            {bookingVehicle && <BookingModal vehicle={bookingVehicle} onClose={() => setBookingVehicle(null)} />}
        </div>
    );
};

export default RentACarPage;
