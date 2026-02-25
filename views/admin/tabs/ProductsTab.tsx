
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../../src/context/AppContext';
import { ProductService } from '../../../src/services/productService';
import ActivityLoggerService from '../../../src/services/activityLogger';
import { Product } from '../../../types';
import { deleteField } from 'firebase/firestore';
import { ArrowPathIcon, TrashIcon, ArchiveBoxIcon } from '../../../components/icons';

const ProductsTab = () => {
    const { language, products, vendors, updateProduct, currentUser, categoryCommissions } = useApp();
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterSubCategory, setFilterSubCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    // Auto-Save Logic
    const [pendingUpdates, setPendingUpdates] = useState<Record<string, Product>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    // Clean up pending updates as they are confirmed by the backend
    useEffect(() => {
        setPendingUpdates(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(id => {
                const product = products.find(p => p.id === id);
                // If backend matches our optimistic update, remove it from pending
                if (product && product.status === next[id].status && product.archivedAt === next[id].archivedAt) {
                    delete next[id];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [products]); // Run whenever backend products update

    const productsRef = React.useRef(products);
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Debounced Save Effect (Trigger API call only)
    useEffect(() => {
        if (Object.keys(pendingUpdates).length === 0) return;

        setSaveStatus('saving');

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const updates = Object.values(pendingUpdates);

                await Promise.all(updates.map(async (p: Product) => {
                    const currentProduct = productsRef.current.find(prod => prod.id === p.id);
                    if (currentProduct && currentProduct.status === p.status && currentProduct.archivedAt === p.archivedAt) {
                        return;
                    }

                    await updateProduct(p);

                    await ActivityLoggerService.log(
                        p.status === 'Approved' ? 'product.approved' : p.status === 'Rejected' ? 'product.rejected' : 'product.updated',
                        currentUser?.id || 'admin',
                        currentUser?.name || 'Admin',
                        currentUser?.role || 'admin',
                        {
                            type: 'product',
                            id: p.id,
                            name: p.name.en,
                            changes: [{ field: 'status', oldValue: '?', newValue: p.status }]
                        }
                    );
                }));

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error("[ProductsTab] Auto-save FAILED:", error);
                setSaveStatus('idle');
                alert('Failed to auto-save changes. Please check connection.');
            }
        }, 1000); // reduced to 1s for snappier feel

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [pendingUpdates, updateProduct, currentUser]); // removed 'products' from dependencies

    const handleStatusChange = (product: Product, newStatus: string) => {
        let updatedProduct = { ...product, status: newStatus } as Product;

        // Optimistic Merge: If approving, immediately show the pending changes in the UI
        if (newStatus === 'Approved' && product.pendingChanges) {
            const { id: _, ...merged } = product.pendingChanges;
            updatedProduct = {
                ...updatedProduct,
                ...merged,
                pendingChanges: undefined,
                approvalStatus: 'approved'
            };
        }

        setPendingUpdates(prev => ({
            ...prev,
            [product.id]: updatedProduct
        }));
    };

    const handleSoftDelete = async (product: Product) => {
        if (confirm('Are you sure? This product will be hidden but kept in archives.')) {
            // Optimistic Update
            setPendingUpdates(prev => ({
                ...prev,
                [product.id]: { ...product, status: 'Archived', archivedAt: new Date().toISOString() }
            }));

            const updated = { ...product, status: 'Archived', archivedAt: new Date().toISOString() };
            await updateProduct(updated as Product); // Cast to Product

            await ActivityLoggerService.log(
                'product.custom' as any, // using custom action or map to existing
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin',
                currentUser?.role || 'admin',
                {
                    type: 'product',
                    id: product.id,
                    name: product.name.en,
                    changes: [{ field: 'status', oldValue: product.status, newValue: 'Archived' }]
                }
            );
        }
    };

    const handleRestore = async (product: Product) => {
        if (confirm('Restore this product to Pending status?')) {
            // Optimistic Update
            setPendingUpdates(prev => ({
                ...prev,
                [product.id]: { ...product, status: 'Pending', isArchived: false, archivedAt: undefined }
            }));

            // Actual Update (using deleteField for cleanup)
            const updated = { ...product, status: 'Pending', archivedAt: deleteField(), isArchived: false };
            await updateProduct(updated as any);

            await ActivityLoggerService.log(
                'product.updated',
                currentUser?.id || 'admin',
                currentUser?.name || 'Admin',
                currentUser?.role || 'admin',
                {
                    type: 'product',
                    id: product.id,
                    name: product.name.en,
                    changes: [{ field: 'status', oldValue: product.status, newValue: 'Pending' }]
                }
            );
        }
    };

    const handlePermanentDelete = async (product: Product) => {
        const confirmMsg = "WARNING: This will PERMANENTLY ERASE this product and its history. This action cannot be undone.\n\nType 'DELETE' to confirm.";
        const userInput = prompt(confirmMsg);

        if (userInput === 'DELETE') {
            try {
                await ProductService.deleteProduct(product.id);

                await ActivityLoggerService.log(
                    'product.deleted',
                    currentUser?.id || 'admin',
                    currentUser?.name || 'Admin',
                    currentUser?.role || 'admin',
                    {
                        type: 'product',
                        id: product.id,
                        name: product.name.en,
                        changes: []
                    }
                );
                alert('Product permanently deleted.');
            } catch (err) {
                console.error(err);
                alert('Failed to delete product.');
            }
        }
    };

    // Merge pending updates into displayed products for optimistic UI
    const effectiveProducts = useMemo(() => {
        return products.map(p => pendingUpdates[p.id] ? pendingUpdates[p.id] : p);
    }, [products, pendingUpdates]);

    // Derived state - filter by both status AND type
    const filteredProducts = useMemo(() => {
        let filtered = effectiveProducts;

        // Execute Soft Delete Filter (Hide Archived by default unless filtering for them)
        if (filterStatus !== 'Archived') {
            filtered = filtered.filter(p => p.status !== 'Archived');
        }

        // Filter by status
        if (filterStatus === 'ReviewRequested') {
            filtered = filtered.filter(p => p.status === 'ReviewRequested' || p.approvalStatus === 'pending_review');
        } else if (filterStatus !== 'All') {
            filtered = filtered.filter(p => p.status === filterStatus);
        }

        // Filter by product type
        if (filterType !== 'All') {
            filtered = filtered.filter(p => (p.productType || 'new') === filterType);
        }

        // Filter by Category
        if (filterCategory !== 'All') {
            filtered = filtered.filter(p => p.category?.en === filterCategory);
        }

        // Filter by Subcategory
        if (filterSubCategory !== 'All') {
            filtered = filtered.filter(p => p.subCategory?.en === filterSubCategory);
        }

        return filtered;
    }, [effectiveProducts, filterStatus, filterType, filterCategory, filterSubCategory]);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="p-6">
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {language === 'en' ? 'Product Management' : 'পণ্য পরিচালনা'}
                            {saveStatus === 'saving' && <span className="text-sm font-normal text-blue-500 animate-pulse">Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-sm font-normal text-green-500">✓ Saved</span>}
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        {['All', 'Pending', 'Approved', 'Rejected', 'ReviewRequested', 'Archived'].map(status => (
                            <button
                                key={status}
                                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                className={`px-3 py-1 rounded text-sm font-medium ${filterStatus === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {/* Product Type Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</span>
                        <select
                            value={filterType}
                            onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                            className="text-sm p-1 rounded border dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                        >
                            <option value="All">All Types</option>
                            <option value="new">New Product</option>
                            <option value="wholesale">Wholesale</option>
                            <option value="resell">Resell</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
                        <select
                            value={filterCategory}
                            onChange={e => { setFilterCategory(e.target.value); setFilterSubCategory('All'); setCurrentPage(1); }}
                            className="text-sm p-1 rounded border dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                        >
                            <option value="All">All Categories</option>
                            {categoryCommissions.map(cat => (
                                <option key={cat.category.en} value={cat.category.en}>{cat.category[language]}</option>
                            ))}
                        </select>
                    </div>

                    {/* Subcategory Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory:</span>
                        <select
                            value={filterSubCategory}
                            onChange={e => { setFilterSubCategory(e.target.value); setCurrentPage(1); }}
                            disabled={filterCategory === 'All'}
                            className="text-sm p-1 rounded border dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white disabled:opacity-50"
                        >
                            <option value="All">All Subcategories</option>
                            {filterCategory !== 'All' && categoryCommissions.find(c => c.category.en === filterCategory)?.subCategories.map(sub => (
                                <option key={sub.id} value={sub.name.en}>{sub.name[language]}</option>
                            )) || null}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{effectiveProducts.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Active</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-yellow-600">{effectiveProducts.filter(p => p.status === 'Pending').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">{effectiveProducts.filter(p => p.status === 'Approved').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Approved</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                    <div className="text-2xl font-bold text-red-600">{effectiveProducts.filter(p => p.status === 'Rejected').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Rejected</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-2 border-purple-300 dark:border-purple-700">
                    <div className="text-2xl font-bold text-purple-600">{(products.filter(p => (p.productType || 'new') === 'wholesale')).length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Wholesale</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow border-2 border-orange-300">
                    <div className="text-2xl font-bold text-orange-600">{effectiveProducts.filter(p => p.approvalStatus === 'pending_review' || p.status === 'ReviewRequested').length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Review Req.</div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price/Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                Quick Status (P | A | R)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {paginatedProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <img src={product.images?.[0] || 'https://via.placeholder.com/40'} alt={product.name[language]} className="w-10 h-10 rounded mr-3 object-cover" />
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{product.name[language]}</div>
                                            <div className="text-xs text-gray-500">
                                                {vendors.find(v => v.id === product.vendorId)?.name[language] || 'Unknown'} • {product.productType || 'New'}
                                            </div>
                                            {(product.approvalStatus === 'pending_review' || product.status === 'ReviewRequested') && (
                                                <div className="mt-1">
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse uppercase">
                                                        Changes Pending
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                    <div className="font-bold">৳{product.price}</div>
                                    <div className={`text-xs ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    <div className="font-medium text-gray-700 dark:text-gray-300">{product.category?.[language] || '-'}</div>
                                    <div className="mt-0.5">{product.subCategory?.[language] || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-900 rounded-full p-1 w-fit">
                                        {[
                                            { label: 'P', value: 'Pending', color: 'bg-yellow-500', text: 'text-yellow-700' },
                                            { label: 'A', value: 'Approved', color: 'bg-green-500', text: 'text-green-700' },
                                            { label: 'R', value: 'Rejected', color: 'bg-red-500', text: 'text-red-700' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleStatusChange(product, opt.value)}
                                                className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${product.status === opt.value
                                                    ? `${opt.color} text-white shadow-lg scale-110`
                                                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800'
                                                    }`}
                                                title={opt.value}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex gap-2">
                                        {/* Show different actions for Archived items */}
                                        {product.status === 'Archived' ? (
                                            <>
                                                <button
                                                    onClick={() => handleRestore(product)}
                                                    className="text-blue-600 hover:text-blue-900 border border-blue-200 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                                    title="Restore to Pending"
                                                >
                                                    <ArrowPathIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(product)}
                                                    className="text-red-600 hover:text-red-900 border border-red-200 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="Permanently Delete"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleSoftDelete(product)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                title="Archive (Soft Delete)"
                                            >
                                                <ArchiveBoxIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between p-4 border-t dark:border-slate-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductsTab;
