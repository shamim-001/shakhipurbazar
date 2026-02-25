import { User, Permission, AdminRole } from '../../types';

/**
 * RBACService provides a centralized logic for checking user permissions.
 * It supports both dynamic admin roles and static permissions for other roles.
 */
export const RBACService = {
    /**
     * Static permission sets for non-admin roles.
     * These define what each specialized role can do by default.
     */
    ROLE_PERMISSIONS: {
        customer: [
            'orders.view', // Can view their own orders
        ] as Permission[],

        vendor: [
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'orders.view',
            'orders.edit',
            'payouts.view',
        ] as Permission[],

        delivery: [
            'orders.view',
            'orders.edit', // To update delivery status
        ] as Permission[],

        agency: [
            'orders.view',
            'orders.edit', // To update flight booking status
            'payouts.view',
        ] as Permission[],

        driver: [
            'orders.view',
            'orders.edit', // To update ride/delivery status
            'drivers.view',
        ] as Permission[],

        reseller: [
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'orders.view',
            'payouts.view',
        ] as Permission[],

        super_admin: ['*'] as Permission[],
    },

    /**
     * Principal permission check function.
     * Checks if a user has a specific permission.
     */
    hasPermission: (user: User | null, permission: Permission, adminRoles?: AdminRole[]): boolean => {
        if (!user) return false;

        // 1. Super Admin bypass
        if (user.role === 'super_admin') return true;

        // 2. Specialized Roles (Vendor, Delivery, Agency, etc.)
        if (user.role !== 'admin' && user.role !== 'staff') {
            const staticPerms = RBACService.ROLE_PERMISSIONS[user.role as keyof typeof RBACService.ROLE_PERMISSIONS];
            if (staticPerms) {
                if (staticPerms.includes('*')) return true;
                return staticPerms.includes(permission);
            }
            return false;
        }

        // 3. Admin / Staff (Dynamic RBAC)
        // If we have the roles list provided, we check the specific adminRole record
        if (adminRoles && user.adminRole) {
            const roleRecord = adminRoles.find(r => r.id === user.adminRole);
            if (roleRecord) {
                if (roleRecord.permissions.includes('*')) return true;
                return roleRecord.permissions.includes(permission);
            }
        }

        // Fallback for legacy admin (if no specific role record is found but they are marked as 'admin')
        if (user.role === 'admin') {
            // Broaden default access for basic admins to include all core modules
            return (
                permission.startsWith('orders.') ||
                permission.startsWith('products.') ||
                permission.startsWith('vendors.') ||
                permission.startsWith('users.') ||
                permission.startsWith('drivers.') ||
                permission.startsWith('agencies.') ||
                permission.startsWith('payouts.') ||
                permission.startsWith('categories.') ||
                permission.startsWith('settings.') ||
                permission.startsWith('analytics.') ||
                permission.startsWith('promotions.') ||
                permission.startsWith('pages.') ||
                permission.startsWith('delivery.') ||
                permission.startsWith('health.') ||
                permission.startsWith('logs.') ||
                permission.startsWith('chats.') ||
                permission.startsWith('roles.') ||
                permission.startsWith('dropshipping.')
            );
        }

        return false;
    },

    /**
     * Helper to check multiple permissions (requires all)
     */
    hasAllPermissions: (user: User | null, permissions: Permission[], adminRoles?: AdminRole[]): boolean => {
        return permissions.every(p => RBACService.hasPermission(user, p, adminRoles));
    },

    /**
     * Helper to check if user has any of the listed permissions
     */
    hasAnyPermission: (user: User | null, permissions: Permission[], adminRoles?: AdminRole[]): boolean => {
        return permissions.some(p => RBACService.hasPermission(user, p, adminRoles));
    }
};
