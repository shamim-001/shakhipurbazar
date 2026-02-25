
// Use standard ESM imports because package.json has "type": "module"
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

// Config from .env
const firebaseConfig = {
    apiKey: "AIzaSyC0ZQJr9D4ZoI7hapRomCDDrAxGipouLcE",
    authDomain: "sakhipur-bazar.firebaseapp.com",
    projectId: "sakhipur-bazar",
    storageBucket: "sakhipur-bazar.firebasestorage.app",
    messagingSenderId: "1045270920582",
    appId: "1:1045270920582:web:be27630c7bbab35ebb0007"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchCrashLogs() {
    console.log("Fetching recent system crash logs...");
    try {
        const logsRef = collection(db, "system_logs");

        // We try to query without the complex index first to avoid "index undefined" errors
        // Simple query by timestamp desc
        const q = query(
            logsRef,
            orderBy("timestamp", "desc"),
            limit(20)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No logs found at all.");
            return;
        }

        console.log(`Found ${snapshot.size} recent logs. Filtering for 'system.crash'...`);

        let crashCount = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.action === 'system.crash') {
                crashCount++;
                console.log("\n--------------------------------------------------");
                console.log(`Log ID: ${doc.id}`);
                console.log(`Timestamp: ${data.timestamp}`);
                console.log(`User ID: ${data.userId}`);
                console.log(`URL: ${data.metadata?.url}`);
                console.log(`Message: ${data.metadata?.message}`);
                console.log(`Stack Trace:\n${data.metadata?.stack}`);
                console.log("--------------------------------------------------\n");
            }
        });

        if (crashCount === 0) {
            console.log("No 'system.crash' logs found in the last 20 entries.");
        }

    } catch (error) {
        console.error("Error fetching logs:", error);
    }
}

fetchCrashLogs();
