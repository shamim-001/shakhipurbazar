const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

/**
 * Helper: Sync roles/permissions to Auth Custom Claims
 */
async function syncUserClaims(userId, role) {
    try {
        await admin.auth().setCustomUserClaims(userId, { role });
        console.log(`Synced claims for user ${userId}: ${role}`);
    } catch (error) {
        console.error(`Claims Sync Failed for ${userId}:`, error);
    }
}

/**
 * Helper: Log System Activity for Audit Trail
 */
async function logActivity(actor, action, targetType, targetId, metadata = {}) {
    try {
        await db.collection('system_logs').add({
            timestamp: new Date().toISOString(),
            userId: actor.uid || 'system',
            userEmail: actor.email || 'system',
            action,
            targetType,
            targetId,
            metadata,
            severity: metadata.severity || 'info'
        });
    } catch (error) {
        console.error('Logging Failed:', error);
    }
}

/**
 * Helper: Financial Processing Logic
 */
async function getOwnerDetails(transaction, vendorId) {
    const vendorRef = db.collection('vendors').doc(vendorId);
    const userRef = db.collection('users').doc(vendorId);

    const vDoc = await transaction.get(vendorRef);
    if (vDoc.exists) return { ownerRef: vendorRef, ownerType: 'vendor' };

    const uDoc = await transaction.get(userRef);
    if (uDoc.exists && uDoc.data().isReseller) return { ownerRef: userRef, ownerType: 'reseller' };

    throw new Error("Owner (Vendor/Reseller) not found.");
}

async function getCommissionRules(transaction) {
    const settingsRef = db.collection('settings').doc('platform');
    const settingsDoc = await transaction.get(settingsRef);
    const settings = settingsDoc.data() || {};

    const categoriesSnapshot = await db.collection('categories').get();
    const commissions = [];
    categoriesSnapshot.forEach(doc => commissions.push(doc.data()));

    return { settings, commissions };
}

function calculateCommissionRate(order, ownerType, settings, commissions) {
    let rate = 10;
    if (ownerType === 'reseller') {
        rate = settings.commissions?.reseller || 7;
    } else {
        const categoryName = order.items?.[0]?.category?.en || order.category?.en || 'General';
        const rule = commissions.find(c => c.category?.en === categoryName);
        if (rule) rate = rule.commissionRate;
        else rate = settings.defaultCommission || 10;
    }
    return rate;
}

/**
 * Cloud Functions
 */

// 1. Payout Initiation
exports.initiatePayout = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin' && userDoc.data()?.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin only.');
    }

    const { amount, destination, method } = data;
    const APPROVAL_THRESHOLD = 10000;
    const needsApproval = amount > APPROVAL_THRESHOLD;

    try {
        const transactionId = await db.runTransaction(async (t) => {
            const statsRef = db.collection('system').doc('platform_stats');
            const statsDoc = await t.get(statsRef);
            let totalBalance = statsDoc.exists ? (statsDoc.data().walletBalance || 0) : 0;
            const shards = await t.get(db.collection('system').doc('platform_stats').collection('shards'));
            shards.forEach(doc => { totalBalance += (doc.data().walletBalance || 0); });

            if (totalBalance < amount) throw new Error('Insufficient platform balance.');

            const txnRef = db.collection('transactions').doc();
            if (!needsApproval) {
                const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc('shard_0');
                const shardDoc = await t.get(shardRef);
                t.set(shardRef, { walletBalance: (shardDoc.data()?.walletBalance || 0) - amount }, { merge: true });
            }

            t.set(txnRef, {
                type: 'admin_withdrawal',
                amount: -amount,
                date: new Date().toISOString(),
                description: `Payout to ${method} (${destination})`,
                status: needsApproval ? 'Pending Approval' : 'Completed',
                destination, method, initiatedBy: context.auth.uid, requiresApproval: needsApproval
            });
            return txnRef.id;
        });

        await logActivity({ uid: context.auth.uid, email: context.auth.token.email }, needsApproval ? 'payout.requested' : 'payout.completed', 'payout', transactionId, { amount, method, needsApproval });
        return { success: true, transactionId, needsApproval };
    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 2. bKash Payment
async function getPaymentConfig() {
    const doc = await db.collection('system').doc('payment_config').get();
    return doc.exists ? doc.data() : null;
}

exports.createPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');
    const { amount, method, reference } = data;
    try {
        const config = await getPaymentConfig();
        if (method === 'bkash' && config?.bkash?.enabled) {
            const { apiKey, secretKey, username, password, sandboxMode } = config.bkash;
            const baseUrl = sandboxMode ? 'https://tokenized.sandbox.bkash.com' : 'https://tokenized.bkash.com';
            const tokenRes = await axios.post(`${baseUrl}/tokenized/checkout/token/grant`, { app_key: apiKey, app_secret: secretKey }, { headers: { username, password } });
            const createRes = await axios.post(`${baseUrl}/tokenized/checkout/create`, {
                mode: '0011', payerReference: reference || context.auth.uid, callbackURL: 'https://sakhipur-bazar.web.app/payment/callback/bkash',
                amount: amount.toString(), currency: 'BDT', intent: 'sale', merchantInvoiceNumber: `INV-${Date.now()}`
            }, { headers: { Authorization: tokenRes.data.id_token, 'X-APP-Key': apiKey } });
            return { paymentID: createRes.data.paymentID, redirectURL: createRes.data.bkashURL };
        }

        if (method === 'nagad' && config?.nagad?.enabled) {
            const { merchantId, baseUrl, sandboxMode } = config.nagad;
            const finalBaseUrl = sandboxMode ? 'https://sandbox.mynagad.com' : baseUrl;
            // Server-side call to Nagad API (Hardening)
            const dateTime = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14); // YYYYMMDDHHmmss
            const res = await axios.post(`${finalBaseUrl}/remote-payment-gateway-1.0/api/dfs/check-out/initialize/`, {
                merchantId,
                orderId: reference || `ORD-${Date.now()}`,
                amount: amount.toString(),
                currency: 'BDT',
                challenge: Math.random().toString(36).substring(7),
                dateTime,
                callbackUrl: 'https://sakhipur-bazar.web.app/payment/callback/nagad'
            }, {
                headers: {
                    'X-KM-Api-Version': 'v-0.2.0',
                    'X-KM-IP-V4': '1.1.1.1', // Real production IP should be here
                    'X-KM-Client-Type': 'PC_WEB',
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.callBackUrl) {
                return { paymentID: res.data.paymentID || reference, redirectURL: res.data.callBackUrl };
            }
            throw new Error(res.data.message || 'Nagad initiation failed');
        }
        throw new Error('Payment method disabled or not supported.');
    } catch (error) { throw new functions.https.HttpsError('internal', error.message); }
});

