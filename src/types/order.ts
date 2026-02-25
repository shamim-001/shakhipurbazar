import { Address } from './common';
import { Product } from './product';

export type OrderStatus =
    | 'Pending'
    | 'Confirmed'
    | 'Preparing'
    | 'Out for Delivery'
    | 'Delivered'
    | 'Completed'
    | 'Cancelled'
    | 'Refund Requested'
    | 'Refund Approved'
    | 'Refund Rejected'
    | 'Ride Requested'
    | 'Ride Accepted'
    | 'Ride Started'
    | 'Payment Processing'
    | 'Ride Completed'
    | 'Refunded'
    | 'Ticket Issued'
    | 'Flight Confirmed'
    | 'Returned to Vendor';

export interface OrderItem {
    productId: string;
    productName: { en: string; bn: string };
    productImage: string;
    quantity: number;
    priceAtPurchase: number;
    selectedCustomizations?: { [key: string]: string | string[] };
    rentalDetails?: {
        date: string;
        from: string;
        to: string;
        tripType?: string;
        estimatedFare?: number;
    };
    flightBookingDetails?: {
        travelDate: string;
        passengers: number;
        travelClass: string;
        passengerName: string;
        passportNumber?: string;
    };
}

export interface DeliveryRequest {
    deliveryManId: string;
    deliveryManName?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    requestedAt: string; // ISO string
    expiresAt?: string; // ISO string
}

export interface Order {
    id: string;
    customerId: string;
    vendorId: string;
    items: OrderItem[];
    total: number;
    payment: 'COD' | 'bKash' | 'Nagad' | 'Card' | 'Cash' | 'Wallet';
    status: OrderStatus;
    date: string;
    statusHistory: { status: OrderStatus; date: string }[];
    refundInfo?: {
        reason: string;
        status: 'Requested' | 'Approved' | 'Rejected';
        vendorApproval?: 'Pending' | 'Approved' | 'Rejected';
        adminApproval?: 'Pending' | 'Approved' | 'Rejected';
        ticketId?: string;
    };
    reviewExpiryDate?: string; // ISO date when the 3-day review period ends
    reviewExtended?: boolean; // If customer has requested an extension
    driverLocation?: {
        lat: number;
        lng: number;
        heading?: number;
        lastUpdated: string;
    };
    assignedDeliveryManId?: string;
    pendingDeliveryManIds?: string[]; // IDs of drivers who received the request
    deliveryRequests?: DeliveryRequest[]; // Multiple active requests
    deliveryFee?: number; // Fee charged to customer for delivery
    deliveryRequest?: { // Legacy: Single request support
        status: 'pending' | 'accepted' | 'rejected' | null;
        requestedAt?: string;
        respondedAt?: string;
    };
    pickupCode?: string; // 4-digit code for delivery handshake
    // Reseller System
    referralCode?: string; // The code used to make this purchase
    commissionAmount?: number; // The amount earned by the referrer

    // High Priority / Emergency
    isEmergency?: boolean;
    priority?: 'normal' | 'high';

    // Flight Agency Extensions
    issuedTickets?: string[]; // URLs to uploaded PDF tickets
    agentNotes?: string;      // Internal notes for the agent or customer feedback
    deliveryAddress?: string | Address; // Backward compatibility with string
    deliveryPhone?: string;
    deliveryCode?: string; // 4-digit code for customer to confirm delivery
    podUrl?: string; // Proof of Delivery photo URL
    cancellationReason?: string;
    cancelledBy?: 'customer' | 'rider' | 'vendor' | 'admin';
    deliveredAt?: string; // ISO date when the order was marked as Delivered
}

export interface CartItem extends Product {
    quantity: number;
    cartItemId: string;
    originalPrice?: number; // Retail price before wholesale/customizations
    selectedCustomizations?: { [key: string]: string | string[] };
    rentalDetails?: {
        date: string;
        from: string;
        to: string;
        tripType?: string;
        estimatedFare?: number;
    };
    flightBookingDetails?: {
        travelDate: string;
        passengers: number;
        travelClass: string;
        passengerName: string;
        passportNumber?: string;
    };
}

export interface Transaction {
    id: string;
    userId: string; // Can be UserID or VendorID
    type: 'deposit' | 'payment' | 'refund' | 'payout' | 'commission_deduction' | 'sale_revenue';
    amount: number;
    date: string;
    description: string;
    status: 'Completed' | 'Pending' | 'Failed';
    orderId?: string; // Link to specific order if applicable
    settleAt?: string; // ISO date for delayed payment distribution
}

export interface Commission {
    id: string;
    resellerId: string;
    orderId: string;
    amount: number;
    status: 'Pending' | 'Paid' | 'Cancelled';
    date: string;
    currency?: string;
    referredUserId?: string;
}

export interface Payout {
    id: string;
    vendorId: string;
    amount: number;
    date: string;
    status?: string; // Added implied field for robustness
}

export interface PendingBooking {
    vehicle: Product;
    bookingDetails: any;
}

export interface FlightBooking {
    id: string;
    userId: string;
    userName?: string;
    userPhone?: string;
    type: 'one-way' | 'round-trip';
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    passengers: number;
    passengerName?: string;
    travelClass?: 'Economy' | 'Business' | 'First';
    status: 'pending' | 'quoted' | 'confirmed' | 'issued' | 'cancelled';
    quoteAmount?: number;
    ticketUrl?: string; // Legacy: single ticket
    issuedTickets?: string[]; // Production: multiple PDF tickets
    agentNotes?: string;
    createdAt: string;
}


export type DeliveryStatus = 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';

export interface Delivery {
    id: string;
    orderId: string;
    vendorId: string; // The shop requesting delivery
    driverId?: string; // Assigned driver
    status: DeliveryStatus;
    pickupAddress: Address | string;
    deliveryAddress: Address | string;
    deliveryFee: number;
    distance?: number;
    createdAt: string;
    acceptedAt?: string;
    pickedUpAt?: string;
    deliveredAt?: string;
    estimatedTime?: number;
    driverNotes?: string;
    deliveryPhoto?: string;
    driverLocation?: { lat: number; lng: number; lastUpdated: string };
    isEmergency?: boolean;
    priority?: 'normal' | 'high';
}
