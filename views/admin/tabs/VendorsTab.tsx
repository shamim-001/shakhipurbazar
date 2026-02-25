
import React from 'react';
import { useApp } from '../../../src/context/AppContext';
import { PaperAirplaneIcon } from '../../../components/icons';

const VendorsTab = () => {
    const { language, products, vendors, updateVendorStatus, updateVendor } = useApp();

    // Filter ONLY Shops
    const shopVendors = vendors.filter(v => v.type === 'shop');

    const handleApprove = (vendorId: string) => {
        if (confirm('Are you sure you want to approve this vendor?')) {
            updateVendorStatus(vendorId, 'Active');
        }
    };

    const handleSuspend = (vendorId: string) => {
        if (confirm('Are you sure you want to suspend this vendor?')) {
            updateVendorStatus(vendorId, 'Suspended');
        }
    };

    const handleActivate = (vendorId: string) => {
        if (confirm('Are you sure you want to activate this vendor?')) {
            updateVendorStatus(vendorId, 'Active');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {language === 'en' ? 'Shop Management' : 'দোকান পরিচালনা'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{shopVendors.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Shops</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">{shopVendors.filter(v => v.status === 'Active').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Active Shops</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">{shopVendors.filter(v => v.status === 'Pending').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Shop</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {shopVendors.map(vendor => (
                            <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img src={vendor.logo} alt={vendor.name[language]} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{vendor.name[language]}</div>
                                            <div className="text-xs text-gray-500">{vendor.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">{vendor.category?.[language] || '-'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${vendor.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        vendor.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'}`}>
                                        {vendor.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm flex gap-2">
                                    <button
                                        onClick={() => {
                                            const currentStatus = vendor.featuredData?.status || (vendor.isFeatured ? 'manual' : 'none');
                                            const newStatus = currentStatus === 'manual' ? 'none' : 'manual';
                                            const priority = newStatus === 'manual' ? prompt("Enter Priority (1-100):", "100") : "0";

                                            if (newStatus === 'manual' && (priority === null || isNaN(Number(priority)))) return;

                                            updateVendor(vendor.id, {
                                                isFeatured: newStatus === 'manual',
                                                featuredData: {
                                                    status: newStatus as any,
                                                    priority: Number(priority),
                                                    autoScore: vendor.featuredData?.autoScore || 0,
                                                    lastUpdated: new Date().toISOString()
                                                }
                                            });
                                        }}
                                        className={`font-bold transition-all ${vendor.featuredData?.status === 'manual' || (vendor.featuredData?.status === undefined && vendor.isFeatured)
                                            ? 'text-amber-500 scale-110' : 'text-gray-400 opacity-50 hover:opacity-100'}`}
                                        title="Ping (Manual Feature)"
                                    >
                                        <PaperAirplaneIcon className={`h-5 w-5 ${vendor.featuredData?.status === 'manual' ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Mark ${vendor.name[language]} as ${vendor.isVerified ? 'Unverified' : 'Verified'}?`)) {
                                                updateVendor(vendor.id, { isVerified: !vendor.isVerified });
                                            }
                                        }}
                                        className={`font-bold ${vendor.isVerified ? 'text-blue-600' : 'text-gray-400 opacity-50'}`}
                                        title="Toggle Verification"
                                    >
                                        {vendor.isVerified ? '★ Verified' : '☆ Verify'}
                                    </button>
                                    {vendor.status === 'Pending' && (
                                        <button
                                            onClick={() => handleApprove(vendor.id)}
                                            className="text-green-600 hover:text-green-900 font-bold"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {vendor.status === 'Active' && (
                                        <button
                                            onClick={() => handleSuspend(vendor.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Suspend
                                        </button>
                                    )}
                                    {vendor.status === 'Suspended' && (
                                        <button
                                            onClick={() => handleActivate(vendor.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            Activate
                                        </button>
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

export default VendorsTab;
