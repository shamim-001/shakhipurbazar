import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useApp } from '../src/context/AppContext';
import { AnalyticsService } from '../src/services/analyticsService';
import { CartItem, Order, OrderItem, Address } from '../types';
import { WalletIcon, CreditCardIcon, CurrencyDollarIcon } from '../components/icons';
import { db } from '../src/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { MapPinIcon, PhoneIcon } from '../components/icons';

import { createUserWithEmailAndPassword } from 'firebase/auth'; // Added
import { auth } from '../src/lib/firebase'; // Added
import { UserService } from '../src/services/userService'; // Fixed casing
import { User } from '../types'; // Ensure User is imported

const CartPage = () => {
    const { language, cart, getCartTotal, updateCartQuantity, removeFromCart, clearCart, placeOrder, currentUser, platformSettings } = useApp();
    const navigate = useNavigate();
    const total = getCartTotal();

    // Checkout State
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPassword, setGuestPassword] = useState('');
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    const [deliveryAddress, setDeliveryAddress] = useState<string | Address>(currentUser?.address || '');
    const [deliveryPhone, setDeliveryPhone] = useState(currentUser?.phone || '');

    // Address Book Logic
    const savedAddresses = currentUser?.addressBook || [];
    const [selectedAddressId, setSelectedAddressId] = useState<string>(
        savedAddresses.find(a => a.isDefault)?.id || (savedAddresses.length > 0 ? savedAddresses[0].id : '')
    );
    const [isManualAddress, setIsManualAddress] = useState(savedAddresses.length === 0);

    // Update form when saved address selection changes
    React.useEffect(() => {
        if (!isManualAddress && selectedAddressId) {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            if (addr) {
                setDeliveryAddress(addr); // Pass the full object
                setDeliveryPhone(addr.phone);
            }
        }
    }, [selectedAddressId, isManualAddress, savedAddresses]);

    // Analytics: View Cart
    React.useEffect(() => {
        if (cart.length > 0) {
            AnalyticsService.trackViewCart(cart);
        }
    }, []);

    // Delivery Zone Selection
    const [selectedZoneId, setSelectedZoneId] = useState(platformSettings.deliveryZones?.[0]?.id || '');
    const selectedZone = platformSettings.deliveryZones?.find(z => z.id === selectedZoneId);
    const deliveryFee = total >= platformSettings.freeDeliveryThreshold ? 0 : (selectedZone?.fee || 0);

    // Payment Config State
    const [paymentConfig, setPaymentConfig] = useState<{
        bkash: { enabled: boolean };
        nagad: { enabled: boolean };
        sslcommerz: { enabled: boolean };
        cod: { enabled: boolean };
    }>({
        bkash: { enabled: false },
        nagad: { enabled: false },
        sslcommerz: { enabled: false },
        cod: { enabled: true } // Default safe fallback
    });

    // Fetch Payment Config
    React.useEffect(() => {
        const unsub = onSnapshot(doc(db, 'system', 'payment_config'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setPaymentConfig({
                    bkash: { enabled: !!data.bkash?.enabled },
                    nagad: { enabled: !!data.nagad?.enabled },
                    sslcommerz: { enabled: !!data.sslcommerz?.enabled },
                    cod: { enabled: data.cod?.enabled ?? true }
                });
            }
        });

        // Check for Payment Callback Status (Failed/Cancelled)
        const queryParams = new URLSearchParams(window.location.search);
        const paymentStatus = queryParams.get('paymentStatus');
        const message = queryParams.get('message');

        if (paymentStatus === 'failed') {
            alert(`Payment Failed: ${message || 'Transaction could not be completed.'}`);
            // Clean up URL
            window.history.replaceState({}, '', '/cart');
        } else if (paymentStatus === 'cancelled') {
            alert('Payment Cancelled.');
            window.history.replaceState({}, '', '/cart');
        }

        return () => {
            unsub();
        };
    }, []);

    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad' | 'Card' | 'Wallet'>('COD');

    // Effect to ensure selected payment method is enabled
    React.useEffect(() => {
        if (paymentMethod === 'COD' && !paymentConfig.cod.enabled) {
            // Switch to first available
            if (paymentConfig.bkash.enabled) setPaymentMethod('bKash');
            else if (paymentConfig.nagad.enabled) setPaymentMethod('Nagad');
            else if (paymentConfig.sslcommerz.enabled) setPaymentMethod('Card');
            else if (platformSettings.features?.enableWalletPayments) setPaymentMethod('Wallet');
        }
    }, [paymentConfig, platformSettings.features?.enableWalletPayments]);

    const content = {
        en: {
            title: "Your Shopping Cart",
            emptyCart: "Your cart is empty.",
            browseProducts: "Browse Products",
            item: "Item",
            price: "Price",
            quantity: "Quantity",
            total: "Total",
            summary: "Order Summary",
            subtotal: "Subtotal",
            deliveryFee: "Delivery Fee",
            deliveryZone: "Delivery Zone",
            selectZone: "Select your delivery area",
            freeDelivery: "Free",
            orderTotal: "Order Total",
            checkout: "Proceed to Checkout",
            remove: "Remove",
            days: "Days",
            payMethod: "Payment Method",
            walletBalance: "Wallet Balance",
            shippingInfo: "Shipping Information",
            addressLabel: "Delivery Address",
            phoneLabel: "Contact Phone",
            addressPlaceholder: "Enter your full delivery address",
            phonePlaceholder: "Enter contact number for delivery",
            addressRequired: "Shipping address is required.",
            phoneRequired: "Contact phone is required.",
            guestCheckout: "Guest Checkout & Sign Up",
            nameLabel: "Your Name",
            emailLabel: "Email Address",
            passwordLabel: "Create Password",
        },
        bn: {
            title: "আপনার শপিং কার্ট",
            emptyCart: "আপনার কার্ট খালি।",
            browseProducts: "পণ্য দেখুন",
            item: "আইটেম",
            price: "মূল্য",
            quantity: "পরিমাণ",
            total: "মোট",
            summary: "অর্ডার সারাংশ",
            subtotal: "উপমোট",
            deliveryFee: "ডেলিভারি ফি",
            deliveryZone: "ডেলিভারি জোন",
            selectZone: "আপনার ডেলিভারি এলাকা নির্বাচন করুন",
            freeDelivery: "ফ্রি",
            orderTotal: "সর্বমোট",
            checkout: "চেকআউট করুন",
            remove: "মুছে ফেলুন",
            days: "দিন",
            payMethod: "পেমেন্ট পদ্ধতি",
            walletBalance: "ওয়ালেট ব্যালেন্স",
            shippingInfo: "শিপিং তথ্য",
            addressLabel: "ডেলিভারি ঠিকানা",
            phoneLabel: "যোগাযোগের ফোন",
            addressPlaceholder: "আপনার পূর্ণ ডেলিভারি ঠিকানা লিখুন",
            phonePlaceholder: "ডেলিভারির জন্য যোগাযোগের নম্বর লিখুন",
            addressRequired: "শিপিং ঠিকানা প্রয়োজন।",
            phoneRequired: "যোগাযোগের ফোন প্রয়োজন।",
            guestCheckout: "গেসট চেকআউট এবং সাইন আপ",
            nameLabel: "আপনার নাম",
            emailLabel: "ইমেইল ঠিকানা",
            passwordLabel: "পাসওয়ার্ড তৈরি করুন",
        }
    }

    const handleCheckout = async () => {
        let userForOrder = currentUser;

        // Guest Checkout / Auto-Signup Logic
        if (!currentUser) {
            if (!guestName || !guestEmail || !guestPassword || !deliveryPhone || !deliveryAddress) {
                alert("Please fill in all guest fields (Name, Email, Password, Phone, Address).");
                return;
            }

            setIsCreatingAccount(true);
            try {
                userForOrder = await UserService.signupGuest({
                    name: guestName,
                    email: guestEmail,
                    phone: deliveryPhone,
                    address: typeof deliveryAddress === 'string' ? deliveryAddress : deliveryAddress.addressLine,
                    password: guestPassword
                });
                toast.success("Account created successfully!");
            } catch (error: any) {
                console.error("Guest Signup Error:", error);
                if (error.code === 'auth/email-already-in-use') {
                    alert("This email is already registered. Please log in.");
                    navigate('/login');
                } else {
                    alert("Signup failed: " + error.message);
                }
                setIsCreatingAccount(false);
                return;
            }
            setIsCreatingAccount(false);
        }

        // Validate Address
        if (isManualAddress) {
            if (!deliveryAddress || typeof deliveryAddress !== 'string' || (typeof deliveryAddress === 'string' && deliveryAddress.trim() === '')) {
                alert(content[language].addressRequired);
                return;
            }
        } else {
            // Saved address checks
            const selectedAddr = savedAddresses.find(a => a.id === selectedAddressId);
            if (!selectedAddr) {
                alert("Please select a saved address or use a new address.");
                return;
            }
            // Use the selected saved address
            userForOrder = { ...userForOrder!, address: selectedAddr.addressLine, phone: selectedAddr.phone };
        }

        if (!deliveryPhone) {
            alert(content[language].phoneRequired);
            return;
        }

        // Analytics: Begin Checkout
        AnalyticsService.trackBeginCheckout(cart);

        if (paymentMethod === 'Wallet' && userForOrder) {
            const deliveryFee = selectedZoneId ? (platformSettings.deliveryZones?.find(z => z.id === selectedZoneId)?.fee || 0) : 0;
            const finalTotal = total + deliveryFee;
            if (userForOrder.walletBalance < finalTotal) {
                toast.error(`Insufficient wallet balance. Total: ৳${finalTotal}, Balance: ৳${userForOrder.walletBalance}`);
                return;
            }
        }

        // Security Check: Enforce Wholesale MOQ
        // Security Check: Enforce Wholesale MOQ (Handled by UI state, but keeping safe guard)
        const moqViolation = cart.find(item => item.productType === 'wholesale' && item.minOrderQuantity && item.quantity < item.minOrderQuantity);
        if (moqViolation) {
            toast.error(language === 'en'
                ? `Minimum order quantity for "${moqViolation.name[language]}" is ${moqViolation.minOrderQuantity}.`
                : `"${moqViolation.name[language]}" এর জন্য সর্বনিম্ন অর্ডার পরিমাণ ${moqViolation.minOrderQuantity}।`);
            return;
        }

        const ordersByVendor = new Map<string, CartItem[]>();

        cart.forEach(item => {
            const vendorId = item.vendorId || 'unknown';
            if (!ordersByVendor.has(vendorId)) {
                ordersByVendor.set(vendorId, []);
            }
            ordersByVendor.get(vendorId)!.push(item);
        });

        const ordersToPlace: Omit<Order, 'id' | 'date' | 'statusHistory'>[] = [];
        let index = 0;

        ordersByVendor.forEach((items, vendorId) => {
            const orderItems: OrderItem[] = items.map(cartItem => {
                const item: any = {
                    productId: cartItem.id,
                    productName: cartItem.name,
                    productImage: (cartItem.images && cartItem.images[0]) || '',
                    quantity: cartItem.quantity,
                    priceAtPurchase: cartItem.price,
                };

                if (cartItem.selectedCustomizations) item.selectedCustomizations = cartItem.selectedCustomizations;
                if (cartItem.rentalDetails) item.rentalDetails = cartItem.rentalDetails;
                if (cartItem.flightBookingDetails) item.flightBookingDetails = cartItem.flightBookingDetails;

                return item as OrderItem;
            });

            const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const orderDeliveryFee = index === 0 ? deliveryFee : 0;
            const orderTotal = itemsTotal + orderDeliveryFee;

            ordersToPlace.push({
                customerId: userForOrder!.id,
                vendorId: vendorId,
                items: orderItems,
                total: orderTotal,
                deliveryFee: orderDeliveryFee,
                payment: paymentMethod,
                deliveryAddress: deliveryAddress,
                deliveryPhone: deliveryPhone,
                status: (paymentMethod === 'COD' || paymentMethod === 'Wallet') ? 'Pending' : 'Payment Processing',
            });
            index++;
        });

        setIsPlacingOrder(true);
        try {
            // Call placeOrder and handle redirection
            const result = await placeOrder(ordersToPlace, paymentMethod, userForOrder!);

            if (result.redirectUrl) {
                toast.loading("Redirecting to payment gateway...");
                window.location.href = result.redirectUrl;
            } else {
                // For COD/Wallet payments - order placed successfully
                toast.success(language === 'en' ? 'Order placed successfully!' : 'অর্ডার সফলভাবে সম্পন্ন হয়েছে!');
                clearCart();
                navigate(`/order-success?orders=${result.orderIds.join(',')}`);
            }
        } catch (error: any) {
            console.error("Checkout Fatal Error:", error);
            toast.error(language === 'en'
                ? `Checkout failed: ${error.message || 'Unknown error'}`
                : `চেকআউট ব্যর্থ হয়েছে: ${error.message || 'অজানা ত্রুটি'}`);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const renderCustomizations = (item: CartItem) => {
        if (item.rentalDetails) {
            return (
                <div className="text-xs text-rose-500 mt-1 font-medium bg-rose-50 dark:bg-rose-900/20 p-2 rounded w-fit">
                    <p>Booking Date: {item.rentalDetails.date}</p>
                    <p>Trip: {item.rentalDetails.from} ➔ {item.rentalDetails.to}</p>
                </div>
            )
        }

        if (!item.selectedCustomizations || Object.keys(item.selectedCustomizations).length === 0) {
            return null;
        }

        return (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Object.entries(item.selectedCustomizations).map(([title, value]) => {
                    const displayValue = Array.isArray(value) ? value.join(', ') : value;
                    return <div key={title}>{title}: {displayValue}</div>;
                })}
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-4">{content[language].emptyCart}</h1>
                <button onClick={() => navigate('/')} className="bg-[#795548] text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors">
                    {content[language].browseProducts}
                </button>
            </div>
        )
    }

    return (
        <div className="bg-[#F9F9F9] dark:bg-slate-900 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-2xl md:text-3xl font-bold text-[#795548] dark:text-rose-200 mb-6">{content[language].title}</h1>
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Cart Items */}
                    <div className="lg:w-2/3 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        {cart.map((item: CartItem) => (
                            <div key={item.cartItemId} className="flex flex-col sm:flex-row items-center justify-between border-b dark:border-slate-700 py-4 last:border-b-0">
                                <div className="flex items-center mb-4 sm:mb-0">
                                    <img src={item.images[0]} alt={item.name[language]} className="w-24 h-24 object-cover rounded-md mr-4" />
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            {item.name[language]}
                                            {item.isPreorder && (
                                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                                                    PRE-ORDER
                                                </span>
                                            )}
                                        </h3>
                                        {renderCustomizations(item)}
                                        {item.isPreorder && item.preorderReleaseDate && (
                                            <p className="text-xs text-amber-600 font-medium mt-1">
                                                Expected Release: {item.preorderReleaseDate}
                                            </p>
                                        )}
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">৳{item.price} {item.rentalDetails ? '/ day' : ''}</p>
                                        {item.productType === 'wholesale' && item.minOrderQuantity && item.quantity < item.minOrderQuantity && (
                                            <p className="text-xs text-red-500 font-medium mt-1">
                                                {language === 'en' ? `Min Order: ${item.minOrderQuantity}` : `সর্বনিম্ন অর্ডার: ${item.minOrderQuantity}`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-gray-800 dark:text-gray-200">
                                    {item.rentalDetails ? (
                                        <div className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                            {item.quantity} {content[language].days}
                                        </div>
                                    ) : (
                                        <div className="flex items-center border dark:border-slate-600 rounded-md">
                                            <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)} className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-l-md">-</button>
                                            <span className="px-3 border-x dark:border-slate-600">{item.quantity}</span>
                                            <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)} className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-r-md">+</button>
                                        </div>
                                    )}
                                    <p className="font-semibold w-20 text-center">৳{item.price * item.quantity}</p>
                                    <button
                                        onClick={() => {
                                            removeFromCart(item.cartItemId);
                                            AnalyticsService.trackRemoveFromCart(item);
                                        }}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        {content[language].remove}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Order Summary */}
                    <div className="lg:w-1/3">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md sticky top-24">
                            <h2 className="text-xl font-bold border-b dark:border-slate-700 pb-4 mb-4 text-gray-800 dark:text-gray-100">{content[language].summary}</h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                                <div className="flex justify-between">
                                    <span>{content[language].subtotal}</span>
                                    <span>৳{total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{content[language].deliveryFee}</span>
                                    {deliveryFee === 0 ? (
                                        <span className="text-green-500 font-bold">{content[language].freeDelivery}</span>
                                    ) : (
                                        <span>৳{deliveryFee}</span>
                                    )}
                                </div>
                                <div className="flex justify-between font-bold text-xl border-t dark:border-slate-700 pt-4 mt-4 text-gray-800 dark:text-gray-100">
                                    <span>{content[language].orderTotal}</span>
                                    <span>৳{total + deliveryFee}</span>
                                </div>
                            </div>

                            {/* Delivery Zone Selection */}
                            <div className="mb-6 border-t dark:border-slate-700 pt-6">
                                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{content[language].deliveryZone}</h3>
                                <select
                                    value={selectedZoneId}
                                    onChange={(e) => setSelectedZoneId(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="" disabled>{content[language].selectZone}</option>
                                    {(platformSettings.deliveryZones || []).filter(z => z.isActive).map(zone => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name[language]} - ৳{zone.fee}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Shipping Information */}
                            <div className="mb-6 border-t dark:border-slate-700 pt-6">
                                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <MapPinIcon className="w-4 h-4 text-rose-500" />
                                    {content[language].shippingInfo}
                                </h3>

                                {/* Guest Signup Form */}
                                {!currentUser && (
                                    <div className="mb-4 space-y-3 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                                        <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">{content[language].guestCheckout}</h4>
                                        <input
                                            type="text"
                                            placeholder={content[language].nameLabel}
                                            value={guestName}
                                            onChange={e => setGuestName(e.target.value)}
                                            className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                                        />
                                        <input
                                            type="email"
                                            placeholder={content[language].emailLabel}
                                            value={guestEmail}
                                            onChange={e => setGuestEmail(e.target.value)}
                                            className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                                        />
                                        <input
                                            type="password"
                                            placeholder={content[language].passwordLabel}
                                            value={guestPassword}
                                            onChange={e => setGuestPassword(e.target.value)}
                                            className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white"
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        {/* Address Selection Toggle */}
                                        {savedAddresses.length > 0 && (
                                            <div className="flex gap-2 mb-3 bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
                                                <button
                                                    onClick={() => setIsManualAddress(false)}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!isManualAddress ? 'bg-white dark:bg-slate-600 shadow text-rose-600' : 'text-gray-500'}`}
                                                >
                                                    Saved Address
                                                </button>
                                                <button
                                                    onClick={() => setIsManualAddress(true)}
                                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${isManualAddress ? 'bg-white dark:bg-slate-600 shadow text-rose-600' : 'text-gray-500'}`}
                                                >
                                                    New Address
                                                </button>
                                            </div>
                                        )}

                                        {!isManualAddress && savedAddresses.length > 0 ? (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Select Address</label>
                                                <select
                                                    value={selectedAddressId}
                                                    onChange={(e) => setSelectedAddressId(e.target.value)}
                                                    className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                                >
                                                    {savedAddresses.map(addr => (
                                                        <option key={addr.id} value={addr.id}>
                                                            {addr.label} - {addr.recipientName}
                                                        </option>
                                                    ))}
                                                </select>
                                                {/* Preview Selected Address */}
                                                {(() => {
                                                    const addr = savedAddresses.find(a => a.id === selectedAddressId);
                                                    if (addr) return (
                                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-600">
                                                            <p className="font-bold">{addr.recipientName}</p>
                                                            <p>{addr.phone}</p>
                                                            <p>{addr.addressLine}, {addr.area}</p>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{content[language].addressLabel}</label>
                                                    <textarea
                                                        value={typeof deliveryAddress === 'string' ? deliveryAddress : ''}
                                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                                        placeholder={content[language].addressPlaceholder}
                                                        className="w-full px-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">{content[language].phoneLabel}</label>
                                                    <div className="relative">
                                                        <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="tel"
                                                            value={deliveryPhone}
                                                            onChange={(e) => setDeliveryPhone(e.target.value)}
                                                            placeholder={content[language].phonePlaceholder}
                                                            className="w-full pl-10 pr-3 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <h3 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{content[language].payMethod}</h3>
                                <div className="space-y-2">
                                    {/* Wallet Payment */}
                                    {platformSettings.features?.enableWalletPayments && (
                                        <label className={`flex items-center gap-3 p-3 border dark:border-slate-600 rounded-lg cursor-pointer transition-all ${((currentUser && currentUser.walletBalance < (total + (selectedZoneId ? (platformSettings.deliveryZones?.find(z => z.id === selectedZoneId)?.fee || 0) : 0))) || !currentUser) ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="Wallet"
                                                checked={paymentMethod === 'Wallet'}
                                                onChange={() => setPaymentMethod('Wallet')}
                                                disabled={((currentUser && currentUser.walletBalance < (total + (selectedZoneId ? (platformSettings.deliveryZones?.find(z => z.id === selectedZoneId)?.fee || 0) : 0))) || !currentUser) ? true : false}
                                                className="text-rose-500 focus:ring-rose-500 disabled:opacity-50"
                                            />
                                            <WalletIcon className="w-5 h-5 text-violet-500" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium dark:text-gray-200">Wallet Pay</span>
                                                    {currentUser && currentUser.walletBalance < (total + (selectedZoneId ? (platformSettings.deliveryZones?.find(z => z.id === selectedZoneId)?.fee || 0) : 0)) && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Insufficient Balance</span>
                                                    )}
                                                    {!currentUser && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Login Required</span>}
                                                </div>
                                                {currentUser && <p className="text-xs text-gray-500">{content[language].walletBalance}: ৳{currentUser.walletBalance}</p>}
                                            </div>
                                        </label>
                                    )}

                                    {/* COD */}
                                    {paymentConfig.cod.enabled && (
                                        <label className="flex items-center gap-3 p-3 border dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="text-rose-500 focus:ring-rose-500" />
                                            <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                                            <span className="font-medium dark:text-gray-200">Cash on Delivery</span>
                                        </label>
                                    )}

                                    {/* bKash */}
                                    {paymentConfig.bkash.enabled && (
                                        <label className="flex items-center gap-3 p-3 border dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <input type="radio" name="payment" value="bKash" checked={paymentMethod === 'bKash'} onChange={() => setPaymentMethod('bKash')} className="text-rose-500 focus:ring-rose-500" />
                                            <span className="font-bold text-pink-600">bKash</span>
                                        </label>
                                    )}

                                    {/* Nagad */}
                                    {paymentConfig.nagad.enabled && (
                                        <label className="flex items-center gap-3 p-3 border dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <input type="radio" name="payment" value="Nagad" checked={paymentMethod === 'Nagad'} onChange={() => setPaymentMethod('Nagad')} className="text-rose-500 focus:ring-rose-500" />
                                            <span className="font-bold text-orange-600">Nagad</span>
                                        </label>
                                    )}

                                    {/* Card / SSL */}
                                    {paymentConfig.sslcommerz.enabled && (
                                        <label className="flex items-center gap-3 p-3 border dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} className="text-rose-500 focus:ring-rose-500" />
                                            <CreditCardIcon className="w-5 h-5 text-blue-600" />
                                            <span className="font-medium dark:text-gray-200">Card Payment (SSL)</span>
                                        </label>
                                    )}

                                    {!paymentConfig.cod.enabled && !paymentConfig.bkash.enabled && !paymentConfig.nagad.enabled && !paymentConfig.sslcommerz.enabled && !platformSettings.features?.enableWalletPayments && (
                                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                                            No payment methods available. Please contact support.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* MOQ Validation Error */}
                            {(() => {
                                const moqViolation = cart.find(item => item.productType === 'wholesale' && item.minOrderQuantity && item.quantity < item.minOrderQuantity);
                                if (moqViolation) {
                                    return (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <span>
                                                {language === 'en'
                                                    ? `Minimum order quantity for "${moqViolation.name[language]}" is ${moqViolation.minOrderQuantity}.`
                                                    : `"${moqViolation.name[language]}" এর জন্য সর্বনিম্ন অর্ডার পরিমাণ ${moqViolation.minOrderQuantity}।`}
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <button
                                onClick={handleCheckout}
                                disabled={isCreatingAccount || isPlacingOrder || cart.some(item => item.productType === 'wholesale' && item.minOrderQuantity && item.quantity < item.minOrderQuantity)}
                                className={`w-full bg-[#FFB6B6] text-white font-bold py-3 rounded-lg hover:bg-[#e6a4a4] transition-colors ${(isCreatingAccount || isPlacingOrder || cart.some(item => item.productType === 'wholesale' && item.minOrderQuantity && item.quantity < item.minOrderQuantity))
                                    ? 'opacity-70 cursor-not-allowed bg-gray-400 hover:bg-gray-400'
                                    : 'hover:bg-[#e6a4a4]'
                                    }`}
                            >
                                {isCreatingAccount
                                    ? 'Creating Account...'
                                    : isPlacingOrder
                                        ? 'Placing Order...'
                                        : (!currentUser ? content[language].guestCheckout : content[language].checkout)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CartPage;
