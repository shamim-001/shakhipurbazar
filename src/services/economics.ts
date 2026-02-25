import { db } from '../lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, increment, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Order, CategoryCommission, Transaction } from '../../types';
import { ActivityLoggerService } from './activityLogger';

export const EconomicsService = {
    /**
     * Get Platform Wallet Balance (Sum of Shards)
     */
    getPlatformBalance: async () => {
        const platformStatsRef = doc(db, 'system', 'platform_stats');
        const statsDoc = await getDoc(platformStatsRef);
        let total = statsDoc.exists() ? (statsDoc.data().walletBalance || 0) : 0;

        // Sum up shards (assume 5 shards)
        for (let i = 0; i < 5; i++) {
            const shardRef = doc(db, 'system', 'platform_stats', 'shards', `shard_${i}`);
            const shardDoc = await getDoc(shardRef);
            if (shardDoc.exists()) {
                total += shardDoc.data().walletBalance || 0;
            }
        }
        return total;
    },

    /**
     * Top up user wallet
     */
    topUpWallet: async (userId: string, amount: number, method: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                transaction.update(userRef, {
                    walletBalance: increment(amount)
                });

                const txnRef = doc(collection(db, 'transactions'));
                transaction.set(txnRef, {
                    id: txnRef.id,
                    userId,
                    type: 'topup',
                    amount: amount,
                    date: new Date().toISOString(),
                    description: `Wallet Top-up via ${method}`,
                    status: 'Completed',
                    paymentMethod: method
                });

                // Audit Log
                ActivityLoggerService.log(
                    'wallet.topup',
                    userId,
                    userDoc.data().name || 'User',
                    userDoc.data().role || 'customer',
                    {
                        type: 'user',
                        id: userId,
                        name: userDoc.data().name || 'User',
                        metadata: { amount, method }
                    }
                );
            });
        } catch (e) {
            console.error("Top-up failed:", e);
            throw e;
        }
    },

    calculateSplit: (orderTotal: number, deliveryFee: number, categoryName: string, commissions: CategoryCommission[]) => {
        const productTotal = orderTotal - (deliveryFee || 0);
        // Default to 10% if not found
        const defaultRate = 10;
        const rule = commissions.find(c => c.category.en === categoryName || c.category.bn === categoryName);
        const rate = rule ? rule.commissionRate : defaultRate;

        const platformFee = (productTotal * rate) / 100;
        const vendorAmount = productTotal - platformFee;

        return {
            vendorAmount: Number(vendorAmount.toFixed(2)),
            platformFee: Number(platformFee.toFixed(2)),
            rateApplied: rate
        };
    },

    /**
     * @deprecated Revenue distribution is now handled by Cloud Functions on 'Delivered' status change.
     * This method is preserved for historical reference but will throw an error if called.
     */
    processOrderTransaction: async (_order: Order, _vendorId: string, _categoryName: string, _commissions: CategoryCommission[], _platformResellerRate?: number) => {
        console.error("CRITICAL: Frontend attempt to distribute revenue. This is now handled by Cloud Functions.");
        throw new Error("Revenue distribution is now restricted to Cloud Functions only.");
    },

    /**
     * Request a Payout (Vendor Side)
     */
    requestPayout: async (vendorId: string, amount: number, methodDetails: { method: string, accountType: string, accountNumber: string, bankDetails?: any }) => {
        try {
            const newTransactionRef = doc(collection(db, 'transactions'));
            await runTransaction(db, async (transaction) => {
                const vendorRef = doc(db, 'vendors', vendorId);
                const vendorDoc = await transaction.get(vendorRef);

                if (!vendorDoc.exists()) throw new Error("Vendor not found");

                const currentBalance = vendorDoc.data().walletBalance || 0;
                if (currentBalance < amount) {
                    throw new Error("Insufficient balance for withdrawal request.");
                }

                transaction.set(newTransactionRef, {
                    id: newTransactionRef.id,
                    userId: vendorId,
                    type: 'withdrawal',
                    amount: -amount,
                    date: new Date().toISOString(),
                    description: `Payout Request via ${methodDetails.method}`,
                    status: 'Pending',
                    paymentMethod: methodDetails.method,
                    paymentDetails: methodDetails
                });

                transaction.update(vendorRef, { payoutRequested: true });
            });
            return newTransactionRef.id;
        } catch (e) {
            console.error("Payout Request Failed", e);
            throw e;
        }
    },

    /**
     * Approve Payout (Admin Side)
     */
    approvePayout: async (transactionId: string, vendorId: string, amount: number) => {
        try {
            await runTransaction(db, async (transaction) => {
                const vendorRef = doc(db, 'vendors', vendorId);
                const txnRef = doc(db, 'transactions', transactionId);

                const vendorDoc = await transaction.get(vendorRef);
                const txnDoc = await transaction.get(txnRef);

                if (!vendorDoc.exists()) throw new Error("Vendor not found");
                if (!txnDoc.exists()) throw new Error("Transaction not found");

                const currentBalance = vendorDoc.data().walletBalance || 0;
                const payoutAmount = Math.abs(amount);
                if (currentBalance < payoutAmount) {
                    throw new Error("Insufficient Funds");
                }

                transaction.update(vendorRef, {
                    walletBalance: currentBalance - payoutAmount,
                    payoutRequested: false
                });

                transaction.update(txnRef, {
                    status: 'Completed',
                    date: new Date().toISOString()
                });

                // Audit Log
                ActivityLoggerService.log(
                    'payout.approved',
                    'admin',
                    'System Admin',
                    'admin',
                    {
                        type: 'payout',
                        id: transactionId,
                        name: `Payout for ${vendorId}`,
                        metadata: { amount: payoutAmount, vendorId }
                    }
                );
            });
        } catch (e) {
            console.error("Approve Payout Failed", e);
            throw e;
        }
    },

    /**
     * Reject Payout (Admin Side)
     */
    rejectPayout: async (transactionId: string) => {
        try {
            const txnRef = doc(db, 'transactions', transactionId);
            await runTransaction(db, async (transaction) => {
                const txnDoc = await transaction.get(txnRef);
                if (!txnDoc.exists()) throw new Error("Transaction not found");

                transaction.update(txnRef, {
                    status: 'Rejected'
                });

                const vendorId = txnDoc.data().userId;
                if (vendorId) {
                    const vendorRef = doc(db, 'vendors', vendorId);
                    transaction.update(vendorRef, { payoutRequested: false });

                    // Audit Log
                    ActivityLoggerService.log(
                        'payout.rejected',
                        'admin',
                        'System Admin',
                        'admin',
                        {
                            type: 'payout',
                            id: transactionId,
                            name: `Payout Rejected for ${vendorId}`,
                            metadata: { vendorId }
                        }
                    );
                }
            });
        } catch (e) {
            throw e;
        }
    },

    /**
     * Process Refund (Admin Side)
     */
    processRefund: async (order: Order, categoryName: string, reason: string, platformCommissions: CategoryCommission[]) => {
        try {
            await runTransaction(db, async (transaction) => {
                const vendorId = order.vendorId;
                const vendorRef = doc(db, 'vendors', vendorId);
                const userRef = doc(db, 'users', vendorId);

                let ownerRef = vendorRef;
                let ownerType: 'vendor' | 'reseller' = 'vendor';

                const vendorDoc = await transaction.get(vendorRef);
                if (!vendorDoc.exists()) {
                    const userDoc = await transaction.get(userRef);
                    if (userDoc.exists() && userDoc.data().isReseller) {
                        ownerRef = userRef;
                        ownerType = 'reseller';
                    }
                }

                const ownerData = (await transaction.get(ownerRef)).data();
                const currentBalance = ownerData?.walletBalance || 0;

                let split;
                const productTotal = order.total - (order.deliveryFee || 0);

                if (ownerType === 'reseller') {
                    const rate = 5;
                    const platformFee = (productTotal * rate) / 100;
                    split = { vendorAmount: productTotal - platformFee, platformFee };
                } else {
                    split = EconomicsService.calculateSplit(order.total, order.deliveryFee || 0, categoryName, platformCommissions);
                }

                const { vendorAmount, platformFee } = split;

                transaction.update(ownerRef, {
                    walletBalance: currentBalance - vendorAmount,
                    lastTransactionDate: new Date().toISOString()
                });

                const numShards = 5;
                const shardId = Math.floor(Math.random() * numShards);
                const shardRef = doc(db, 'system', 'platform_stats', 'shards', `shard_${shardId}`);
                transaction.set(shardRef, {
                    walletBalance: increment(-platformFee),
                    lastUpdated: new Date().toISOString()
                }, { merge: true });

                const revTxnRef = doc(collection(db, 'transactions'));
                transaction.set(revTxnRef, {
                    userId: vendorId,
                    type: 'refund_reversal',
                    amount: -order.total,
                    date: new Date().toISOString(),
                    description: `Refund Reversal for Order #${order.id}. Reason: ${reason}`,
                    status: 'Completed',
                    orderId: order.id
                });

                const feeTxnRef = doc(collection(db, 'transactions'));
                transaction.set(feeTxnRef, {
                    userId: vendorId,
                    type: 'commission_refund',
                    amount: platformFee,
                    date: new Date().toISOString(),
                    description: `Platform Commission Refund for Order #${order.id}`,
                    status: 'Completed',
                    orderId: order.id
                });

                // Audit Log
                ActivityLoggerService.log(
                    'order.refunded',
                    'admin',
                    'System Admin',
                    'admin',
                    {
                        type: 'order',
                        id: order.id,
                        name: `Order #${order.id} Refunded`,
                        metadata: { amount: order.total, reason }
                    }
                );
            });
        } catch (e) {
            console.error("Refund processing failed:", e);
            throw e;
        }
    },

    /**
     * Deducts balance from customer's wallet for an order.
     */
    payWithWallet: async (userId: string, amount: number, orderId: string, description: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("User not found");

                const currentBalance = userDoc.data().walletBalance || 0;
                if (currentBalance < amount) {
                    throw new Error("Insufficient wallet balance.");
                }

                transaction.update(userRef, {
                    walletBalance: increment(-amount)
                });

                const txnRef = doc(collection(db, 'transactions'));
                transaction.set(txnRef, {
                    id: txnRef.id,
                    userId,
                    type: 'payment',
                    amount: -amount,
                    date: new Date().toISOString(),
                    description,
                    status: 'Completed',
                    orderId
                });
            });
        } catch (e) {
            console.error("Wallet payment failed:", e);
            throw e;
        }
    },

    /**
     * Settles all pending transactions whose settleAt date has passed.
     */
    processDriverEarning: async (userId: string, amount: number, jobId: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("Driver not found");

                transaction.update(userRef, {
                    walletBalance: increment(amount)
                });

                const txnRef = doc(collection(db, 'transactions'));
                transaction.set(txnRef, {
                    id: txnRef.id,
                    userId,
                    type: 'driver_earning',
                    amount: amount,
                    date: new Date().toISOString(),
                    description: `Earning for Trip #${jobId}`,
                    status: 'Completed',
                    jobId
                });
            });
        } catch (e) {
            console.error("Driver earning process failed:", e);
            throw e;
        }
    },

    processDeliveryEarning: async (userId: string, amount: number, deliveryId: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, 'users', userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) throw new Error("Delivery Man not found");

                transaction.update(userRef, {
                    walletBalance: increment(amount)
                });

                const txnRef = doc(collection(db, 'transactions'));
                transaction.set(txnRef, {
                    id: txnRef.id,
                    userId,
                    type: 'delivery_earning',
                    amount: amount,
                    date: new Date().toISOString(),
                    description: `Earning for Delivery #${deliveryId}`,
                    status: 'Completed',
                    deliveryId
                });
            });
        } catch (e) {
            console.error("Delivery earning process failed:", e);
            throw e;
        }
    },

    /**
     * Settles all pending transactions whose settleAt date has passed.
     */
    settlePendingTransactions: async () => {
        try {
            const q = query(
                collection(db, 'transactions'),
                where('status', '==', 'Pending'),
                where('settleAt', '<=', new Date().toISOString())
            );

            const snapshot = await getDocs(q);
            if (snapshot.empty) return 0;

            let settledCount = 0;
            for (const transactionDoc of snapshot.docs) {
                const txnData = transactionDoc.data() as Transaction;

                if (txnData.type as string === 'withdrawal') continue;

                await runTransaction(db, async (transaction) => {
                    const ownerRef = doc(db, 'vendors', txnData.userId);
                    const userRef = doc(db, 'users', txnData.userId);

                    let targetRef = ownerRef;
                    let ownerDoc = await transaction.get(ownerRef);

                    if (!ownerDoc.exists()) {
                        targetRef = userRef;
                        ownerDoc = await transaction.get(userRef);
                    }

                    if (ownerDoc.exists()) {
                        const currentBalance = ownerDoc.data().walletBalance || 0;
                        transaction.update(targetRef, {
                            walletBalance: currentBalance + txnData.amount,
                            lastTransactionDate: new Date().toISOString()
                        });

                        transaction.update(transactionDoc.ref, {
                            status: 'Completed',
                            settledAt: new Date().toISOString()
                        });
                        settledCount++;
                    }
                });
            }
            return settledCount;
        } catch (e) {
            console.error("Settlement process failed:", e);
            throw e;
        }
    }
};
