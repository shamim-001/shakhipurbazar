import React, { useMemo } from 'react';
import { AppContext } from './AppContext';
import { useAuth } from '../auth/AuthContext';
import { useCart } from './CartContext';
import { useOrders } from './OrderContext';
import { useProducts } from './ProductContext';
import { useSystem } from './SystemContext';
import { useUsers } from './UserContext';
import { useChat } from './ChatContext';
import { useEconomics } from './EconomicsContext';
import { usePromotions } from './PromotionContext';
import { AppContextType } from '../../types';
import { UserService } from '../services/userService';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useAuth();
    const cart = useCart();
    const orders = useOrders();
    const products = useProducts();
    const system = useSystem();
    const users = useUsers();
    const chat = useChat();
    const economics = useEconomics();
    const promotions = usePromotions();

    // Constant usually defined in AppProvider
    const sakhipurPrimeVendorId = 'SAKHIPUR-PRIME';

    const combinedValue = useMemo(() => {
        const baseValues = {
            ...auth,
            ...system,
            ...cart,
            ...orders,
            ...products,
            ...users,
            ...chat,
            ...economics,
            ...promotions,
            sakhipurPrimeVendorId
        };

        const overrides = {
            // Activity log stubs
            activityLogs: [] as any[],
            logActivity: async () => { },
            getActivityLogs: () => [],
            exportActivityLogs: () => { },

            // Analytics / Management stubs
            processPromotionBudgets: () => promotions.processPromotionBudgets(),
            generateReferralCode: () => '',
            markAllMessagesAsRead: async () => {
                if (!auth.currentUser) return;
                const threadsToMark = chat.chatThreads.filter(t => (t.unreadCount?.[auth.currentUser!.uid] || 0) > 0);
                await Promise.all(threadsToMark.map(t => chat.markAsRead(t.id)));
            },
            createNotification: async (data: any) => {
                const { createNotification } = await import('../services/notificationService');
                await createNotification(data);
            },

            // Professional Registration
            registerVendor: async (formData: any) => {
                const res = await UserService.registerVendor(formData, auth.currentUser ? { ...auth.currentUser, ...users.currentUser } as any : null);
                return res.user;
            },
            registerRider: async (formData: any) => {
                const res = await UserService.registerRider(formData, auth.currentUser ? { ...auth.currentUser, ...users.currentUser } as any : null);
                return res.user;
            },
            registerDeliveryMan: async (formData: any) => {
                const res = await UserService.registerDeliveryMan(formData, auth.currentUser ? { ...auth.currentUser, ...users.currentUser } as any : null);
                return res.user;
            },
            registerAgency: async (formData: any) => {
                const res = await UserService.registerAgency(formData, auth.currentUser ? { ...auth.currentUser, ...users.currentUser } as any : null);
                return res.user;
            },

            // User Management
            updateUser: (updates: any) => users.updateUser(updates),
            // Admin User Management
            createAdminUser: (userData: any) => UserService.createAdminUser(userData),
            updateUserById: (id: string, updates: any) => users.updateUserById(id, updates),
            deleteUserById: (id: string) => users.deleteUserById(id),
            toggleUserStatus: (id: string, status: any) => users.toggleUserStatus(id, status),
            enableResellerMode: async (userId: string) => {
                await UserService.enableResellerMode(userId);
            },
            updateVendor: (vendorId: string, updates: any) => users.updateVendor(vendorId, updates),
            updateVendorOnlineStatus: (vendorId: string, status: any) => users.updateVendorOnlineStatus(vendorId, status),
            updateVendorStatus: (vendorId: string, status: any) => users.updateVendorStatus(vendorId, status),

            // Wallet & System
            topUpWallet: (amount: number, method: string) => economics.topUpWallet(amount, method),
            payWithWallet: async (amount: number, desc: string) => economics.payWithWallet(users.currentUser?.id || '', amount, '', desc),
            updateHomepageSections: () => { },
            updateHeroSlides: (slides: any) => system.updateHeroSlides(slides),

            // Bulk Operations
            bulkApproveVendors: async () => ({ success: true, count: 0 }),
            bulkRejectVendors: async () => ({ success: true, count: 0 }),
            bulkDeleteVendors: async () => ({ success: true, count: 0 }),
            bulkUpdateOrders: async () => ({ success: true, count: 0 }),
            bulkExport: () => { },
            startSupportChat: (subject: string) => chat.startSupportChat(subject),
        };

        return {
            ...baseValues,
            ...overrides,
            register: (name: string, email: string, password?: string) => auth.register(name, email, password),
        } as unknown as AppContextType;
    }, [auth, system, cart, orders, products, users, chat, economics, promotions]);

    return (
        <AppContext.Provider value={combinedValue}>
            {children}
        </AppContext.Provider>
    );
};
