import React, { useState, useMemo } from 'react';
import { useApp } from '../../src/context/AppContext';
import { Product } from '../../types';
import { deleteField } from 'firebase/firestore';
import { ArrowPathIcon, CheckIcon, XIcon, ExclamationTriangleIcon, EyeIcon } from '../../components/icons';
import ActivityLoggerService from '../../src/services/activityLogger';

const AdminReviewsTab: React.FC = () => {
    const { language, products, updateProduct, currentUser } = useApp();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Filter products that have pending changes
    const pendingReviews = useMemo(() => {
        return products.filter(p => p.approvalStatus === 'pending_review' && p.pendingChanges);
    }, [products]);

    const handleApprove = async (product: Product) => {
        if (!confirm(language === 'en' ? 'Approve these changes? They will go live immediately.' : 'পরিবর্তনগুলি অনুমোদন করবেন?')) return;

        try {
            if (!product.pendingChanges) return;

            // Merge changes into the root product
            // We must be careful to handle deleting fields if needed, but usually it's just overwrites
            const updatedProduct = {
                ...product,
                ...product.pendingChanges,
                pendingChanges: deleteField(), // Clear the draft
                approvalStatus: 'Approved',     // Reset status
                riskLevel: 0,
                lastRiskCheck: new Date().toISOString()
            };

            await updateProduct(updatedProduct as any);

            await ActivityLoggerService.log(
                'product.approved',
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin',
                currentUser?.role || 'admin',
                {
                    type: 'product',
                    id: product.id,
                    name: product.name.en,
                    changes: [{ field: 'approval', oldValue: 'pending', newValue: 'approved' }]
                }
            );

            setSelectedProduct(null);
            alert('Changes approved and published.');
        } catch (error) {
            console.error("Approval failed", error);
            alert("Failed to approve changes.");
        }
    };

    const handleReject = async (product: Product) => {
        const reason = prompt("Reason for rejection:");
        if (!reason) return;

        try {
            const updatedProduct = {
                ...product,
                pendingChanges: deleteField(), // Clear the draft
                approvalStatus: 'Approved',    // Revert to approved (Live state matches Old State)
                // We keep the old data, we just remove the pending flag
                rejectionReason: reason // Optional: store reason
            };

            await updateProduct(updatedProduct as any);

            await ActivityLoggerService.log(
                'product.rejected',
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin',
                currentUser?.role || 'admin',
                {
                    type: 'product',
                    id: product.id,
                    name: product.name.en,
                    metadata: { reason }
                }
            );

            setSelectedProduct(null);
            alert('Changes rejected.');
        } catch (error) {
            console.error("Rejection failed", error);
            alert("Failed to reject changes.");
        }
    };

    // Helper to render diff
    const DiffView = ({ oldData, newData }: { oldData: any, newData: any }) => {
        const changedFields = Object.keys(newData).filter(key => {
            // Ignore system fields
            if (['id', 'pendingChanges', 'approvalStatus', 'riskLevel', 'lastRiskCheck'].includes(key)) return false;
            return JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
        });

        if (changedFields.length === 0) return <div className="text-gray-500 italic">No visible content changes detected.</div>;

        return (
            <div className="space-y-4">
                {changedFields.map(key => (
                    <div key={key} className="border-b pb-2">
                        <div className="font-bold capitalize text-gray-700 dark:text-gray-300 mb-1">{key}</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                <span className="text-xs text-red-500 font-bold block mb-1">CURRENT</span>
                                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-300 font-mono text-xs">
                                    {typeof oldData[key] === 'object' ? JSON.stringify(oldData[key], null, 2) : String(oldData[key])}
                                </pre>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                                <span className="text-xs text-green-500 font-bold block mb-1">PROPOSED</span>
                                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-300 font-mono text-xs">
                                    {typeof newData[key] === 'object' ? JSON.stringify(newData[key], null, 2) : String(newData[key])}
                                </pre>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Updates</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pendingReviews.length} products waiting for approval
                    </p>
                </div>
            </div>

            {pendingReviews.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                    <CheckIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="text-gray-500">No pending update reviews.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {pendingReviews.map(product => (
                        <div key={product.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-l-4 border-yellow-500 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <img src={product.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{product.name.en}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${(product.riskLevel || 0) >= 3 ? 'bg-red-100 text-red-700' :
                                            (product.riskLevel || 0) >= 2 ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            Risk Level {product.riskLevel || 0}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(product.lastRiskCheck || '').toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProduct(product)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium flex items-center gap-2"
                            >
                                <EyeIcon className="w-4 h-4" /> Review
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* DIFF MODAL */}
            {selectedProduct && selectedProduct.pendingChanges && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900 rounded-t-lg">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Reviewing: {selectedProduct.name.en}
                            </h3>
                            <button onClick={() => setSelectedProduct(null)}><XIcon className="w-6 h-6 text-gray-500" /></button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700 flex items-start gap-3">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">Risk Assessment</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        Risk Level: {selectedProduct.riskLevel}. Please review the changes below carefully.
                                        {(selectedProduct.riskLevel || 0) >= 3 && " Critical modifications detected (e.g. Price > 20%)."}
                                    </p>
                                </div>
                            </div>

                            <DiffView oldData={selectedProduct} newData={selectedProduct.pendingChanges} />
                        </div>

                        <div className="p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-b-lg flex justify-end gap-3">
                            <button
                                onClick={() => handleReject(selectedProduct)}
                                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold flex items-center gap-2"
                            >
                                <XIcon className="w-4 h-4" /> Reject Changes
                            </button>
                            <button
                                onClick={() => handleApprove(selectedProduct)}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none"
                            >
                                <CheckIcon className="w-4 h-4" /> Approve & Publish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviewsTab;
