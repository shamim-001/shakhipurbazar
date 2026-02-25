import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from '../lib/firebase';
import { User as AppUser } from '../types';

// Define the shape of our context
interface AuthContextType {
    currentUser: FirebaseUser | null;
    loading: boolean;
    logout: () => Promise<void>;
    login: (email: string, pass: string) => Promise<FirebaseUser>;
    register: (name: string, email: string, pass?: string) => Promise<FirebaseUser>;
    loginWithGoogle: () => Promise<FirebaseUser>;
    loginWithFacebook: () => Promise<FirebaseUser>;
}

// Create Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        if (auth.currentUser) {
            try {
                const { ActivityLoggerService } = await import('../services/activityLogger');
                ActivityLoggerService.log('auth.logout', auth.currentUser.uid, auth.currentUser.displayName || 'User', 'user', {
                    type: 'user', id: auth.currentUser.uid, name: 'Logout'
                });
            } catch (e) { console.error(e); }
        }
        return signOut(auth);
    };

    const login = async (email: string, pass: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            const { ActivityLoggerService } = await import('../services/activityLogger');
            ActivityLoggerService.log('auth.login_success', result.user.uid, result.user.displayName || email, 'user', {
                type: 'user', id: result.user.uid, name: 'Login'
            });
            return result.user;
        } catch (error: any) {
            const { ActivityLoggerService } = await import('../services/activityLogger');
            ActivityLoggerService.log('auth.login_failed', 'system', 'System', 'system', {
                type: 'user', id: email, name: 'Login Failed', metadata: { error: error.message, email }
            });
            throw error;
        }
    };

    const register = async (name: string, email: string, pass?: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass || '');

            // Create initial user profile in Firestore
            const { UserService } = await import('../services/userService');
            const newUser: AppUser = {
                id: result.user.uid,
                name: name || 'User',
                email: email,
                role: 'customer',
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`,
                phone: '',
                address: '',
                walletBalance: 0,
                addressBook: [],
                createdAt: new Date().toISOString()
            };

            await UserService.createUserProfile(newUser);

            const { ActivityLoggerService } = await import('../services/activityLogger');
            ActivityLoggerService.log('user.created', result.user.uid, email, 'customer', {
                type: 'user', id: result.user.uid, name: 'User Signup'
            });
            return result.user;
        } catch (error) {
            console.error("Registration error in AuthContext:", error);
            throw error;
        }
    };

    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user entry exists in Firestore
        const { UserService } = await import('../services/userService');
        // We cast to string because we know uid exists on FirebaseUser
        const userDoc = await UserService.getUserProfile(user.uid);

        if (!userDoc) {
            // Create new user profile using AppUser type
            const newUser: AppUser = {
                id: user.uid,
                name: user.displayName || 'User',
                email: user.email || '',
                role: 'customer',
                image: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}`,
                phone: '',
                address: '',
                walletBalance: 0,
                addressBook: [],
                createdAt: new Date().toISOString()
            };
            await UserService.createUserProfile(newUser);
            return newUser;
        }

        return userDoc as AppUser;
    };

    const loginWithFacebook = async () => {
        const result = await signInWithPopup(auth, facebookProvider);
        // Similar logic could be applied here if Facebook auth was fully enabled/requested
        return result.user;
    };

    const value = {
        currentUser,
        loading,
        logout,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Hook to use auth
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
