// Script to populate initial categories in Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

// Firebase config (same as in your app)
const firebaseConfig = {
    apiKey: "AIzaSyDEKVRV_8JDhpfxR52p2Y-qTLhtzb4KKcU",
    authDomain: "sakhipur-bazar.firebaseapp.com",
    projectId: "sakhipur-bazar",
    storageBucket: "sakhipur-bazar.firebasestorage.app",
    messagingSenderId: "1046788790861",
    appId: "1:1046788790861:web:f326c6c5e81c1ade86dd88"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Categories to populate
const categories = [
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

async function populateCategories() {
    console.log('Starting to populate categories...');

    try {
        for (const category of categories) {
            await setDoc(doc(db, 'categories', category.id), category);
            console.log(`✓ Added category: ${category.category.en}`);
        }

        console.log('\n✅ All categories populated successfully!');
        console.log(`Total categories added: ${categories.length}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error populating categories:', error);
        process.exit(1);
    }
}

populateCategories();
