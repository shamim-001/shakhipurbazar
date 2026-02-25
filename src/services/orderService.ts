import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, runTransaction } from 'firebase/firestore';
import { Order } from '../../types';

export const OrderService = {
    subscribeToOrders: (callback: (orders: Order[]) => void, userId?: string, role?: string) => {
        let q = query(collection(db, 'orders'), orderBy('date', 'desc'));

        if (userId) {
            if (role === 'vendor') {
                q = query(collection(db, 'orders'), where('vendorId', '==', userId), orderBy('date', 'desc'));
            } else if (role === 'driver' || role === 'delivery_man') {
                q = query(collection(db, 'orders'), where('assignedDeliveryManId', '==', userId), orderBy('date', 'desc'));
            } else {
                // Default: Customer
                q = query(collection(db, 'orders'), where('customerId', '==', userId), orderBy('date', 'desc'));
            }
        }

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            callback(orders);
        });
    },

    fetchPaginatedOrders: async (status: string, lastDoc: any, pageSize: number) => {
        try {
            const ordersRef = collection(db, 'orders');
            let q = query(ordersRef, orderBy('date', 'desc'), limit(pageSize));

            if (status !== 'all') {
                q = query(ordersRef, where('status', '==', status), orderBy('date', 'desc'), limit(pageSize));
            }

            if (lastDoc) {
                const { startAfter } = await import('firebase/firestore');
                q = query(q, startAfter(lastDoc));
            }

            const snapshot = await getDocs(q);
            return {
                orders: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)),
                lastDoc: snapshot.docs[snapshot.docs.length - 1]
            };
        } catch (error) {
            console.error("OrderService.fetchPaginatedOrders error:", error);
            throw error;
        }
    },

    createOrder: async (order: Order): Promise<void> => {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Check and deduct stock for each item
                for (const item of order.items) {
                    const productRef = doc(db, 'products', item.productId);
                    const productSnap = await transaction.get(productRef);

                    if (!productSnap.exists()) {
                        throw new Error(`Product ${item.productId} not found.`);
                    }

                    const productData = productSnap.data() as any;
                    const newStock = (productData.stock || 0) - item.quantity;

                    if (newStock < 0) {
                        throw new Error(`Insufficient stock for ${productData.name?.en || item.productId}`);
                    }

                    const updates: any = { stock: newStock };

                    // Specific handling for Resell items (mark as sold if stock hits 0)
                    if (productData.productType === 'resell' && newStock <= 0) {
                        updates.resellStatus = 'sold';
                    }

                    transaction.update(productRef, updates);
                }

                // 2. Create the order document
                const orderRef = doc(db, 'orders', order.id);
                transaction.set(orderRef, order);
            });

            // 3. Log Activity (outside transaction as it's fire-and-forget)
            const { ActivityLoggerService } = await import('./activityLogger');
            ActivityLoggerService.log(
                'order.created',
                order.customerId,
                'Customer',
                'customer',
                { type: 'order', id: order.id, name: `Order #${order.id}`, metadata: { total: order.total } }
            );
        } catch (error) {
            console.error("OrderService.createOrder error:", error);
            throw error;
        }
    },

    updateOrderStatus: async (id: string, status: Order['status'], statusHistory: Order['statusHistory'], podUrl?: string, deliveredAt?: string): Promise<void> => {
        try {
            const docRef = doc(db, 'orders', id);
            const updates: any = { status, statusHistory };
            if (podUrl) updates.podUrl = podUrl;
            if (deliveredAt) updates.deliveredAt = deliveredAt;
            await updateDoc(docRef, updates);

            const { ActivityLoggerService } = await import('./activityLogger');
            let action: any = 'order.updated';
            if (status === 'Cancelled') action = 'order.cancelled';
            else if (status === 'Completed' || status === 'Delivered') action = 'order.completed';

            ActivityLoggerService.log(
                action,
                'system', // We might want to pass the actor ID here in future
                'System/User',
                'unknown',
                { type: 'order', id, name: `Order ${status}`, metadata: { status } }
            );

        } catch (error) {
            console.error("OrderService.updateOrderStatus error:", error);
            throw error;
        }
    },

    // For other updates (e.g. driverLocation)
    updateOrder: async (id: string, data: Partial<Order>): Promise<void> => {
        try {
            const docRef = doc(db, 'orders', id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("OrderService.updateOrder error:", error);
            throw error;
        }
    },

    extendReviewPeriod: async (id: string): Promise<void> => {
        try {
            const docRef = doc(db, 'orders', id);
            // Extend by 7 days
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 7);
            await updateDoc(docRef, {
                reviewExpiryDate: newExpiry.toISOString(),
                reviewExtended: true
            });
        } catch (error) {
            console.error("OrderService.extendReviewPeriod error:", error);
            throw error;
        }
    }
};
