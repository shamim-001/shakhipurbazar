export interface Product {
    id: string;
    slug?: string;
    name: { en: string; bn: string };
    category: { en: string; bn: string };
    subCategory?: { en: string; bn: string };
    price: number;
    vendorId?: string; // Links to a Vendor (Shop or Driver)
    sellerId?: string; // For C2C resell (Links to User ID)
    stock: number;
    rating: number;
    description: { en: string; bn: string };
    images: string[];
    videoUrl?: string; // URL for product video
    isActive?: boolean;
    productType?: 'new' | 'wholesale' | 'resell' | 'rental' | 'flight' | 'vehicle';
    updatedAt?: string;
    resellStatus?: 'active' | 'sold' | 'delisted';
    condition?: 'Like New' | 'Gently Used' | 'Used';

    // Wholesale Fields
    wholesaleEnabled?: boolean;
    minOrderQuantity?: number;
    wholesalePrice?: number;

    // Resell / Trust Fields
    negotiable?: boolean;
    authenticityVerified?: boolean;

    // Dropshipping Fields
    isDropship?: boolean;
    dropshipSource?: 'AliExpress' | 'CJ' | 'Other';
    originalUrl?: string;

    variants?: {
        name: { en: string; bn: string };
        price: number;
    }[];
    colorOptions?: string[]; // e.g., ["Red", "Blue"]
    sizeOptions?: string[];  // e.g., ["S", "M", "L", "XL"]
    cakeFlavours?: { en: string; bn: string }[];
    deliveryInfo?: { en: string; bn: string };
    reviews?: {
        id: string;
        customerName: string;
        customerImage: string;
        comment: { en: string; bn: string };
        rating: number;
        date: string;
        status?: 'Pending' | 'Approved' | 'Rejected';
    }[];
    customizations?: {
        title: { en: string; bn: string };
        type: 'single' | 'multiple';
        options: {
            en: string;
            bn: string;
            priceModifier?: number;
        }[];
    }[];
    specifications?: {
        key: { en: string; bn: string };
        value: { en: string; bn: string };
    }[];
    vehicleDetails?: {
        type: 'Sedan' | 'Microbus' | 'Truck' | 'Ambulance' | 'CNG' | 'Bike';
        seats: number;
        ac: boolean;
        fuelType: 'CNG' | 'Petrol' | 'Diesel' | 'Hybrid';
        driverIncluded: boolean;
        driverName?: string;
        driverRating?: number;
        totalTrips?: number;
        isVerified?: boolean;
        locationLat?: number;
        locationLng?: number;
    };
    flightDetails?: {
        airline: string;
        flightNumber: string;
        originCode: string;
        destinationCode: string;
        departureTime: string; // HH:mm
        arrivalTime: string; // HH:mm
        duration: string;
        stops: number;
        class: 'Economy' | 'Business';
    };
    status?: 'Pending' | 'Approved' | 'Rejected' | 'ReviewRequested';
    rejectionReason?: string;

    // Product Promotion Fields
    activePromotionId?: string; // Links to ProductPromotion
    isPromoted?: boolean; // Helper flag for quick checks

    // Lifecycle Fields
    archivedAt?: string;
    isArchived?: boolean; // Optional helper

    // Multi-Level Approval System
    pendingChanges?: Partial<Product>;
    riskLevel?: 0 | 1 | 2 | 3;
    approvalStatus?: 'approved' | 'pending_review' | 'rejected';
    lastRiskCheck?: string;
    reviewRequestReason?: string;

    // Pre-order System
    isPreorder?: boolean;
    preorderReleaseDate?: string; // ISO Date String
    preorderNote?: string;
}

export interface UserReview {
    id: string;
    productId: string;
    vendorId?: string;
    customerId: string;
    customerName: string;
    customerImage: string;
    rating: number;
    comment: { en: string; bn: string };
    date: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    createdAt?: any; // Firestore serverTimestamp
}

export interface CategoryCommission {
    id: string; // Added ID for easier management
    slug?: string;
    category: { en: string; bn: string };
    commissionRate: number;
    isActive: boolean;
    type?: 'vendor' | 'reseller' | 'both';
    icon?: string; // For category emoji or icon name
    subCategories: {
        id: string;
        name: { en: string; bn: string };
        value: string; // usage value e.g. 'smartphones'
        isActive?: boolean;
    }[];
    order?: number; // For drag and drop ordering
}