exports.executePayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');
    const { paymentID, method } = data;
    try {
        const config = await getPaymentConfig();
        if (method === 'bkash') {
            const { apiKey, secretKey, username, password, sandboxMode } = config.bkash;
            const baseUrl = sandboxMode ? 'https://tokenized.sandbox.bkash.com' : 'https://tokenized.bkash.com';
            const tokenRes = await axios.post(`${baseUrl}/tokenized/checkout/token/grant`, { app_key: apiKey, app_secret: secretKey }, { headers: { username, password } });
            const execRes = await axios.post(`${baseUrl}/tokenized/checkout/execute`, { paymentID }, { headers: { Authorization: tokenRes.data.id_token, 'X-APP-Key': apiKey } });
            if (execRes.data.statusCode === '0000') {
                const amount = parseFloat(execRes.data.amount);
                await db.runTransaction(async (t) => {
                    const userRef = db.collection('users').doc(context.auth.uid);
                    t.update(userRef, { walletBalance: admin.firestore.FieldValue.increment(amount) });
                    t.set(db.collection('transactions').doc(), { userId: context.auth.uid, type: 'deposit', amount, date: new Date().toISOString(), status: 'Completed', method, gatewayTxnId: execRes.data.trxID });
                });
                return { success: true, trxID: execRes.data.trxID };
            } else throw new Error(execRes.data.errorMessage);
        }
    } catch (error) { throw new functions.https.HttpsError('internal', error.message); }
});

