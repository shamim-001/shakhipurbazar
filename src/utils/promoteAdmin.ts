
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export const promoteAdmin = async () => {
    try {
        console.log("Locating Admin credentials...");
        // 1. Login as Super Admin to ensure permissions
        await signInWithEmailAndPassword(auth, 'admin@sakhipurbazar.com', 'AdminPassword123!');
        console.log("✅ Authenticated as Super Admin.");

        // 2. Find target user
        const q = query(collection(db, 'users'), where('email', '==', 'admin@sakhipurbazar.com'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Admin account not found in database!");
            return;
        }

        // 3. Update all matches (should be 1)
        querySnapshot.forEach(async (userDoc) => {
            await updateDoc(doc(db, 'users', userDoc.id), {
                role: 'super_admin',
                adminRole: 'super_admin' // Legacy/Compatibility
            });
            console.log(`✅ ${userDoc.id} promoted to Super Admin.`);
        });

        alert("Success! Admin role has been force-updated.");

        // Optional: Sign out
        await signOut(auth);

    } catch (error: any) {
        console.error("Promotion failed:", error);
        alert(`Error: ${error.message}`);
    }
};
