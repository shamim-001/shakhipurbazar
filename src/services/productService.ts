
import { db } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { Product } from '../../types';

export const ProductService = {
    subscribeToProducts: (callback: (products: Product[]) => void) => {
        const q = query(collection(db, 'products'));
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            callback(products);
        });
    },

    getAllProducts: async (): Promise<Product[]> => {
        try {
            const snapshot = await getDocs(collection(db, 'products'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("ProductService.getAllProducts error:", error);
            return [];
        }
    },

    addProduct: async (product: Product): Promise<string> => {
        try {
            const id = product.id || doc(collection(db, 'products')).id;
            const finalProduct = { ...product, id };
            await setDoc(doc(db, 'products', id), finalProduct);
            return id;
        } catch (error) {
            console.error("ProductService.addProduct error:", error);
            throw error;
        }
    },

    updateProduct: async (id: string, data: Partial<Product>): Promise<void> => {
        try {
            const docRef = doc(db, 'products', id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("ProductService.updateProduct error:", error);
            throw error;
        }
    },

    deleteProduct: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'products', id));
        } catch (error) {
            console.error("ProductService.deleteProduct error:", error);
            throw error;
        }
    },

    getProductsByCategory: async (categoryEn: string): Promise<Product[]> => {
        try {
            const q = query(collection(db, 'products'), where('category.en', '==', categoryEn));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("ProductService.getProductsByCategory error:", error);
            return [];
        }
    },

    updateProductCategory: async (oldCategoryEn: string, newCategory: { en: string; bn: string }): Promise<void> => {
        try {
            const q = query(collection(db, 'products'), where('category.en', '==', oldCategoryEn));
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => {
                batch.update(d.ref, { category: newCategory });
            });
            await batch.commit();
        } catch (error) {
            console.error("ProductService.updateProductCategory error:", error);
            throw error;
        }
    },

    updateProductSubCategory: async (categoryEn: string, oldSubCategoryEn: string, newSubCategory: { en: string; bn: string }): Promise<void> => {
        try {
            const q = query(
                collection(db, 'products'),
                where('category.en', '==', categoryEn),
                where('subCategory.en', '==', oldSubCategoryEn)
            );
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => {
                batch.update(d.ref, { subCategory: newSubCategory });
            });
            await batch.commit();
        } catch (error) {
            console.error("ProductService.updateProductSubCategory error:", error);
            throw error;
        }
    }
};