exports.verifyNagadPayment = functions.https.onCall(async (data, context) => {
    // Nagad Verification
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');
    const { paymentRefId } = data; // Usually 'payment_ref_id' from callback params

    try {
        const config = await getPaymentConfig();
        if (!config?.nagad?.enabled) throw new Error('Nagad disabled');

        const { merchantId, baseUrl, sandboxMode } = config.nagad;
        const finalBaseUrl = sandboxMode ? 'https://sandbox.mynagad.com' : baseUrl;

        // Verify API
        const res = await axios.get(`${finalBaseUrl}/remote-payment-gateway-1.0/api/dfs/verify/payment/${paymentRefId}`, {
            headers: {
                'X-KM-Api-Version': 'v-0.2.0',
                'X-KM-IP-V4': '1.1.1.1',
                'X-KM-Client-Type': 'PC_WEB'
            }
        });

        const verifyData = res.data;

        if (verifyData.status === 'Success') {
            const amount = parseFloat(verifyData.amount);
            const orderId = verifyData.orderId;

            // Update wallet
            await db.runTransaction(async (t) => {
                const userRef = db.collection('users').doc(context.auth.uid);
                t.update(userRef, { walletBalance: admin.firestore.FieldValue.increment(amount) });
                t.set(db.collection('transactions').doc(), {
                    userId: context.auth.uid,
                    type: 'deposit',
                    amount,
                    date: new Date().toISOString(),
                    status: 'Completed',
                    method: 'nagad',
                    gatewayTxnId: verifyData.issuerPaymentRefId,
                    metadata: verifyData
                });
            });

            return { success: true, transactionId: verifyData.issuerPaymentRefId };
        } else {
            return { success: false, error: 'Verification failed or payment not successful' };
        }

    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// 3. SSLCommerz
exports.initiateSSLPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');
    try {
        const config = await getPaymentConfig();
        const { storeId, storePassword, sandboxMode } = config.ssl;
        const baseUrl = sandboxMode ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
        const project = process.env.GCLOUD_PROJECT || 'sakhipur-bazar';
        const functionBaseUrl = `https://us-central1-${project}.cloudfunctions.net`;
        const formData = new URLSearchParams({
            store_id: storeId, store_passwd: storePassword, total_amount: data.amount.toString(), currency: 'BDT',
            tran_id: data.reference || `TRX-${Date.now()}`, success_url: `${functionBaseUrl}/sslPaymentSuccess`,
            fail_url: `${functionBaseUrl}/sslPaymentFail`, cancel_url: `${functionBaseUrl}/sslPaymentCancel`,
            cus_name: data.customerName, cus_email: data.customerEmail, cus_phone: data.customerPhone,
            cus_add1: data.customerAddress || 'Sakhipur', cus_city: 'Sakhipur', cus_country: 'Bangladesh',
            shipping_method: 'NO', product_name: 'Order', product_category: 'General', product_profile: 'general'
        });
        const res = await axios.post(`${baseUrl}/gwprocess/v4/api.php`, formData.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        if (res.data.status === 'SUCCESS') return { success: true, paymentUrl: res.data.GatewayPageURL };
        throw new Error(res.data.failedreason || 'Initiation failed');
    } catch (error) { throw new functions.https.HttpsError('internal', error.message); }
});

exports.sslPaymentSuccess = functions.https.onRequest((req, res) => { res.redirect(`https://sakhipur-bazar.web.app/order-success?paymentStatus=success&trxID=${req.body.tran_id}`); });
exports.sslPaymentFail = functions.https.onRequest((req, res) => { res.redirect('https://sakhipur-bazar.web.app/cart?paymentStatus=failed'); });
exports.sslPaymentCancel = functions.https.onRequest((req, res) => { res.redirect('https://sakhipur-bazar.web.app/cart?paymentStatus=cancelled'); });

// 4. Triggers
/**
 * Helper: Notification Dispatcher (Mocking SMS/WhatsApp)
 */
async function sendNotification(userId, message, priority = 'normal') {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const phone = userData.phone;

        // 1. Log to Notifications Collection (For in-app history)
        await db.collection('notifications').add({
            userId,
            message,
            timestamp: new Date().toISOString(),
            read: false,
            priority
        });

        // 2. Simulated SMS/WhatsApp (Future Integration Point)
        if (phone && priority === 'high') {
            console.log(`[SMS/WhatsApp] TO: ${phone} | MSG: ${message}`);
            // Integration with Twilio/Plivo/WhatsApp API would go here
        }

        // 3. Update User Badge Count
        await db.collection('users').doc(userId).update({
            unreadNotifications: admin.firestore.FieldValue.increment(1)
        });

    } catch (error) {
        console.error('Notification Dispatch Error:', error);
    }
}

// 4. Triggers
exports.onOrderUpdated = functions.firestore.document('orders/{orderId}').onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const orderId = context.params.orderId;

    const isDelivered = newData.status === 'Delivered' && oldData.status !== 'Delivered';
    const isCompleted = (newData.status === 'Completed' || newData.status === 'Ride Completed') && (oldData.status !== 'Completed' && oldData.status !== 'Ride Completed');
    const isCancelled = (newData.status === 'Cancelled' && oldData.status !== 'Cancelled');
    const statusChanged = newData.status !== oldData.status;

    // Financial Distribution logic
    // We trigger on 'Delivered' for products (3-day hold) and 'Ride Completed' for rides (immediate).
    if ((isDelivered || (newData.status === 'Ride Completed' && oldData.status !== 'Ride Completed')) && !newData.isProcessed) {
        try {
            await db.runTransaction(async (t) => {
                const { ownerRef, ownerType } = await getOwnerDetails(t, newData.vendorId);
                const { settings, commissions } = await getCommissionRules(t);
                const rate = calculateCommissionRate(newData, ownerType, settings, commissions);
                const fee = (newData.total * rate) / 100;

                const isRide = newData.status === 'Ride Completed';

                // Calculate Settlement Date
                // Product orders have a 3-day hold; Rides are immediate.
                const settleAt = new Date();
                if (!isRide) settleAt.setDate(settleAt.getDate() + 3);

                const status = isRide ? 'Completed' : 'Pending';

                // 1. Sale Revenue
                t.set(db.collection('transactions').doc(), {
                    userId: newData.vendorId,
                    type: 'sale_revenue',
                    amount: newData.total,
                    date: new Date().toISOString(),
                    settleAt: settleAt.toISOString(),
                    description: isRide
                        ? `Ride Revenue for Order #${orderId.slice(-6)}`
                        : `Sale Revenue for Order #${orderId.slice(-6)} (Settling in 3 days)`,
                    status,
                    orderId,
                    metadata: { ownerType }
                });

                // 2. Commission Deduction
                t.set(db.collection('transactions').doc(), {
                    userId: newData.vendorId,
                    type: 'commission_deduction',
                    amount: -fee,
                    date: new Date().toISOString(),
                    settleAt: settleAt.toISOString(),
                    description: `Platform commission (${rate}%) for Order #${orderId.slice(-6)}`,
                    status,
                    orderId
                });

                // 3. Immediate Transfers for Completed status
                if (isRide) {
                    const vendorAmt = newData.total - fee;
                    t.update(ownerRef, { walletBalance: admin.firestore.FieldValue.increment(vendorAmt) });

                    const shardId = Math.floor(Math.random() * 5);
                    const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);
                    t.set(shardRef, { walletBalance: admin.firestore.FieldValue.increment(fee), lastUpdated: new Date().toISOString() }, { merge: true });
                }

                // 4. Delivery Man Fee (Immediate distribution as they fulfilled their part)
                if (!isRide && newData.assignedDeliveryManId && newData.deliveryFee) {
                    const deliveryFee = newData.deliveryFee;
                    const deliveryCommission = 10; // 10% Platform Fee on delivery
                    const platformDeliveryShare = (deliveryFee * deliveryCommission) / 100;
                    const deliveryManNet = deliveryFee - platformDeliveryShare;

                    const dRef = db.collection('vendors').doc(newData.assignedDeliveryManId);
                    t.update(dRef, { walletBalance: admin.firestore.FieldValue.increment(deliveryManNet) });

                    t.set(db.collection('transactions').doc(), {
                        userId: newData.assignedDeliveryManId,
                        type: 'sale_revenue',
                        amount: deliveryManNet,
                        date: new Date().toISOString(),
                        status: 'Completed',
                        orderId,
                        description: `Delivery Fee for Order #${orderId.slice(-6)}`
                    });

                    const shardId = Math.floor(Math.random() * 5);
                    const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);
                    t.set(shardRef, { walletBalance: admin.firestore.FieldValue.increment(platformDeliveryShare), lastUpdated: new Date().toISOString() }, { merge: true });
                }

                // 5. Reseller Referral Commission
                if (newData.referralCode) {
                    const resellerQuery = await db.collection('users').where('referralCode', '==', newData.referralCode).limit(1).get();
                    if (!resellerQuery.empty) {
                        const resellerDoc = resellerQuery.docs[0];
                        const resellerRate = settings.commissions?.reseller || 5;
                        const resellerAmt = (newData.total * resellerRate) / 100;

                        t.set(db.collection('transactions').doc(), {
                            userId: resellerDoc.id,
                            type: 'referral_commission',
                            amount: resellerAmt,
                            date: new Date().toISOString(),
                            settleAt: settleAt.toISOString(),
                            status,
                            orderId,
                            description: `Referral commission for Order #${orderId.slice(-6)}`
                        });

                        if (isRide) {
                            t.update(resellerDoc.ref, { walletBalance: admin.firestore.FieldValue.increment(resellerAmt) });
                            // Deduct from platform for rides
                            const shardId = Math.floor(Math.random() * 5);
                            const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);
                            t.set(shardRef, { walletBalance: admin.firestore.FieldValue.increment(-resellerAmt) }, { merge: true });
                        }
                    }
                }

                t.update(change.after.ref, { isProcessed: true });
            });

            await logActivity({ uid: 'system', email: 'system@platform' }, 'order.financials.distributed', 'order', orderId, { total: newData.total, vendorId: newData.vendorId, isRide: newData.status === 'Ride Completed' });

        } catch (e) { console.error("Order Distribution Logic Failed:", e); }
    }

    // Wallet Refund (Cancellation or Approved Refund)
    const needsRefund = (isCancelled || (newData.status === 'Refund Approved' && oldData.status !== 'Refund Approved')) && newData.payment === 'Wallet' && !newData.isRefunded;

    if (needsRefund) {
        try {
            await db.runTransaction(async (t) => {
                // 1. Refund Customer
                const customerRef = db.collection('users').doc(newData.customerId);
                t.update(customerRef, { walletBalance: admin.firestore.FieldValue.increment(newData.total) });

                t.set(db.collection('transactions').doc(), {
                    userId: newData.customerId,
                    type: 'refund',
                    amount: newData.total,
                    date: new Date().toISOString(),
                    status: 'Completed',
                    orderId,
                    description: `Refund for Order #${orderId.slice(-6)}`
                });

                // 2. Invalidate Pending Transactions (Crucial for 3-day hold logic)
                const pendingTxns = await db.collection('transactions')
                    .where('orderId', '==', orderId)
                    .where('status', '==', 'Pending')
                    .get();

                pendingTxns.forEach(doc => {
                    t.update(doc.ref, {
                        status: 'Cancelled',
                        cancelledAt: new Date().toISOString(),
                        description: doc.data().description + " (Reversed due to Refund)"
                    });
                });

                t.update(change.after.ref, { isRefunded: true });
            });

            await logActivity({ uid: 'system', email: 'system@platform' }, 'order.refunded', 'order', orderId, { amount: newData.total, customerId: newData.customerId });
            await sendNotification(newData.customerId, `Your order #${orderId.slice(-6)} has been refunded to your wallet.`, 'high');
        } catch (e) { console.error("Refund Logic Failed:", e); }
    }

    // Status Notifications
    if (statusChanged) {
        const orderShortId = orderId.slice(-6);
        if (newData.status === 'Ride Accepted') {
            await sendNotification(newData.customerId, `A driver has accepted your ride request! They are on their way.`, 'high');
        } else if (newData.status === 'Out for Delivery') {
            await sendNotification(newData.customerId, `Your order #${orderShortId} is out for delivery!`, 'normal');
        } else if (newData.status === 'Delivered') {
            await sendNotification(newData.customerId, `Your order #${orderShortId} has been delivered. Please confirm receipt to complete the order.`, 'normal');
        } else if (newData.status === 'Completed') {
            await sendNotification(newData.customerId, `Thank you for confirming receipt of order #${orderShortId}!`, 'normal');
            await sendNotification(newData.vendorId, `Order #${orderShortId} confirmed by customer. Payment added to your wallet.`, 'normal');
        } else if (newData.status === 'Refund Requested') {
            await sendNotification(newData.vendorId, `A refund has been requested for Order #${orderShortId}.`, 'high');
            // Also notify admin
            await sendNotification('admin', `Refund requested for Order #${orderShortId}`, 'high');
        } else if (newData.status === 'Cancelled') {
            await sendNotification(newData.vendorId, `Order #${orderShortId} was cancelled by the customer.`, 'normal');
        }
    }

    return null;
});

