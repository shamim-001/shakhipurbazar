
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, limit, getDocs } = require('firebase/firestore');
const { readFileSync } = require('fs');

function parseEnv() {
    const content = readFileSync('.env.production', 'utf8');
    const config = {};
    content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            config[key.trim()] = value.trim();
        }
    });
    return config;
}

const env = parseEnv();

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

async function checkLogs() {
    console.log("Fetching latest system logs...");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(5));
    const snap = await getDocs(q);

    snap.forEach(doc => {
        const data = doc.data();
        console.log(`\n--- Log ID: ${doc.id} | ${data.timestamp} ---`);
        console.log(`Action: ${data.action}`);
        if (data.metadata) {
            console.log(`Message: ${data.metadata.message}`);
            if (data.metadata.stack) {
                console.log(`Stack Trace: ${data.metadata.stack.slice(0, 500)}...`);
            }
        }
    });

    process.exit(0);
}

checkLogs().catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
});
