import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PlatformSettings } from '../types';
import ProtectedRoute from '../components/ProtectedRoute';

// LAZY LOADED COMPONENTS
const HomePage = React.lazy(() => import('../../views/HomePage'));
const CategoryPage = React.lazy(() => import('../../views/CategoryPage'));
const ProductPage = React.lazy(() => import('../../views/ProductPage'));
const VendorPage = React.lazy(() => import('../../views/VendorPage'));
const AdminSetupPage = React.lazy(() => import('../../views/AdminSetupPage'));
const CartPage = React.lazy(() => import('../../views/CartPage'));
const VendorRegistrationPage = React.lazy(() => import('../../views/VendorRegistrationPage'));
const RiderRegistrationPage = React.lazy(() => import('../../views/RiderRegistrationPage'));
const RiderDashboardPage = React.lazy(() => import('../../views/RiderDashboardPage'));
const DeliveryManRegistrationPage = React.lazy(() => import('../../views/DeliveryManRegistrationPage'));
const DeliveryManDashboardPage = React.lazy(() => import('../../views/DeliveryManDashboardPage'));
const AgencyRegistrationPage = React.lazy(() => import('../../views/AgencyRegistrationPage'));
const AgencyDashboardPage = React.lazy(() => import('../../views/AgencyDashboardPage'));
const ShopsPage = React.lazy(() => import('../../views/ShopsPage'));
const WholesalePage = React.lazy(() => import('../../views/WholesalePage'));
const ResellPage = React.lazy(() => import('../../views/ResellPage'));
const RentACarPage = React.lazy(() => import('../../views/RentACarPage'));
const FlightsPage = React.lazy(() => import('../../views/FlightsPage'));
const UserProfilePage = React.lazy(() => import('../../views/UserProfilePage'));
const ChatPage = React.lazy(() => import('../../views/ChatPage'));
const SearchResultsPage = React.lazy(() => import('../../views/SearchResultsPage'));
const LoginPage = React.lazy(() => import('../../views/LoginPage'));
const RegistrationPage = React.lazy(() => import('../../views/RegistrationPage'));
const AdminDashboardPage = React.lazy(() => import('../../views/AdminDashboardPage'));
const PaymentSettingsPage = React.lazy(() => import('../../views/PaymentSettingsPage'));
const VendorDashboardPage = React.lazy(() => import('../../views/VendorDashboardPage'));
const AddProductPage = React.lazy(() => import('../../views/AddProductPage'));
const OrderSuccessPage = React.lazy(() => import('../../views/OrderSuccessPage'));
const InboxPage = React.lazy(() => import('../../views/InboxPage'));
const ResellerDashboardPage = React.lazy(() => import('../../views/ResellerDashboardPage'));
const ContentPage = React.lazy(() => import('../../views/ContentPage'));
const PaymentCallbackPage = React.lazy(() => import('../../views/PaymentCallbackPage'));
const NotFoundPage = React.lazy(() => import('../../views/NotFoundPage'));

// Fallback Loading Component
const PageLoading = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
    </div>
);

// Maintenance Mode Screen
const MaintenanceScreen: React.FC<{ message: { en: string; bn: string }, language: 'en' | 'bn' }> = ({ message, language }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-900 p-6 text-center">
        <div className="w-24 h-24 mb-6 text-amber-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'en' ? 'Maintenance Mode' : 'রক্ষণাবেক্ষণ মোড'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            {message[language]}
        </p>
        <div className="mt-8">
            <a href="/login" className="text-sm text-indigo-600 hover:underline font-medium">Admin Login</a>
        </div>
    </div>
);