// New Order Trigger (For Ride Requests & Initial Placement)
exports.onOrderCreated = functions.firestore.document('orders/{orderId}').onCreate(async (snap, context) => {
    const order = snap.data();
    if (order.status === 'Ride Requested') {
        const severity = order.isEmergency ? 'critical' : 'info';
        await logActivity({ uid: 'system' }, 'ride.requested', 'order', context.params.orderId, { severity });

        if (order.isEmergency) {
            // High priority broadcast for Ambulances
            await sendNotification('admin', `EMERGENCY AMBULANCE REQUEST: Order #${context.params.orderId.slice(-6)}`, 'high');
            // Notification to current vendor (driver) is already handled by sendNotification below usually 
            // but we can add more logic here to broadcast to all online ambulance drivers if needed
        }
    }
    await sendNotification(order.customerId, `Order #${context.params.orderId.slice(-6)} placed successfully.`);
    return null;
});

// Chat Message Notification
exports.onMessageCreated = functions.firestore.document('chat_threads/{threadId}/messages/{messageId}').onCreate(async (snap, context) => {
    const message = snap.data();
    const threadId = context.params.threadId;

    const threadDoc = await db.collection('chat_threads').doc(threadId).get();
    if (!threadDoc.exists) return;

    const threadData = threadDoc.data();
    const recipientId = threadData.participantIds.find(id => id !== message.senderId);

    if (recipientId) {
        await sendNotification(recipientId, `New message: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`);
    }
    return null;
});

