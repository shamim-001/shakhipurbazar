const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// NOTE: This script requires a service account key to run locally.
// If run via Cloud Functions or a secure environment, it uses default credentials.

const CONCURRENCY = 20; // Number of concurrent updates
const UPDATES_PER_BATCH = 5; // How many times each "user" updates their wallet

async function runStressTest() {
    console.log('--- Starting Sharding Stress Test ---');
    console.log(`Config: ${CONCURRENCY} concurrent users, ${UPDATES_PER_BATCH} updates each.`);

    // Initialize Admin SDK (Assuming default credentials or environment setup)
    // If running in local dev, you might need: const serviceAccount = require('./service-account.json');
    try {
        initializeApp();
    } catch (e) {
        // Already initialized
    }

    const db = getFirestore();

    const startBalanceDoc = await db.collection('system').doc('platform_stats').get();
    let initialTotal = startBalanceDoc.exists ? (startBalanceDoc.data().walletBalance || 0) : 0;

    const shardsSnapshot = await db.collection('system').doc('platform_stats').collection('shards').get();
    shardsSnapshot.forEach(doc => { initialTotal += (doc.data().walletBalance || 0); });

    console.log(`Initial aggregated balance: ${initialTotal}`);

    const workers = [];

    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push((async () => {
            for (let j = 0; j < UPDATES_PER_BATCH; j++) {
                const shardId = Math.floor(Math.random() * 5);
                const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);

                await db.runTransaction(async (t) => {
                    t.set(shardRef, {
                        walletBalance: FieldValue.increment(10),
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });
                });
            }
        })());
    }

    await Promise.all(workers);
    console.log('All updates completed.');

    const endBalanceDoc = await db.collection('system').doc('platform_stats').get();
    let finalTotal = endBalanceDoc.exists ? (endBalanceDoc.data().walletBalance || 0) : 0;

    const finalShardsSnapshot = await db.collection('system').doc('platform_stats').collection('shards').get();
    finalShardsSnapshot.forEach(doc => { finalTotal += (doc.data().walletBalance || 0); });

    const expectedTotal = initialTotal + (CONCURRENCY * UPDATES_PER_BATCH * 10);

    console.log(`Final aggregated balance: ${finalTotal}`);
    console.log(`Expected balance: ${expectedTotal}`);

    if (finalTotal === expectedTotal) {
        console.log('SUCCESS: Sharding integrity maintained under load.');
    } else {
        console.error('FAILURE: Balance mismatch detected!');
    }
}

runStressTest().catch(console.error);
