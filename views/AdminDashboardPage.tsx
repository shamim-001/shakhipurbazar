
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { Permission } from '../types';
const AdminAnalyticsTab = React.lazy(() => import('./AdminAnalyticsTab'));
const AdminPayoutsTab = React.lazy(() => import('./AdminPayoutsTab'));
const AdminPromotionsTab = React.lazy(() => import('./AdminPromotionsTab'));
const AdminCategoriesTab = React.lazy(() => import('./AdminCategoriesTab'));
const UserManagementTab = React.lazy(() => import('./UserManagementTab'));
const RoleManagementTab = React.lazy(() => import('./RoleManagementTab'));
const PaymentGatewaySettings = React.lazy(() => import('./PaymentGatewaySettings'));
import {
    ChartBarIcon, CurrencyDollarIcon, MegaphoneIcon,
    ShieldCheckIcon, Cog8ToothIcon,
    ArchiveBoxIcon, StoreIcon, TruckIcon, GlobeAltIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon, NewspaperIcon as QuickRepliesIcon,
    PlusIcon, LifebuoyIcon, UserIcon, ClipboardDocumentCheckIcon
} from '../components/icons';
const CMSPagesTab = React.lazy(() => import('./admin/CMSPagesTab'));
const DeliveryZoneSettings = React.lazy(() => import('../components/admin/DeliveryZoneSettings'));
const GeneralSettings = React.lazy(() => import('../components/admin/GeneralSettings'));
const HomePageSettings = React.lazy(() => import('../components/admin/HomePageSettings'));
const AdminChatHubTab = React.lazy(() => import('./admin/AdminChatHubTab'));
const QuickRepliesTab = React.lazy(() => import('./admin/QuickRepliesTab'));
const AdminActivityLogTab = React.lazy(() => import('./admin/AdminActivityLogTab'));
const AdminHealthTab = React.lazy(() => import('./admin/AdminHealthTab'));

const AdminReviewsTab = React.lazy(() => import('./admin/AdminReviewsTab'));
const ReviewModerationTab = React.lazy(() => import('./admin/ReviewModerationTab'));
const NewProductApprovalTab = React.lazy(() => import('./admin/NewProductApprovalTab'));
const AdminSupportTab = React.lazy(() => import('./AdminSupportTab'));

// Service Dashboards
const VendorServiceDashboard = React.lazy(() => import('./admin/VendorServiceDashboard'));
const DeliveryServiceDashboard = React.lazy(() => import('./admin/DeliveryServiceDashboard'));
const AgencyServiceDashboard = React.lazy(() => import('./admin/AgencyServiceDashboard'));


