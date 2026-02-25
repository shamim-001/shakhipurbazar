import { ThemeColors, SectionConfig, HomepageSection, CustomProductSection, FAQItem, DeliveryZone } from './common';
import { Page } from './common';

// Permission system for role-based access control
export type Permission =
    | 'users.view' | 'users.create' | 'users.edit' | 'users.delete'
    | 'vendors.view' | 'vendors.approve' | 'vendors.suspend' | 'vendors.edit'
    | 'drivers.view' | 'drivers.approve' | 'drivers.suspend'
    | 'agencies.view' | 'agencies.approve' | 'agencies.suspend'
    | 'orders.view' | 'orders.edit' | 'orders.cancel'
    | 'products.view' | 'products.approve' | 'products.delete' | 'products.edit'
    | 'payouts.view' | 'payouts.approve' | 'payouts.reject'
    | 'categories.view' | 'categories.edit'
    | 'settings.view' | 'settings.edit'
    | 'reports.view' | 'reports.generate'
    | 'roles.view' | 'roles.create' | 'roles.edit' | 'roles.delete'
    | 'promotions.view' | 'promotions.manage' | 'promotions.approve'
    | 'pages.view' | 'pages.edit' | 'pages.delete'
    | 'chats.view' | 'chats.edit' | 'chats.moderation'
    | 'analytics.view' | 'health.view' | 'logs.view'
    | 'dropshipping.view' | 'dropshipping.manage'
    | 'delivery.view' | 'delivery.manage'
    | '*'; // Wildcard for super admin

// Admin role definition
export interface AdminRole {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    isSystemRole: boolean; // Cannot be deleted if true
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
}

// Activity Log & Audit Trail System
export type ActivityAction =
    // User actions
    | 'user.created' | 'user.updated' | 'user.deleted' | 'user.suspended' | 'user.activated'
    // Vendor actions
    | 'vendor.created' | 'vendor.approved' | 'vendor.rejected' | 'vendor.suspended' | 'vendor.activated'
    // Order actions
    | 'order.created' | 'order.confirmed' | 'order.cancelled' | 'order.refunded' | 'order.status_changed'
    // Product actions
    | 'product.created' | 'product.approved' | 'product.rejected' | 'product.deleted' | 'product.updated'
    // Payout actions
    | 'payout.requested' | 'payout.approved' | 'payout.rejected' | 'wallet.topup'
    // Settings actions
    | 'settings.updated' | 'category.created' | 'category.updated' | 'category.deleted'
    // Promotion actions
    | 'promotion.created' | 'promotion.paused' | 'promotion.resumed' | 'promotion.cancelled' | 'promotion.budget_updated'
    // Auth actions
    | 'auth.login_success' | 'auth.login_failed' | 'auth.logout'
    // Bulk actions
    | 'bulk.approve' | 'bulk.reject' | 'bulk.delete' | 'bulk.export' | 'bulk.update';

export interface ChangeRecord {
    field: string;
    oldValue: any;
    newValue: any;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: string;
    action: ActivityAction;
    targetType: 'user' | 'vendor' | 'order' | 'product' | 'payout' | 'settings' | 'category' | 'promotion';
    targetId: string;
    targetName: string;
    changes?: ChangeRecord[];
    metadata?: {
        bulkCount?: number;
        ipAddress?: string;
        userAgent?: string;
        reason?: string;
    };
    severity: 'info' | 'warning' | 'critical';
}

export interface LogFilters {
    userId?: string;
    action?: ActivityAction;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
    severity?: 'info' | 'warning' | 'critical';
    searchTerm?: string;
}

export interface Notification {
    id: string;
    type: 'order' | 'promo' | 'new_product' | 'payout_request' | 'product_approval' | 'ride_request' | 'message' | 'system';
    title: { en: string; bn: string };
    message: { en: string; bn: string };
    read: boolean;
    date: string;
    link?: Page;
    data?: any;
}

export interface PlatformSettings {
    // General Settings
    deliveryFee: number;
    freeDeliveryThreshold: number;
    defaultCommission: number;
    appName?: string;
    logoUrl?: string;
    supportEmail?: string;
    supportPhone?: string;
    faqs: FAQItem[];
    helpCenterContent?: {
        title: { en: string; bn: string };
        description: { en: string; bn: string };
    };
    contactEmail?: string;
    contactPhone?: string;

    // Feature Flags
    features?: {
        enableWalletPayments: boolean;
        deliveryCommissionRate?: number;
    };

    // Theme & UI
    themeSettings: {
        light: ThemeColors;
        dark: ThemeColors;
    };

    // Content & Social
    announcement: {
        show: boolean;
        message: { en: string; bn: string };
        link: string;
    };
    socialLinks: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        youtube?: string;
    };
    footerDescription: { en: string; bn: string };
    copyrightText: { en: string; bn: string };

    // Homepage Config
    homepageSections: {
        hero: SectionConfig;
        promotions: SectionConfig;
        categories: SectionConfig;
        featured: SectionConfig;
    };
    showFeaturedShops?: boolean;


    // NEW: Launch Control
    maintenanceMode?: {
        enabled: boolean;
        message: { en: string; bn: string };
    };
    moduleToggles?: {
        wholesale: boolean;
        resell: boolean;
        rentacar: boolean;
        flights: boolean;
        delivery: boolean;
    };

    mainTabs: {
        [key: string]: { show: boolean; label: { en: string; bn: string } };
    };
    customProductSections: CustomProductSection[];

    // Payout Settings
    payoutDestination?: {
        method: 'bKash' | 'Nagad' | 'Bank';
        accountNumber: string;
        bankName?: string;
    };

    commissions?: {
        reseller: number;
        agency: number;
        driver: number;
    };
    deliveryZones?: DeliveryZone[];

    // Legacy/Unused fields kept optional
    showPromotionsSection?: boolean;
    showFeaturedSection?: boolean;
    announcementBar?: any;

    // NEW: CMS Pages
    contentPages?: Record<string, any>; // PageContent is in common but can be cyclic, use any/PageContent
    // NEW: Analytics
    analytics?: {
        gtmId: string;
        enabled: boolean;
        headScripts?: string;
        bodyScripts?: string;
    };
}
