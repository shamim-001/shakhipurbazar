import React, { useState, useEffect } from 'react';
import { db } from '../src/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { CheckCircleIcon, XIcon } from '../components/icons';
import { useApp } from '../src/context/AppContext';

interface PaymentGatewayConfig {
    bkash: {
        enabled: boolean;
        apiKey: string;
        secretKey: string;
        username: string;
        password: string;
        sandboxMode: boolean;
    };
    nagad: {
        enabled: boolean;
        merchantId: string;
        merchantKey: string;
    };
    sslcommerz: {
        enabled: boolean;
        storeId: string;
        storePassword: string;
    };
    cod: {
        enabled: boolean;
    };
}

const PaymentGatewaySettings: React.FC = () => {
    const { platformSettings, updatePlatformSettings } = useApp();
    const [config, setConfig] = useState<PaymentGatewayConfig>({
        bkash: {
            enabled: false,
            apiKey: '',
            secretKey: '',
            username: '',
            password: '',
            sandboxMode: true,
        },
        nagad: {
            enabled: false,
            merchantId: '',
            merchantKey: '',
        },
        sslcommerz: {
            enabled: false,
            storeId: '',
            storePassword: '',
        },
        cod: {
            enabled: true, // COD enabled by default
        },
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            // Add timeout to prevent infinite loading
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const loadData = async () => {
                const docRef = doc(db, 'system', 'payment_config');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Deep merge to ensure all sections exist even if DB doc is partial
                    setConfig(prev => ({
                        ...prev,
                        ...data,
                        bkash: { ...prev.bkash, ...(data.bkash || {}) },
                        nagad: { ...prev.nagad, ...(data.nagad || {}) },
                        sslcommerz: { ...prev.sslcommerz, ...(data.sslcommerz || {}) },
                        cod: { ...prev.cod, ...(data.cod || {}) },
                    }));
                }
            };

            await Promise.race([loadData(), timeout]);
        } catch (error) {
            console.error('Error loading payment config:', error);
            // Use default config on error - this is fine
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const docRef = doc(db, 'system', 'payment_config');
            await setDoc(docRef, config);
            alert('Payment Gateway settings saved successfully!');
        } catch (error) {
            console.error('Error saving payment config:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (gateway: keyof PaymentGatewayConfig, field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            [gateway]: {
                ...prev[gateway],
                [field]: value,
            },
        }));
    };


    return (
        <div className={`space-y-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Payment Gateway Configuration</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                    Configure your payment gateways here. Enable COD (Cash on Delivery) immediately, and add bKash/Nagad credentials when you're ready to accept online payments.
                </p>
            </div>

            {/* Wallet System Switch (Moved from Modules) */}
            <div className="bg-violet-50 dark:bg-slate-800/50 rounded-lg shadow-md p-6 border-2 border-violet-200 dark:border-violet-900/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-xs">WP</span>
                            Wallet System
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enable/Disable customer top-ups & wallet payments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={platformSettings.features?.enableWalletPayments ?? true}
                            onChange={(e) => {
                                updatePlatformSettings({
                                    ...platformSettings,
                                    features: { ...platformSettings.features, enableWalletPayments: e.target.checked }
                                } as any);
                            }}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
                    </label>
                </div>
            </div>

            {/* Cash on Delivery */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cash on Delivery (COD)</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Default payment method - Always available</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.cod.enabled}
                            onChange={(e) => updateField('cod', 'enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                </div>
            </div>

            {/* bKash */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            bK
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">bKash</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Most popular in Bangladesh</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.bkash.enabled}
                            onChange={(e) => updateField('bkash', 'enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
                    </label>
                </div>

                {config.bkash.enabled && (
                    <div className="space-y-4 mt-6 pt-6 border-t dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    API Key
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={config.bkash.apiKey}
                                    onChange={(e) => updateField('bkash', 'apiKey', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Enter your bKash API Key"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Secret Key
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={config.bkash.secretKey}
                                    onChange={(e) => updateField('bkash', 'secretKey', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Enter your Secret Key"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={config.bkash.username}
                                    onChange={(e) => updateField('bkash', 'username', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Merchant Username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Password
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={config.bkash.password}
                                    onChange={(e) => updateField('bkash', 'password', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Merchant Password"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.bkash.sandboxMode}
                                    onChange={(e) => updateField('bkash', 'sandboxMode', e.target.checked)}
                                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Sandbox Mode (for testing)</span>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Nagad */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            N
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nagad</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Government-backed mobile wallet</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.nagad.enabled}
                            onChange={(e) => updateField('nagad', 'enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </label>
                </div>

                {config.nagad.enabled && (
                    <div className="space-y-4 mt-6 pt-6 border-t dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Merchant ID
                                </label>
                                <input
                                    type="text"
                                    value={config.nagad.merchantId}
                                    onChange={(e) => updateField('nagad', 'merchantId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Your Nagad Merchant ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Merchant Key
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={config.nagad.merchantKey}
                                    onChange={(e) => updateField('nagad', 'merchantKey', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Your Merchant Key"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SSLCommerz */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            SSL
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">SSLCommerz</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Credit/Debit card payments</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.sslcommerz.enabled}
                            onChange={(e) => updateField('sslcommerz', 'enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {config.sslcommerz.enabled && (
                    <div className="space-y-4 mt-6 pt-6 border-t dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Store ID
                                </label>
                                <input
                                    type="text"
                                    value={config.sslcommerz.storeId}
                                    onChange={(e) => updateField('sslcommerz', 'storeId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Your Store ID"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Store Password
                                </label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    value={config.sslcommerz.storePassword}
                                    onChange={(e) => updateField('sslcommerz', 'storePassword', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                    placeholder="Store Password"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Show Passwords */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="show-passwords"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="show-passwords" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    Show sensitive credentials
                </label>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 border-t dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Note:</strong> Credentials are stored securely in Firestore. Only enable gateways after obtaining merchant accounts.
                </p>
                <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="h-5 w-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PaymentGatewaySettings;