exports.onUserUpdated = functions.firestore.document('users/{userId}').onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const userId = context.params.userId;

    const watched = ['role', 'status', 'isVerified', 'isReseller'];
    const changes = watched.filter(f => newData[f] !== oldData[f]).map(f => ({ field: f, from: oldData[f], to: newData[f] }));

    if (changes.length > 0) {
        await logActivity({ uid: 'system' }, 'user.security_update', 'user', userId, { changes, severity: 'warning' });

        // If role changed, sync to Custom Claims
        if (newData.role !== oldData.role) {
            await syncUserClaims(userId, newData.role);
        }
    }
});

// 5. Health & Analytics
exports.checkSystemHealth = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin required.');
    const user = await db.collection('users').doc(context.auth.uid).get();
    if (user.data()?.role !== 'admin' && user.data()?.role !== 'super_admin') throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');

    const isDeep = data?.deepScan || false;
    const report = { timestamp: new Date().toISOString(), wallets: { status: 'healthy', issues: [] }, logistics: { status: 'healthy', issues: [] }, sharding: { status: 'healthy', issues: [] }, logs: { criticalCount: 0 }, summary: 'All systems operational' };

    const negBal = await db.collection('users').where('walletBalance', '<', 0).limit(5).get();
    if (!negBal.empty) { report.wallets.status = 'warning'; report.wallets.issues.push(`${negBal.size} users have negative balances.`); }

    const pendingPayouts = await db.collection('transactions').where('type', '==', 'admin_withdrawal').where('status', '==', 'Pending Approval').get();
    report.wallets.pendingPayouts = pendingPayouts.size;
    if (pendingPayouts.size > 20) { report.wallets.status = 'warning'; report.wallets.issues.push("High payout volume."); }

    if (isDeep) {
        const shard0 = await db.collection('system').doc('platform_stats').collection('shards').doc('shard_0').get();
        if (shard0.exists && shard0.data().walletBalance < 1000) { report.sharding.status = 'warning'; report.sharding.issues.push("Shard 0 balance low."); }
    }

    const pendingOrders = await db.collection('orders').where('status', '==', 'Pending').limit(50).get();
    report.logistics.pendingOrders = pendingOrders.size;
    if (pendingOrders.size > 30) { report.logistics.status = 'warning'; report.logistics.issues.push("Order backlog."); }

    return report;
});

