import React, { useEffect } from 'react';
import { AppProviders } from './src/providers/AppProviders';
import { AppRoutes } from './src/routes/AppRoutes';
import { PWABanner } from './components/PWABanner';
import { useLocation } from 'react-router-dom';
import { useApp } from './src/context/AppContext';
import { listenToForegroundMessages } from './src/services/notificationService';

import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

// The Main App Component
const App: React.FC = () => {
    return (
        <AppProviders>
            <GlobalErrorBoundary>
                <div className="flex flex-col min-h-screen bg-[#F9F9F9] dark:bg-slate-900" style={{ fontFamily: 'Noto Sans Bengali, sans-serif' }}>
                    <AppContent />
                </div>
            </GlobalErrorBoundary>
        </AppProviders>
    );
};

// Internal component to use hooks from providers
const AppContent: React.FC = () => {
    // We can add global listeners here (like PWA Banner, scroll to top)
    const { pathname } = useLocation();
    const { currentUser } = useApp(); // Access context

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    // Listen for foreground notifications
    useEffect(() => {
        const unsubscribe = listenToForegroundMessages((payload) => {
            console.log("Notification received in foreground:", payload);
        });
        return () => unsubscribe();
    }, []);

    return (
        <GlobalErrorBoundary userId={currentUser?.id} userEmail={currentUser?.email}>
            <ImportedHeader />
            <main className="flex-grow">
                <AppRoutes />
            </main>
            <ImportedFooter />
            <ImportedBottomNav />
            <PWABanner />
        </GlobalErrorBoundary>
    );
};

import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';

const ImportedHeader = () => <Header />;
const ImportedFooter = () => <Footer />;
const ImportedBottomNav = () => <BottomNav />;

export default App;
