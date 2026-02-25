import { Address, Theme } from './common';

export interface PaymentMethod {
    id: string;
    type: 'bKash' | 'Nagad' | 'Bank Card';
    identifier: string; // Masked phone or card number
    details?: any; // Extra details
    isDefault?: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin' | 'vendor' | 'staff' | 'delivery' | 'super_admin' | 'agency' | 'driver' | 'reseller'; // Expanded roles
    shopId?: string;   // ID if the user owns a standard shop
    driverId?: string; // ID if the user is a registered RIDER (Rent-a-Car)
    deliveryManId?: string; // ID if the user is a registered DELIVERY MAN (Products)
    agencyId?: string; // ID if the user is a travel agent
    employerVendorId?: string; // For team members - tracks which vendor employs them
    phone?: string;
    agencyLicense?: string; // Required for agency registration
    deliveryManProfile?: {
        isAvailable: boolean;
        currentLocation?: { lat: number; lng: number };
        deliveryFee: number; // Per delivery charge
        rating: number; // 1-5 stars
        totalDeliveries: number; // Completed deliveries count
    };
    address?: string; // Legacy: Simple string address
    addressBook?: Address[]; // New: Structured Address Book
    image?: string;
    walletBalance: number;
    paymentMethods?: PaymentMethod[]; // Saved payment methods
    // Reseller Fields
    referralCode?: string; // Unique code this user shares
    referredBy?: string; // ID of the user who referred this user
    isReseller?: boolean; // If true, has access to Reseller Dashboard
    resellerEarnings?: number; // Total earnings from commissions
    resellerJoinDate?: string;
    // Admin-specific fields
    adminRole?: string; // Role ID for admin users (references AdminRole)
    permissions?: string[]; // Denormalized permissions for Security Rules
    payoutSettings?: {
        method: 'bKash' | 'Rocket' | 'Nagad' | 'Bank Transfer';
        accountType: 'Personal' | 'Agent' | 'Bank';
        accountNumber: string;
        bankDetails?: {
            bankName: string;
            branchName: string;
            accountName: string;
        };
        lastUpdated: string;
    };
    status?: 'active' | 'inactive' | 'suspended';
    lastLogin?: string;
    createdAt?: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | Address;
    orders: number;
    image: string;
}

export interface Testimonial {
    id: string;
    customerName: string;
    customerImage: string;
    comment: { en: string; bn: string };
    rating: number;
}
