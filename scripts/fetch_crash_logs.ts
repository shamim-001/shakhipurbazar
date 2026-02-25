
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchCrashLogs() {
    console.log("Fetching recent system crash logs...");
    try {
        const logsRef = collection(db, "system_logs");
        const q = query(
            logsRef,
            where("action", "==", "system.crash"),
            orderBy("timestamp", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No crash logs found in the last 5 entries.");
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log("\n--------------------------------------------------");
            console.log(`Log ID: ${doc.id}`);
            console.log(`Timestamp: ${data.timestamp}`);
            console.log(`User ID: ${data.userId}`);
            console.log(`URL: ${data.metadata?.url}`);
            console.log(`Message: ${data.metadata?.message}`);
            console.log(`Stack Trace:\n${data.metadata?.stack}`);
            console.log("--------------------------------------------------\n");
        });
    } catch (error) {
        console.error("Error fetching logs:", error);
    }
}

fetchCrashLogs();
