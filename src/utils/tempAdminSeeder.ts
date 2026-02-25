
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const seedAdminAccount = async () => {
    const email = 'admin@sakhipurbazar.com';
    const password = 'AdminPassword123!'; // Strong password

    try {
        console.log(`Attempting to seed admin: ${email}`);
        let user;

        try {
            // Try login first
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log('✅ Admin already exists. Logged in.');
        } catch (loginError: any) {
            if (loginError.code === 'auth/user-not-found') {
                // Create user
                console.log('User not found. Creating new admin...');
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                user = userCredential.user;
                console.log('✅ Admin account created.');
            } else {
                throw loginError;
            }
        }

        if (user) {
            // Ensure Firestore Profile exists and is Super Admin
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists() || userSnap.data().role !== 'super_admin') {
                await setDoc(userRef, {
                    id: user.uid,
                    name: 'Super Admin',
                    email: email,
                    role: 'super_admin',
                    createdAt: new Date().toISOString(),
                    isVerified: true,
                    walletBalance: 0,
                    image: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
                }, { merge: true });
                console.log('✅ Firestore profile updated to Super Admin.');
            } else {
                console.log('✅ Firestore profile already is Super Admin.');
            }

            alert(`Admin Ready!\nEmail: ${email}\nPassword: ${password}\n\nPlease proceed to login.`);
        }

    } catch (error: any) {
        console.error('Failed to seed admin:', error);
        alert(`Failed to seed admin: ${error.message}`);
    }
};