exports.scheduledHealthAudit = functions.pubsub.schedule('every 6 hours').onRun(async () => {
    const orders = await db.collection('orders').where('status', '==', 'Pending').get();
    if (orders.size > 100) await logActivity({ uid: 'system' }, 'system.health_alert', 'system', 'audit', { pendingOrders: orders.size, severity: 'critical' });
    return null;
});

// NEW: Scheduled Promotion Budget Deduction (Replaces client-side setInterval)
exports.processDailyPromotions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date();
    console.log('Running daily promotion budget deduction...');

    try {
        const promotionsSnap = await db.collection('product_promotions')
            .where('status', '==', 'active')
            .get();

        if (promotionsSnap.empty) {
            console.log('No active promotions found.');
            return null;
        }

        const batch = db.batch();
        let deductionCount = 0;

        promotionsSnap.forEach(doc => {
            const promo = doc.data();
            const dailyRate = promo.dailyBudget || 0;
            const remaining = promo.remainingBudget || 0;

            if (remaining <= 0) {
                // Pause if budget exhausted
                batch.update(doc.ref, { status: 'paused', lastProcessed: now.toISOString() });
            } else {
                const deduction = Math.min(dailyRate, remaining);
                const newRemaining = remaining - deduction;

                batch.update(doc.ref, {
                    remainingBudget: newRemaining,
                    status: newRemaining <= 0 ? 'paused' : 'active',
                    lastProcessed: now.toISOString()
                });
                deductionCount++;
            }
        });

        await batch.commit();
        console.log(`Processed ${deductionCount} promotions.`);
        return null;
    } catch (error) {
        console.error('Promotion processing failed:', error);
        return null;
    }
});

exports.getPlatformAnalytics = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin required.');
    const { startDate, endDate } = data;
    const snapshot = await db.collection('orders').where('date', '>=', startDate).where('date', '<=', endDate).get();
    const analytics = { revenue: 0, orders: snapshot.size, categories: {} };
    snapshot.forEach(doc => {
        const order = doc.data();
        analytics.revenue += (order.total || 0);
        order.items?.forEach(i => {
            const cat = i.category?.en || 'Other';
            analytics.categories[cat] = (analytics.categories[cat] || 0) + 1;
        });
    });
    return analytics;
});

/**
 * AUTOMATED SETTLEMENT:
 * Runs daily to move pending income into vendor/reseller wallets after safety period.
 */
