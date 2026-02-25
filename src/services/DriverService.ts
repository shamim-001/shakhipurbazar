import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Delivery, DeliveryStatus } from '../types'; // Assuming types are exported from root types
// Note: We might need to import DeliveryGeoService if we calc distance here, or pass it in.
import { DeliveryGeoService } from './DeliveryGeoService';

export const DriverService = {
    /**
     * Find nearby drivers (within 5km radius)
     */
    findNearbyDrivers: async (lat: number, lng: number, radius: number = 5): Promise<string[]> => {
        try {
            const driversRef = collection(db, 'vendors');
            const q = query(
                driversRef,
                where('type', '==', 'deliveryMan'),
                where('onlineStatus', '==', 'Online'),
                where('status', '==', 'Active')
            );

            const snapshot = await getDocs(q);
            const nearbyDriverIds: string[] = [];

            for (const doc of snapshot.docs) {
                const driver = doc.data();
                // Check deliveryManProfile location
                const driverLat = driver.deliveryManProfile?.currentLocation?.lat;
                const driverLng = driver.deliveryManProfile?.currentLocation?.lng;

                if (driverLat && driverLng) {
                    // Calculate distance using GeoService
                    const distance = await DeliveryGeoService.calculateDistance(lat, lng, driverLat, driverLng);
                    if (distance <= radius) {
                        nearbyDriverIds.push(doc.id);
                    }
                }
            }
            return nearbyDriverIds;
        } catch (error) {
            console.error("Error finding drivers:", error);
            return [];
        }
    },

    /**
     * Get deliveries for a specific driver
     */
    getDriverDeliveries: async (driverId: string, status?: DeliveryStatus): Promise<Delivery[]> => {
        try {
            let q = query(
                collection(db, 'deliveries'),
                where('driverId', '==', driverId)
            );

            if (status) {
                q = query(q, where('status', '==', status));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
        } catch (error) {
            console.error('Error getting driver deliveries:', error);
            return [];
        }
    },

    /**
     * Subscribe to a specific driver's location
     */
    subscribeToDriverLocation: (driverId: string, callback: (location: { lat: number, lng: number }) => void) => {
        return onSnapshot(doc(db, 'vendors', driverId), (doc) => {
            const data = doc.data();
            if (data?.deliveryManProfile?.currentLocation) {
                callback(data.deliveryManProfile.currentLocation);
            }
        });
    },

    /**
     * Toggle Driver Online/Offline Status
     */
    toggleDriverStatus: async (driverId: string, status: 'Online' | 'Offline'): Promise<void> => {
        const docRef = doc(db, 'vendors', driverId);
        await updateDoc(docRef, { onlineStatus: status });
    },

    /**
     * Update Driver Service Mode
     */
    updateServiceMode: async (driverId: string, mode: 'ride' | 'delivery' | 'both'): Promise<void> => {
        const docRef = doc(db, 'vendors', driverId);
        await updateDoc(docRef, { serviceMode: mode });
    },

    /**
     * Update Delivery Man's Global Location (for finding nearby drivers)
     */
    updateDeliveryManLocation: async (driverId: string, lat: number, lng: number): Promise<void> => {
        const docRef = doc(db, 'vendors', driverId);
        // We use dot notation to update nested field without overwriting the whole profile
        await updateDoc(docRef, {
            'deliveryManProfile.currentLocation': { lat, lng },
            'deliveryManProfile.lastLocationUpdate': new Date().toISOString()
        });
    },

    /**
     * Specifically broadcast an emergency request for Ambulances
     */
    broadcastEmergencyRequest: async (orderId: string, lat: number, lng: number): Promise<void> => {
        try {
            // 1. Find all online drivers with 'ride' or 'both' service mode
            const driversRef = collection(db, 'vendors');
            const q = query(
                driversRef,
                where('type', '==', 'deliveryMan'),
                where('onlineStatus', '==', 'Online'),
                where('status', '==', 'Active')
            );

            const snapshot = await getDocs(q);
            const eligibleDriverIds: string[] = [];
            const driverNames: Record<string, string> = {};

            for (const docSnap of snapshot.docs) {
                const driver = docSnap.data();
                // Check if they support rides/ambulance
                if (driver.serviceMode === 'ride' || driver.serviceMode === 'both') {
                    eligibleDriverIds.push(docSnap.id);
                    driverNames[docSnap.id] = (driver.name as any)?.en || driver.name;
                }
            }

            if (eligibleDriverIds.length === 0) {
                console.warn("No available drivers for emergency broadcast");
                return;
            }

            // 2. Call DeliveryService broadcast with emergency=true
            const { DeliveryService } = await import('./deliveryService');
            await DeliveryService.requestDeliveryBroadcast(orderId, eligibleDriverIds, driverNames, true);

        } catch (error) {
            console.error("Error in emergency broadcast:", error);
            throw error;
        }
    },
    /**
     * Complete a Ride/Trip and Process Earnings
     */
    completeTrip: async (tripId: string, driverId: string, fareAmount: number): Promise<void> => {
        try {
            // 1. Update Trip Status (assuming 'orders' or 'trips' collection)
            // For now, consistent with Order system:
            const { EconomicsService } = await import('./economics');

            // Logic to update order status would be here or called separately via DeliveryService.updateStatus equivalent
            // But if DriverService handles "Trips" specifically:

            await EconomicsService.processDriverEarning(driverId, fareAmount, tripId);

        } catch (error) {
            console.error("Error completing trip:", error);
            throw error;
        }
    }
};
