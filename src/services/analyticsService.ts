import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { AnalyticsEvent, VendorAnalyticsReport, ProductAnalytics } from '../../types';

// Collection references
// Collection references
const EVENTS_COLLECTION = 'analytics_events';
const ORDERS_COLLECTION = 'orders';

export const AnalyticsService = {

    /**
     * Record a user interaction event (view, click, purchase)
     */
    logEvent: async (event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) => {
        try {
            await addDoc(collection(db, EVENTS_COLLECTION), {
                ...event,
                timestamp: Timestamp.now()
            });
        } catch (error) {
            console.error("Failed to log analytics event:", error);
        }
    },

    /**
     * Generate REAL analytics report from Firestore Orders
     */
    getVendorReport: async (vendorId: string, range: number | { startDate: Date, endDate: Date } = 7): Promise<VendorAnalyticsReport> => {
        // 1. Calculate Date Range
        let startDate: Date;
        let endDate: Date;

        if (typeof range === 'number') {
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - range);
        } else {
            startDate = range.startDate;
            endDate = range.endDate;
        }

        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();

        // 2. Fetch Orders from Firestore
        // Note: For exact range, we should check both boundaries
        let q = query(
            collection(db, ORDERS_COLLECTION),
            where('date', '>=', startDateStr),
            where('date', '<=', endDateStr),
            orderBy('date', 'asc')
        );

        if (vendorId !== 'GLOBAL') {
            q = query(q, where('vendorId', '==', vendorId));
        }

        const snapshot = await getDocs(q);
        const orders: any[] = snapshot.docs.map(doc => doc.data());

        // 3. Initialize Arrays for Dates
        const dates = [];
        const currentDate = new Date(startDate);
        // Normalize time to avoiding infinite loop issues with DST/Times
        currentDate.setHours(0, 0, 0, 0);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);

        while (currentDate <= endDateTime) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 4. Aggregate Data Grouped by Date
        const dailyTraits: { [key: string]: { organic: number, promoted: number } } = {};
        dates.forEach(d => dailyTraits[d] = { organic: 0, promoted: 0 });

        let totalRevenue = 0;
        let totalOrders = 0;

        orders.forEach(order => {
            const dateKey = order.date.split('T')[0];
            if (dailyTraits[dateKey]) {
                // In future, check order.isPromoted (if implemented). Defaulting to organic for now.
                // Simulating a split for demo visual only based on random property if needed, 
                // but better to keep it 'organic' if we don't track promotion source yet.
                // Let's assume all 'bKash' orders are 'promoted' just to show some chart variation if meaningful,
                // OR just put everything in organic.
                // Better approach: Put everything in organicResult to be accurate.

                dailyTraits[dateKey].organic += order.total;
            }
            totalRevenue += order.total;
            totalOrders += 1;
        });

        const dailyTrends = dates.map(date => ({
            date,
            organicRevenue: dailyTraits[date]?.organic || 0,
            promotedRevenue: 0 // Placeholder until we track ad-attributed orders
        }));

        // 5. Construct Report
        const report: VendorAnalyticsReport = {
            vendorId,
            dateRange: { from: startDate.toISOString(), to: endDate.toISOString() },
            totalProducts: 45, // Needs separate product query to be real
            promotedProducts: 0,
            organicMetrics: {
                views: 0, // Need 'analytics_events' aggregation for this
                clicks: 0,
                orders: totalOrders,
                revenue: totalRevenue,
                ctr: 0,
                conversionRate: 0
            },
            promotedMetrics: {
                views: 0,
                clicks: 0,
                orders: 0,
                revenue: 0,
                ctr: 0,
                conversionRate: 0,
                totalSpend: 0,
                roi: 0
            },
            productBreakdown: [],
            dailyTrends
        };

        return report;
    },

    /**
     * Get Admin global analytics
     */
    getAdminOverview: async () => {
        // Fetch total counts (Approximation for performance)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const vendorsSnapshot = await getDocs(collection(db, 'vendors'));
        const ordersSnapshot = await getDocs(collection(db, 'orders'));

        const totalRevenue = ordersSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

        return {
            totalUsers: usersSnapshot.size,
            activeVendors: vendorsSnapshot.size,
            totalOrders: ordersSnapshot.size,
            revenue: totalRevenue,
            growth: '+0%' // Needs historical comparison
        };
    },

    /**
     * Get Recent Orders for Analytics Table (showing Date & Time)
     * Limit 10 for dashboard view
     */
    getRecentOrders: async (limitCount = 10) => {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            orderBy('date', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    /**
     * GA4 E-commerce: View Item
     */
    trackViewItem: (product: any) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'view_item',
                ecommerce: {
                    items: [{
                        item_id: product.id,
                        item_name: (product.name && product.name['en']) || product.name,
                        price: product.price,
                        item_category: (product.category && product.category['en']) || product.category,
                        quantity: 1
                    }]
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Add To Cart
     */
    trackAddToCart: (product: any) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'add_to_cart',
                ecommerce: {
                    items: [{
                        item_id: product.id,
                        item_name: (product.name && product.name['en']) || product.name,
                        price: product.price,
                        item_category: (product.category && product.category['en']) || product.category,
                        quantity: 1
                    }]
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Add To Wishlist
     */
    trackAddToWishlist: (product: any) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'add_to_wishlist',
                ecommerce: {
                    currency: 'BDT',
                    value: product.price,
                    items: [{
                        item_id: product.id,
                        item_name: (product.name && product.name['en']) || product.name,
                        price: product.price,
                        item_category: (product.category && product.category['en']) || product.category,
                        quantity: 1
                    }]
                }
            });
        }
    },

    /**
     * GA4 E-commerce: View Cart
     */
    trackViewCart: (cartItems: any[]) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'view_cart',
                ecommerce: {
                    currency: 'BDT',
                    value: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    items: cartItems.map(item => ({
                        item_id: item.id,
                        item_name: (item.name && item.name['en']) || item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Remove From Cart
     */
    trackRemoveFromCart: (product: any) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'remove_from_cart',
                ecommerce: {
                    items: [{
                        item_id: product.id,
                        item_name: (product.name && product.name['en']) || product.name,
                        price: product.price,
                        quantity: 1
                    }]
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Begin Checkout
     */
    trackBeginCheckout: (cartItems: any[]) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'begin_checkout',
                ecommerce: {
                    currency: 'BDT',
                    value: cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                    items: cartItems.map(item => ({
                        item_id: item.id,
                        item_name: (item.name && item.name['en']) || item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Add Shipping Info
     */
    trackAddShippingInfo: (shippingTier: string, value: number, items: any[]) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'add_shipping_info',
                ecommerce: {
                    currency: 'BDT',
                    value: value,
                    shipping_tier: shippingTier,
                    items: items.map(item => ({
                        item_id: item.id,
                        item_name: (item.name && item.name['en']) || item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Add Payment Info
     */
    trackAddPaymentInfo: (paymentMethod: string, value: number, items: any[]) => {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'add_payment_info',
                ecommerce: {
                    currency: 'BDT',
                    value: value,
                    payment_type: paymentMethod,
                    items: items.map(item => ({
                        item_id: item.id,
                        item_name: (item.name && item.name['en']) || item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Purchase
     */

    trackPurchase: (order: any, user?: any) => {
        if (window.dataLayer) {
            // Extract items safely
            const items = (order.items || []).map((item: any) => ({
                item_id: item.productId || item.id,
                item_name: (item.productName && item.productName['en']) || (item.name && item.name['en']) || item.productName || item.name,
                price: item.priceAtPurchase || item.price,
                quantity: item.quantity,
                // Add categories/brands if available in item object
                item_category: item.category ? (item.category.en || item.category) : undefined
            }));

            // Calculate tax if not present (assuming 0 for now as per previous logic, or extract from total - subtotal - shipping)
            const tax = order.tax || 0;
            const shipping = order.deliveryFee !== undefined ? order.deliveryFee : 60; // Default to 60 if missing

            // Prepare User Data
            const phone = order.deliveryPhone || user?.phone || (typeof order.deliveryAddress === 'object' ? order.deliveryAddress.phone : undefined);
            const email = user?.email || undefined;

            // Name handling
            const fullName = user?.name || (typeof order.deliveryAddress === 'object' ? order.deliveryAddress.recipientName : undefined) || 'Guest';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

            // Address handling
            let address = undefined;
            let city = undefined;
            let region = undefined;
            let postalCode = undefined; // Not strictly tracked in current model but placeholder
            let country = 'Bangladesh'; // Default

            if (typeof order.deliveryAddress === 'object') {
                address = order.deliveryAddress.addressLine;
                city = order.deliveryAddress.area; // Using area as City proxy
                // Region/State often matches Division/Area in this context
            } else if (typeof order.deliveryAddress === 'string') {
                address = order.deliveryAddress;
            }

            window.dataLayer.push({
                event: 'purchase',
                ecommerce: {
                    transaction_id: order.id,
                    value: order.total,
                    tax: tax,
                    shipping: shipping,
                    currency: 'BDT',
                    coupon: order.promoCode || undefined,
                    items: items
                },
                user_data: {
                    email: email,
                    phone_number: phone,
                    address: {
                        first_name: firstName,
                        last_name: lastName,
                        street: address,
                        city: city,
                        region: region,
                        postal_code: postalCode,
                        country: country
                    }
                }
            });
        }
    },

    /**
     * GA4 E-commerce: Refund (Full)
     */
    trackRefund: (orderId: string, value: number, items?: any[]) => {
        if (window.dataLayer && items) {
            window.dataLayer.push({
                event: 'refund',
                ecommerce: {
                    transaction_id: orderId,
                    value: value,
                    currency: 'BDT',
                    items: items.map((item: any) => ({
                        item_id: item.productId || item.id,
                        quantity: item.quantity
                    }))
                }
            });
        }
    },

    /**
     * Call the Advanced Platform Analytics Cloud Function
     */
    getAdvancedPlatformAnalytics: async (startDate: Date, endDate: Date) => {
        try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const functions = getFunctions();
            const getAnalytics = httpsCallable(functions, 'getPlatformAnalytics');
            const result = await getAnalytics({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            return result.data;
        } catch (error) {
            console.error("Failed to fetch advanced analytics:", error);
            throw error;
        }
    },

    /**
     * Call the System Health Check Cloud Function
     */
    getSystemHealthReport: async (deepScan: boolean = false) => {
        try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const functions = getFunctions();
            const checkHealth = httpsCallable(functions, 'checkSystemHealth');
            const result = await checkHealth({ deepScan });
            return result.data as any;
        } catch (error) {
            console.error("Failed to fetch system health report:", error);
            throw error;
        }
    }
};
