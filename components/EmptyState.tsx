import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    icon?: React.ElementType;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon: Icon, actionLabel, onAction }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {Icon && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                    <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">{message}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
