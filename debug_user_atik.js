
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './service-account.json' assert { type: "json" };

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function checkUser() {
    try {
        const userRecord = await auth.getUserByEmail('atikpolar25@gmail.com');
        console.log("Auth User Found:", userRecord.uid);

        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists) {
            console.log("Firestore User Data:", JSON.stringify(userDoc.data(), null, 2));
        } else {
            console.log("No Firestore document found for this user!");
        }

        // Also check if any shop exists with this owner
        const shopQuery = await db.collection('vendors').where('ownerId', '==', userRecord.uid).get();
        if (!shopQuery.empty) {
            console.log("Vendor/Shop Profile Found:", JSON.stringify(shopQuery.docs[0].data(), null, 2));
        } else {
            console.log("No Vendor/Shop profile found for this user.");
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkUser();
