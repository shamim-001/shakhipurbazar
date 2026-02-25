
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { ProductPromotion } from '../../types';

export const PromotionService = {
    subscribeToPromotions: (callback: (promotions: ProductPromotion[]) => void) => {
        const q = query(collection(db, 'product_promotions'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductPromotion));
            callback(promotions);
        });
    },

    createPromotion: async (promotion: ProductPromotion): Promise<void> => {
        const { id, ...data } = promotion;
        await setDoc(doc(db, 'product_promotions', id), data);
    },

    updatePromotion: async (id: string, updates: Partial<ProductPromotion>): Promise<void> => {
        const docRef = doc(db, 'product_promotions', id);
        await updateDoc(docRef, updates);
    },

    deletePromotion: async (id: string): Promise<void> => {
        await deleteDoc(doc(db, 'product_promotions', id));
    }
};
