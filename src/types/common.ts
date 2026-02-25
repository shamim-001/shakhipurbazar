
export interface Address {
    id: string;
    label: string; // e.g., "Home", "Office"
    recipientName: string;
    phone: string;
    addressLine: string;
    area: string; // Used for delivery zone calculation
    isDefault: boolean;
}

export type Language = 'en' | 'bn';

export type Page =
    | { name: 'initial' }
    | { name: 'home' }
    | { name: 'category'; category: string }
    | { name: 'product'; productId: string }
    | { name: 'vendor'; vendorId: string }
    | { name: 'cart' }
    | { name: 'shops' }
    | { name: 'wholesale' }
    | { name: 'resell' }
    | { name: 'rentacar' }
    | { name: 'flights' }
    | { name: 'vendorRegister' }
    | { name: 'riderRegister' }
    | { name: 'agencyRegister' }
    | { name: 'agencyRegister' }
    | { name: 'deliveryManRegister' } // New Page
    | { name: 'riderDashboard' }
    | { name: 'deliveryManDashboard' } // New Page
    | { name: 'agencyDashboard' }
    | { name: 'register' }
    | { name: 'userProfile'; tab?: string }
    | { name: 'inbox' }
    | { name: 'chat'; threadId: string }
    | { name: 'searchResults'; query: string }
    | { name: 'login' }
    | { name: 'adminDashboard' }
    | { name: 'vendorDashboard' }
    | { name: 'resellerDashboard' }
    | { name: 'addProductPage', productType?: 'new' | 'wholesale' | 'resell' }
    | { name: 'editProductPage'; productId: string }
    | { name: 'orderSuccess'; orderIds: string[] };

export type Theme = 'light' | 'dark';

export interface ThemeColors {
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    buttonPrimary?: string;
    buttonText?: string;
    youtube?: string;
}

export interface SectionConfig {
    show: boolean;
    title: { en: string; bn: string };
    subtitle?: { en: string; bn: string };
    placeholder?: { en: string; bn: string };
}

export interface HeroSlide {
    id: string;
    image: string;
    title: { en: string; bn: string };
    subtitle: { en: string; bn: string };
    link: string;
    active: boolean; // Control visibility
    text?: { en: string; bn: string }; // Optional distinct text if needed
    homepageSections?: { // Added from second definition
        hero: {
            show: boolean;
            title: { en: string; bn: string };
            subtitle: { en: string; bn: string };
            placeholder: { en: string; bn: string };
        };
        promotions: { show: boolean; title: { en: string; bn: string } };
    };
}

export interface HomepageSection {
    id: string;
    title: { en: string; bn: string };
    targetCategoryId: string; // Category ID or 'CAT::parentId::subName'
    priority: number;
    isActive: boolean;
    displayLimit?: number;
}

export interface NewsItem {
    id: string;
    title: { en: string; bn: string };
    summary: { en: string; bn: string };
    date: string;
    image: string;
}

export interface PageContent {
    title: string;
    content: string; // HTML or Markdown
    lastUpdated: string;
    isVisible: boolean;
}

export interface FAQItem {
    id: string;
    question: { en: string; bn: string };
    answer: { en: string; bn: string };
    category?: string;
}

export interface DeliveryZone {
    id: string;
    name: { en: string; bn: string };
    fee: number;
    isActive: boolean;
    description?: { en: string; bn: string };
}

export interface CustomProductSection {
    id: string;
    title: { en: string; bn: string };
    productIds: string[];
    show: boolean;
}
