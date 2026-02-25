import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { AppProvider } from '../context/AppProvider';
import { CartProvider } from '../context/CartContext';
import { OrderProvider } from '../context/OrderContext';
import { ProductProvider } from '../context/ProductContext';
import { SystemProvider } from '../context/SystemContext';
import { UserProvider, useUsers } from '../context/UserContext';
import { ChatProvider } from '../context/ChatContext';
import { EconomicsProvider } from '../context/EconomicsContext';
import { PromotionProvider } from '../context/PromotionContext';
import ErrorBoundary from '../components/ErrorBoundary';
import AnalyticsProvider from '../components/AnalyticsProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ErrorBoundary>
            <HelmetProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <UserProvider>
                            <UserDependentProviders>
                                <SystemProvider>
                                    <ProductProvider>
                                        <PromotionProvider>
                                            <CartProvider>
                                                <AppProvider>
                                                    <AnalyticsProvider>
                                                        <Toaster position="top-center" />
                                                        {children}
                                                    </AnalyticsProvider>
                                                </AppProvider>
                                            </CartProvider>
                                        </PromotionProvider>
                                    </ProductProvider>
                                </SystemProvider>
                            </UserDependentProviders>
                        </UserProvider>
                    </AuthProvider>
                </BrowserRouter>
            </HelmetProvider>
        </ErrorBoundary>
    );
};

const UserDependentProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useUsers();
    return (
        <ChatProvider currentUser={currentUser}>
            <EconomicsProvider currentUser={currentUser}>
                <OrderProvider currentUser={currentUser}>
                    {children}
                </OrderProvider>
            </EconomicsProvider>
        </ChatProvider>
    );
};
