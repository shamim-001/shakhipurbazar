export * from './common';
export * from './user';
export * from './product';
export * from './order';
export * from './vendor';
export * from './admin';
export * from './analytics';
export * from './support';

// AppContextType is the only one left that needs many imports to be defined.
// It acts as the "God Interface" for the context.
// We can move it here or keep it in context folder, but legacy types.ts had it.
// Let's define it here to maintain structure.

import { Language, Page, Theme, HomepageSection, HeroSlide, NewsItem } from './common';
import { User, PaymentMethod } from './user';
import { Product, CategoryCommission } from './product'; // Check if ProductPromotion is in vendor or product? It's in vendor.
import { Vendor, Invitation, Promotion } from './vendor';
import { Order, CartItem, OrderStatus, Transaction, Payout, FlightBooking, PendingBooking } from './order';
import { Notification, AdminRole, PlatformSettings, Permission, ActivityLog, ActivityAction, ChangeRecord, LogFilters } from './admin';
import { ChatThread, SupportTicket } from './support';
import { BulkResult, WorkflowTransition } from './analytics';
// Correction: ProductPromotion is in vendor.ts in my previous step.
import { ProductPromotion as VendorProductPromotion } from './vendor';

export interface AppContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    cart: CartItem[];
    addToCart: (product: Product, quantity: number, selectedCustomizations?: { [key: string]: string | string[] }, rentalDetails?: { date: string; from: string; to: string }) => void;
    removeFromCart: (cartItemId: string) => void;
    updateCartQuantity: (cartItemId: string, quantity: number) => void;
    getCartTotal: () => number;
    clearCart: () => void;
    theme: Theme;
    toggleTheme: () => void;
    products: Product[];
    addProduct: (product: Product) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    updateProduct: (updatedProduct: Product) => Promise<void>;
    updateVendor: (vendorId: string, updatedData: Partial<Vendor>) => Promise<void>;
    updateProductStatus: (productId: string, status: Product['status'], reason?: string) => Promise<void>;
    updateResellItem: (productId: string, status: Product['resellStatus']) => void;
    deleteResellItem: (productId: string) => void;
    wishlist: Product[];
    addToWishlist: (product: Product) => void;
    removeFromWishlist: (productId: string) => void;
    isProductInWishlist: (productId: string) => boolean;
    recentlyViewed: Product[];
    addRecentlyViewed: (product: Product) => void;
    chatThreads: ChatThread[];
    sendMessage: (threadId: string, messageText: string) => void;
    startChat: (participantId: string, context?: { type?: 'order' | 'product' | 'flight' | 'general' | 'support'; id?: string; productId?: string; orderId?: string; vendorId?: string; prefilledMessage?: string; contextType?: 'order' | 'product' | 'flight' | 'general' | 'support'; contextId?: string; subject?: string }) => Promise<string>;
    notifications: Notification[];
    markNotificationAsRead: (id: string) => void;
    markAllNotificationsAsRead: () => void;
    markAllMessagesAsRead: () => Promise<void>;
    createNotification: (data: any) => Promise<void>;
    currentUser: User | null;
    loading: boolean;
    users: User[];
    login: (email: string, pass: string) => Promise<User | null>; // Updated to Promise
    loginWithGoogle: () => Promise<User | null>;
    loginWithFacebook: () => Promise<User | null>;
    logout: () => Promise<void>; // Updated to Promise
    register: (name: string, email: string, password?: string) => Promise<User | null>; // Added password, Promisified
    registerVendor: (formData: any) => Promise<User | null>;
    registerRider: (formData: any) => Promise<User | null>;
    registerDeliveryMan: (formData: any) => Promise<User | null>; // ADDED
    registerAgency: (formData: any) => Promise<User | null>;
    vendors: Vendor[];
    orders: Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus, podUrl?: string) => Promise<void>;
    cancelOrder: (orderId: string, cancelledBy?: 'customer' | 'rider', reason?: string) => Promise<void>;
    assignDriverToOrder: (orderId: string, driverId: string) => void;
    requestRefund: (orderId: string, reason: string) => void;
    confirmOrderReceipt: (orderId: string) => Promise<void>;
    extendReviewPeriod: (orderId: string) => Promise<void>;
    updateVendorStatus: (vendorId: string, status: Vendor['status']) => Promise<void>;
    updateVendorOnlineStatus: (vendorId: string, status: 'Online' | 'Offline') => Promise<void>;
    updateVendorServiceMode: (vendorId: string, mode: 'ride' | 'delivery' | 'both') => Promise<void>;
    categoryCommissions: CategoryCommission[];
    updateCategoryCommissions: (categories: CategoryCommission[]) => void;
    updateCategory: (originalCategoryEn: string, updatedCategory: CategoryCommission) => Promise<void>;
    addCategoryCommission: (newCommission: CategoryCommission) => Promise<void>;
    deleteCategoryCommission: (categoryEn: string, migrateToId?: string) => Promise<void>;
    reorderCategories: (reorderedCategories: CategoryCommission[]) => Promise<void>;
    addSubCategory: (parentCategoryEn: string, newSubCategory: { en: string; bn: string }) => void;
    updateSubCategory: (parentCategoryEn: string, originalSubCategoryEn: string, updatedSubCategory: { en: string; bn: string }) => void;
    deleteSubCategory: (parentCategoryEn: string, subCategoryEn: string) => void;
    payouts: Payout[];
    processPayout: (vendorId: string, amount: number) => void;
    requestVendorPayout: (vendorId: string, amount: number, methodDetails: { method: string, accountType: string, accountNumber: string, bankDetails?: any }) => Promise<void>;
    updateUser: (updatedUser: Partial<User>) => void;
    placeOrder: (ordersToPlace: Omit<Order, 'id' | 'date' | 'statusHistory'>[], paymentMethod?: 'COD' | 'bKash' | 'Nagad' | 'Card' | 'Wallet', guestUser?: User) => Promise<{ orderIds: string[], redirectUrl?: string }>;
    bookRide: (vehicle: Product, rentalInfo: any, paymentMethod?: string) => void;
    bookFlight: (flight: Product, bookingInfo: any, paymentMethod?: string) => void;
    updateDriverLocation: (orderId: string, lat: number, lng: number) => void;
    newsItems: NewsItem[];
    pendingBooking: PendingBooking | null;
    setPendingBooking: (booking: PendingBooking | null) => void;

    // Wallet & Dropshipping
    walletTransactions: Transaction[];
    topUpWallet: (amount: number, method: string) => void;
    payWithWallet: (amount: number, description: string) => Promise<boolean>;
    importDropshipProduct: (product: Product) => void;
    sakhipurPrimeVendorId: string;

    homepageSections: HomepageSection[];
    updateHomepageSections: (sections: HomepageSection[]) => void;

    // Global Settings
    platformSettings: PlatformSettings;
    updatePlatformSettings: (settings: Partial<PlatformSettings>) => void;
    heroSlides: HeroSlide[];
    updateHeroSlides: (slides: HeroSlide[]) => void;

    // Admin User Management
    adminRoles: AdminRole[];
    createAdminUser: (userData: Omit<User, 'id' | 'walletBalance'>) => Promise<User | null>;
    updateUserById: (userId: string, updates: Partial<User>) => void;
    deleteUserById: (userId: string) => void;
    toggleUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => void;

    // Role Management
    createRole: (roleData: Omit<AdminRole, 'id' | 'createdAt'>) => Promise<AdminRole | null>;
    updateRole: (roleId: string, updates: Partial<AdminRole>) => Promise<void>;
    deleteRole: (roleId: string) => Promise<boolean>;

    // Permission Utilities
    hasPermission: (permission: Permission) => boolean;
    getUserPermissions: (userId: string) => Permission[];

    // Activity Logging & Audit Trail
    activityLogs: ActivityLog[];
    logActivity: (action: ActivityAction, target: {
        type: 'user' | 'vendor' | 'order' | 'product' | 'payout' | 'settings' | 'category' | 'promotion';
        id: string;
        name: string;
        changes?: ChangeRecord[];
        metadata?: any;
    }) => Promise<void>;
    getActivityLogs: (filters?: LogFilters) => ActivityLog[];
    exportActivityLogs: (filters?: LogFilters) => void;

    // Order Workflow Management
    pendingTransitions: WorkflowTransition[];
    checkWorkflowTransitions: () => void;

    // Bulk Operations
    bulkApproveVendors: (vendorIds: string[]) => Promise<BulkResult>;
    bulkRejectVendors: (vendorIds: string[], reason?: string) => Promise<BulkResult>;
    bulkDeleteVendors: (vendorIds: string[]) => Promise<BulkResult>;
    bulkApproveProducts: (productIds: string[]) => Promise<BulkResult>;
    bulkRejectProducts: (productIds: string[], reason?: string) => Promise<BulkResult>;
    bulkDeleteProducts: (productIds: string[]) => Promise<BulkResult>;
    bulkUpdateOrders: (orderIds: string[], updates: Partial<Order>) => Promise<BulkResult>;
    bulkExport: (items: any[], filename: string) => void;

    // Product Promotion Management
    productPromotions: VendorProductPromotion[];
    createPromotion: (promotionData: Omit<VendorProductPromotion, 'id' | 'status' | 'createdAt'>) => Promise<VendorProductPromotion | null>;
    updatePromotion: (id: string, updates: Partial<VendorProductPromotion>) => Promise<void>;
    pausePromotion: (id: string) => Promise<void>;
    resumePromotion: (id: string) => Promise<void>;
    cancelPromotion: (id: string) => Promise<void>;
    processPromotionBudgets: () => void; // Daily budget deduction
    getActivePromotions: (vendorId?: string) => VendorProductPromotion[];
    getPromotionByProductId: (productId: string) => VendorProductPromotion | undefined;
    minimumPromotionBid: number;

    // Reseller & Affiliate System
    generateReferralCode: (userId: string) => string;
    enableResellerMode: (userId: string) => void;

    // Vendor-Managed Delivery Marketplace
    requestDelivery: (orderId: string, deliveryManId: string) => void;
    acceptDeliveryRequest: (orderId: string) => void;
    rejectDeliveryRequest: (orderId: string, reason?: string) => void;
    confirmHandover: (orderId: string) => void;

    // Flight Booking System
    flightBookings: FlightBooking[];
    requestFlightBooking: (booking: Omit<FlightBooking, 'id' | 'userId' | 'status' | 'createdAt'>) => Promise<void>;
    updateFlightBookingStatus: (id: string, status: FlightBooking['status'], data?: Partial<FlightBooking>) => Promise<void>;
    sendAttachment: (threadId: string, file: File | Blob, type: 'image' | 'file') => Promise<void>;
    startSupportChat: (subject: string) => Promise<string>;
}