exports.scheduledSettlement = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const now = new Date().toISOString();
    console.log('Running automated transaction settlement...');

    try {
        const pendingSnap = await db.collection('transactions')
            .where('status', '==', 'Pending')
            .where('settleAt', '<=', now)
            .get();

        if (pendingSnap.empty) {
            console.log('No pending settlements.');
            return null;
        }

        let settledCount = 0;
        for (const txnDoc of pendingSnap.docs) {
            const txnData = txnDoc.data();
            // Payouts (withdrawals) are manual and NOT part of auto-settlement
            if (txnData.type === 'withdrawal' || txnData.type === 'admin_withdrawal') continue;

            try {
                await db.runTransaction(async (t) => {
                    const userId = txnData.userId;
                    const vendorRef = db.collection('vendors').doc(userId);
                    const userRef = db.collection('users').doc(userId);

                    let ownerRef = vendorRef;
                    let ownerDoc = await t.get(vendorRef);

                    if (!ownerDoc.exists) {
                        ownerRef = userRef;
                        ownerDoc = await t.get(userRef);
                    }

                    if (ownerDoc.exists) {
                        const currentBalance = ownerDoc.data().walletBalance || 0;
                        t.update(ownerRef, {
                            walletBalance: currentBalance + txnData.amount,
                            lastTransactionDate: new Date().toISOString()
                        });

                        // Realize platform revenue for commission deductions
                        if (txnData.type === 'commission_deduction' || txnData.type === 'referral_commission') {
                            // If it's a commission deduction, platform EARNS the absolute amount
                            // If it's a referral_commission, platform SPENDS the amount (already deducted from platform in some models, but here we track it)
                            const shardId = Math.floor(Math.random() * 5);
                            const shardRef = db.collection('system').doc('platform_stats').collection('shards').doc(`shard_${shardId}`);

                            // For commission_deduction, txnData.amount is negative (e.g., -50). Platform earns +50.
                            const platformImpact = txnData.type === 'commission_deduction' ? Math.abs(txnData.amount) : -txnData.amount;

                            t.set(shardRef, {
                                walletBalance: admin.firestore.FieldValue.increment(platformImpact),
                                lastUpdated: new Date().toISOString()
                            }, { merge: true });
                        }

                        t.update(txnDoc.ref, {
                            status: 'Completed',
                            settledAt: new Date().toISOString()
                        });
                        settledCount++;
                    }
                });
            } catch (err) {
                console.error(`Failed to settle txn ${txnDoc.id}:`, err);
            }
        }

        console.log(`Settled ${settledCount} transactions.`);
        return null;
    } catch (error) {
        console.error('Settlement process failed:', error);
        return null;
    }
});

// 6. Risk-Based Product Approval System
exports.calculateRiskLevel = functions.firestore.document('products/{productId}').onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // BLOCKING LOOP: Only run if 'pendingChanges' field was actually modified/added
    // If pendingChanges is undefined in both, or identical, skip.
    if (!newData.pendingChanges) return null; // Logic only applies when pending changes exist

    // If pendingChanges didn't change (e.g. we just updated riskLevel), skip to avoid loops
    // Use JSON stringify for deep comparison of the object
    if (oldData.pendingChanges && JSON.stringify(newData.pendingChanges) === JSON.stringify(oldData.pendingChanges)) {
        return null;
    }

    const changes = newData.pendingChanges;
    const current = newData; // The live data currently in root fields
    let riskLevel = 0;
    const reasons = [];

    // --- RISK CALCULATION LOGIC ---

    // LEVEL 3: Critical (Price hikes > 20%, potential fraud)
    if (changes.price !== undefined && current.price !== undefined) {
        const diff = Math.abs(changes.price - current.price);
        const percent = (diff / current.price) * 100;
        if (percent > 20) {
            riskLevel = 3;
            reasons.push(`Price changed by ${percent.toFixed(1)}%`);
        }
    }

    // LEVEL 2: High Impact (Category, Wholesale logic)
    if (changes.category && changes.category.en !== current.category?.en) {
        riskLevel = Math.max(riskLevel, 2);
        reasons.push('Category changed');
    }
    if (changes.productType && changes.productType !== current.productType) {
        riskLevel = Math.max(riskLevel, 2);
        reasons.push('Product Type changed');
    }
    // Wholesale field changes
    if (changes.wholesalePrice !== undefined && changes.wholesalePrice !== current.wholesalePrice) riskLevel = Math.max(riskLevel, 2);
    if (changes.minOrderQuantity !== undefined && changes.minOrderQuantity !== current.minOrderQuantity) riskLevel = Math.max(riskLevel, 2);

    // LEVEL 1: Standard (Content updates)
    // Title, Description, Images
    if (changes.name && changes.name.en !== current.name?.en) riskLevel = Math.max(riskLevel, 1);
    if (changes.description && JSON.stringify(changes.description) !== JSON.stringify(current.description)) riskLevel = Math.max(riskLevel, 1);
    if (changes.images && JSON.stringify(changes.images) !== JSON.stringify(current.images)) riskLevel = Math.max(riskLevel, 1);

    // LEVEL 0: Auto-Approval
    // If riskLevel is still 0, it implies only minor fields (like stock) were changed, 
    // OR fields that are not monitored.

    if (riskLevel === 0) {
        // AUTO-MERGE: The changes are safe. Apply them to root and remove pendingChanges.
        console.log(`[Auto-Approve] Product ${context.params.productId} - Level 0 Changes`);

        // Construct the update object: merge pendingChanges into root
        const updatePayload = {
            ...changes, // Spread the new values (e.g. stock: 50)
            pendingChanges: admin.firestore.FieldValue.delete(), // Remove the draft
            approvalStatus: 'approved',
            riskLevel: 0,
            lastRiskCheck: new Date().toISOString()
        };

        // Safety: Ensure we don't overwrite ID or crucial system fields if the draft had them
        delete updatePayload.id;

        await change.after.ref.update(updatePayload);
        await logActivity({ uid: 'system' }, 'product.auto_approved', 'product', context.params.productId, { reason: 'Level 0 (Stock/Minor)' });

    } else {
        // FLAG FOR REVIEW: Keep pendingChanges, set risk stats
        console.log(`[Flagged] Product ${context.params.productId} - Level ${riskLevel}`);

        await change.after.ref.update({
            riskLevel: riskLevel,
            approvalStatus: 'pending_review',
            lastRiskCheck: new Date().toISOString()
            // pendingChanges remains for Admin to see
        });
    }
});

