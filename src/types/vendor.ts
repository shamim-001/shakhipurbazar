export interface Vendor {
    id: string;
    slug?: string;
    type: 'shop' | 'rider' | 'deliveryMan' | 'agency'; // Explicitly distinguish type - 'driver' is deprecated/split
    name: { en: string; bn: string };
    owner: string;
    email: string;
    location: string;
    rating: number;
    joined: string;
    payment: string;
    bannerImage: string;
    logo: string;
    category: { en: string; bn: string };
    distance: number;
    isFeatured: boolean;
    status: 'Active' | 'Pending' | 'Suspended';
    onlineStatus: 'Online' | 'Offline';
    lastPayoutDate?: string;
    payoutRequested?: boolean;
    driversLicense?: string;
    agencyLicense?: string;
    walletBalance: number;
    pendingBalance: number;
    serviceMode?: 'ride' | 'delivery' | 'both';
    deliveryManProfile?: {
        isAvailable: boolean;
        currentLocation?: { lat: number; lng: number };
        deliveryFee: number; // Per delivery charge  
        rating: number; // 1-5 stars
        totalDeliveries: number; // Completed deliveries count
    };
    isVerified?: boolean;
    vendorId?: string; // For team delivery men, links to the employing vendor (shop)
    featuredData?: {
        status: 'none' | 'manual' | 'auto';
        priority: number;   // 1-100, manual uses this for ranking
        expiry?: string;    // ISO date for temporary manual featuring
        autoScore: number;  // Calculated performance score
        lastUpdated: string;
    };
    stats?: {
        totalOrders: number;
        avgRating: number;
    };
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
    guaranteePeriod?: 0 | 7 | 15 | 30; // Refund guarantee period in days
}

export interface Invitation {
    id: string;
    type: 'team_join';
    fromVendorId: string;
    fromVendorName: { en: string; bn: string }; // Denormalized for display
    toDeliveryManId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export interface Promotion {
    id: string;
    type: 'banner' | 'card';
    title: { en: string; bn: string };
    image: string;
    discountText: { en: string; bn: string };
    category: string;
    vendorId?: string;
    bgColorClass: string;
}

export interface ProductPromotion {
    id: string;
    productId: string;
    vendorId: string;
    dailyBudget: number; // Amount deducted daily
    totalSpent: number; // Total amount spent so far
    remainingBudget: number; // Available budget
    startDate: string;
    endDate?: string; // Optional end date
    status: 'active' | 'paused' | 'ended' | 'pending_approval';
    priority: number; // Calculated from dailyBudget for sorting
    createdAt: string;
    lastDeductionDate?: string; // Last time daily budget was deducted
}
