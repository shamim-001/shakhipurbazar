import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Product } from '../types';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { AnalyticsService } from '../src/services/analyticsService';
import StarRating from '../components/StarRating';
import { ChevronLeftIcon, StoreIcon, ArchiveBoxIcon, IdentificationIcon, CategoryIcon, StarIcon, ChatBubbleLeftRightIcon, UserIcon, PaperAirplaneIcon, TruckIcon, ClipboardDocumentCheckIcon, HeartIcon, XIcon } from '../components/icons';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import SEO from '../src/components/SEO';

interface ProductPageProps {
    product: Product;
}

const ProductInfoTabs: React.FC<{
    product: Product;
    selectedCustomizations: { [key: string]: string | string[] };
    setSelectedCustomizations: React.Dispatch<React.SetStateAction<{ [key: string]: string | string[] }>>;
}> = ({ product, selectedCustomizations, setSelectedCustomizations }) => {
    const { language } = useApp();

    const availableTabs = useMemo(() => {
        return [
            { id: 'description', label: { en: 'Description', bn: 'বিবরণ' }, content: product.description },
            { id: 'variants', label: { en: 'Variants', bn: 'ভেরিয়েন্ট' }, content: product.variants },
            { id: 'cakeFlavour', label: { en: 'Cake Flavour', bn: 'কেকের ফ্লেভার' }, content: product.cakeFlavours },
            { id: 'customizations', label: { en: 'Customization', bn: 'কাস্টমাইজেশন' }, content: product.customizations },
            { id: 'specifications', label: { en: 'Specifications', bn: 'স্পেসিফিকেশন' }, content: product.specifications },
            { id: 'delivery', label: { en: 'Delivery', bn: 'ডেলিভারি' }, content: product.deliveryInfo },
            { id: 'flightDetails', label: { en: 'Flight Details', bn: 'ফ্লাইটের তথ্য' }, content: product.flightDetails },
            { id: 'vehicleDetails', label: { en: 'Vehicle Details', bn: 'গাড়ির তথ্য' }, content: product.vehicleDetails },
            { id: 'reviews', label: { en: 'Reviews', bn: 'রিভিউ' }, content: product.reviews },
        ].filter(tab => tab.content && (!Array.isArray(tab.content) || tab.content.length > 0));
    }, [product, language]);

    const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || '');

    useEffect(() => {
        if (!availableTabs.some(t => t.id === activeTab)) {
            setActiveTab(availableTabs[0]?.id || '');
        }
    }, [product.id, availableTabs, activeTab]);

    if (availableTabs.length === 0) return null;

    const handleCustomizationSelect = (title: string, option: string, type: 'single' | 'multiple') => {
        setSelectedCustomizations(prev => {
            const newSelections = { ...prev };
            const currentSelection = newSelections[title];

            if (type === 'single') {
                newSelections[title] = option;
            } else { // multiple
                const currentArray = Array.isArray(currentSelection) ? currentSelection : [];
                if (currentArray.includes(option)) {
                    newSelections[title] = currentArray.filter(item => item !== option);
                } else {
                    newSelections[title] = [...currentArray, option];
                }
            }
            return newSelections;
        });
    };

    const renderContent = () => {
        const currentTab = availableTabs.find(t => t.id === activeTab);
        if (!currentTab) return null;

        switch (currentTab.id) {
            case 'description':
                return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.description[language]}</p>;
            case 'variants':
                return (
                    <ul className="space-y-2">
                        {product.variants?.map((variant, index) => (
                            <li key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{variant.name[language]}</span>
                                <span className="font-bold text-gray-800 dark:text-gray-100">৳{variant.price}</span>
                            </li>
                        ))}
                    </ul>
                );
            case 'cakeFlavour':
                return (
                    <div className="flex flex-wrap gap-3">
                        {product.cakeFlavours?.map((flavour, index) => (
                            <span key={index} className="px-4 py-2 bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 rounded-full text-sm font-medium">
                                {flavour[language]}
                            </span>
                        ))}
                    </div>
                );
            case 'customizations':
                return (
                    <div className="space-y-6">
                        {product.customizations?.map((custom, index) => (
                            <div key={index}>
                                <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-3">{custom.title[language]}</h4>
                                <div className="flex flex-wrap gap-3">
                                    {custom.options.map((option, optIndex) => {
                                        const titleEn = custom.title.en;
                                        const optionEn = option.en;
                                        const currentSelection = selectedCustomizations[titleEn];
                                        const isSelected = custom.type === 'single'
                                            ? currentSelection === optionEn
                                            : Array.isArray(currentSelection) && currentSelection.includes(optionEn);

                                        return (
                                            <button
                                                key={optIndex}
                                                onClick={() => handleCustomizationSelect(titleEn, optionEn, custom.type)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isSelected
                                                    ? 'bg-rose-500 text-white border-rose-500'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 border-transparent hover:bg-gray-200 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                {option[language]}
                                                {option.priceModifier && option.priceModifier > 0 && ` (+৳${option.priceModifier})`}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'specifications':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {product.specifications?.map((spec, index) => (
                                    <tr key={index} className="bg-white dark:bg-slate-800">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap bg-gray-50 dark:bg-slate-700/50 w-1/3">
                                            {spec.key[language]}
                                        </th>
                                        <td className="px-6 py-4">
                                            {spec.value[language]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            case 'delivery':
                return <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{product.deliveryInfo?.[language]}</p>;
            case 'flightDetails':
                return (
                    <div className="bg-sky-50 dark:bg-sky-900/20 p-6 rounded-xl border border-sky-100 dark:border-sky-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-sky-100 dark:bg-sky-800 p-3 rounded-full">
                                <PaperAirplaneIcon className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-sky-800 dark:text-sky-100">{product.flightDetails?.airline}</h3>
                                <p className="text-sky-600 dark:text-sky-300">Flight No: {product.flightDetails?.flightNumber}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Route</p>
                                <p className="font-bold text-lg dark:text-white">{product.flightDetails?.originCode} ➔ {product.flightDetails?.destinationCode}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Departure</p>
                                <p className="font-bold text-lg dark:text-white">{product.flightDetails?.departureTime}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Arrival</p>
                                <p className="font-bold text-lg dark:text-white">{product.flightDetails?.arrivalTime}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Duration</p>
                                <p className="font-bold text-gray-800 dark:text-white">{product.flightDetails?.duration}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Class</p>
                                <p className="font-bold text-gray-800 dark:text-white">{product.flightDetails?.class}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-sky-500 uppercase font-bold">Stops</p>
                                <p className="font-bold text-gray-800 dark:text-white">{product.flightDetails?.stops === 0 ? 'Non-stop' : `${product.flightDetails?.stops} Stop(s)`}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'vehicleDetails':
                return (
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-rose-100 dark:bg-rose-800 p-3 rounded-full">
                                <TruckIcon className="w-8 h-8 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-rose-800 dark:text-rose-100">{language === 'en' ? 'Vehicle Specifications' : 'গাড়ির বৈশিষ্ট্যসমূহ'}</h3>
                                <p className="text-rose-600 dark:text-rose-300">{product.vehicleDetails?.type} Service</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-rose-500 uppercase font-bold">Capacity</p>
                                <p className="font-bold text-lg dark:text-white">{product.vehicleDetails?.seats} Seats</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-rose-500 uppercase font-bold">AC Status</p>
                                <p className="font-bold text-lg dark:text-white">{product.vehicleDetails?.ac ? 'Air Conditioned' : 'Non-AC'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-rose-500 uppercase font-bold">Fuel Type</p>
                                <p className="font-bold text-lg dark:text-white">{product.vehicleDetails?.fuelType}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-rose-500 uppercase font-bold">Driver</p>
                                <p className="font-bold text-gray-800 dark:text-white">{product.vehicleDetails?.driverIncluded ? 'Included' : 'Self-Drive'}</p>
                            </div>
                            {product.vehicleDetails?.driverName && (
                                <div className="space-y-1">
                                    <p className="text-xs text-rose-500 uppercase font-bold">Assigned Driver</p>
                                    <p className="font-bold text-gray-800 dark:text-white">{product.vehicleDetails?.driverName}</p>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-xs text-rose-500 uppercase font-bold">Verfication</p>
                                <p className={`font-bold ${product.vehicleDetails?.isVerified ? 'text-green-600' : 'text-amber-600'} `}>
                                    {product.vehicleDetails?.isVerified ? 'Verified Vehicle' : 'Under Verification'}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            case 'reviews':
                const reviews = product.reviews || [];
                const displayReviews = reviews.slice(0, 3);
                const hasMore = reviews.length > 3;

                return (
                    <div className="space-y-6">
                        {reviews.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 italic py-4">
                                {language === 'en' ? 'No reviews yet for this product.' : 'এই পণ্যের জন্য এখনও কোনো রিভিউ নেই।'}
                            </p>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {(displayReviews).map(review => (
                                        <div key={review.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                                            <img src={review.customerImage} alt={review.customerName} className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white dark:border-slate-600" />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{review.customerName}</h4>
                                                        <StarRating rating={review.rating} className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment[language]}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {hasMore && (
                                    <button
                                        onClick={() => (window as any).setShowAllReviewsModal(true)}
                                        className="w-full py-3 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all border border-rose-100 dark:border-rose-900/30 mt-4"
                                    >
                                        {language === 'en' ? `See all ${reviews.length} reviews` : `সব ${reviews.length}টি রিভিউ দেখুন`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="mt-12">
            <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                    {availableTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id
                                ? 'border-rose-500 text-rose-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label[language]}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="py-4">
                {renderContent()}
            </div>
        </div>
    );
};




const ProductPage: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { language, addToCart, products: allProducts, addRecentlyViewed, vendors, users, currentUser, startChat, isProductInWishlist, addToWishlist, removeFromWishlist } = useApp();
    const navigate = useNavigate();
    const location = useLocation();

    const product = useMemo(() => {
        if (!productId) return undefined;
        return allProducts.find(p => p.id === productId || p.slug === productId);
    }, [allProducts, productId]);

    const [quantity, setQuantity] = useState(1);
    const [activeMedia, setActiveMedia] = useState<string>('');
    const [selectedCustomizations, setSelectedCustomizations] = useState<{ [key: string]: string | string[] }>({});
    const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);

    // Expose setter for nested components
    useEffect(() => {
        (window as any).setShowAllReviewsModal = setShowAllReviewsModal;
    }, []);

    // Reset state when product changes
    useEffect(() => {
        if (product) {
            const minQty = (product.productType === 'wholesale' && product.minOrderQuantity) ? product.minOrderQuantity : 1;
            setQuantity(product.stock >= minQty ? minQty : 0);
            setActiveMedia(product.images[0]);
            setSelectedCustomizations({});
            addRecentlyViewed(product);
        }
    }, [product?.id, addRecentlyViewed]);

    // Memoized info
    const vendor = useMemo(() => vendors.find(v => v.id === product?.vendorId), [product?.vendorId, vendors]);
    const seller = useMemo(() => users.find(u => u.id === product?.sellerId), [product?.sellerId, users]);
    const isOffline = vendor?.onlineStatus === 'Offline';

    const calculatedPrice = useMemo(() => {
        if (!product) return 0;

        let basePrice = product.price;
        // Wholesale Tiered Logic: If quantity meets MOQ, apply wholesale price
        if (product.wholesaleEnabled && product.wholesalePrice !== undefined) {
            const moq = product.minOrderQuantity || 1;
            if (quantity >= moq) {
                basePrice = product.wholesalePrice;
            }
        }

        let total = basePrice;
        if (!product.customizations) return total;

        Object.entries(selectedCustomizations).forEach(([title, value]) => {
            const customGroup = product.customizations?.find(c => c.title.en === title);
            if (!customGroup) return;

            const selectedOptions = Array.isArray(value) ? value : [value];
            selectedOptions.forEach(optName => {
                const option = customGroup.options.find(o => o.en === optName);
                if (option && option.priceModifier) {
                    total += option.priceModifier;
                }
            });
        });
        return total;
    }, [product, selectedCustomizations]);

    // Analytics: View Item
    useEffect(() => {
        if (product) {
            AnalyticsService.trackViewItem(product);
        }
    }, [product?.id]);

    const relatedProducts = useMemo(() => {
        if (!product) return [];
        return allProducts
            .filter(p => p.category.en === product.category.en && p.id !== product.id && p.status === 'Approved')
            .slice(0, 4);
    }, [product, allProducts]);

    const structuredData = useMemo(() => {
        if (!product) return null;

        const baseSchema: any = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name[language],
            "image": product.images,
            "description": product.description[language],
            "sku": product.id,
            "offers": {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "BDT",
                "price": calculatedPrice,
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
        };

        if (product.productType === 'flight' && product.flightDetails) {
            return {
                ...baseSchema,
                "@type": "Flight",
                "flightNumber": product.flightDetails.flightNumber,
                "provider": {
                    "@type": "Airline",
                    "name": product.flightDetails.airline
                },
                "departureAirport": {
                    "@type": "Airport",
                    "name": product.flightDetails.originCode,
                    "iataCode": product.flightDetails.originCode
                },
                "arrivalAirport": {
                    "@type": "Airport",
                    "name": product.flightDetails.destinationCode,
                    "iataCode": product.flightDetails.destinationCode
                }
            };
        }

        if (product.productType === 'resell') {
            return {
                ...baseSchema,
                "itemCondition": product.condition === 'New' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
                "offers": {
                    ...baseSchema.offers,
                    "itemCondition": product.condition === 'New' ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition"
                }
            };
        }

        if ((product.productType === 'rental' || product.productType === 'vehicle') && product.vehicleDetails) {
            const isAmbulance = product.vehicleDetails.type === 'Ambulance';
            return {
                ...baseSchema,
                "@type": isAmbulance ? "EmergencyService" : "RentalCarReservation",
                "reservationNumber": product.id,
                "provider": {
                    "@type": "LocalBusiness",
                    "name": isAmbulance ? "Sakhipur Emergency Ambulance" : "Sakhipur Bazar Rent-A-Car"
                },
                "description": isAmbulance
                    ? `Emergency Ambulance Service. 24/7 Availability.${product.vehicleDetails.ac ? 'AC' : 'Non-AC'}.`
                    : `Vehicle: ${product.vehicleDetails.type}, ${product.vehicleDetails.seats} seats.${product.vehicleDetails.ac ? 'AC' : 'Non-AC'}.`
            };
        }

        return baseSchema;
    }, [product, language, calculatedPrice]);

    if (!product) return <div className="p-20 text-center">Product not found</div>;

    // Check if the product is viewable
    const isOwner = (currentUser?.shopId === product.vendorId || currentUser?.driverId === product.vendorId) || currentUser?.id === product.sellerId;
    const isAdmin = currentUser?.role === 'admin';
    const isViewable = product.status === 'Approved' || isOwner || isAdmin;

    if (!isViewable) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
                    {language === 'en' ? 'Product Not Available' : 'পণ্যটি উপলব্ধ নেই'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    {language === 'en' ? 'This product is currently under review or has been removed.' : 'এই পণ্যটি বর্তমানে পর্যালোচনার অধীনে আছে বা সরানো হয়েছে।'}
                </p>
                <button onClick={() => navigate('/')} className="bg-[#795548] text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-colors">
                    {language === 'en' ? 'Go to Homepage' : 'হোমপেজে যান'}
                </button>
            </div>
        )
    }

    if (!vendor && !seller) {
        return <div className="p-20 text-center">Seller not found for this product.</div>;
    }

    const handleAddToCart = () => {
        // Create a temporary product with the updated price for the cart
        const cartProduct = { ...product, price: calculatedPrice };
        addToCart(cartProduct, quantity, selectedCustomizations);

        // Analytics: Add to Cart
        AnalyticsService.trackAddToCart({ ...cartProduct, quantity });

        toast.success(`${quantity} x ${product.name[language]} added to cart!`);
    };

    const handleChatWithSeller = async () => {
        if (!currentUser) {
            alert(language === 'en' ? 'Please log in to chat with the seller.' : 'বিক্রেতার সাথে চ্যাট করতে অনুগ্রহ করে লগইন করুন।');
            navigate('/login');
            return;
        }

        let sellerUserId: string | undefined;

        if (product.sellerId) {
            sellerUserId = product.sellerId;
        } else if (product.vendorId) {
            const vendorUser = users.find(u => u.shopId === product.vendorId || u.driverId === product.vendorId);
            sellerUserId = vendorUser?.id;
        }

        if (sellerUserId) {
            if (sellerUserId === currentUser.id) {
                alert(language === 'en' ? "You can't start a chat with yourself." : "আপনি নিজের সাথে চ্যাট শুরু করতে পারবেন না।");
                return;
            }
            // Pass productId and vendorId to link the chat
            let prefilledMessage = '';
            if (product.productType === 'resell') {
                prefilledMessage = language === 'en'
                    ? `Hi, I'm interested in your ${product.name.en}. Is it still available?`
                    : `হ্যালো, আমি আপনার ${product.name.bn} এই পণ্যটি কিনতে আগ্রহী। এটি কি এখনো পাওয়া যাবে?`;
            }
            const threadId = await startChat(sellerUserId, {
                type: 'product',
                id: product.id,
                productId: product.id,
                vendorId: product.vendorId,
                prefilledMessage
            });
            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
        } else {
            alert(language === 'en' ? 'Could not find the seller to start a chat.' : 'চ্যাট শুরু করার জন্য বিক্রেতাকে খুঁজে পাওয়া যায়নি।');
        }
    };

    const getVideoEmbedUrl = (url: string) => {
        // Simple YouTube ID extraction
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url;
    };

    const isYouTube = (url: string) => {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }


    const content = {
        en: {
            soldBy: "Sold by",
            quantity: "Quantity",
            addToCart: "Add to Cart",
            chatWithSeller: "Chat with Seller",
            relatedTitle: "You Might Also Like",
            visitShop: "Visit Shop",
            addToWishlist: "Add to Wishlist",
            inWishlist: "In Wishlist",
            shopOffline: "Shop Offline",
            shopOfflineMsg: "This shop is currently not accepting new orders."
        },
        bn: {
            soldBy: "বিক্রেতা",
            quantity: "পরিমাণ",
            addToCart: "কার্টে যোগ করুন",
            chatWithSeller: "বিক্রেতার সাথে চ্যাট করুন",
            relatedTitle: "আপনার আরও ভালো লাগতে পারে",
            visitShop: "দোকান দেখুন",
            addToWishlist: "ইচ্ছেতালিকায় যোগ করুন",
            inWishlist: "ইচ্ছেতালিকায় আছে",
            shopOffline: "দোকান অফলাইন",
            shopOfflineMsg: "এই দোকানটি বর্তমানে নতুন অর্ডার গ্রহণ করছে না।"
        }
    }

    const SellerInfo = () => {
        if (seller) {
            return (
                <div className="bg-[#FFF3E0] dark:bg-slate-700/50 p-4 rounded-lg flex items-center gap-4 mb-6 border border-[#fde8c8] dark:border-slate-700">
                    <UserIcon className="w-12 h-12 text-gray-500 p-2 bg-gray-200 dark:bg-slate-600 rounded-full" />
                    <div className="flex-grow">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{content[language].soldBy}</p>
                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{seller.name}</h4>
                    </div>
                </div>
            );
        }
        if (vendor) {
            return (
                <div className="bg-[#FFF3E0] dark:bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 mb-6 border border-[#fde8c8] dark:border-slate-700">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img src={vendor.logo} alt={vendor.name[language]} className="w-16 h-16 rounded-full flex-shrink-0" />
                        <div className="flex-grow">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{content[language].soldBy}</p>
                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{vendor.name[language]}</h4>
                            <StarRating rating={vendor.rating} className="h-4 w-4" />
                        </div>
                    </div>
                    {vendor.id ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/vendor/${vendor.slug || vendor.id}`);
                            }}
                            className="w-full sm:w-auto justify-center relative z-10 bg-white dark:bg-slate-600 text-[#795548] dark:text-rose-200 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors flex items-center gap-2 cursor-pointer ml-auto sm:ml-0"
                        >
                            <StoreIcon className="w-5 h-5" />
                            <span>{content[language].visitShop}</span>
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                alert(language === 'en' ? 'Store information is currently unavailable.' : 'দোকানের তথ্য বর্তমানে পাওয়া যাচ্ছে না।');
                            }}
                            className="w-full sm:w-auto justify-center bg-white dark:bg-slate-600 text-[#795548] dark:text-rose-200 px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors flex items-center gap-2 ml-auto sm:ml-0"
                        >
                            <StoreIcon className="w-5 h-5" />
                            <span>{content[language].visitShop}</span>
                        </button>
                    )}
                </div>
            );
        }
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <SEO
                title={product.name[language]}
                description={product.description[language].substring(0, 160)}
                image={product.images[0]}
                url={`https://sakhipur-bazar.web.app/product/${product.slug || product.id}`}
                type="product"
                schema={structuredData || undefined}
                lang={language}
            />
            <button
                onClick={() => {
                    if (window.history.length > 1) {
                        navigate(-1);
                    } else {
                        navigate('/', { replace: true });
                    }
                }}
                className="relative z-10 inline-flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors mb-6 cursor-pointer"
            >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                {language === 'en' ? 'Back' : 'ফিরে যান'}
            </button>

            <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Image/Video Gallery */}
                    <div>
                        <div className="w-full h-96 bg-gray-100 dark:bg-slate-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                            {activeMedia === 'video' && product.videoUrl ? (
                                isYouTube(product.videoUrl) ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getVideoEmbedUrl(product.videoUrl)}
                                        title="Product Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <video controls className="w-full h-full object-contain">
                                        <source src={product.videoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )
                            ) : (
                                <img src={activeMedia} alt={product.name[language]} className="w-full h-full object-contain" />
                            )}
                        </div>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                            {product.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img}
                                    alt={`Thumbnail ${index + 1}`}
                                    onClick={() => setActiveMedia(img)}
                                    className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 flex-shrink-0 ${activeMedia === img ? 'border-[#FFB6B6]' : 'border-transparent'}`}
                                />
                            ))}
                            {product.videoUrl && (
                                <div
                                    onClick={() => setActiveMedia('video')}
                                    className={`w-20 h-20 bg-black rounded-md cursor-pointer border-2 flex-shrink-0 flex items-center justify-center relative ${activeMedia === 'video' ? 'border-[#FFB6B6]' : 'border-transparent'}`}
                                >
                                    <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-8 border-l-white border-b-4 border-b-transparent ml-1"></div>
                                    </div>
                                    <span className="absolute bottom-1 text-[10px] text-white font-bold">Video</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Details */}
                    <div>
                        {isOffline && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-200 p-4 mb-6 rounded-r-lg" role="alert">
                                <p className="font-bold">{content[language].shopOffline}</p>
                                <p>{content[language].shopOfflineMsg}</p>
                            </div>
                        )}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2" style={{ fontFamily: 'Noto Sans Bengali, Poppins, sans-serif' }}>
                            {product.name[language]}
                        </h1>
                        <div className="flex items-center space-x-2 mb-4">
                            <StarRating rating={product.rating} />
                            <span className="text-gray-600 dark:text-gray-400">({product.rating} stars)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-[#795548] dark:text-rose-300">৳{calculatedPrice}</p>
                                {product.wholesaleEnabled && product.price > calculatedPrice && (
                                    <p className="text-lg text-gray-400 line-through">৳{product.price}</p>
                                )}
                            </div>

                            {product.productType === 'resell' && product.negotiable && (
                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
                                    {language === 'en' ? 'Negotiable' : 'আলোচনা সাপেক্ষ'}
                                </span>
                            )}

                            {product.productType === 'resell' && product.authenticityVerified && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800">
                                    <ClipboardDocumentCheckIcon className="w-3 h-3" />
                                    {language === 'en' ? 'Authenticity Verified' : 'সত্যতা যাচাইকৃত'}
                                </span>
                            )}
                        </div>
                        {product.wholesaleEnabled && product.minOrderQuantity && (
                            <div className="space-y-1 mb-6">
                                <p className="text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-full w-fit">
                                    {language === 'en' ? `Wholesale: ৳${product.wholesalePrice} (Min ${product.minOrderQuantity})` : `পাইকারি: ৳${product.wholesalePrice} (ন্যূনতম ${product.minOrderQuantity} টি)`}
                                </p>
                                {quantity < product.minOrderQuantity && (
                                    <p className="text-[10px] text-gray-500 italic">
                                        {language === 'en' ? `Add ${product.minOrderQuantity - quantity} more to unlock wholesale price.` : `পাইকারি মূল্য পেতে আরও ${product.minOrderQuantity - quantity} টি যোগ করুন।`}
                                    </p>
                                )}
                            </div>
                        )}

                        <SellerInfo />

                        {/* Info Grid */}
                        <div className="border-t dark:border-slate-700 pt-6 mt-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-3">
                                    <CategoryIcon className="w-6 h-6 text-rose-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'en' ? 'Category' : 'ক্যাটাগরি'}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{product.category[language]}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-3">
                                    <ArchiveBoxIcon className="w-6 h-6 text-rose-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'en' ? 'Stock' : 'স্টক'}</p>
                                        <p className={`font-semibold ${product.stock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                            {product.stock > 0 ? `${product.stock} ${language === 'en' ? 'Available' : 'আছে'}` : (language === 'en' ? 'Out of Stock' : 'স্টক নেই')}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-3">
                                    <IdentificationIcon className="w-6 h-6 text-rose-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'en' ? 'Type' : 'ধরন'}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{product.productType}</p>
                                    </div>
                                </div>
                                {product.productType === 'resell' && product.condition && (
                                    <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg flex items-center gap-3">
                                        <StarIcon className="w-6 h-6 text-rose-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{language === 'en' ? 'Condition' : 'কন্ডিশন'}</p>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{product.condition}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dedicated Color & Size Selectors */}
                        {(product.colorOptions && product.colorOptions.length > 0) && (
                            <div className="mt-6">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                    {language === 'en' ? 'Select Color' : 'রঙ নির্বাচন করুন'}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {product.colorOptions.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedCustomizations(prev => ({ ...prev, Color: color }))}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${selectedCustomizations['Color'] === color
                                                ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:text-gray-200'
                                                }`}
                                        >
                                            {color}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(product.sizeOptions && product.sizeOptions.length > 0) && (
                            <div className="mt-4">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                    {language === 'en' ? 'Select Size' : 'সাইজ নির্বাচন করুন'}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizeOptions.map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedCustomizations(prev => ({ ...prev, Size: size }))}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all ${selectedCustomizations['Size'] === size
                                                ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 dark:text-gray-200'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-4 mt-6 mb-6">
                            <label className="font-semibold text-gray-800 dark:text-gray-200">{content[language].quantity}:</label>
                            <div className={`flex items-center border dark:border-slate-600 rounded-md text-gray-800 dark:text-gray-200 ${isOffline || product.stock === 0 ? 'opacity-50' : ''}`}>
                                <button
                                    onClick={() => {
                                        const minQty = (product.productType === 'wholesale' && product.minOrderQuantity) ? product.minOrderQuantity : 1;
                                        setQuantity(Math.max(minQty, quantity - 1));
                                    }}
                                    className="px-3 py-1 text-lg hover:bg-gray-100 dark:hover:bg-slate-700 rounded-l-md disabled:cursor-not-allowed"
                                    disabled={isOffline || product.stock === 0 || quantity <= ((product.productType === 'wholesale' && product.minOrderQuantity) ? product.minOrderQuantity : 1)}
                                >
                                    -
                                </button>
                                <span className="px-4 py-1 border-x dark:border-slate-600 w-12 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="px-3 py-1 text-lg hover:bg-gray-100 dark:hover:bg-slate-700 rounded-r-md disabled:cursor-not-allowed"
                                    disabled={isOffline || product.stock === 0 || quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0 || isOffline}
                                className="flex-1 bg-[#FFB6B6] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#e6a4a4] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isOffline ? content[language].shopOffline : (product.stock > 0 ? content[language].addToCart : (language === 'en' ? 'Out of Stock' : 'স্টক নেই'))}
                            </button>
                            <button
                                onClick={handleChatWithSeller}
                                className="flex-1 bg-white dark:bg-slate-700 text-[#795548] dark:text-rose-200 font-bold py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors border dark:border-slate-600 flex items-center justify-center gap-2"
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                <span>{content[language].chatWithSeller}</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (isProductInWishlist(product.id)) {
                                        removeFromWishlist(product.id);
                                    } else {
                                        addToWishlist(product);
                                        AnalyticsService.trackAddToWishlist(product);
                                    }
                                }}
                                className={`p-3 rounded-lg border flex-shrink-0 transition-colors ${isProductInWishlist(product.id)
                                    ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100'
                                    : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-400 hover:text-rose-500 hover:border-rose-200'
                                    }`}
                                title={isProductInWishlist(product.id) ? content[language].inWishlist : content[language].addToWishlist}
                            >
                                <HeartIcon className={`w-6 h-6 ${isProductInWishlist(product.id) ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <ProductInfoTabs product={product} selectedCustomizations={selectedCustomizations} setSelectedCustomizations={setSelectedCustomizations} />
            </div>

            {/* All Reviews Modal */}
            {showAllReviewsModal && product && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border dark:border-slate-700">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <StarIcon className="w-6 h-6 text-yellow-500 fill-current" />
                                {language === 'en' ? `Customer Reviews (${product.reviews?.length})` : `ক্রেতার রিভিউ (${product.reviews?.length}টি)`}
                            </h3>
                            <button onClick={() => setShowAllReviewsModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {product.reviews?.map(review => (
                                <div key={review.id} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <img src={review.customerImage} alt={review.customerName} className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white dark:border-slate-600" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-gray-100">{review.customerName}</h4>
                                                <StarRating rating={review.rating} className="h-4 w-4" />
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{review.comment[language]}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
                            <button
                                onClick={() => setShowAllReviewsModal(false)}
                                className="px-6 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-slate-600"
                            >
                                {language === 'en' ? 'Close' : 'বন্ধ করুন'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-center text-[#795548] dark:text-rose-200 mb-8">
                        {content[language].relatedTitle}
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map(p => {
                            return <ProductCard key={p.id} product={p} />;
                        })}
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ProductPage;
