
import React, { useState } from 'react';
import { useApp } from '../../src/context/AppContext';
import AgenciesTab from './tabs/AgenciesTab';
import { GlobeAltIcon, TicketIcon } from '../../components/icons'; // TicketIcon might not exist, checking icons

const AgencyServiceDashboard = () => {
    const { language, products } = useApp();
    const [activeTab, setActiveTab] = useState<'agencies'>('agencies');

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Flight Agency Service' : 'ফ্লাইট এজেন্সি সার্ভিস'}
            </h2>

            {/* Sub-Navigation */}
            <div className="flex gap-4 mb-6 border-b dark:border-slate-700 pb-2">
                <button
                    onClick={() => setActiveTab('agencies')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'agencies'
                        ? 'bg-blue-600 text-white shadow-lg font-bold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                >
                    <GlobeAltIcon className="w-5 h-5" />
                    {language === 'en' ? 'Agencies & Flights' : 'এজেন্সি এবং ফ্লাইট'}
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border dark:border-slate-700 min-h-[500px]">
                {activeTab === 'agencies' && <AgenciesTab products={products} />}
            </div>
        </div>
    );
};

export default AgencyServiceDashboard;
