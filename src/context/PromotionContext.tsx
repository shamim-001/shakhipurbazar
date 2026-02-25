import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProductPromotion } from '../../types';
import { PromotionService } from '../services/promotionService';

interface PromotionContextType {
    productPromotions: ProductPromotion[];
    createPromotion: (promotionData: Omit<ProductPromotion, 'id' | 'status' | 'createdAt'>) => Promise<ProductPromotion | null>;
    updatePromotion: (id: string, updates: Partial<ProductPromotion>) => Promise<void>;
    pausePromotion: (id: string) => Promise<void>;
    resumePromotion: (id: string) => Promise<void>;
    cancelPromotion: (id: string) => Promise<void>;
    processPromotionBudgets: () => void;
    getActivePromotions: (vendorId?: string) => ProductPromotion[];
    getPromotionByProductId: (productId: string) => ProductPromotion | undefined;
    minimumPromotionBid: number;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [productPromotions, setProductPromotions] = useState<ProductPromotion[]>([]);
    const minimumPromotionBid = 10; // Default minimum bid

    useEffect(() => {
        const unsubscribe = PromotionService.subscribeToPromotions(setProductPromotions);
        return () => unsubscribe();
    }, []);

    const createPromotion = async (promotionData: any) => {
        const id = `PROMO${Date.now()}`;
        const newPromotion: ProductPromotion = {
            id,
            status: 'active',
            createdAt: new Date().toISOString(),
            ...promotionData
        };
        await PromotionService.createPromotion(newPromotion);
        return newPromotion;
    };

    const updatePromotion = async (id: string, updates: Partial<ProductPromotion>) => {
        await PromotionService.updatePromotion(id, updates);
    };

    const pausePromotion = async (id: string) => {
        await PromotionService.updatePromotion(id, { status: 'paused' });
    };

    const resumePromotion = async (id: string) => {
        await PromotionService.updatePromotion(id, { status: 'active' });
    };

    const cancelPromotion = async (id: string) => {
        await PromotionService.updatePromotion(id, { status: 'ended' });
    };

    const processPromotionBudgets = useCallback(() => {
        // Implementation for daily budget deduction logic
        console.log("Processing promotion budgets...");
    }, []);

    const getActivePromotions = useCallback((vendorId?: string) => {
        return productPromotions.filter(p =>
            p.status === 'active' && (!vendorId || p.vendorId === vendorId)
        );
    }, [productPromotions]);

    const getPromotionByProductId = useCallback((productId: string) => {
        return productPromotions.find(p => p.productId === productId && p.status === 'active');
    }, [productPromotions]);

    return (
        <PromotionContext.Provider value={{
            productPromotions,
            createPromotion,
            updatePromotion,
            pausePromotion,
            resumePromotion,
            cancelPromotion,
            processPromotionBudgets,
            getActivePromotions,
            getPromotionByProductId,
            minimumPromotionBid
        }}>
            {children}
        </PromotionContext.Provider>
    );
};

export const usePromotions = () => {
    const context = useContext(PromotionContext);
    if (!context) throw new Error('usePromotions must be used within a PromotionProvider');
    return context;
};
