import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'vendor' | 'customer' | 'delivery' | 'agency' | 'super_admin')[];
    requireAdmin?: boolean;
    requireVendor?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireAdmin, requireVendor }) => {
    const { currentUser, loading } = useApp();
    const location = useLocation();

    if (loading) {
        return <div className="p-10 text-center">Loading...</div>;
    }

    if (!currentUser) {
        // Redirect to login while saving the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Super Admin Bypass
    if (currentUser.role === 'super_admin') return <>{children}</>;

    if (requireAdmin) {
        // strict admin check
        const isAdmin = currentUser.role === 'admin' || !!currentUser.adminRole;
        if (!isAdmin) {
            return <Navigate to="/" replace />;
        }
    }

    if (requireVendor) {
        // Vendor check - must have shopId OR be a reseller for resell items
        const isResellPath = location.pathname === '/add-product' && new URLSearchParams(location.search).get('type') === 'resell';
        const isReseller = currentUser.isReseller || currentUser.role === 'reseller';

        if (!currentUser.shopId && !(isResellPath && isReseller)) {
            return <Navigate to="/vendor-register" replace />; // Updated path to match App.tsx if possible
        }
    }

    if (allowedRoles) {
        const hasRole = allowedRoles.includes(currentUser.role);

        // Capability Checks: Allow if user has specific IDs even if role is 'customer'
        const isDelivery = allowedRoles.includes('delivery') && (!!currentUser.driverId || !!currentUser.deliveryManId);
        const isVendor = allowedRoles.includes('vendor') && !!currentUser.shopId;
        const isAgency = allowedRoles.includes('agency') && !!currentUser.agencyId;

        if (!hasRole && !isDelivery && !isVendor && !isAgency) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