// 7. Vendor Draft Management
exports.mergeDraftToLive = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');

    const { draftId, approvalStatus } = data;
    const targetStatus = approvalStatus || 'Pending'; // Default to Pending if not specified (Vendor submit)

    try {
        const draftRef = db.collection('product_drafts').doc(draftId);
        const draftDoc = await draftRef.get();

        if (!draftDoc.exists) throw new functions.https.HttpsError('not-found', 'Draft not found.');

        const draftData = draftDoc.data();

        // Auth Check
        const isVendorOwner = draftData.vendorId === context.auth.uid;
        const isAdmin = await db.collection('users').doc(context.auth.uid).get().then(s => s.data().role === 'admin' || s.data().role === 'super_admin');

        if (!isVendorOwner && !isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to draft.');
        }

        if (targetStatus === 'Approved' && !isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admin can approve directly.');
        }

        // Create new Product ID or use existing if it was an edit?
        // Logic: If draftData has 'targetProductId', we update. Else create new.
        // For now, simpler: Create New.
        const newProductId = `P${Date.now()}`;
        const newProduct = {
            ...draftData,
            id: newProductId,
            status: targetStatus,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Remove draft metadata
        delete newProduct.id; // We set new ID

        await db.runTransaction(async (t) => {
            const prodRef = db.collection('products').doc(newProductId);
            t.set(prodRef, newProduct);
            t.delete(draftRef);
        });

        await logActivity({ uid: context.auth.uid }, 'draft.merged', 'product', newProductId, { draftId, status: targetStatus });
        return { success: true, productId: newProductId };

    } catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// 7. Admin User Management
exports.createUser = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User required.');

    // 2. Role Check (Admin/Super Admin only)
    const callerRef = db.collection('users').doc(context.auth.uid);
    const callerSnap = await callerRef.get();
    if (!callerSnap.exists || (callerSnap.data().role !== 'admin' && callerSnap.data().role !== 'super_admin')) {
        throw new functions.https.HttpsError('permission-denied', 'Admins only.');
    }

    const { email, password, name, phone, role, adminRole, address, status } = data;

    try {
        // 3. Create Auth User
        const userRecord = await admin.auth().createUser({
            email,
            password: password || 'Sakhipur@123', // Default password if not provided
            displayName: name,
            phoneNumber: phone || undefined,
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });

        // 4. Create Firestore Profile
        const newUser = {
            id: userRecord.uid,
            name,
            email,
            phone: phone || '',
            role: role || 'customer',
            adminRole: role === 'admin' ? (adminRole || 'admin') : '',
            address: address || '',
            status: status || 'active',
            walletBalance: 0,
            addressBook: [],
            createdAt: new Date().toISOString(),
            isVerified: true // Admin created users are verified
        };

        await db.collection('users').doc(userRecord.uid).set(newUser);
        await syncUserClaims(userRecord.uid, newUser.role);
        await logActivity({ uid: context.auth.uid, email: context.auth.token.email }, 'user.created', 'user', userRecord.uid, { role, email });

        return { success: true, userId: userRecord.uid };

    } catch (error) {
        console.error('Create User Failed:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
