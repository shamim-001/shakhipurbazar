import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, writeBatch, runTransaction } from 'firebase/firestore';
import { createNotification } from './notificationService';
import { Delivery, DeliveryStatus } from '../types';
import { DeliveryGeoService } from './DeliveryGeoService';
import { LoggerService } from './loggerService';

export const DeliveryService = {

    /**
     * Create a new delivery for an order
     */
    createDelivery: async (orderId: string, vendorId: string, pickupAddress: any, deliveryAddress: any): Promise<Delivery> => {
        try {
            // Calculate distance and fee using GeoService
            const distance = await DeliveryGeoService.calculateDistance(
                pickupAddress.lat,
                pickupAddress.lng,
                deliveryAddress.lat,
                deliveryAddress.lng
            );

            const deliveryFee = DeliveryGeoService.calculateDeliveryFee(distance);
            const estimatedTime = DeliveryGeoService.estimateDeliveryTime(distance);

            // Prepare object without ID first
            const deliveryPayload: Omit<Delivery, 'id'> = {
                orderId,
                vendorId,
                status: 'pending',
                pickupAddress,
                deliveryAddress,
                distance,
                estimatedTime,
                deliveryFee,
                createdAt: new Date().toISOString()
            };

            // Save to Firestore and get generated ID
            const docRef = await addDoc(collection(db, 'deliveries'), deliveryPayload);

            // Return complete object with proper ID
            const finalDelivery: Delivery = {
                id: docRef.id,
                ...deliveryPayload
            };
            return finalDelivery;
        } catch (error) {
            LoggerService.error('Error creating delivery', error);
            throw error;
        }
    },

    /**
     * Assign a driver to a delivery
     */
    assignDriver: async (deliveryId: string, driverId: string): Promise<void> => {
        try {
            await updateDoc(doc(db, 'deliveries', deliveryId), {
                driverId,
                status: 'assigned',
                assignedAt: new Date().toISOString()
            });

            LoggerService.info(`Driver ${driverId} assigned to delivery ${deliveryId}`);
        } catch (error) {
            LoggerService.error('Error assigning driver', error);
            throw error;
        }
    },

    /**
     * Update delivery status
     */
    updateStatus: async (deliveryId: string, status: DeliveryStatus, notes?: string, deliveryPhoto?: string): Promise<void> => {
        try {
            const batch = writeBatch(db);
            const deliveryRef = doc(db, 'deliveries', deliveryId);
            const deliverySnap = await getDoc(deliveryRef);

            if (!deliverySnap.exists()) {
                throw new Error("Delivery document not found");
            }

            const deliveryData = deliverySnap.data() as Delivery;
            const orderId = deliveryData.orderId;

            const updates: any = {
                status,
                updatedAt: new Date().toISOString()
            };

            if (deliveryPhoto) updates.deliveryPhoto = deliveryPhoto;
            if (status === 'picked_up') updates.pickedUpAt = new Date().toISOString();
            else if (status === 'delivered') updates.deliveredAt = new Date().toISOString();
            if (notes) updates.driverNotes = notes;

            batch.update(deliveryRef, updates);

            // Sync with Order Status if orderId exists
            if (orderId) {
                let orderStatus: any = null;
                switch (status) {
                    case 'assigned': orderStatus = 'Confirmed'; break;
                    case 'picked_up': orderStatus = 'Out for Delivery'; break;
                    case 'in_transit': orderStatus = 'In Transit'; break;
                    case 'delivered': orderStatus = 'Delivered'; break;
                    case 'failed': orderStatus = 'Failed'; break;
                    case 'cancelled': orderStatus = 'Cancelled'; break;
                }

                if (orderStatus) {
                    const orderRef = doc(db, 'orders', orderId);
                    const orderSnap = await getDoc(orderRef);
                    if (orderSnap.exists()) {
                        const orderData = orderSnap.data();
                        const history = [...(orderData.statusHistory || []), { status: orderStatus, date: new Date().toISOString() }];
                        const orderUpdates: any = { status: orderStatus, statusHistory: history };
                        if (status === 'delivered' && deliveryPhoto) {
                            orderUpdates.podUrl = deliveryPhoto;
                        }
                        batch.update(orderRef, orderUpdates);

                        // Notify Vendor
                        await createNotification({
                            userId: orderData.vendorId,
                            title: { en: 'Delivery Status Updated', bn: 'ডেলিভারি স্ট্যাটাস আপডেট করা হয়েছে' },
                            body: { en: `Order #${orderId.slice(-6)} delivery status is now: ${status}.`, bn: `অর্ডার #${orderId.slice(-6)}-এর ডেলিভারি স্ট্যাটাস এখন: ${status}।` },
                            type: 'order',
                            data: { orderId }
                        } as any);

                        // Notify Customer
                        await createNotification({
                            userId: orderData.customerId,
                            title: { en: 'Order Status Update', bn: 'অর্ডার স্ট্যাটাস আপডেট' },
                            body: { en: `Your order #${orderId.slice(-6)} is now: ${status}.`, bn: `আপনার অর্ডার #${orderId.slice(-6)} এখন: ${status}।` },
                            type: 'order',
                            data: { orderId }
                        } as any);
                    }
                }
            }

            await batch.commit();
            LoggerService.info(`Delivery ${deliveryId} status updated to ${status} (Atomically)`);

            // Process Earnings if Delivered
            if (status === 'delivered') {
                try {
                    const { EconomicsService } = await import('./economics');
                    await EconomicsService.processDeliveryEarning(deliveryData.driverId!, deliveryData.deliveryFee, deliveryData.id);
                } catch (err) {
                    LoggerService.error(`Failed to process earning for delivery ${deliveryId}`, err);
                }
            }
        } catch (error) {
            LoggerService.error('Error updating delivery status', error);
            throw error;
        }
    },

    /**
     * Update driver's real-time location (Link to specific delivery)
     */
    updateDeliveryTrackingLocation: async (deliveryId: string, lat: number, lng: number): Promise<void> => {
        try {
            await updateDoc(doc(db, 'deliveries', deliveryId), {
                driverLocation: {
                    lat,
                    lng,
                    lastUpdated: new Date().toISOString()
                }
            });
        } catch (error) {
            LoggerService.error('Error updating driver location', error);
            throw error;
        }
    },

    /**
     * Get delivery by order ID
     */
    getDeliveryByOrderId: async (orderId: string): Promise<Delivery | null> => {
        try {
            const q = query(
                collection(db, 'deliveries'),
                where('orderId', '==', orderId)
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Delivery;
        } catch (error) {
            LoggerService.error('Error getting delivery', error);
            return null;
        }
    },

    /**
     * Broadcast Delivery Request (Vendor -> Multiple Drivers)
     * Replaces single requestDelivery
     */
    requestDeliveryBroadcast: async (orderId: string, deliveryManIds: string[], deliveryMenNames: Record<string, string>, isEmergency: boolean = false): Promise<void> => {
        const orderRef = doc(db, 'orders', orderId);

        const newRequests = deliveryManIds.map(id => ({
            deliveryManId: id,
            deliveryManName: deliveryMenNames[id] || 'Unknown',
            status: 'pending',
            requestedAt: new Date().toISOString()
        }));

        await updateDoc(orderRef, {
            deliveryRequests: newRequests,
            pendingDeliveryManIds: deliveryManIds,
            priority: isEmergency ? 'high' : 'normal',
            isEmergency: isEmergency
        });

        // Notify All Delivery Men
        const notificationPromises = deliveryManIds.map(id =>
            createNotification({
                userId: id,
                title: isEmergency
                    ? { en: 'CRITICAL: Emergency Request!', bn: 'জরুরী: জরুরী অনুরোধ!' }
                    : { en: 'New Delivery Opportunity', bn: 'নতুন ডেলিভারি সুযোগ' },
                body: isEmergency
                    ? { en: `EMERGENCY order #${orderId.slice(-6)}. Immediate response required!`, bn: `জরুরী অর্ডার #${orderId.slice(-6)}। অবিলম্বে সাড়া দেওয়া প্রয়োজন!` }
                    : { en: `New order request #${orderId.slice(-6)}. Accept it before others!`, bn: `নতুন অর্ডার অনুরোধ #${orderId.slice(-6)}। অন্যদের আগে গ্রহণ করুন!` },
                type: 'order',
                data: { orderId, isEmergency: isEmergency ? 'true' : 'false' }
            } as any)
        );
        await Promise.all(notificationPromises);
    },

    /**
     * Accept Delivery Request (Atomic Transaction)
     */
    acceptDeliveryRequest: async (orderId: string, driverId: string): Promise<void> => {
        try {
            await runTransaction(db, async (transaction) => {
                const orderRef = doc(db, 'orders', orderId);
                const orderDoc = await transaction.get(orderRef);

                if (!orderDoc.exists()) {
                    throw new Error("Order does not exist!");
                }

                const orderData = orderDoc.data();

                if (orderData.assignedDeliveryManId) {
                    throw new Error("Order already assigned to another driver!");
                }

                // Find the request for this driver
                const requests = orderData.deliveryRequests || [];
                const myRequestIndex = requests.findIndex((r: any) => r.deliveryManId === driverId);

                if (myRequestIndex === -1 && !orderData.deliveryRequest) {
                    // Strict check
                    throw new Error("No pending request found for this driver.");
                }

                // Update payload
                // Calculate updated requests
                const updatedRequests = requests.map((r: any) => {
                    if (r.deliveryManId === driverId) {
                        return { ...r, status: 'accepted', respondedAt: new Date().toISOString() };
                    } else if (r.status === 'pending') {
                        return { ...r, status: 'expired', respondedAt: new Date().toISOString() };
                    }
                    return r;
                });

                // Generate random 4-digit codes
                const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
                const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

                // Update payload
                const updates: any = {
                    deliveryRequests: updatedRequests,
                    assignedDeliveryManId: driverId,
                    pendingDeliveryManIds: [], // Clear broadcast pool
                    status: 'Confirmed',
                    pickupCode,
                    deliveryCode,
                    updatedAt: new Date().toISOString()
                };

                // Backward compatibility for single request field
                if (orderData.deliveryRequest) {
                    updates.deliveryRequest = {
                        ...orderData.deliveryRequest,
                        status: 'accepted',
                        respondedAt: new Date().toISOString()
                    };
                }

                transaction.update(orderRef, updates);
            });

            // Notify Vendor (Post-transaction)
            const orderDoc = await getDoc(doc(db, 'orders', orderId));
            if (orderDoc.exists()) {
                const orderData = orderDoc.data();
                await createNotification({
                    userId: orderData.vendorId,
                    title: { en: 'Delivery Request Accepted', bn: 'ডেলিভারি অনুরোধ গ্রহণ করা হয়েছে' },
                    body: { en: `Driver has accepted Order #${orderId.slice(-6)}.`, bn: `ড্রাইভার অর্ডার #${orderId.slice(-6)} গ্রহণ করেছেন।` },
                    type: 'order',
                    data: { orderId }
                } as any);
            }

        } catch (e) {
            LoggerService.error("Transaction failed", e);
            throw e;
        }
    },

    /**
     * Reject Delivery Request
     */
    rejectDeliveryRequest: async (orderId: string, driverId: string): Promise<void> => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
            const data = orderSnap.data();
            const requests = data.deliveryRequests || [];

            const updatedRequests = requests.map((r: any) => {
                if (r.deliveryManId === driverId) {
                    return { ...r, status: 'rejected', respondedAt: new Date().toISOString() };
                }
                return r;
            });

            const updates: any = {
                deliveryRequests: updatedRequests
            };

            if (data.deliveryRequest && data.assignedDeliveryManId === driverId) {
                updates.deliveryRequest = {
                    ...data.deliveryRequest,
                    status: 'rejected',
                    respondedAt: new Date().toISOString()
                };
            }

            await updateDoc(orderRef, updates);
        }
    },

    /**
     * Assign Self (Vendor delivers)
     */
    assignSelfDelivery: async (orderId: string, vendorId: string): Promise<void> => {
        const orderRef = doc(db, 'orders', orderId);
        const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

        await updateDoc(orderRef, {
            assignedDeliveryManId: vendorId,
            status: 'Confirmed',
            deliveryCode,
            // Add a synthetic "accepted" request for record keeping
            deliveryRequests: [{
                deliveryManId: vendorId,
                deliveryManName: 'Self',
                status: 'accepted',
                requestedAt: new Date().toISOString(),
                expiresAt: new Date().toISOString()
            }]
        });
    }
};
