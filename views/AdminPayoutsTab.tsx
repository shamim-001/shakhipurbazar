import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useApp } from '../src/context/AppContext';
import { db } from '../src/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { CurrencyDollarIcon, ClockIcon, CheckCircleIcon, XIcon, CogIcon, ArrowPathIcon } from '../components/icons';
import { Transaction } from '../types';

import { EconomicsService } from '../src/services/economics';

const AdminPayoutsTab = () => {
    const { language, platformSettings, updatePlatformSettings } = useApp();
    const [platformBalance, setPlatformBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Payout Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [payoutInfo, setPayoutInfo] = useState({
        method: 'bKash' as 'bKash' | 'Nagad' | 'Bank',
        accountNumber: '',
        bankName: '' // only for Bank
    });

    // Load saved payout settings from PlatformSettings (assuming we store it there for simplicity)
    useEffect(() => {
        if (platformSettings.payoutDestination) {
            setPayoutInfo(platformSettings.payoutDestination);
        }
    }, [platformSettings]);

    useEffect(() => {
        // 1. Listen to Platform Balance (Root + Shards)
        const platformStatsRef = doc(db, 'system', 'platform_stats');
        const shardsRef = collection(db, 'system', 'platform_stats', 'shards');

        // We'll maintain a map of shard values to aggregate correctly
        const shardValues: { [id: string]: number } = {};
        let rootBalance = 0;

        const updateBalance = () => {
            const totalShards = Object.values(shardValues).reduce((a, b) => a + b, 0);
            setPlatformBalance(rootBalance + totalShards);
        };

        const unsubRoot = onSnapshot(platformStatsRef, (doc) => {
            if (doc.exists()) {
                rootBalance = doc.data().walletBalance || 0;
                updateBalance();
            }
        });

        const unsubShards = onSnapshot(shardsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                shardValues[change.doc.id] = change.doc.data().walletBalance || 0;
            });
            updateBalance();
        });

        // 2. Listen to Admin Payout Transactions
        const q = query(
            collection(db, 'transactions'),
            where('type', '==', 'admin_withdrawal'),
            orderBy('date', 'desc'),
            limit(20)
        );

        const unsubTxn = onSnapshot(q, (snapshot) => {
            const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            setTransactions(txns);
            setLoading(false);
        });

        // 3. Listen to Pending Vendor Withdrawals
        const qPending = query(
            collection(db, 'transactions'),
            where('type', '==', 'withdrawal'),
            where('status', '==', 'Pending'),
            orderBy('date', 'asc')
        );

        const unsubPending = onSnapshot(qPending, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
            setPendingRequests(reqs);
        });

        return () => {
            unsubRoot();
            unsubShards();
            unsubTxn();
            unsubPending();
        };
    }, []);

    const handleSaveSettings = () => {
        updatePlatformSettings({
            ...platformSettings,
            payoutDestination: payoutInfo
        } as any);
        setShowSettings(false);
        alert("Payout destination saved.");
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);

        if (isNaN(amount) || amount <= 0 || amount > platformBalance) {
            alert("Invalid amount");
            return;
        }

        if (!payoutInfo.accountNumber) {
            alert("Please configure a Payout Destination in Payout Settings first.");
            setShowSettings(true);
            return;
        }

        const isLarge = amount > 10000;
        const confirmMsg = isLarge
            ? `৳${amount} exceeds the direct payout limit. It will be submitted for internal approval. Continue?`
            : `Confirm AUTOMATIC transfer of ৳${amount} to ${payoutInfo.method} (${payoutInfo.accountNumber})?`;

        if (!confirm(confirmMsg)) return;

        setIsProcessing(true);

        try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const functions = getFunctions();
            const initiatePayout = httpsCallable(functions, 'initiatePayout');

            const result = await initiatePayout({
                amount,
                destination: payoutInfo.accountNumber,
                method: payoutInfo.method
            });

            const data = result.data as any;
            if (data.success) {
                if (data.needsApproval) {
                    alert(`Request Submitted! ৳${amount} is pending internal approval.`);
                } else {
                    alert(`Success! ৳${amount} transferred to ${payoutInfo.method} account.`);
                }
                setWithdrawAmount('');
            }
        } catch (error: any) {
            console.error("Payout Gateway Error:", error);
            alert(`Failed: ${error.message || "Unknown error during payout initiation."}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApprove = async (txn: Transaction) => {
        if (!confirm(`Approve payout of ৳${Math.abs(txn.amount)} for Vendor?`)) return;
        try {
            await EconomicsService.approvePayout(txn.id, txn.userId, txn.amount);
            toast.success("Payout Approved");
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        }
    };

    const handleReject = async (txn: Transaction) => {
        if (!confirm(`Reject payout request?`)) return;
        try {
            await EconomicsService.rejectPayout(txn.id);
            toast.success("Payout Rejected");
        } catch (e: any) {
            toast.error(`Error: ${e.message}`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CurrencyDollarIcon className="h-7 w-7 text-green-600" />
                        {language === 'en' ? 'Platform Earnings & Payouts' : 'প্ল্যাটফর্ম আয় এবং পেআউট'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage platform earnings and vendor payout requests.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            if (confirm("Run settlement for all pending vendor payments older than 3 days?")) {
                                try {
                                    const count = await EconomicsService.settlePendingTransactions();
                                    alert(`Settled ${count} transactions successfully.`);
                                } catch (e: any) {
                                    alert(`Settlement failed: ${e.message}`);
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                    >
                        <ArrowPathIcon className="w-5 h-5" /> Run Settlement
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg font-bold text-gray-700 dark:text-white hover:bg-gray-200"
                    >
                        <CogIcon className="w-5 h-5" /> Payout Settings
                    </button>
                </div>
            </div>

            {/* Payout Settings Modal/Panel */}
            {showSettings && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 mb-6">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">Configure Auto-Payout Destintation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Method</label>
                            <select
                                value={payoutInfo.method}
                                onChange={e => setPayoutInfo({ ...payoutInfo, method: e.target.value as any })}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            >
                                <option value="bKash">bKash (Personal/Agent)</option>
                                <option value="Nagad">Nagad</option>
                                <option value="Bank">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">
                                {payoutInfo.method === 'Bank' ? 'Account Number' : 'Mobile Number'}
                            </label>
                            <input
                                type="text"
                                value={payoutInfo.accountNumber}
                                onChange={e => setPayoutInfo({ ...payoutInfo, accountNumber: e.target.value })}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder={payoutInfo.method === 'Bank' ? 'Account No.' : '017...'}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-gray-500 font-bold">Cancel</button>
                        <button onClick={handleSaveSettings} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Save Configuration</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance & Withdraw Card */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-indigo-100 font-medium mb-1">Available Platform Revenue</p>
                        <h3 className="text-4xl font-bold mb-8">৳{platformBalance.toLocaleString()}</h3>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="text-xs text-indigo-100 uppercase font-bold tracking-wider">Withdraw Amount</label>
                                <div className="flex mt-1">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-transparent bg-indigo-800 text-gray-100 sm:text-sm">৳</span>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-transparent bg-white/20 placeholder-indigo-200 text-white outline-none"
                                        placeholder="0.00"
                                        max={platformBalance}
                                    />
                                </div>
                            </div>

                            {payoutInfo.accountNumber && (
                                <div className="text-xs text-indigo-200 flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" /> Sending to {payoutInfo.method} {payoutInfo.accountNumber}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!withdrawAmount || parseFloat(withdrawAmount) > platformBalance || isProcessing}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isProcessing ? 'Processing Transfer...' : 'Withdraw Funds Now'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Dashboard Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pending Vendor Payouts */}
                    {pendingRequests.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden border border-orange-200 dark:border-orange-900">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/10 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5" /> Pending Vendor Requests ({pendingRequests.length})
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Details</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                        {pendingRequests.map(txn => (
                                            <tr key={txn.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    {new Date(txn.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {txn.userId?.substring(0, 8)}...
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    ৳{Math.abs(txn.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {txn.paymentMethod ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-800 dark:text-gray-200">{txn.paymentMethod}</span>
                                                            <span className="text-xs">{txn.paymentDetails?.accountNumber}</span>
                                                            {txn.paymentMethod === 'Bank Transfer' && txn.paymentDetails?.bankDetails && (
                                                                <span className="text-xs text-gray-400">{txn.paymentDetails.bankDetails.bankName} - {txn.paymentDetails.bankDetails.branchName}</span>
                                                            )}
                                                            {txn.paymentDetails?.accountType && txn.paymentMethod !== 'Bank Transfer' && (
                                                                <span className="text-[10px] uppercase bg-gray-100 dark:bg-gray-700 px-1 rounded w-fit mt-0.5">{txn.paymentDetails.accountType}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs italic text-gray-400">Legacy / Not specified</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        onClick={() => handleApprove(txn)}
                                                        className="text-green-600 hover:text-green-900 font-bold mr-4"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(txn)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Auto-Withdrawal History */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Auto-Withdrawal History</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                                <thead className="bg-gray-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No withdrawals yet.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((txn: any) => (
                                            <tr key={txn.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    {new Date(txn.date).toLocaleDateString()}
                                                    <span className="text-xs text-gray-400 block">{new Date(txn.date).toLocaleTimeString()}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    ৳{Math.abs(txn.amount).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {txn.description}
                                                    {txn.gatewayTxnId && <span className="block text-xs font-mono text-gray-400">{txn.gatewayTxnId}</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        {txn.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPayoutsTab;
