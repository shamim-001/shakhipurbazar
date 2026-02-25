
import React from 'react';
import { useApp } from '../../../src/context/AppContext';

const DriversTab = () => {
    const { language, vendors, updateVendorStatus } = useApp();
    // Use vendors array filtered by type 'rider' (Rent-a-Car/Driver)
    const drivers = vendors.filter(v => v.type === 'rider');

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Driver/Rent-a-Car Management' : 'ড্রাইভার/রেন্ট-এ-কার পরিচালনা'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{drivers.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Drivers</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">{drivers.filter(d => d.status === 'Active').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">{drivers.filter(d => d.status !== 'Active').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending/Inactive</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {drivers.map(driver => (
                            <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img src={driver.logo || 'https://via.placeholder.com/40'} alt={driver.name[language]} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                        <div className="font-medium text-gray-900 dark:text-white">{driver.name[language]}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{driver.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${driver.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {driver.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm gap-2 flex">
                                    <button
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                        onClick={() => window.alert('Edit feature coming soon')}
                                    >Edit</button>
                                    {driver.status === 'Active' ? (
                                        <button
                                            className="text-red-600 hover:text-red-900 font-medium"
                                            onClick={() => {
                                                if (confirm('Suspend this driver?')) updateVendorStatus(driver.id, 'Suspended');
                                            }}
                                        >Suspend</button>
                                    ) : (
                                        <button
                                            className="text-green-600 hover:text-green-900 font-medium"
                                            onClick={() => {
                                                if (confirm('Activate this driver?')) updateVendorStatus(driver.id, 'Active');
                                            }}
                                        >Activate</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DriversTab;
