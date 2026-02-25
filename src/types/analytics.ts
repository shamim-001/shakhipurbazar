import { Order, OrderStatus } from './order';

export interface ProductAnalytics {
    productId: string;
    vendorId: string;
    date: string; // Daily aggregation

    // View metrics
    organicViews: number; // Views when NOT promoted
    promotedViews: number; // Views when promoted
    totalViews: number;

    // Click metrics
    organicClicks: number; // Clicks to product page when NOT in promoted position
    promotedClicks: number; // Clicks when in promoted position
    totalClicks: number;

    // Conversion metrics
    organicOrders: number;
    promotedOrders: number;
    totalOrders: number;

    // Revenue metrics
    organicRevenue: number;
    promotedRevenue: number;
    totalRevenue: number;

    // Engagement metrics
    organicCTR: number; // (clicks / views) * 100
    promotedCTR: number;
    organicConversionRate: number; // (orders / clicks) * 100
    promotedConversionRate: number;

    // ROI for promoted
    promotionSpend?: number; // Daily budget spent
    promotionROI?: number; // ((promoted revenue - promotion spend) / promotion spend) * 100
}

export interface AnalyticsEvent {
    id: string;
    eventType: 'view' | 'click' | 'add_to_cart' | 'purchase';
    productId: string;
    vendorId: string;
    userId?: string;
    isPromoted: boolean; // Was the product promoted when this event occurred?
    timestamp: string;
    metadata?: {
        position?: number; // Position in listing
        category?: string;
        searchQuery?: string;
        referrer?: string;
    };
}

export interface VendorAnalyticsReport {
    vendorId: string;
    dateRange: {
        from: string;
        to: string;
    };

    // Overall metrics
    totalProducts: number;
    promotedProducts: number;

    // Aggregated analytics
    organicMetrics: {
        views: number;
        clicks: number;
        orders: number;
        revenue: number;
        ctr: number;
        conversionRate: number;
    };

    promotedMetrics: {
        views: number;
        clicks: number;
        orders: number;
        revenue: number;
        ctr: number;
        conversionRate: number;
        totalSpend: number;
        roi: number;
    };

    // Product-level breakdown
    productBreakdown: ProductAnalytics[];

    // Trends
    dailyTrends: {
        date: string;
        organicRevenue: number;
        promotedRevenue: number;
    }[];
}

// Order Workflow System
export interface WorkflowRule {
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    condition?: (order: Order) => boolean;
    delay?: number; // minutes
    requiresAction?: 'vendor' | 'driver' | 'admin' | 'customer';
    notifications?: string[];
    autoProgress?: boolean;
}

export interface WorkflowTransition {
    orderId: string;
    scheduledFor: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    ruleId: string;
}

// Bulk Operations System
export interface BulkOperation<T = any> {
    action: 'approve' | 'reject' | 'delete' | 'update' | 'export';
    items: T[];
    updates?: Partial<T>;
    options?: {
        skipValidation?: boolean;
        logActivity?: boolean;
        reason?: string;
    };
}

export interface BulkResult {
    success: number;
    failed: number;
    total: number;
    errors: BulkError[];
    completedAt: string;
}

export interface BulkError {
    itemId: string;
    itemName: string;
    error: string;
}
