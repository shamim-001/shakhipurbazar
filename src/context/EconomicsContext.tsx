import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, User } from '../../types';
import { EconomicsService } from '../services/economics';

interface EconomicsContextType {
    walletTransactions: Transaction[];
    topUpWallet: (amount: number, method: string) => Promise<void>;
    payWithWallet: (userId: string, amount: number, orderId: string, description: string) => Promise<boolean>;
}

const EconomicsContext = createContext<EconomicsContextType | undefined>(undefined);

export const EconomicsProvider: React.FC<{ currentUser: User | null; children: React.ReactNode }> = ({ currentUser, children }) => {
    const [walletTransactions, setWalletTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        // Assume EconomicsService has a subscription method or fetch
        // For now, stub
    }, [currentUser]);

    const topUpWallet = async (amount: number, method: string) => {
        if (!currentUser) return;
        // Integration Note: Backend update enabled. Real payment gateway redirect would happen before this call in UI.
        await EconomicsService.topUpWallet(currentUser.id, amount, method);
    };

    const payWithWallet = async (userId: string, amount: number, orderId: string, description: string) => {
        return await EconomicsService.payWithWallet(userId, amount, orderId, description);
    };

    return (
        <EconomicsContext.Provider value={{ walletTransactions, topUpWallet, payWithWallet }}>
            {children}
        </EconomicsContext.Provider>
    );
};

export const useEconomics = () => {
    const context = useContext(EconomicsContext);
    if (!context) throw new Error('useEconomics must be used within an EconomicsProvider');
    return context;
};
