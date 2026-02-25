
import React from 'react';
import { useApp } from '../../src/context/AppContext';
import VendorsTab from './tabs/VendorsTab';
import ProductsTab from './tabs/ProductsTab';
import OrdersTab from './tabs/OrdersTab';
import { StoreIcon, ShoppingBagIcon, ArchiveBoxIcon } from '../../components/icons';

const VendorServiceDashboard = () => {
    const { language } = useApp();
    const [subTab, setSubTab] = React.useState<'vendors' | 'products' | 'orders'>('vendors');

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                {language === 'en' ? 'Vendor & Retail Management' : 'ভেন্ডর ও খুচরা ব্যবস্থাপনা'}
            </h2>

            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setSubTab('vendors')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${subTab === 'vendors' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}
                >
                    <StoreIcon className="w-5 h-5" />
                    {language === 'en' ? 'Vendors' : 'ভেন্ডর'}
                </button>
                <button
                    onClick={() => setSubTab('products')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${subTab === 'products' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}
                >
                    <ArchiveBoxIcon className="w-5 h-5" />
                    {language === 'en' ? 'Products' : 'পণ্য'}
                </button>
                <button
                    onClick={() => setSubTab('orders')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${subTab === 'orders' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}
                >
                    <ShoppingBagIcon className="w-5 h-5" />
                    {language === 'en' ? 'Orders' : 'অর্ডার'}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 min-h-[600px] p-1">
                {/* 
                   Note: The tabs from AdminDashboardPage are not currently exported.
                   We will need to modify AdminDashboardPage to export them or move them to separate files. 
                   For now, assuming they will be available.
                */}
                {subTab === 'vendors' && <VendorsTab />}
                {subTab === 'products' && <ProductsTab />}
                {subTab === 'orders' && <OrdersTab />}
            </div>
        </div>
    );
};

export default VendorServiceDashboard;
