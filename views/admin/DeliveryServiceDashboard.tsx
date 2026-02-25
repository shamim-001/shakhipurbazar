
import React, { useState } from 'react';
import { useApp } from '../../src/context/AppContext';
import DriversTab from './tabs/DriversTab';
import DeliveryMenTab from './tabs/DeliveryMenTab';
import DeliveryManagementTab from './DeliveryManagementTab';
import { TruckIcon, UserGroupIcon, MapPinIcon } from '../../components/icons';

const DeliveryServiceDashboard = () => {
    const { language } = useApp();
    const [activeTab, setActiveTab] = useState<'drivers' | 'delivery_men' | 'settings'>('drivers');

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Delivery & Logistics Service' : 'ডেলিভারি এবং লজিস্টিক সার্ভিস'}
            </h2>

            {/* Sub-Navigation */}
            <div className="flex gap-4 mb-6 border-b dark:border-slate-700 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('drivers')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'drivers'
                        ? 'bg-blue-600 text-white shadow-lg font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                >
                    <TruckIcon className="w-5 h-5" />
                    {language === 'en' ? 'Rent-A-Car Drivers' : 'রেন্ট-এ-কার ড্রাইভার'}
                </button>
                <button
                    onClick={() => setActiveTab('delivery_men')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'delivery_men'
                        ? 'bg-blue-600 text-white shadow-lg font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                >
                    <UserGroupIcon className="w-5 h-5" />
                    {language === 'en' ? 'Delivery Men' : 'ডেলিভারি ম্যান'}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'settings'
                        ? 'bg-blue-600 text-white shadow-lg font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                >
                    <MapPinIcon className="w-5 h-5" />
                    {language === 'en' ? 'Logistics Settings' : 'লজিস্টিক সেটিংস'}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 min-h-[500px]">
                {activeTab === 'drivers' && <DriversTab />}
                {activeTab === 'delivery_men' && <DeliveryMenTab />}
                {activeTab === 'settings' && <DeliveryManagementTab />}
            </div>
        </div>
    );
};

export default DeliveryServiceDashboard;
