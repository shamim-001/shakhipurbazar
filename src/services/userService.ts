
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, deleteDoc } from 'firebase/firestore';
import { User, AdminRole } from '../../types';

export const UserService = {
    getUserProfile: async (uid: string): Promise<User | null> => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as User;
            }
            return null;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    subscribeToUsers: (callback: (users: User[]) => void) => {
        const q = query(collection(db, 'users'));
        return onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            callback(users);
        });
    },

    createUserProfile: async (user: User): Promise<void> => {
        try {
            await setDoc(doc(db, 'users', user.id), user);
        } catch (error) {
            console.error("Error creating user profile:", error);
            throw error;
        }
    },

    updateUserProfile: async (uid: string, data: Partial<User>): Promise<void> => {
        try {
            const docRef = doc(db, 'users', uid);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            throw error;
        }
    },

    // Registration Helpers (Moved from App.tsx)
    registerVendor: async (formData: any, currentUser: User | null): Promise<{ user: User, vendor: any }> => {
        try {
            let userToUpdate = currentUser;
            let newUserCreated = false;

            // If no current user, create one (Simulation logic from App.tsx)
            if (!userToUpdate) {
                const newUserId = `VU${Date.now()}`;
                const newUser: User = {
                    id: newUserId,
                    name: formData.ownerName,
                    email: formData.email,
                    role: 'customer',
                    image: `https://picsum.photos/100/100?random=${newUserId}`,
                    phone: formData.phone,
                    address: formData.address,
                    walletBalance: 0,
                    // Initialize arrays if needed by type, though App.tsx didn't always
                    addressBook: []
                };
                userToUpdate = newUser;
                newUserCreated = true;
            }

            if (userToUpdate!.shopId) {
                throw new Error("This account is already registered as a Seller.");
            }

            const newVendorId = `V${Date.now()}`;
            const newVendor = {
                id: newVendorId,
                type: 'shop',
                name: { en: formData.shopNameEn, bn: formData.shopNameBn },
                owner: userToUpdate!.name,
                ownerId: userToUpdate!.id, // Add ownerId matching Auth UID
                email: userToUpdate!.email,
                location: formData.address,
                rating: 0,
                joined: new Date().toISOString().split('T')[0],
                payment: `${formData.paymentMethod}: ${formData.paymentDetails}`,
                bannerImage: 'https://picsum.photos/400/200?random=' + newVendorId,
                logo: 'https://picsum.photos/200/200?random=' + newVendorId,
                category: { en: formData.shopCategory, bn: formData.shopCategory },
                distance: Math.round((Math.random() * 4 + 1) * 10) / 10,
                isFeatured: false,
                status: 'Pending',
                onlineStatus: 'Offline',
                payoutRequested: false,
                walletBalance: 0,
                pendingBalance: 0,
            };

            const isAdmin = userToUpdate!.role === 'admin' || userToUpdate!.role === 'super_admin';
            const updatedUser = {
                ...userToUpdate!,
                shopId: newVendorId,
                role: isAdmin ? userToUpdate!.role : 'vendor' as User['role']
            };

            // Persist to Firestore
            if (newUserCreated) {
                await UserService.createUserProfile(updatedUser);
            } else {
                await UserService.updateUserProfile(updatedUser.id, {
                    shopId: newVendorId,
                    role: isAdmin ? userToUpdate!.role : 'vendor' as User['role']
                });
            }

            // Also save vendor to 'vendors' collection
            await setDoc(doc(db, 'vendors', newVendorId), newVendor);

            return { user: updatedUser, vendor: newVendor };
        } catch (error) {
            console.error("UserService.registerVendor error:", error);
            throw error;
        }
    },

    registerRider: async (formData: any, currentUser: User | null): Promise<{ user: User, vendor: any }> => {
        try {
            let userToUpdate = currentUser;
            let newUserCreated = false;

            if (!userToUpdate) {
                const newUserId = `RU${Date.now()}`;
                const newUser: User = {
                    id: newUserId,
                    name: formData.name,
                    email: formData.email,
                    role: 'customer',
                    image: `https://picsum.photos/100/100?random=${newUserId}`,
                    phone: formData.phone,
                    address: formData.address,
                    walletBalance: 0,
                    addressBook: []
                };
                userToUpdate = newUser;
                newUserCreated = true;
            }

            if (userToUpdate!.driverId) {
                throw new Error("This account is already registered as a Driver.");
            }

            const newVendorId = `RIDER${Date.now()}`;
            const newVendor = {
                id: newVendorId,
                type: 'rider', // UPDATED from 'driver'
                name: { en: formData.name, bn: formData.name },
                owner: userToUpdate!.name,
                ownerId: userToUpdate!.id, // Add ownerId matching Auth UID
                email: userToUpdate!.email,
                location: formData.address,
                rating: 0,
                joined: new Date().toISOString().split('T')[0],
                payment: 'Cash',
                bannerImage: 'https://picsum.photos/400/200?random=' + newVendorId,
                logo: 'https://picsum.photos/200/200?random=' + newVendorId,
                category: { en: 'Rent a Car', bn: 'রেন্ট-এ-কার' },
                distance: 0,
                isFeatured: false,
                status: 'Pending',
                onlineStatus: 'Offline',
                payoutRequested: false,
                driversLicense: formData.license,
                walletBalance: 0,
                pendingBalance: 0,
            };

            const isAdmin = userToUpdate!.role === 'admin' || userToUpdate!.role === 'super_admin';
            const updatedUser = {
                ...userToUpdate!,
                driverId: newVendorId,
                role: isAdmin ? userToUpdate!.role : 'driver' as User['role']
            };

            if (newUserCreated) {
                await UserService.createUserProfile(updatedUser);
            } else {
                await UserService.updateUserProfile(updatedUser.id, {
                    driverId: newVendorId,
                    role: isAdmin ? userToUpdate!.role : 'driver' as User['role']
                });
            }

            await setDoc(doc(db, 'vendors', newVendorId), newVendor); // Storing riders in vendors collection as per App.tsx schema? App.tsx uses 'vendors' state for all.

            return { user: updatedUser, vendor: newVendor };
        } catch (error) {
            console.error("UserService.registerRider error:", error);
            throw error;
        }
    },

    registerDeliveryMan: async (formData: any, currentUser: User | null): Promise<{ user: User, vendor: any }> => {
        try {
            let userToUpdate = currentUser;
            let newUserCreated = false;

            if (!userToUpdate) {
                const newUserId = `DM${Date.now()}`;
                const newUser: User = {
                    id: newUserId,
                    name: formData.name,
                    email: formData.email,
                    role: 'customer',
                    image: `https://picsum.photos/100/100?random=${newUserId}`,
                    phone: formData.phone,
                    address: formData.address,
                    walletBalance: 0,
                    addressBook: []
                };
                userToUpdate = newUser;
                newUserCreated = true;
            }

            if (userToUpdate!.deliveryManId) {
                throw new Error("This account is already registered as a Delivery Man.");
            }

            const newVendorId = `DEL${Date.now()}`;
            const newVendor = {
                id: newVendorId,
                type: 'deliveryMan',
                name: { en: formData.name, bn: formData.name },
                owner: userToUpdate!.name,
                ownerId: userToUpdate!.id, // Add ownerId matching Auth UID
                email: userToUpdate!.email,
                location: formData.address,
                rating: 0,
                joined: new Date().toISOString().split('T')[0],
                payment: 'Cash',
                bannerImage: 'https://picsum.photos/400/200?random=' + newVendorId,
                logo: 'https://picsum.photos/200/200?random=' + newVendorId,
                category: { en: 'Delivery Service', bn: 'ডেলিভারি সার্ভিস' },
                distance: 0,
                isFeatured: false,
                status: 'Pending',
                onlineStatus: 'Offline',
                payoutRequested: false,
                // Delivery specific fields could go here or in a nested profile
                walletBalance: 0,
                pendingBalance: 0,
                deliveryManProfile: {
                    isAvailable: true,
                    deliveryFee: 50,
                    rating: 5,
                    totalDeliveries: 0,
                    // Default location (e.g. Sakhipur Center)
                    currentLocation: { lat: 24.3396, lng: 90.1760 }
                }
            };

            const isAdmin = userToUpdate!.role === 'admin' || userToUpdate!.role === 'super_admin';
            const updatedUser = {
                ...userToUpdate!,
                deliveryManId: newVendorId,
                role: isAdmin ? userToUpdate!.role : 'delivery' as User['role']
            };

            if (newUserCreated) {
                await UserService.createUserProfile(updatedUser);
            } else {
                await UserService.updateUserProfile(updatedUser.id, {
                    deliveryManId: newVendorId,
                    role: isAdmin ? userToUpdate!.role : 'delivery' as User['role']
                });
            }

            await setDoc(doc(db, 'vendors', newVendorId), newVendor);

            return { user: updatedUser, vendor: newVendor };
        } catch (error) {
            console.error("UserService.registerDeliveryMan error:", error);
            throw error;
        }
    },

    registerAgency: async (formData: any, currentUser: User | null): Promise<{ user: User, vendor: any }> => {
        try {
            let userToUpdate = currentUser;
            let newUserCreated = false;

            if (!userToUpdate) {
                const newUserId = `AU${Date.now()}`;
                const newUser: User = {
                    id: newUserId,
                    name: formData.name,
                    email: formData.email,
                    role: 'customer',
                    image: `https://picsum.photos/100/100?random=${newUserId}`,
                    phone: formData.phone,
                    address: formData.address,
                    walletBalance: 0,
                    addressBook: []
                };
                userToUpdate = newUser;
                newUserCreated = true;
            }

            if (userToUpdate!.agencyId) {
                throw new Error("This account is already registered as an Agency.");
            }

            const newVendorId = `AGENCY${Date.now()}`;
            const newVendor = {
                id: newVendorId,
                type: 'agency',
                name: { en: formData.agencyName, bn: formData.agencyName },
                owner: userToUpdate!.name,
                ownerId: userToUpdate!.id, // Add ownerId matching Auth UID
                email: userToUpdate!.email,
                location: formData.address,
                rating: 0,
                joined: new Date().toISOString().split('T')[0],
                payment: 'Bank Transfer',
                bannerImage: 'https://picsum.photos/400/200?random=' + newVendorId,
                logo: 'https://picsum.photos/200/200?random=' + newVendorId,
                category: { en: 'Travel Agency', bn: 'ভ্রমণ সংস্থা' },
                distance: 0,
                isFeatured: false,
                status: 'Pending',
                onlineStatus: 'Online',
                payoutRequested: false,
                agencyLicense: formData.license,
                walletBalance: 0,
                pendingBalance: 0,
            };

            const isAdmin = userToUpdate!.role === 'admin' || userToUpdate!.role === 'super_admin';
            const updatedUser = {
                ...userToUpdate!,
                agencyId: newVendorId,
                role: isAdmin ? userToUpdate!.role : 'agency' as User['role']
            };

            if (newUserCreated) {
                await UserService.createUserProfile(updatedUser);
            } else {
                await UserService.updateUserProfile(updatedUser.id, {
                    agencyId: newVendorId,
                    role: isAdmin ? userToUpdate!.role : 'agency' as User['role']
                });
            }

            await setDoc(doc(db, 'vendors', newVendorId), newVendor);

            return { user: updatedUser, vendor: newVendor };
        } catch (error) {
            console.error("UserService.registerAgency error:", error);
            throw error;
        }
    },

    // Admin Role Management
    subscribeToRoles: (callback: (roles: AdminRole[]) => void) => {
        const q = query(collection(db, 'roles'));
        return onSnapshot(q, (snapshot) => {
            const roles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminRole));
            callback(roles);
        });
    },

    createRole: async (role: AdminRole): Promise<void> => {
        try {
            await setDoc(doc(db, 'roles', role.id), role);
        } catch (error) {
            console.error("Error creating role:", error);
            throw error;
        }
    },

    updateRole: async (roleId: string, data: Partial<AdminRole>): Promise<void> => {
        try {
            const docRef = doc(db, 'roles', roleId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating role:", error);
            throw error;
        }
    },

    deleteRole: async (roleId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'roles', roleId));
        } catch (error) {
            console.error("Error deleting role:", error);
            throw error;
        }
    },

    deleteUserById: async (userId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },
    async signupGuest(data: { name: string, email: string, phone: string, address: string, password?: string }): Promise<User> {
        try {
            const { auth } = await import('../lib/firebase');
            const { createUserWithEmailAndPassword } = await import('firebase/auth');

            // 1. Create Auth
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password || 'TemporaryPassword123!');
            const uid = userCredential.user.uid;

            // Force refresh session
            await userCredential.user.getIdToken(true);

            // 2. Create Profile
            const newUser: User = {
                id: uid,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                role: 'customer',
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}`,
                walletBalance: 0,
                addressBook: [],
                createdAt: new Date().toISOString()
            };

            await this.createUserProfile(newUser);
            return newUser;
        } catch (error) {
            console.error("UserService.signupGuest error:", error);
            throw error;
        }
    },

    async enableResellerMode(uid: string): Promise<void> {
        try {
            const docRef = doc(db, 'users', uid);
            const userSnap = await getDoc(docRef);
            if (!userSnap.exists()) throw new Error("User not found");

            const userData = userSnap.data() as User;
            const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';

            await updateDoc(docRef, {
                isReseller: true,
                resellerJoinDate: new Date().toISOString(),
                role: isAdmin ? userData.role : 'reseller'
            });
        } catch (error) {
            console.error("Error enabling reseller mode:", error);
            throw error;
        }
    },

    createAdminUser: async (userData: Omit<User, 'id' | 'walletBalance'>): Promise<User | null> => {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');
            const createUser = httpsCallable(functions, 'createUser');

            const result = await createUser(userData);
            const data = result.data as any;

            if (data.success) {
                return {
                    id: data.userId,
                    ...userData,
                    walletBalance: 0,
                    createdAt: new Date().toISOString()
                } as User;
            }
            return null;
        } catch (error) {
            console.error("Error creating admin user:", error);
            throw error;
        }
    },

    updateVendor: async (vendorId: string, data: Partial<any>): Promise<void> => {
        try {
            const docRef = doc(db, 'vendors', vendorId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating vendor:", error);
            throw error;
        }
    }
};
