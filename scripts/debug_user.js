
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSy...", // Will be filled in next step
    authDomain: "sakhipur-bazar.firebaseapp.com",
    projectId: "sakhipur-bazar",
    storageBucket: "sakhipur-bazar.firebasestorage.app",
    messagingSenderId: "107...",
    appId: "1:107...",
    measurementId: "G-..."
};

// I will populate the real values from the read_resource output in the actual tool call below

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const checkUser = async (uid) => {
    console.log(`Checking user with UID: ${uid}`);
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            console.log("User Data:", JSON.stringify(userDoc.data(), null, 2));
        } else {
            console.log("User document does NOT exist!");
        }
    } catch (error) {
        console.error("Error fetching user:", error);
    }
    process.exit();
};

checkUser('iiYQYUrRKzd4HYP0DY53RtD0Md73');
