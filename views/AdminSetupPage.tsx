import React, { useState, useEffect } from 'react';
import { useApp } from '../src/context/AppContext';
import { UserService } from '../src/services/userService';
import { auth, db } from '../src/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { User, CategoryCommission } from '../types';
import { useNavigate } from 'react-router-dom';

const AdminSetupPage = () => {
    const { language } = useApp(); // Keep language if needed, or just remove destructuring if empty
    const [status, setStatus] = useState('');
    const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setAuthUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handlePromote = async () => {
        if (!authUser) {
            setStatus("No user logged in. Please log in first.");
            return;
        }

        setStatus("Promoting...");

        try {
            // Check if profile exists
            let profile = await UserService.getUserProfile(authUser.uid);

            if (!profile) {
                // Create new admin profile
                const newProfile: User = {
                    id: authUser.uid,
                    name: authUser.displayName || 'Admin',
                    email: authUser.email || '',
                    role: 'admin',
                    image: authUser.photoURL || `https://ui-avatars.com/api/?name=Admin`,
                    phone: '',
                    address: '',
                    walletBalance: 0,
                    adminRole: 'role_super_admin' // Use role ID instead of object
                };
                await UserService.createUserProfile(newProfile);
                setStatus("Success! Profile created as Admin. Redirecting...");
            } else {
                // Update existing
                await UserService.updateUserProfile(authUser.uid, {
                    role: 'admin',
                    adminRole: 'role_super_admin' // Use role ID instead of object
                });
                setStatus("Success! User upgraded to Admin. Redirecting...");
            }

            setTimeout(() => {
                window.location.href = '/admin';
            }, 1000);

        } catch (e: any) {
            setStatus("Error: " + e.message);
        }
    };

    const handleInitializeCategories = async () => {
        setStatus("Initializing categories...");

        const categories: CategoryCommission[] = [
            {
                id: 'CAT-RESTAURANT',
                category: { en: 'Restaurant', bn: 'রেস্তোরাঁ' },
                commissionRate: 15,
                isActive: true,
                subCategories: [
                    { id: 'SUB-PIZZA', name: { en: 'Pizza', bn: 'পিৎজা' }, value: 'pizza' },
                    { id: 'SUB-BURGERS', name: { en: 'Burgers', bn: 'বার্গার' }, value: 'burgers' },
                    { id: 'SUB-PASTA', name: { en: 'Pasta', bn: 'পাস্তা' }, value: 'pasta' }
                ]
            },
            {
                id: 'CAT-CAKE',
                category: { en: 'Cake', bn: 'কেক' },
                commissionRate: 10,
                isActive: true,
                subCategories: [
                    { id: 'SUB-BIRTHDAY', name: { en: 'Birthday Cakes', bn: 'জন্মদিনের কেক' }, value: 'birthday-cakes' },
                    { id: 'SUB-CUPCAKES', name: { en: 'Cupcakes', bn: 'কাপকেক' }, value: 'cupcakes' },
                    { id: 'SUB-CHOCOLATE', name: { en: 'Chocolate Cakes', bn: 'চকোলেট কেক' }, value: 'chocolate-cakes' }
                ]
            },
            {
                id: 'CAT-GROCERIES',
                category: { en: 'Groceries', bn: 'মুদিখানা' },
                commissionRate: 8,
                isActive: true,
                subCategories: [
                    { id: 'SUB-RICE', name: { en: 'Rice & Grains', bn: 'চাল ও শস্য' }, value: 'rice-grains' },
                    { id: 'SUB-OIL', name: { en: 'Oil & Spices', bn: 'তেল ও মশলা' }, value: 'oil-spices' },
                    { id: 'SUB-DAIRY', name: { en: 'Dairy Products', bn: 'দুগ্ধজাত পণ্য' }, value: 'dairy' }
                ]
            },
            {
                id: 'CAT-BABY',
                category: { en: 'Baby & Mom Care', bn: 'বেবি ও মম কেয়ার' },
                commissionRate: 12,
                isActive: true,
                subCategories: [
                    { id: 'SUB-DIAPERS', name: { en: 'Diapers', bn: 'ডায়াপার' }, value: 'diapers' },
                    { id: 'SUB-BABYFOODS', name: { en: 'Baby Foods', bn: 'শিশু খাদ্য' }, value: 'baby-foods' },
                    { id: 'SUB-TOYS', name: { en: 'Toys', bn: 'খেলনা' }, value: 'toys' }
                ]
            },
            {
                id: 'CAT-ELECTRONICS',
                category: { en: 'Electronics', bn: 'ইলেকট্রনিক্স' },
                commissionRate: 5,
                isActive: true,
                subCategories: [
                    { id: 'SUB-MOBILE', name: { en: 'Mobile Phones', bn: 'মোবাইল ফোন' }, value: 'mobile-phones' },
                    { id: 'SUB-ACCESSORIES', name: { en: 'Accessories', bn: 'আনুষাঙ্গিক' }, value: 'accessories' },
                    { id: 'SUB-APPLIANCES', name: { en: 'Home Appliances', bn: 'গৃহস্থালী যন্ত্র' }, value: 'appliances' }
                ]
            },
            {
                id: 'CAT-FASHION',
                category: { en: 'Fashion & Clothing', bn: 'ফ্যাশন ও পোশাক' },
                commissionRate: 12,
                isActive: true,
                subCategories: [
                    { id: 'SUB-MENS', name: { en: "Men's Wear", bn: 'পুরুষদের পোশাক' }, value: 'mens-wear' },
                    { id: 'SUB-WOMENS', name: { en: "Women's Wear", bn: 'মহিলাদের পোশাক' }, value: 'womens-wear' },
                    { id: 'SUB-KIDS', name: { en: "Kids' Wear", bn: 'শিশুদের পোশাক' }, value: 'kids-wear' }
                ]
            }
        ];

        try {
            for (const category of categories) {
                await setDoc(doc(db, 'categories', category.id), category);
            }
            setStatus(`✅ Success! ${categories.length} categories initialized. Go to Admin Dashboard > Categories to view.`);
        } catch (e: any) {
            setStatus("Error: " + e.message);
        }
    };

    if (loading) return <div className="p-10 flex justify-center">Loading session...</div>;

    return (
        <div className="p-10 flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>

            {authUser ? (
                <>
                    <p className="mb-4">Current Logged In Email: <strong>{authUser.email}</strong></p>
                    <p className="mb-4">UID: {authUser.uid}</p>
                    <button
                        onClick={handlePromote}
                        className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-bold mb-4"
                    >
                        MAKE ME ADMIN
                    </button>
                    <button
                        onClick={handleInitializeCategories}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-bold"
                    >
                        Initialize Categories
                    </button>
                </>
            ) : (
                <div className="text-center">
                    <p className="mb-4 text-red-500">No user logged in.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-bold"
                    >
                        Go to Login Page
                    </button>
                    <p className="mt-2 text-sm text-gray-500">Log in, then verify you are redirected here or come back to /admin-setup</p>
                </div>
            )}

            <p className="mt-4 font-mono font-bold text-green-600 animate-pulse">{status}</p>
        </div>
    );
};

export default AdminSetupPage;
