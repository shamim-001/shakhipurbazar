import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CategoryCommission, BulkResult, Language } from '../../types';
import { ProductService } from '../services/productService';
import { CategoryService } from '../services/categoryService';
import { slugify } from '../utils/slugify';

interface ProductContextType {
    products: Product[];
    addProduct: (product: Product) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    updateProduct: (updatedProduct: Product) => Promise<void>;
    updateProductStatus: (productId: string, status: Product['status'], reason?: string) => Promise<void>;
    categoryCommissions: CategoryCommission[];
    updateCategoryCommissions: (categories: CategoryCommission[]) => void;
    updateCategory: (originalCategoryEn: string, updatedCategory: CategoryCommission) => Promise<void>;
    addCategoryCommission: (newCommission: CategoryCommission) => Promise<void>;
    deleteCategoryCommission: (categoryEn: string, migrateToId?: string) => Promise<void>;
    reorderCategories: (reorderedCategories: CategoryCommission[]) => Promise<void>;
    bulkApproveProducts: (productIds: string[]) => Promise<BulkResult>;
    bulkRejectProducts: (productIds: string[], reason?: string) => Promise<BulkResult>;
    bulkDeleteProducts: (productIds: string[]) => Promise<BulkResult>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryCommissions, setCategoryCommissions] = useState<CategoryCommission[]>([]);

    useEffect(() => {
        const unsubProducts = ProductService.subscribeToProducts((fetchedProducts) => {
            // Note: Use Bengali name for slug if available to support localized SEO
            setProducts(fetchedProducts.map(p => ({
                ...p,
                slug: p.slug || slugify(p.name.bn || p.name.en)
            })));
        });
        const unsubCats = CategoryService.subscribeToCategories(setCategoryCommissions);
        return () => { unsubProducts(); unsubCats(); };
    }, []);

    const addProduct = async (product: Product) => {
        const slug = product.slug || slugify(product.name.bn || product.name.en);
        await ProductService.addProduct({ ...product, slug });
    };

    const deleteProduct = async (productId: string) => {
        await ProductService.deleteProduct(productId);
    };

    const updateProduct = async (updatedProduct: Product) => {
        await ProductService.updateProduct(updatedProduct.id, updatedProduct);
    };

    const updateProductStatus = async (productId: string, status: Product['status'], reason?: string) => {
        await ProductService.updateProduct(productId, { status, rejectionReason: reason });
    };

    // Stubs for now
    const updateCategoryCommissions = () => { };
    const updateCategory = async () => { };
    const addCategoryCommission = async () => { };
    const deleteCategoryCommission = async () => { };
    const reorderCategories = async () => { };
    const bulkApproveProducts = async (productIds: string[]) => {
        for (const id of productIds) {
            await ProductService.updateProduct(id, { status: 'Approved' });
        }
        return { success: true, count: productIds.length };
    };

    const bulkRejectProducts = async (productIds: string[], reason?: string) => {
        for (const id of productIds) {
            await ProductService.updateProduct(id, { status: 'Rejected', rejectionReason: reason });
        }
        return { success: true, count: productIds.length };
    };

    const bulkDeleteProducts = async (productIds: string[]) => {
        for (const id of productIds) {
            await ProductService.deleteProduct(id);
        }
        return { success: true, count: productIds.length };
    };

    return (
        <ProductContext.Provider value={{
            products, addProduct, deleteProduct, updateProduct, updateProductStatus,
            categoryCommissions, updateCategoryCommissions, updateCategory,
            addCategoryCommission, deleteCategoryCommission, reorderCategories,
            bulkApproveProducts, bulkRejectProducts, bulkDeleteProducts
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) throw new Error('useProducts must be used within a ProductProvider');
    return context;
};