const SettingsTab: React.FC<{
    activeSetting: string | null;
    setActiveSetting: (s: string | null) => void;
}> = ({ activeSetting, setActiveSetting }) => {
    const { language, platformSettings, updatePlatformSettings } = useApp();

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Platform Settings' : 'প্ল্যাটফর্ম সেটিংস'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">
                <button
                    type="button"
                    onClick={() => setActiveSetting('payment')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'payment' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Payment</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gateways & Config</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSetting('general')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'general' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">General</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Basic Info & Logo</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSetting('delivery')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'delivery' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delivery</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fees & Zones</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSetting('homepage')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'homepage' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Home Page</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hero & Sections</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSetting('modules')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'modules' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Modules</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Visibility Toggles</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveSetting('commission')}
                    className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow hover:shadow-lg transition-all text-left ${activeSetting === 'commission' ? 'ring-2 ring-blue-500' : ''}`}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Commissions</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Role Base Rates</p>
                </button>
            </div>

            {activeSetting === 'payment' && (
                <div className="mt-6">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <PaymentGatewaySettings />
                    </React.Suspense>
                </div>
            )}

            {activeSetting === 'general' && (
                <div className="mt-6">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <GeneralSettings />
                    </React.Suspense>
                </div>
            )}

            {activeSetting === 'delivery' && (
                <div className="mt-6">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <DeliveryZoneSettings />
                    </React.Suspense>
                </div>
            )}

            {activeSetting === 'homepage' && (
                <div className="mt-6">
                    <React.Suspense fallback={<div>Loading...</div>}>
                        <HomePageSettings />
                    </React.Suspense>
                </div>
            )}

            {activeSetting === 'modules' && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Module Visibility</h3>
                    <p className="text-sm text-gray-500 mb-6">Toggle the visibility of main tabs on the homepage.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {platformSettings.mainTabs && Object.entries(platformSettings.mainTabs).map(([key, config]) => (
                            <div key={key} className="flex items-center justify-between p-4 border dark:border-slate-700 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{config.label?.en || key}</h4>
                                    <p className="text-xs text-gray-500">{config.label?.bn}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.show}
                                        onChange={(e) => {
                                            const updatedTabs = {
                                                ...platformSettings.mainTabs,
                                                [key]: { ...config, show: e.target.checked }
                                            };
                                            updatePlatformSettings({ ...platformSettings, mainTabs: updatedTabs });
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        ))}

                    </div>
                </div>
            )}

            {activeSetting === 'commission' && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Role-Based Commissions</h3>
                    <p className="text-sm text-gray-500 mb-6">Set standard commission rates for different platform roles.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Reseller Commission (%)
                            </label>
                            <input
                                type="number"
                                value={platformSettings.commissions?.reseller ?? 5}
                                onChange={(e) => updatePlatformSettings({
                                    ...platformSettings,
                                    commissions: { ...platformSettings.commissions, reseller: Number(e.target.value) }
                                } as any)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default seller markup limit?</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Agency Commission (%)
                            </label>
                            <input
                                type="number"
                                value={platformSettings.commissions?.agency ?? 8}
                                onChange={(e) => updatePlatformSettings({
                                    ...platformSettings,
                                    commissions: { ...platformSettings.commissions, agency: Number(e.target.value) }
                                } as any)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fee from agency earnings.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Driver Commission (%)
                            </label>
                            <input
                                type="number"
                                value={platformSettings.commissions?.driver ?? 15}
                                onChange={(e) => updatePlatformSettings({
                                    ...platformSettings,
                                    commissions: { ...platformSettings.commissions, driver: Number(e.target.value) }
                                } as any)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">Fee from driver earnings.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const DropshippingTab = () => {
    const { language } = useApp();
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Dropshipping Management' : 'ড্রপশিপিং পরিচালনা'}
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400">
                    {language === 'en'
                        ? 'Manage dropshipping settings, suppliers, and orders here.'
                        : 'এখানে ড্রপশিপিং সেটিংস, সরবরাহকারী এবং অর্ডার পরিচালনা করুন।'}
                </p>
            </div>
        </div>
    );
};

const AdminDashboardPage: React.FC = () => {
    const {
        language, platformSettings, updatePlatformSettings
    } = useApp();

    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(tabFromUrl || 'analytics');
    const [activeSetting, setActiveSetting] = useState<string | null>(searchParams.get('setting'));
    const [moderationSubTab, setModerationSubTab] = useState<'user_reviews' | 'new_products' | 'content_updates'>('user_reviews');

    // Sync state with URL
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as any);
        setSearchParams({ tab: tabId });
    };

    const handleSettingChange = (settingId: string | null) => {
        setActiveSetting(settingId);
        if (settingId) {
            setSearchParams({ tab: 'settings', setting: settingId });
        } else {
            setSearchParams({ tab: 'settings' });
        }
    };

    // Sync state with URL when searchParams change (e.g. back button)
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
        const setting = searchParams.get('setting');
        if (setting) setActiveSetting(setting);
    }, [searchParams]);

    const tabs = [
        { id: 'analytics', label: language === 'en' ? 'Analytics' : 'বিশ্লেষণ', icon: ChartBarIcon, permission: 'analytics.view' as Permission },
        { id: 'vendor_service', label: language === 'en' ? 'Vendor Service' : 'ভেন্ডর সার্ভিস', icon: StoreIcon, permission: 'vendors.view' as Permission },
        { id: 'delivery_service', label: language === 'en' ? 'Delivery Service' : 'ডেলিভারি সার্ভিস', icon: TruckIcon, permission: 'drivers.view' as Permission },
        { id: 'agency_service', label: language === 'en' ? 'Agency Service' : 'এজেন্সি সার্ভিস', icon: GlobeAltIcon, permission: 'agencies.view' as Permission },
        { id: 'reviews', label: language === 'en' ? 'Moderation' : 'মডারেশন', icon: ClipboardDocumentCheckIcon, permission: 'products.view' as Permission },
        { id: 'users', label: language === 'en' ? 'Users' : 'ব্যবহারকারী', icon: UserIcon, permission: 'users.view' as Permission },
        { id: 'roles', label: language === 'en' ? 'Roles' : 'ভূমিকা', icon: ShieldCheckIcon, permission: 'roles.view' as Permission },
        { id: 'payouts', label: language === 'en' ? 'Payouts' : 'প্রদান', icon: CurrencyDollarIcon, permission: 'payouts.view' as Permission },
        { id: 'promotions', label: language === 'en' ? 'Promotions' : 'প্রচারণা', icon: MegaphoneIcon, permission: 'promotions.view' as Permission },
        { id: 'categories', label: language === 'en' ? 'Categories' : 'বিভাগ', icon: ArchiveBoxIcon, permission: 'categories.view' as Permission },
        { id: 'pages', label: language === 'en' ? 'Pages' : 'পেজ', icon: DocumentTextIcon, permission: 'pages.view' as Permission },
        { id: 'dropshipping', label: language === 'en' ? 'Dropshipping' : 'ড্রপশিপিং', icon: TruckIcon, permission: 'dropshipping.view' as Permission },
        { id: 'chats', label: language === 'en' ? 'Chats' : 'চ্যাট', icon: ChatBubbleLeftRightIcon, permission: 'chats.view' as Permission },
        { id: 'quick_replies', label: language === 'en' ? 'Quick Replies' : 'কুইক রিপ্লাই', icon: QuickRepliesIcon, permission: 'chats.edit' as Permission },
        { id: 'settings', label: language === 'en' ? 'Settings' : 'সেটিংস', icon: Cog8ToothIcon, permission: 'settings.view' as Permission },
        { id: 'health', label: language === 'en' ? 'System Health' : 'সিস্টেম হেলথ', icon: ShieldCheckIcon, permission: 'health.view' as Permission },
        { id: 'logs', label: language === 'en' ? 'Activity Logs' : 'অ্যাক্টিভিটি লগ', icon: DocumentTextIcon, permission: 'logs.view' as Permission },
        { id: 'support', label: language === 'en' ? 'Support' : 'সাপোর্ট', icon: LifebuoyIcon, permission: 'chats.view' as Permission },
        { id: 'seed_data', label: language === 'en' ? 'Seed Data' : 'ডাটা সিড', icon: PlusIcon, permission: '*' as Permission },
    ];

    const { hasPermission } = useApp();
    const visibleTabs = useMemo(() => tabs.filter(tab => hasPermission(tab.permission)), [hasPermission]);

    // Ensure active tab is allowed, otherwise redirect to first allowed tab
    useEffect(() => {
        const isAllowed = visibleTabs.some(t => t.id === activeTab);
        if (!isAllowed && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].id as any);
        }
    }, [visibleTabs, activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'analytics':
                return <AdminAnalyticsTab />;
            case 'vendor_service':
                return <VendorServiceDashboard />;
            case 'delivery_service':
                return <DeliveryServiceDashboard />;
            case 'agency_service':
                return <AgencyServiceDashboard />;
            case 'reviews':
                return (
                    <div className="p-6">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border dark:border-slate-700">
                            <div className="flex bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
                                {[
                                    { id: 'user_reviews', label: language === 'en' ? 'User Reviews' : 'ইউজার রিভিউ' },
                                    { id: 'new_products', label: language === 'en' ? 'New Products' : 'নতুন পণ্য' },
                                    { id: 'content_updates', label: language === 'en' ? 'Content Updates' : 'কনটেন্ট আপডেট' }
                                ].map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setModerationSubTab(sub.id as any)}
                                        className={`px-8 py-4 font-bold transition-all border-b-4 ${sub.id === moderationSubTab
                                            ? 'border-rose-500 text-rose-500 bg-white dark:bg-slate-800'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                            <div className="min-h-[600px]">
                                {moderationSubTab === 'user_reviews' && <ReviewModerationTab />}
                                {moderationSubTab === 'new_products' && <NewProductApprovalTab />}
                                {moderationSubTab === 'content_updates' && <AdminReviewsTab />}
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return <UserManagementTab />;
            case 'roles':
                return <RoleManagementTab />;
            case 'payouts':
                return <AdminPayoutsTab />;
            case 'promotions':
                return <AdminPromotionsTab />;
            case 'categories':
                return <AdminCategoriesTab />;
            case 'pages':
                return <CMSPagesTab />;
            case 'dropshipping':
                return <DropshippingTab />;
            case 'chats':
                return <AdminChatHubTab />;
            case 'quick_replies':
                return <QuickRepliesTab />;
            case 'settings':
                return <SettingsTab activeSetting={activeSetting} setActiveSetting={handleSettingChange} />;
            case 'health':
                return <AdminHealthTab />;
            case 'logs':
                return <AdminActivityLogTab />;
            case 'support':
                return <AdminSupportTab />;
            case 'seed_data':
                return (
                    <div className="p-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border dark:border-slate-700 text-center">
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Shop Data Alignment</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                This tool will populate Firestore with real Sakhipur shops (Sagor Store, Hatim Furniture, etc.) as seen in the mockup.
                            </p>
                            <button
                                onClick={async () => {
                                    if (confirm('Run shop seeding now?')) {
                                        const { seedRealShops } = await import('../src/utils/shopSeeder');
                                        const result = await seedRealShops();
                                        if (result.success) alert('Success! Shops seeded.');
                                        else alert('Failed: ' + result.error);
                                    }
                                }}
                                className="bg-rose-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-rose-600 transition-colors shadow-lg"
                            >
                                Execute Shop Seeder
                            </button>
                        </div>
                    </div>
                );
            default:
                return <AdminAnalyticsTab />;
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="container mx-auto px-4 md:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {language === 'en' ? 'Admin Dashboard' : 'অ্যাডমিন ড্যাশবোর্ড'}
                        </h1>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-700">
                            <span className={`w-2 h-2 rounded-full ${platformSettings.maintenanceMode?.enabled ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                {platformSettings.maintenanceMode?.enabled ? 'Maintenance ON' : 'Live'}
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm(`Switch ${platformSettings.maintenanceMode?.enabled ? 'OFF' : 'ON'} maintenance mode?`)) {
                                    updatePlatformSettings({
                                        ...platformSettings,
                                        maintenanceMode: {
                                            ...platformSettings.maintenanceMode,
                                            enabled: !platformSettings.maintenanceMode?.enabled,
                                            message: platformSettings.maintenanceMode?.message || { en: 'Scheduled Maintenance', bn: 'পরিকল্পিত রক্ষণাবেক্ষণ' }
                                        }
                                    });
                                }
                            }}
                            className={`text-xs px-2 py-1 rounded border font-bold transition-colors ${platformSettings.maintenanceMode?.enabled
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                }`}
                        >
                            {platformSettings.maintenanceMode?.enabled ? 'Go Live' : 'Go Maintenance'}
                        </button>
                    </div>
                </div>

                {/* Tabs - Scrollable */}
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex gap-1 overflow-x-auto pb-px">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-8 py-8">
                <React.Suspense fallback={<div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div></div>}>
                    {renderContent()}
                </React.Suspense>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
