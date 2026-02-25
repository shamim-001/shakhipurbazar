
import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Vendor } from '../../types';

export const seedRealShops = async () => {
    console.log('🌱 Seeding real shops to Firestore...');

    const shops: Partial<Vendor>[] = [
        {
            id: 'v-sagor-store',
            type: 'shop',
            name: { en: 'Sagor Store', bn: 'সাগর স্টোর' },
            owner: 'Sagor Ahmed',
            email: 'sagor@example.com',
            location: 'Sakhipur Municipality',
            rating: 4.8,
            joined: new Date().toISOString(),
            payment: 'bKash, Cash',
            bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1604719312563-8912e938a4bb?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Groceries & Foods', bn: 'মুদি ও খাবার' },
            distance: 0.1,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        },
        {
            id: 'v-hatim-furniture',
            type: 'shop',
            name: { en: 'Hatim Furniture', bn: 'হাতিম ফার্নিচার' },
            owner: 'Hatim Ali',
            email: 'hatim@example.com',
            location: 'M.A. Aziz Road, Sakhipur',
            rating: 4.9,
            joined: new Date().toISOString(),
            payment: 'Bank, bKash, Cash',
            bannerImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Furniture', bn: 'আসবাবপত্র' },
            distance: 0.5,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        },
        {
            id: 'v-dbbl-banking',
            type: 'shop',
            name: { en: 'Dutch-Bangla Agent Banking', bn: 'ডাচ-বাংলা এজেন্ট ব্যাংকিং' },
            owner: 'Monir Hossain',
            email: 'dbbl@example.com',
            location: 'Bus Stand Road, Sakhipur',
            rating: 5.0,
            joined: new Date().toISOString(),
            payment: 'Bank',
            bannerImage: 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Banking Services', bn: 'ব্যাংকিং সেবা' },
            distance: 0.2,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        },
        {
            id: 'v-rent-a-car',
            type: 'rider',
            name: { en: 'Sakhipur Rent-A-Car', bn: 'সখীপুর রেন্ট-এ-কার' },
            owner: 'Kabir Baksh',
            email: 'rentacar@example.com',
            location: 'Sakhipur Central',
            rating: 4.8,
            joined: new Date().toISOString(),
            payment: 'bKash, Cash',
            bannerImage: 'https://images.unsplash.com/photo-1441148345475-03a2e82f9719?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Rent a Car', bn: 'রেন্ট-এ-কার' },
            distance: 0.2,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        },
        {
            id: 'v-travels',
            type: 'agency',
            name: { en: 'Sakhipur Travels', bn: 'সখীপুর ট্রাভেলস' },
            owner: 'Samsul Haque',
            email: 'travels@example.com',
            location: 'Main Road, Sakhipur',
            rating: 4.9,
            joined: new Date().toISOString(),
            payment: 'Visa, Mastercard, bKash',
            bannerImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Travel Agency', bn: 'ভ্রমণ সংস্থা' },
            distance: 0.5,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        },
        {
            id: 'v-prime',
            type: 'shop',
            name: { en: 'Sakhipur Prime', bn: 'সখীপুর প্রাইম' },
            owner: 'Admin',
            email: 'prime@example.com',
            location: 'Global Delivery',
            rating: 5.0,
            joined: new Date().toISOString(),
            payment: 'Online Payment',
            bannerImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800',
            logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&q=80&w=200',
            category: { en: 'Global Collection', bn: 'গ্লোবাল কালেকশন' },
            distance: 0,
            isFeatured: true,
            status: 'Active',
            onlineStatus: 'Online',
            walletBalance: 0,
            pendingBalance: 0,
            isVerified: true
        }
    ];

    try {
        for (const shop of shops) {
            const docRef = doc(db, 'vendors', shop.id!);
            await setDoc(docRef, {
                ...shop,
                createdAt: serverTimestamp()
            }, { merge: true });
            console.log(`✅ Seeded: ${shop.name?.en}`);
        }
        console.log('🎉 Seeding complete!');
        return { success: true };
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        return { success: false, error };
    }
};
