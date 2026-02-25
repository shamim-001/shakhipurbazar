import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    limit,
    QueryConstraint,
    or,
    and
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, User } from '../../types';

export const useOrderSubscription = (currentUser: User | null) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const ordersRef = collection(db, 'orders');
        const unsubscribers: (() => void)[] = [];

        if (currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.adminRole) {
            const q = query(ordersRef, orderBy('date', 'desc'), limit(500));
            const unsub = onSnapshot(q, (snapshot) => {
                setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
                setLoading(false);
            }, (error) => {
                console.error("Admin order subscription error:", error);
                setLoading(false);
            });
            return () => unsub();
        }

        // For non-admin users, we merge streams:
        let purchaseOrders: Order[] = [];
        let salesOrders: Order[] = [];
        let deliveryOrders: Order[] = [];
        let resellerOrders: Order[] = [];

        const updateMergedOrders = () => {
            const allOrders = [...purchaseOrders, ...salesOrders, ...deliveryOrders, ...resellerOrders];
            // Deduplicate by ID
            const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
            // Sort by date desc
            uniqueOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setOrders(uniqueOrders);
            setLoading(false);
        };

        // 1. My Purchases (All authenticated users are customers)
        const purchaseQuery = query(ordersRef, where('customerId', '==', currentUser.id), orderBy('date', 'desc'), limit(50));
        unsubscribers.push(onSnapshot(purchaseQuery, (snapshot) => {
            purchaseOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            updateMergedOrders();
        }, (error) => console.warn("Purchase subscription error:", error)));

        // 2. My Sales (Vendor/Agency)
        if (currentUser.shopId || currentUser.agencyId) {
            const vendorId = currentUser.shopId || currentUser.agencyId;
            const salesQuery = query(ordersRef, where('vendorId', '==', vendorId), orderBy('date', 'desc'), limit(100));
            unsubscribers.push(onSnapshot(salesQuery, (snapshot) => {
                salesOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                updateMergedOrders();
            }, (error) => console.warn("Sales subscription error:", error)));
        }

        // 3. My Deliveries (Driver/Rider/Delivery Man)
        if (currentUser.driverId) {
            // Driver sees rides they are doing (vendorId=driverId) OR open ride requests
            const driverQuery = query(
                ordersRef,
                or(
                    where('vendorId', '==', currentUser.driverId),
                    where('status', '==', 'Ride Requested')
                ),
                orderBy('date', 'desc'),
                limit(50)
            );
            unsubscribers.push(onSnapshot(driverQuery, (snapshot) => {
                deliveryOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                updateMergedOrders();
            }));
        } else if (currentUser.deliveryManId) {
            const deliveryQuery = query(
                ordersRef,
                or(
                    where('assignedDeliveryManId', '==', currentUser.deliveryManId),
                    where('pendingDeliveryManIds', 'array-contains', currentUser.deliveryManId)
                ),
                orderBy('date', 'desc'),
                limit(50)
            );
            unsubscribers.push(onSnapshot(deliveryQuery, (snapshot) => {
                deliveryOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                updateMergedOrders();
            }));
        }

        // 4. Reseller Orders
        if ((currentUser.isReseller || currentUser.role === 'reseller') && currentUser.referralCode) {
            const resellerQuery = query(ordersRef, where('referralCode', '==', currentUser.referralCode), orderBy('date', 'desc'), limit(100));
            unsubscribers.push(onSnapshot(resellerQuery, (snapshot) => {
                resellerOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                updateMergedOrders();
            }));
        }

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [currentUser?.id, currentUser?.role, currentUser?.shopId, currentUser?.driverId, currentUser?.deliveryManId, currentUser?.agencyId, currentUser?.isReseller, currentUser?.referralCode]);

    return { orders, loading };
};
