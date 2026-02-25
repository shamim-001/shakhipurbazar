import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FlightBooking } from '../../types';
import { createNotification } from './notificationService';

export const FlightService = {
    // Request a new flight booking
    requestBooking: async (booking: Omit<FlightBooking, 'id' | 'userId' | 'status' | 'createdAt'>, userId: string): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, 'flight_bookings'), {
                ...booking,
                userId,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error requesting flight booking:', error);
            throw error;
        }
    },

    // Get all bookings (for Admin/Agency)
    getAllBookings: async (): Promise<FlightBooking[]> => {
        try {
            const q = query(collection(db, 'flight_bookings'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlightBooking));
        } catch (error) {
            console.error('Error fetching all flight bookings:', error);
            return [];
        }
    },

    // Get user's bookings
    getUserBookings: async (userId: string): Promise<FlightBooking[]> => {
        try {
            const q = query(
                collection(db, 'flight_bookings'),
                where('userId', '==', userId),
            );
            // Client-side sorting might be needed if composite index is missing
            const snapshot = await getDocs(q);
            const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlightBooking));
            return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (error) {
            console.error('Error fetching user flight bookings:', error);
            return [];
        }
    },

    // Update booking status (Quote, Issue, Cancel)
    updateBookingStatus: async (id: string, status: FlightBooking['status'], data?: Partial<FlightBooking>) => {
        if (!id) throw new Error('Booking ID is required');
        try {
            const updateData: any = { status, ...data, updatedAt: serverTimestamp() };
            await updateDoc(doc(db, 'flight_bookings', id), updateData);

            // Fetch booking to get userId for notification
            const snap = await getDocs(query(collection(db, 'flight_bookings'), where('__name__', '==', id)));
            if (!snap.empty) {
                const booking = snap.docs[0].data() as FlightBooking;
                if (!booking.userId) return;

                let title = "";
                let body = "";

                if (status === 'quoted') {
                    title = "Flight Quote Received";
                    body = `Your flight from ${booking.from} to ${booking.to} has been quoted. Check the price now!`;
                } else if (status === 'issued') {
                    title = "Ticket Issued!";
                    body = `Good news! Your flight ticket to ${booking.to} has been issued. You can download the PDF files in your profile.`;
                } else if (status === 'cancelled') {
                    title = "Booking Cancelled";
                    body = `Your flight booking request from ${booking.from} to ${booking.to} has been cancelled.`;
                }

                if (title) {
                    await createNotification({
                        userId: booking.userId,
                        title: { en: title, bn: title },
                        body: { en: body, bn: body },
                        type: 'system',
                        relatedId: id,
                        link: { name: 'userProfile', tab: 'flight' }
                    });
                }
            }
        } catch (error) {
            console.error('Error updating flight booking:', error);
            throw error;
        }
    },

    // Real-time subscriptions
    subscribeToAllBookings: (callback: (bookings: FlightBooking[]) => void) => {
        const q = query(collection(db, 'flight_bookings'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlightBooking));
            callback(bookings);
        }, (error) => {
            console.error('Error subscribing to flight bookings:', error);
        });
    },

    subscribeToUserBookings: (userId: string, callback: (bookings: FlightBooking[]) => void) => {
        const q = query(collection(db, 'flight_bookings'), where('userId', '==', userId));
        // Note: Client-side sort if needed
        return onSnapshot(q, (snapshot) => {
            const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlightBooking));
            bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            callback(bookings);
        }, (error) => {
            console.error('Error subscribing to user flight bookings:', error);
        });
    }
};