// Module Protected Route
const ModuleProtectedRoute: React.FC<{
    moduleKey: keyof NonNullable<PlatformSettings['moduleToggles']>,
    children: React.ReactNode
}> = ({ moduleKey, children }) => {
    const { platformSettings, currentUser, language } = useApp();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isEnabled = platformSettings.moduleToggles?.[moduleKey] !== false;

    if (!isEnabled && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-slate-900 p-6 text-center rounded-xl shadow-sm">
                <div className="w-16 h-16 mb-4 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {language === 'en' ? 'Module Temporarily Unavailable' : 'মডিউলটি সাময়িকভাবে উপলব্ধ নয়'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                    {language === 'en'
                        ? `The ${moduleKey} module is currently disabled for maintenance. Please check back later.`
                        : `${moduleKey} মডিউলটি বর্তমানে রক্ষণাবেক্ষণের জন্য নিষ্ক্রিয় করা হয়েছে। দয়া করে পরে আবার পরীক্ষা করুন।`}
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                    {language === 'en' ? 'Back to Home' : 'হোমে ফিরে যান'}
                </button>
            </div>
        );
    }

    return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
    const { platformSettings, language, currentUser } = useApp();
    const isMaintenanceMode = platformSettings.maintenanceMode?.enabled && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin';



    if (isMaintenanceMode) {
        return <MaintenanceScreen message={platformSettings.maintenanceMode!.message} language={language} />;
    }

    return (
        <Suspense fallback={<PageLoading />}>
            <Routes>
                {/* Admin Setup - Special Route */}
                <Route path="/admin-setup" element={<AdminSetupPage />} />

                {/* Public & Customer Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/category/:categoryName" element={<CategoryPage />} />
                <Route path="/product/:productId" element={<ProductPage />} />
                <Route path="/vendor/:vendorId" element={<VendorPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/user-dashboard" element={<Navigate to="/profile" replace />} /> {/* Legacy Redirect */}
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <UserProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/inbox" element={
                    <ProtectedRoute>
                        <InboxPage />
                    </ProtectedRoute>
                } />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />

                {/* NEW: Payment Callback Route */}
                <Route path="/payment/callback" element={<PaymentCallbackPage />} />

                {/* Module Routes (Protected by Toggles) */}
                <Route path="/shops" element={
                    <ModuleProtectedRoute moduleKey="wholesale"> {/* Assuming Shops is general but wholesale toggle affects it or just keep public? Let's assume public. Actually wholesale page is different */}
                        <ShopsPage />
                    </ModuleProtectedRoute>
                } />
                <Route path="/wholesale" element={
                    <ModuleProtectedRoute moduleKey="wholesale">
                        <WholesalePage />
                    </ModuleProtectedRoute>
                } />
                <Route path="/resell" element={
                    <ModuleProtectedRoute moduleKey="resell">
                        <ResellPage />
                    </ModuleProtectedRoute>
                } />
                <Route path="/rentacar" element={
                    <ModuleProtectedRoute moduleKey="rentacar">
                        <RentACarPage />
                    </ModuleProtectedRoute>
                } />
                <Route path="/flights" element={
                    <ModuleProtectedRoute moduleKey="flights">
                        <FlightsPage />
                    </ModuleProtectedRoute>
                } />


                {/* Protected Dashboard Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                } />

                {/* Admin Sub-pages */}
                <Route path="/admin/payment-settings" element={
                    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                        <PaymentSettingsPage />
                    </ProtectedRoute>
                } />

                <Route path="/vendor-dashboard" element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                        <VendorDashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/reseller-dashboard" element={
                    <ProtectedRoute allowedRoles={['reseller']}>
                        <ResellerDashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/rider-dashboard" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                        <RiderDashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/delivery-dashboard" element={
                    <ProtectedRoute allowedRoles={['delivery']}>
                        <DeliveryManDashboardPage />
                    </ProtectedRoute>
                } />
                <Route path="/agency-dashboard" element={
                    <ProtectedRoute allowedRoles={['agency']}>
                        <AgencyDashboardPage />
                    </ProtectedRoute>
                } />

                {/* Registration Routes (Public but specialized) */}
                <Route path="/vendor/register" element={<VendorRegistrationPage />} />
                <Route path="/rider/register" element={<RiderRegistrationPage />} />
                <Route path="/delivery/register" element={<DeliveryManRegistrationPage />} />
                <Route path="/agency/register" element={<AgencyRegistrationPage />} />

                {/* Action Routes */}
                <Route path="/add-product" element={
                    <ProtectedRoute allowedRoles={['vendor', 'reseller', 'agency', 'driver']}>
                        <AddProductPage />
                    </ProtectedRoute>
                } />
                <Route path="/edit-product/:productId" element={
                    <ProtectedRoute allowedRoles={['vendor', 'reseller', 'admin', 'agency', 'driver']}>
                        <AddProductPage />
                    </ProtectedRoute>
                } />
                <Route path="/chat/:threadId" element={
                    <ProtectedRoute>
                        <ChatPage />
                    </ProtectedRoute>
                } />
                <Route path="/order-success" element={<OrderSuccessPage />} />

                {/* CMS Content Pages */}
                <Route path="/page/:pageId" element={<ContentPage />} />
                <Route path="/about" element={<ContentPage />} />
                <Route path="/contact" element={<ContentPage />} />
                <Route path="/privacy" element={<ContentPage />} />
                <Route path="/terms" element={<ContentPage />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense >
    );
};
