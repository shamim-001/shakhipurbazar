import React from 'react';

const ProductSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200 dark:bg-slate-700 w-full" />
            <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-slate-700 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default ProductSkeleton;
