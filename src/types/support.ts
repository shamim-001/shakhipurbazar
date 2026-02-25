import { Page } from './common';

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: string;
    type?: 'text' | 'image' | 'file' | 'system' | 'product_link' | 'order_link';
    metadata?: {
        productId?: string;
        orderId?: string;
        imageUrl?: string;
        quickReplyId?: string;
        isAdminAction?: boolean;
        senderName?: string;
        url?: string;
        filename?: string;
        size?: number;
    };
    seenBy?: { [userId: string]: string }; // userId -> ISO timestamp
}

export interface ChatThread {
    id: string;
    participantIds: string[];
    participantRoles?: { [userId: string]: 'customer' | 'vendor' | 'admin' | 'delivery' };
    lastMessage?: string;
    lastMessageAt?: string;
    lastSenderId?: string;
    productId?: string;
    orderId?: string;
    vendorId?: string;
    customerId?: string;
    unreadCount?: { [userId: string]: number };
    status?: 'active' | 'archived' | 'blocked';
    lastActionBy?: string; // userId who performed the last major action (e.g. sent message)
    subject?: string;
    history: ChatMessage[]; // Maintained for backward compatibility or small threads

    // Context Awareness
    contextType?: 'order' | 'product' | 'flight' | 'general' | 'support';
    contextId?: string; // ID of the Order, Product, or Flight Booking
    metadata?: {
        type?: 'order' | 'product' | 'flight' | 'general' | 'support';
        id?: string;
        productId?: string;
        orderId?: string;
        vendorId?: string;
        customerId?: string;
        subject?: string;
        contextType?: 'order' | 'product' | 'flight' | 'general' | 'support';
        [key: string]: any;
    };
}

export interface QuickReply {
    id: string;
    role: 'vendor' | 'delivery' | 'admin';
    template: { en: string; bn: string };
    category?: string;
    usageCount?: number;
}

export type SupportCategory = 'Help Center' | 'Contact Customer Care' | 'Shipping & Delivery' | 'Order' | 'Payment' | 'Returns & Refunds';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    category: SupportCategory;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: 'Low' | 'Medium' | 'High' | 'Emergency';
    createdAt: string;
    updatedAt: string;
    messages?: {
        id: string;
        senderId: string;
        senderName: string;
        content: string;
        timestamp: string;
        isAdmin: boolean;
    }[];
}

