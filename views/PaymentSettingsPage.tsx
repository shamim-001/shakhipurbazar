import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentGatewaySettings from './PaymentGatewaySettings';
import { ChevronLeftIcon } from '../components/icons';

const PaymentSettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="container mx-auto px-4 py-8">
                {/* Header with back button */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        Back to Admin
                    </button>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    Payment Gateway Settings
                </h1>

                {/* Payment Gateway Settings Component */}
                <PaymentGatewaySettings />
            </div>
        </div>
    );
};

export default PaymentSettingsPage;
