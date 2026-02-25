import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Vendor, AdminRole, Permission, ActivityLog, ActivityAction, LogFilters, ChangeRecord } from '../../types';
import { useAuth } from '../auth/AuthContext';
import { UserService } from '../services/userService';
import { RBACService } from '../services/rbacService';
import { db } from '../lib/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';

interface UserContextType {
    currentUser: User | null;
    loading: boolean;
    users: User[];
    vendors: Vendor[];
    adminRoles: AdminRole[];
    updateUser: (updatedUser: Partial<User>) => Promise<void>;
    updateUserById: (userId: string, updates: Partial<User>) => Promise<void>;
    deleteUserById: (userId: string) => Promise<void>;
    toggleUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => void;
    hasPermission: (permission: Permission) => boolean;
    updateVendor: (vendorId: string, updates: Partial<Vendor>) => Promise<void>;
    updateVendorOnlineStatus: (vendorId: string, status: 'Online' | 'Offline') => Promise<void>;
    updateVendorStatus: (vendorId: string, status: Vendor['status']) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser: authUser } = useAuth();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);

    useEffect(() => {
        if (!authUser) {
            setCurrentUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubProfile = onSnapshot(doc(db, 'users', authUser.uid), (doc) => {
            if (doc.exists()) {
                setCurrentUser({ id: doc.id, ...doc.data() } as User);
            }
            setLoading(false);
        });

        return () => unsubProfile();
    }, [authUser]);

    useEffect(() => {
        // Publicly available data should be loaded here
        const unsubVendors = onSnapshot(collection(db, 'vendors'), (snap) => {
            setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
        });

        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
            return () => unsubVendors();
        }

        const unsubUsers = UserService.subscribeToUsers(setUsers);
        const unsubRoles = UserService.subscribeToRoles(setAdminRoles);
        return () => { unsubUsers(); unsubRoles(); unsubVendors(); };
    }, [currentUser]);

    const updateUser = async (updates: Partial<User>) => {
        if (currentUser) await UserService.updateUserProfile(currentUser.id, updates);
    };

    const updateUserById = async (userId: string, updates: Partial<User>) => {
        await UserService.updateUserProfile(userId, updates);
    };

    const toggleUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
        await UserService.updateUserProfile(userId, { status } as any);
    };

    const deleteUserById = async (userId: string) => {
        await UserService.deleteUserById(userId);
    };

    const hasPermission = (permission: Permission) => {
        return RBACService.hasPermission(currentUser, permission, adminRoles);
    };

    const updateVendor = async (vendorId: string, updates: Partial<Vendor>) => {
        await UserService.updateVendor(vendorId, updates);
    };

    const updateVendorOnlineStatus = async (vendorId: string, status: 'Online' | 'Offline') => {
        await UserService.updateVendor(vendorId, { onlineStatus: status });
    };

    const updateVendorStatus = async (vendorId: string, status: Vendor['status']) => {
        await UserService.updateVendor(vendorId, { status });
    };

    return (
        <UserContext.Provider value={{
            currentUser, loading, users, vendors, adminRoles,
            updateUser, updateUserById, deleteUserById, toggleUserStatus, hasPermission,
            updateVendor, updateVendorOnlineStatus, updateVendorStatus
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUsers must be used within a UserProvider');
    return context;
};
