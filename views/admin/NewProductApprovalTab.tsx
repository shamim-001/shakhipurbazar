import React, { useState } from 'react';
import { useApp } from '../../src/context/AppContext';
import { Product } from '../../types';
import { CheckIcon, XIcon, EyeIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon } from '../../components/icons';
import { toast } from 'react-hot-toast';

type ActionType = 'approve' | 'reject' | 'request_review' | null;

const NewProductApprovalTab: React.FC = () => {
    const { language, products, vendors, users, updateProductStatus, createNotification } = useApp();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Action Modal State
    const [actionProduct, setActionProduct] = useState<Product | null>(null);
    const [actionType, setActionType] = useState<ActionType>(null);
    const [actionReason, setActionReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pendingProducts = products.filter(p => p.status === 'Pending' || p.approvalStatus === 'pending_review' || p.status === 'ReviewRequested');

    const openActionModal = (product: Product, type: ActionType) => {
        setActionProduct(product);
        setActionType(type);
        setActionReason('');
    };

    const closeActionModal = () => {
        setActionProduct(null);
        setActionType(null);
        setActionReason('');
        setIsSubmitting(false);
    };

    const handleExecuteAction = async () => {
        if (!actionProduct || !actionType) return;
        setIsSubmitting(true);

        try {
            if (actionType === 'approve') {
                await updateProductStatus(actionProduct.id, 'Approved');
                toast.success(language === 'en' ? "Product approved!" : "পণ্য অনুমোদন করা হয়েছে!");

                await createNotification({
                    userId: actionProduct.vendorId || actionProduct.sellerId || '',
                    title: { en: 'Product Approved', bn: 'পণ্য অনুমোদিত' },
                    body: { en: `Your product "${actionProduct.name[language]}" is now live.`, bn: `আপনার পণ্য "${actionProduct.name[language]}" এখন লাইভ হয়েছে।` },
                    type: 'product',
                    relatedId: actionProduct.id
                });
            } else if (actionType === 'reject') {
                if (!actionReason.trim()) {
                    toast.error("Please provide a reason.");
                    setIsSubmitting(false);
                    return;
                }
                await updateProductStatus(actionProduct.id, 'Rejected', actionReason);
                toast.success("Product rejected.");

                await createNotification({
                    userId: actionProduct.vendorId || actionProduct.sellerId || '',
                    title: { en: 'Product Rejected', bn: 'পণ্য প্রত্যাখ্যাত' },
                    body: { en: `Your product "${actionProduct.name[language]}" was rejected. Reason: ${actionReason}`, bn: `আপনার পণ্য "${actionProduct.name[language]}" প্রত্যাখ্যাত হয়েছে। কারণ: ${actionReason}` },
                    type: 'product',
                    relatedId: actionProduct.id
                });
            } else if (actionType === 'request_review') {
                if (!actionReason.trim()) {
                    toast.error("Please provide feedback.");
                    setIsSubmitting(false);
                    return;
                }
                await updateProductStatus(actionProduct.id, 'ReviewRequested', actionReason);
                toast.success("Review requested from seller.");

                await createNotification({
                    userId: actionProduct.vendorId || actionProduct.sellerId || '',
                    title: { en: 'Action Required: Product Review', bn: 'পদক্ষেপ প্রয়োজন: পণ্য পর্যালোচনা' },
                    body: { en: `Admin requested details for "${actionProduct.name[language]}": ${actionReason}`, bn: `অ্যাডমিন "${actionProduct.name[language]}" এর জন্য অতিরিক্ত তথ্য চেয়েছেন: ${actionReason}` },
                    type: 'product',
                    relatedId: actionProduct.id
                });
            }
            closeActionModal();
            // Close details modal if open
            if (selectedProduct?.id === actionProduct.id) {
                setSelectedProduct(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Action failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    const getSellerName = (product: Product) => {
        if (product.productType === 'resell' && product.sellerId) {
            const user = users.find(u => u.id === product.sellerId);
            return user ? user.name : (language === 'en' ? 'Unknown Reseller' : 'অজানা রিসেলার');
        }
        const vendor = vendors.find(v => v.id === product.vendorId);
        return vendor ? vendor.name[language] : (language === 'en' ? 'Unknown Vendor' : 'অজানা বিক্রেতা');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Product Approvals</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pendingProducts.length} products waiting for oversight
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {pendingProducts.map(product => (
                    <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <img src={product.images?.[0]} alt="" className="w-16 h-16 rounded-lg object-cover border dark:border-slate-600" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{product.name[language]}</h3>
                                    {product.productType === 'resell' && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-md font-bold uppercase tracking-wider">
                                            Reseller
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Seller: {getSellerName(product)} •
                                    Price: ৳{product.price} •
                                    Type: {product.productType === 'resell' ? (language === 'en' ? 'Used Item' : 'ব্যবহৃত পণ্য') : (product.productType || 'New')}
                                </p>
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${product.status === 'ReviewRequested' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {product.status === 'ReviewRequested' ? 'Review Requested' : 'Pending Approval'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedProduct(product)}
                                className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                                title="View Details"
                            >
                                <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => openActionModal(product, 'request_review')}
                                className="p-2 bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg transition-all"
                                title="Request More Details"
                            >
                                <QuestionMarkCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => openActionModal(product, 'approve')}
                                className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all"
                                title="Approve"
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => openActionModal(product, 'reject')}
                                className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                                title="Reject"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {pendingProducts.length === 0 && (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-700/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <CheckIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Clean Slate!</h3>
                        <p className="text-gray-500">No product listings are currently waiting for oversight.</p>
                    </div>
                )}
            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl shadow-2xl relative overflow-hidden">
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:text-red-500 z-10"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                            {/* Left: Images */}
                            <div className="md:w-1/2 p-6 bg-gray-50 dark:bg-slate-800/50 overflow-y-auto">
                                <div className="space-y-4">
                                    {selectedProduct.images.map((img, idx) => (
                                        <img key={idx} src={img} alt="" className="w-full rounded-2xl shadow-sm border dark:border-slate-700" />
                                    ))}
                                </div>
                            </div>

                            {/* Right: Details */}
                            <div className="md:w-1/2 p-8 overflow-y-auto custom-scrollbar">
                                <span className="inline-block text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold uppercase mb-2">
                                    {selectedProduct.productType || 'New Product'}
                                </span>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    {selectedProduct.name[language]}
                                </h3>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Price</p>
                                        <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">৳{selectedProduct.price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Stock</p>
                                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedProduct.stock}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Key Details</h4>
                                        <ul className="space-y-2">
                                            <li className="flex justify-between text-sm">
                                                <span className="text-gray-500">Category:</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-300">{selectedProduct.category[language]}</span>
                                            </li>
                                            {selectedProduct.subCategory && (
                                                <li className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Subcategory:</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-300">{selectedProduct.subCategory[language]}</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Description</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                            {selectedProduct.description[language] || selectedProduct.description.en}
                                        </p>
                                    </div>

                                    {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Specifications</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedProduct.specifications.map((spec, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-slate-800/30 p-2 rounded">
                                                        <span className="text-gray-500">{spec.key[language]}</span>
                                                        <span className="font-medium text-gray-900 dark:text-gray-300">{spec.value[language]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t dark:border-slate-700 flex flex-wrap gap-3">
                                    <button
                                        onClick={() => openActionModal(selectedProduct, 'approve')}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                    >
                                        Approve Product
                                    </button>
                                    <button
                                        onClick={() => openActionModal(selectedProduct, 'request_review')}
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                    >
                                        Request Fixes
                                    </button>
                                    <button
                                        onClick={() => openActionModal(selectedProduct, 'reject')}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Confirmation Modal */}
            {actionProduct && actionType && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            {actionType === 'approve' && 'Confirm Approval'}
                            {actionType === 'reject' && 'Reject Product'}
                            {actionType === 'request_review' && 'Request Changes'}
                        </h3>

                        {actionType === 'approve' ? (
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Are you sure you want to approve <strong>{actionProduct.name[language]}</strong>? This will make the product live on the marketplace immediately.
                            </p>
                        ) : (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {actionType === 'reject' ? 'Reason for Rejection' : 'Feedback for Seller'}
                                </label>
                                <textarea
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    rows={4}
                                    placeholder={actionType === 'reject' ? "e.g., Violates policy, Low quality images..." : "e.g., Please add more photos, Fix description typos..."}
                                ></textarea>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeActionModal}
                                className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExecuteAction}
                                disabled={isSubmitting}
                                className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                        actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                            'bg-orange-600 hover:bg-orange-700'
                                    } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'Processing...' : (
                                    <>
                                        {actionType === 'approve' && 'Confirm Approval'}
                                        {actionType === 'reject' && 'Reject Product'}
                                        {actionType === 'request_review' && 'Send Request'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewProductApprovalTab;
