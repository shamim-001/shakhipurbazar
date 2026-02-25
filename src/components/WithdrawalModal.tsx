import React, { useState } from 'react';
import { XIcon, CreditCardIcon, BuildingStorefrontIcon as LibraryIcon } from "../../components/icons";

interface WithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, methodDetails: any) => void;
    maxAmount: number;
    currentBalance: number;
    language: 'en' | 'bn';
    payoutSettings?: any;
}

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onSubmit, maxAmount, currentBalance, language, payoutSettings }) => {
    const [amount, setAmount] = useState<number>(maxAmount);

    // Auto-fill from payoutSettings if available
    const [method, setMethod] = useState<'bKash' | 'Rocket' | 'Nagad' | 'Bank Transfer'>(payoutSettings?.method || 'bKash');
    const [accountType, setAccountType] = useState<'Personal' | 'Agent' | 'Bank'>(payoutSettings?.accountType || 'Personal');
    const [accountNumber, setAccountNumber] = useState(payoutSettings?.accountNumber || '');

    // Bank Details
    const [bankName, setBankName] = useState(payoutSettings?.bankDetails?.bankName || '');
    const [branchName, setBranchName] = useState(payoutSettings?.bankDetails?.branchName || '');
    const [accountName, setAccountName] = useState(payoutSettings?.bankDetails?.accountName || '');

    const isLocked = !!payoutSettings; // If settings exist, they are locked for editing here.

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (amount < 500) {
            alert(language === 'en' ? 'Minimum withdrawal is ৳500' : 'ন্যূনতম উত্তোলন ৳৫০০');
            return;
        }
        if (amount > currentBalance) {
            alert(language === 'en' ? 'Insufficient balance' : 'অপর্যাপ্ত ব্যালেন্স');
            return;
        }

        const details = {
            method,
            accountType: method === 'Bank Transfer' ? 'Bank' : accountType,
            accountNumber,
            bankDetails: method === 'Bank Transfer' ? { bankName, branchName, accountName } : undefined
        };

        onSubmit(amount, details);
        onClose();
    };

    const content = {
        en: {
            title: "Withdraw Funds",
            balance: "Available Balance",
            amount: "Withdrawal Amount",
            method: "Payment Method",
            accType: "Account Type",
            accNum: "Account Number",
            bankName: "Bank Name",
            branch: "Branch Name",
            accName: "Account Holder Name",
            cancel: "Cancel",
            submit: "Submit Request",
            personal: "Personal",
            agent: "Agent"
        },
        bn: {
            title: "টাকা উত্তোলন করুন",
            balance: "উপলব্ধ ব্যালেন্স",
            amount: "উত্তোলনের পরিমাণ",
            method: "পেমেন্ট পদ্ধতি",
            accType: "অ্যাকাউন্টের ধরন",
            accNum: "অ্যাকাউন্ট নম্বর",
            bankName: "ব্যাংকের নাম",
            branch: "শাখার নাম",
            accName: "অ্যাকাউন্টধারীর নাম",
            cancel: "বাতিল",
            submit: "অনুরোধ জমা দিন",
            personal: "পার্সোনাল",
            agent: "এজেন্ট"
        }
    };

    const t = content[language];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-700/50">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <CreditCardIcon className="w-6 h-6 text-green-600" />
                        {t.title}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-100 dark:border-green-800/30">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1 uppercase tracking-wide">{t.balance}</p>
                        <p className="text-3xl font-extrabold text-green-700 dark:text-green-300">৳{currentBalance.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.amount}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                            <input
                                type="number"
                                required
                                min={500}
                                max={currentBalance}
                                value={amount}
                                onChange={e => setAmount(Number(e.target.value))}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold text-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.method}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['bKash', 'Rocket', 'Nagad', 'Bank Transfer'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    disabled={isLocked && method !== m}
                                    onClick={() => !isLocked && setMethod(m as any)}
                                    className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all ${method === m
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        : isLocked
                                            ? 'border-gray-100 dark:border-slate-800 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                                            : 'border-gray-200 dark:border-slate-700 hover:border-green-200 dark:hover:border-slate-600 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {m === 'Bank Transfer' ? (language === 'en' ? 'Bank' : 'ব্যাংক') : m}
                                </button>
                            ))}
                        </div>
                    </div>

                    {method !== 'Bank Transfer' ? (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.accType}</label>
                                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
                                    {(['Personal', 'Agent'] as const).map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setAccountType(type)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${accountType === type
                                                ? 'bg-white dark:bg-slate-600 text-gray-800 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            {type === 'Personal' ? t.personal : t.agent}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.accNum}</label>
                                <input
                                    type="text"
                                    required
                                    disabled={isLocked}
                                    placeholder="017..."
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    className={`w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 outline-none ${isLocked ? 'cursor-not-allowed text-gray-400' : ''}`}
                                />
                                {isLocked && (
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                                        ⓘ {language === 'en' ? 'Using verified payout destination' : 'যাচাইকৃত মাধ্যম ব্যবহৃত হচ্ছে'}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-white mb-2">
                                <LibraryIcon className="w-4 h-4" /> Bank Details {isLocked && " (Verified)"}
                            </div>
                            <input
                                placeholder={t.bankName}
                                required
                                disabled={isLocked}
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                className={`w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-500 rounded-lg text-sm ${isLocked ? 'cursor-not-allowed text-gray-400' : ''}`}
                            />
                            <input
                                placeholder={t.branch}
                                required
                                disabled={isLocked}
                                value={branchName}
                                onChange={e => setBranchName(e.target.value)}
                                className={`w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-500 rounded-lg text-sm ${isLocked ? 'cursor-not-allowed text-gray-400' : ''}`}
                            />
                            <input
                                placeholder={t.accName}
                                required
                                disabled={isLocked}
                                value={accountName}
                                onChange={e => setAccountName(e.target.value)}
                                className={`w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-500 rounded-lg text-sm ${isLocked ? 'cursor-not-allowed text-gray-400' : ''}`}
                            />
                            <input
                                placeholder={t.accNum}
                                required
                                disabled={isLocked}
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                                className={`w-full p-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-500 rounded-lg text-sm ${isLocked ? 'cursor-not-allowed text-gray-400' : ''}`}
                            />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95"
                        >
                            {t.submit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WithdrawalModal;
