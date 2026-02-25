import React from 'react';
import { useApp } from '../../src/context/AppContext';
import { MapPinIcon, TruckIcon } from '../../components/icons';

const DeliveryManagementTab = () => {
    const { orders, vendors, users, assignDriverToOrder } = useApp();

    // Filter Logic
    const unassignedOrders = orders.filter(o =>
        // Status checks: Confirmed OR Preparing (Ready for pickup assignment)
        (o.status === 'Confirmed' || o.status === 'Preparing') &&
        !o.assignedDeliveryManId &&
        // Not a ride/flight/rental
        !o.items.some(i => i.flightBookingDetails || i.rentalDetails)
    );

    const activeDeliveryMen = vendors.filter(v =>
        (v.type === 'rider' || v.type === 'deliveryMan' || v.driversLicense) &&
        v.status === 'Active' &&
        v.onlineStatus === 'Online' &&
        (v.serviceMode === 'delivery' || v.serviceMode === 'both')
    );

    const handleAssign = (orderId: string, driverId: string) => {
        if (!driverId) return;
        assignDriverToOrder(orderId, driverId);
    };

    const getCustomerAddress = (customerId: string) => {
        const customer = users.find(u => u.id === customerId);
        // Fallback to legacy address or first address
        if (customer?.addressBook && customer.addressBook.length > 0) {
            const defaultAddr = customer.addressBook.find(a => a.isDefault);
            return defaultAddr ? defaultAddr.addressLine : customer.addressBook[0].addressLine;
        }
        return customer?.address || "Unknown Address";
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Delivery Dispatch</h2>
                <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow text-sm font-semibold">
                    Unassigned: <span className="text-red-500">{unassignedOrders.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Orders Column */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-5 text-[#2c3e50] dark:text-white flex items-center gap-2 pb-2 border-b dark:border-slate-700">
                        <span className="bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {unassignedOrders.length}
                        </span>
                        Pending Dispatch
                    </h3>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {unassignedOrders.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <TruckIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>All orders have been dispatched!</p>
                            </div>
                        ) : (
                            unassignedOrders.map(order => (
                                <div key={order.id} className="border border-gray-100 dark:border-slate-700 p-4 rounded-xl hover:shadow-lg transition-all bg-gray-50 dark:bg-slate-700/50 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">ORDER #{order.id.slice(-6)}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white ${order.status === 'Confirmed' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-[#2c3e50] dark:text-white text-lg">৳{order.total}</div>
                                            <div className="text-[10px] text-gray-400">{order.items.length} Items</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 p-2 rounded-lg">
                                        <MapPinIcon className="w-4 h-4 text-red-500 shrink-0" />
                                        <span className="line-clamp-2 text-xs">{getCustomerAddress(order.customerId)}</span>
                                    </div>

                                    {/* Inline Assign */}
                                    <div className="mt-2">
                                        <select
                                            onChange={(e) => handleAssign(order.id, e.target.value)}
                                            className="w-full text-sm border-gray-200 rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Assign Delivery Man...</option>
                                            {activeDeliveryMen.map(dm => (
                                                <option key={dm.id} value={dm.id}>
                                                    {dm.name.en} (Active • Only {orders.filter(o => o.assignedDeliveryManId === dm.id && !['Delivered', 'Cancelled'].includes(o.status)).length} jobs)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Delivery Men Column */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-5 text-[#2c3e50] dark:text-white flex items-center gap-2 pb-2 border-b dark:border-slate-700">
                        <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {activeDeliveryMen.length}
                        </span>
                        Active Delivery Heroes
                    </h3>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {activeDeliveryMen.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>No delivery men are currently online.</p>
                            </div>
                        ) : activeDeliveryMen.map(dm => {
                            const currentLoad = orders.filter(o => o.assignedDeliveryManId === dm.id && !['Delivered', 'Cancelled', 'Ride Completed'].includes(o.status)).length;

                            return (
                                <div key={dm.id} className="flex items-center gap-4 p-3 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm">
                                        <img src={dm.logo || 'https://via.placeholder.com/150'} alt={dm.name.en} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-[#2c3e50] dark:text-white truncate">
                                            {dm.name.en}
                                            {dm.vendorId && (
                                                <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                                                    @{vendors.find(v => v.id === dm.vendorId)?.name.en || 'Unknown Team'}
                                                </span>
                                            )}
                                            {!dm.vendorId && (
                                                <span className="ml-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                    Independent
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                                            </span>
                                            <span className="text-xs text-gray-400">{dm.serviceMode === 'both' ? 'Hybrid' : 'Parcel Only'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right bg-blue-50 dark:bg-slate-900 px-3 py-1 rounded-lg">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">TASK</p>
                                        <p className={`font-bold text-lg ${currentLoad > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {currentLoad}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryManagementTab;
