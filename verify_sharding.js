const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // I'll assume this exists or use env

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function verifyShardingLogic(orderCount) {
    console.log(`🚀 Starting Backend Verification of ${orderCount} concurrent orders...`);

    // 1. Get initial balance (aggregated)
    async function getAggregatedBalance() {
        let total = 0;
        const rootDoc = await db.collection('system').doc('platform_stats').get();
        if (rootDoc.exists) total += (rootDoc.data().walletBalance || 0);

        const shards = await db.collection('system').doc('platform_stats').collection('shards').get();
        shards.forEach(doc => {
            total += (doc.data().walletBalance || 0);
        });
        return total;
    }

    const initial = await getAggregatedBalance();
    console.log(`📊 Initial Balance: ${initial}`);

    const orders = Array.from({ length: orderCount }, (_, i) => ({
        id: `BACKEND-TEST-${Date.now()}-${i}`,
        total: 1000,
        vendorId: 'VENDOR-TEST-1',
        deliveryFee: 100,
        assignedDeliveryManId: 'DRIVER-TEST-1',
        status: 'Delivered'
    }));

    const categoryCommission = 10; // 10%

    // Perform concurrent updates
    const promises = orders.map(async (order) => {
        return db.runTransaction(async (transaction) => {
            const platformFee = order.total * (categoryCommission / 100);

            // Shard update
            const numShards = 5;
            const shardId = Math.floor(Math.random() * numShards);
            const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);

            transaction.set(shardRef, {
                walletBalance: admin.firestore.FieldValue.increment(platformFee),
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // Vendor update
            const vendorRef = db.collection('vendors').doc(order.vendorId);
            transaction.set(vendorRef, {
                walletBalance: admin.firestore.FieldValue.increment(order.total - platformFee),
                lastTransactionDate: new Date().toISOString()
            }, { merge: true });
        });
    });

    await Promise.all(promises);
    console.log(`✅ All Transactions submitted.`);

    const final = await getAggregatedBalance();
    console.log(`📊 Final Balance: ${final}`);
    console.log(`📊 Expected Final: ${initial + (orderCount * 100)}`);

    if (final === initial + (orderCount * 100)) {
        console.log('🏆 LOGIC VERIFIED: Sharding works perfectly under concurrency.');
    } else {
        console.log('❌ LOGIC ERROR: Balance mismatch.');
    }
}

// verifyShardingLogic(20).catch(console.error);
console.log("Ready to run verifyShardingLogic(20)");
