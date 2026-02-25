import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, onSnapshot } from 'firebase/firestore';
import { Order, OrderStatus, Payout, FlightBooking, PendingBooking, WorkflowTransition, Transaction, User, Product } from '../../types';
import { OrderService } from '../services/orderService';
import { EconomicsService } from '../services/economics';
import { useOrderSubscription } from '../hooks/useOrderSubscription';

interface OrderContextType {
    orders: Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus, podUrl?: string) => Promise<void>;
    cancelOrder: (orderId: string, cancelledBy?: 'customer' | 'rider', reason?: string) => Promise<void>;
    assignDriverToOrder: (orderId: string, driverId: string) => Promise<void>;
    requestRefund: (orderId: string, reason: string) => Promise<void>;
    confirmOrderReceipt: (orderId: string) => Promise<void>;
    extendReviewPeriod: (orderId: string) => Promise<void>;
    payouts: Payout[];
    processPayout: (vendorId: string, amount: number) => void;
    requestVendorPayout: (vendorId: string, amount: number, methodDetails: any) => Promise<void>;
    placeOrder: (ordersToPlace: any[], paymentMethod?: string, guestUser?: User) => Promise<string | undefined>;
    bookRide: (vehicle: Product, rentalInfo: any, paymentMethod?: string) => void;
    bookFlight: (flight: Product, bookingInfo: any, paymentMethod?: string) => void;
    updateDriverLocation: (orderId: string, lat: number, lng: number) => void;
    flightBookings: FlightBooking[];
    requestFlightBooking: (booking: any) => Promise<void>;
    updateFlightBookingStatus: (id: string, status: any, data?: any) => Promise<void>;
    pendingBooking: PendingBooking | null;
    setPendingBooking: (booking: PendingBooking | null) => void;
    pendingTransitions: WorkflowTransition[];
    checkWorkflowTransitions: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ currentUser: User | null; children: React.ReactNode }> = ({ currentUser, children }) => {
    const { orders } = useOrderSubscription(currentUser);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [flightBookings, setFlightBookings] = useState<FlightBooking[]>([]);
    const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
    const [pendingTransitions, setPendingTransitions] = useState<WorkflowTransition[]>([]);

    const updateOrderStatus = async (orderId: string, status: OrderStatus, podUrl?: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const now = new Date().toISOString();
        const history = [...(order.statusHistory || []), { status, date: now }];
        const deliveredAt = status === 'Delivered' ? now : undefined;
        await OrderService.updateOrderStatus(orderId, status, history, podUrl, deliveredAt);
    };

    const cancelOrder = async (orderId: string, cancelledBy?: 'customer' | 'rider', reason?: string) => {
        await OrderService.updateOrder(orderId, {
            status: 'Cancelled',
            cancelledBy,
            cancellationReason: reason,
            statusHistory: [{ status: 'Cancelled', date: new Date().toISOString() }]
        });
    };

    const assignDriverToOrder = async (orderId: string, driverId: string) => {
        await OrderService.updateOrder(orderId, { assignedDeliveryManId: driverId, status: 'Confirmed' });
    };

    const requestRefund = async (orderId: string, reason: string) => {
        await OrderService.updateOrder(orderId, { status: 'Refund Requested', refundInfo: { reason, status: 'Requested' } });
    };

    const confirmOrderReceipt = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const now = new Date().toISOString();
        const history = [...(order.statusHistory || []), { status: 'Completed', date: now }];
        await OrderService.updateOrder(orderId, {
            status: 'Completed',
            statusHistory: history,
            deliveredAt: order.deliveredAt || now // Use existing if available, fallback to now
        });
    };

    const extendReviewPeriod = async (orderId: string) => {
        await OrderService.extendReviewPeriod(orderId);
    };

    const processPayout = async (transactionId: string, vendorId: string, amount: number) => {
        await EconomicsService.approvePayout(transactionId, vendorId, amount);
    };

    const requestVendorPayout = async (vendorId: string, amount: number, methodDetails: any) => {
        await EconomicsService.requestPayout(vendorId, amount, methodDetails);
    };

    const placeOrder = async (ordersToPlace: any[], paymentMethod?: string, guestUser?: User) => {
        let lastOrderId: string | undefined;
        let totalAmount = 0;
        const orderIds: string[] = [];

        try {
            // 1. Create all order documents
            const createdOrders: Order[] = [];
            for (const orderData of ordersToPlace) {
                const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
                const newOrder: Order = {
                    id: orderId,
                    date: new Date().toISOString(),
                    status: (paymentMethod === 'COD' || paymentMethod === 'Wallet') ? 'Pending' : 'Payment Processing',
                    statusHistory: [{ status: (paymentMethod === 'COD' || paymentMethod === 'Wallet') ? 'Pending' : 'Payment Processing', date: new Date().toISOString() }],
                    ...orderData
                };
                await OrderService.createOrder(newOrder);
                lastOrderId = orderId;
                totalAmount += newOrder.total;
                createdOrders.push(newOrder);
                orderIds.push(orderId);
            }

            // 2. Handle Online Payments
            if (paymentMethod && ['bKash', 'Nagad', 'Card', 'SSLCommerz'].includes(paymentMethod)) {
                const { PaymentService } = await import('../services/paymentService');

                // We use the first order ID as the reference for the whole transaction
                const mainOrderId = lastOrderId || `TRX${Date.now()}`;

                const result = await PaymentService.initiatePayment(
                    mainOrderId,
                    paymentMethod as any,
                    totalAmount,
                    {
                        name: guestUser?.name || currentUser?.name || 'Guest',
                        email: guestUser?.email || currentUser?.email || 'guest@example.com',
                        phone: guestUser?.phone || currentUser?.phone || '',
                        address: guestUser?.address || (typeof currentUser?.address === 'string' ? currentUser?.address : currentUser?.address?.addressLine) || ''
                    }
                );

                if (result.success && result.redirectUrl) {
                    return { orderIds, redirectUrl: result.redirectUrl };
                } else {
                    throw new Error(result.error || "Failed to initiate payment");
                }
            }
        } catch (error: any) {
            console.error("Order Placement Internal Error:", error);
            throw error; // Re-throw to be caught by the UI
        }

        return { orderIds };
    };

    const bookRide = async (vehicle: Product, rentalInfo: any, paymentMethod?: string) => {
        const orderId = `RIDE${Date.now()}`;
        const rideOrder: any = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'Ride Requested',
            vendorId: vehicle.vendorId,
            customerId: currentUser?.id,
            total: vehicle.price,
            items: [{ productId: vehicle.id, name: vehicle.name, quantity: 1, price: vehicle.price }],
            rentalInfo,
            paymentMethod,
            statusHistory: [{ status: 'Ride Requested', date: new Date().toISOString() }]
        };
        await OrderService.createOrder(rideOrder as Order);

        // Also add to bookings collection for multi-service tracking
        await addDoc(collection(db, 'bookings'), {
            ...rideOrder,
            vehicleId: vehicle.id,
            createdAt: new Date().toISOString()
        });

        return orderId;
    };

    const bookFlight = async (flight: Product, bookingInfo: any, paymentMethod?: string) => {
        const orderId = `FLIGHT${Date.now()}`;
        const flightOrder: any = {
            id: orderId,
            date: new Date().toISOString(),
            status: 'Flight Requested',
            vendorId: flight.vendorId,
            customerId: currentUser?.id,
            total: flight.price,
            items: [{ productId: flight.id, name: flight.name, quantity: 1, price: flight.price }],
            bookingInfo,
            paymentMethod,
            statusHistory: [{ status: 'Flight Requested', date: new Date().toISOString() }]
        };
        await OrderService.createOrder(flightOrder as Order);
    };

    const updateDriverLocation = async (orderId: string, lat: number, lng: number) => {
        await OrderService.updateOrder(orderId, {
            driverLocation: {
                lat,
                lng,
                lastUpdated: new Date().toISOString()
            }
        });
    };

    const requestFlightBooking = async (data: any) => {
        const flightId = `FLIGHT${Date.now()}`;
        const newFlight = {
            id: flightId,
            customerId: currentUser?.id,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            ...data
        };
        await addDoc(collection(db, 'bookings'), newFlight);
        return flightId;
    };

    const updateFlightBookingStatus = async (id: string, status: any, data?: any) => {
        const bookingRef = doc(db, 'bookings', id);
        await updateDoc(bookingRef, { status, ...data, updatedAt: new Date().toISOString() });
    };

    const checkWorkflowTransitions = () => {
        // Implementation logic
    };

    return (
        <OrderContext.Provider value={{
            orders, updateOrderStatus, cancelOrder, assignDriverToOrder,
            requestRefund, confirmOrderReceipt, extendReviewPeriod,
            payouts, processPayout, requestVendorPayout,
            placeOrder, bookRide, bookFlight, updateDriverLocation,
            flightBookings, requestFlightBooking, updateFlightBookingStatus,
            pendingBooking, setPendingBooking,
            pendingTransitions, checkWorkflowTransitions
        }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => {
    const context = useContext(OrderContext);
    if (!context) throw new Error('useOrders must be used within an OrderProvider');
    return context;
};
