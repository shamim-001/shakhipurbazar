import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../src/context/AppContext';
import { getPagePath } from '../../../src/utils/navigation';
import { EconomicsService } from '../../../src/services/economics';
import { AnalyticsService } from '../../../src/services/analyticsService';
import { usePaginatedOrders } from '../../../src/hooks/usePaginatedOrders';
import { Order } from '../../../types';
// ... icons
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    ShoppingBagIcon,
    UserIcon,
    XIcon,
    PhotoIcon,
    CheckCircleIcon
} from '../../../components/icons';

const OrdersTab = () => {
    const { language, updateOrderStatus, products, categoryCommissions, users, startChat, currentUser } = useApp();
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isPodExpanded, setIsPodExpanded] = useState(false);

    const { orders: paginatedOrders, loading, hasMore, loadMore } = usePaginatedOrders(filterStatus, 15);


    const handleStatusChange = async (orderId: string, newStatus: string) => {
        if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
            await updateOrderStatus(orderId, newStatus as any);
        }
    };

    const viewOrderDetails = (order: any) => { // Changed Order to any
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {language === 'en' ? 'All Orders' : 'সকল অর্ডার'}
                </h2>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                    <option value="all">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{paginatedOrders.length}{hasMore ? '+' : ''}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Loaded</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">{paginatedOrders.filter(o => o.status === 'Pending').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending (Loaded)</div>
                </div>
                {/* ... other stats could be updated to use a real count query later ... */}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    {/* ... (table headers same) ... */}
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {paginatedOrders.map(order => {
                            const customer = users.find(u => u.id === order.customerId);
                            const customerName = customer ? customer.name : (order.customerId || 'Unknown');
                            return (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">#{order.id.slice(-8).toUpperCase()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{new Date(order.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{customerName}</div>
                                        {customer?.phone && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">৳{order.total}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`px-2 py-1 text-xs rounded-full border-0 font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                        order.status === 'Refund Requested' || order.status === 'Refunded' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                            <option value="Refund Requested">Refund Requested</option>
                                            <option value="Refunded">Refunded</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 flex flex-col gap-1">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => viewOrderDetails(order)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md disabled:bg-gray-400"
                    >
                        {loading ? 'Loading...' : 'Load More Orders'}
                    </button>
                </div>
            )}

            {!hasMore && paginatedOrders.length > 0 && (
                <div className="text-center mt-6 text-gray-500 text-sm">
                    No more orders to load.
                </div>
            )}


            {/* Order Details Modal */}
            {showDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Order #{selectedOrder.id.slice(0, 8)}
                                </h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Order Status Section */}
                                <div className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-xl">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Date & Time</span>
                                            <p className="text-gray-900 dark:text-white font-medium">{new Date(selectedOrder.date).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Status</span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 uppercase">
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Payment</span>
                                            <p className="text-gray-900 dark:text-white font-medium">{selectedOrder.payment}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400 block mb-1">Total Amount</span>
                                            <p className="text-rose-500 dark:text-rose-400 font-black">৳{selectedOrder.total}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mt-4 border-t dark:border-slate-600 pt-4">
                                        {selectedOrder.pickupCode && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1 text-[10px] uppercase font-bold">Pickup Code</span>
                                                <p className="text-blue-600 dark:text-blue-400 font-mono font-bold text-lg tracking-widest">{selectedOrder.pickupCode}</p>
                                            </div>
                                        )}
                                        {selectedOrder.deliveryCode && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400 block mb-1 text-[10px] uppercase font-bold">Delivery Code</span>
                                                <p className="text-green-600 dark:text-green-400 font-mono font-bold text-lg tracking-widest">{selectedOrder.deliveryCode}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Proof of Delivery Section */}
                                {selectedOrder.podUrl && (
                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl relative overflow-hidden group">
                                        <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {language === 'en' ? 'Proof of Delivery (Verified)' : 'ডেলিভারি প্রমাণ (যাচাইকৃত)'}
                                        </h3>
                                        <div
                                            className="relative cursor-pointer group/pod"
                                            onClick={() => setIsPodExpanded(!isPodExpanded)}
                                        >
                                            <img
                                                src={selectedOrder.podUrl}
                                                alt="Proof of Delivery"
                                                className={`w-full rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900 transition-all duration-300 ${isPodExpanded ? 'max-h-[80vh] object-contain shadow-2xl' : 'max-h-48 object-cover shadow-sm hover:shadow-md'}`}
                                            />
                                            {!isPodExpanded && (
                                                <div className="absolute inset-0 bg-black/0 group-hover/pod:bg-black/10 flex items-center justify-center transition-all rounded-lg">
                                                    <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full opacity-0 group-hover/pod:opacity-100 transition-opacity shadow-lg">
                                                        <PhotoIcon className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity ${isPodExpanded ? 'opacity-100' : 'opacity-0'}`}
                                                onClick={(e) => { e.stopPropagation(); setIsPodExpanded(false); }}
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-500 italic mt-2 text-right">
                                            {language === 'en' ? 'Click to expand image' : 'ছবি বড় করতে ক্লিক করুন'}
                                        </p>
                                    </div>
                                )}

                                {/* Cancellation Reason Display */}
                                {selectedOrder.status === 'Cancelled' && (selectedOrder.cancellationReason || selectedOrder.cancelledBy) && (
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 p-4 rounded-xl">
                                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5" />
                                            Cancellation Information
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            {selectedOrder.cancelledBy && (
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Cancelled By</span>
                                                    <p className="text-gray-900 dark:text-white font-medium capitalize">{selectedOrder.cancelledBy}</p>
                                                </div>
                                            )}
                                            {selectedOrder.cancellationReason && (
                                                <div className="sm:col-span-2">
                                                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Reason</span>
                                                    <p className="text-gray-900 dark:text-white font-medium bg-white dark:bg-slate-800 p-3 rounded-lg border dark:border-slate-700">
                                                        {selectedOrder.cancellationReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Customer Details Section */}
                                {(() => {
                                    const customer = users.find(u => u.id === selectedOrder.customerId);
                                    return (
                                        <div className="border dark:border-slate-700 p-4 rounded-xl">
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                                <UserIcon className="w-4 h-4" /> Customer Information
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400 block">Name</span>
                                                    <p className="text-gray-900 dark:text-white font-medium">{customer?.name || 'Walk-in Customer'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400 block">Contact Phone</span>
                                                    <p className="text-gray-900 dark:text-white font-medium">{selectedOrder.deliveryPhone || customer?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <span className="text-gray-500 dark:text-gray-400 block">Shipping Address</span>
                                                    <p className="text-gray-900 dark:text-white font-medium">
                                                        {typeof selectedOrder.deliveryAddress === 'object'
                                                            ? `${selectedOrder.deliveryAddress.addressLine}, ${selectedOrder.deliveryAddress.area}`
                                                            : (selectedOrder.deliveryAddress || customer?.address || 'No address provided')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Items Section */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                        <ShoppingBagIcon className="w-4 h-4" /> Ordered Items
                                    </h4>
                                    <div className="border dark:border-slate-700 rounded-xl overflow-hidden">
                                        {selectedOrder.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 border-b dark:border-slate-700 last:border-0 bg-white dark:bg-slate-800">
                                                {item.productImage && (
                                                    <img src={item.productImage} alt="" className="w-12 h-12 object-cover rounded-lg" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {item.productName[language] || item.productName.en}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ৳{item.priceAtPurchase}</p>
                                                </div>
                                                <div className="text-sm font-black text-gray-900 dark:text-white">
                                                    ৳{item.priceAtPurchase * item.quantity}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t dark:border-slate-700 flex flex-wrap justify-between items-center gap-4">
                                <div className="flex gap-2">
                                    {currentUser?.id !== selectedOrder.customerId ? (
                                        <button
                                            onClick={async () => {
                                                const customer = users.find(u => u.id === selectedOrder.customerId);
                                                if (customer) {
                                                    setShowDetailsModal(false);
                                                    const threadId = await startChat(customer.id, { type: 'order', orderId: selectedOrder.id });
                                                    if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                } else {
                                                    alert("Customer details not found in system.");
                                                }
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 font-bold transition-all"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                            Chat with Customer
                                        </button>
                                    ) : (
                                        <div className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg text-xs italic font-medium">
                                            Self-Order (No Chat)
                                        </div>
                                    )}
                                    <button
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 font-bold transition-all"
                                    >
                                        <DocumentTextIcon className="w-4 h-4" />
                                        Print Invoice
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-6 py-2 bg-gray-900 text-white dark:bg-rose-600 rounded-xl hover:opacity-90 font-black shadow-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
