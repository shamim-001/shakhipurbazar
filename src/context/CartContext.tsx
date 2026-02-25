import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../../types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity: number, selectedCustomizations?: { [key: string]: string | string[] }, rentalDetails?: { date: string; from: string; to: string }) => void;
    removeFromCart: (cartItemId: string) => void;
    updateCartQuantity: (cartItemId: string, quantity: number) => void;
    getCartTotal: () => number;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const calculateItemPrice = (item: any, quantity: number) => {
        let basePrice = item.originalPrice || item.price;

        // Wholesale Tiered Logic
        if (item.wholesaleEnabled && item.wholesalePrice !== undefined) {
            const moq = item.minOrderQuantity || 1;
            if (quantity >= moq) {
                basePrice = item.wholesalePrice;
            }
        }

        let total = basePrice;
        if (item.selectedCustomizations && item.customizations) {
            Object.entries(item.selectedCustomizations).forEach(([title, value]) => {
                const group = item.customizations.find((c: any) => c.title.en === title);
                if (!group) return;
                const selectedOptions = Array.isArray(value) ? value : [value];
                selectedOptions.forEach(optName => {
                    const opt = group.options.find((o: any) => o.en === optName);
                    if (opt?.priceModifier) total += opt.priceModifier;
                });
            });
        }
        return total;
    };

    const addToCart = (product: Product, quantity: number, selectedCustomizations?: { [key: string]: string | string[] }, rentalDetails?: { date: string; from: string; to: string }) => {
        setCart(prev => {
            const cartItemId = `${product.id}-${JSON.stringify(selectedCustomizations)}-${JSON.stringify(rentalDetails)}`;
            const existingIndex = prev.findIndex(item => item.cartItemId === cartItemId);

            const minQty = (product.productType === 'wholesale' && product.minOrderQuantity) ? product.minOrderQuantity : 1;
            const finalQty = Math.max(minQty, quantity);

            if (existingIndex >= 0) {
                const newCart = [...prev];
                const updatedItem = { ...newCart[existingIndex] };
                updatedItem.quantity += quantity; // Add to existing
                updatedItem.price = calculateItemPrice(updatedItem, updatedItem.quantity);
                newCart[existingIndex] = updatedItem;
                return newCart;
            }

            const newItem: CartItem = {
                ...product,
                quantity: finalQty,
                cartItemId,
                selectedCustomizations,
                rentalDetails,
                originalPrice: product.price // Save original retail
            };
            newItem.price = calculateItemPrice(newItem, newItem.quantity);
            return [...prev, newItem];
        });
    };

    const removeFromCart = (cartItemId: string) => {
        setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    const updateCartQuantity = (cartItemId: string, quantity: number) => {
        setCart(prev => prev.map(item => {
            if (item.cartItemId !== cartItemId) return item;

            const minQty = (item.productType === 'wholesale' && item.minOrderQuantity) ? item.minOrderQuantity : 1;
            const newQuantity = Math.max(minQty, quantity);
            const newPrice = calculateItemPrice(item, newQuantity);

            return { ...item, quantity: newQuantity, price: newPrice };
        }));
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartQuantity, getCartTotal, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
