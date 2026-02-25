
import React, { useState, useEffect } from 'react';
import { useApp } from '../../src/context/AppContext';

const GeneralSettings: React.FC = () => {
    const { platformSettings, updatePlatformSettings } = useApp();

    // Local state to buffer changes
    const [localSettings, setLocalSettings] = useState(platformSettings);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with global settings on mount or global update (unless we have local edits, but simpler to just init)
    useEffect(() => {
        setLocalSettings(platformSettings);
        setHasChanges(false);
    }, []); // Only on mount to avoid overwriting ongoing edits if platformSettings changes elsewhere? 
    // Actually, good practice to sync if not editing, but for simple settings page, 
    // we want to ensure we don't overwrite user's typing.
    // Let's rely on manual Save.

    const handleChange = (field: string, value: any, nestedField?: string) => {
        setLocalSettings(prev => {
            if (nestedField) {
                // Handle 2-level nesting max for now (e.g. footerDescription.en)
                // Or specialized handling.
                // Let's make it simpler: tailored handlers for complex objects.
                return prev;
            }
            return { ...prev, [field]: value };
        });
        setHasChanges(true);
    };

    const handleNestedChange = (parent: keyof typeof platformSettings, key: string, value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any),
                [key]: value
            }
        }));
        setHasChanges(true);
    };

    const saveBasicInfo = () => {
        updatePlatformSettings({
            ...platformSettings,
            appName: localSettings.appName,
            logoUrl: localSettings.logoUrl,
            supportEmail: localSettings.supportEmail,
            supportPhone: localSettings.supportPhone,
        });
        alert("Basic Info saved successfully!");
        setHasChanges(false); // Refine this later if we want to track per-section changes, but strictly speaking "hasChanges" is global. 
        // Ideally we should have granular dirty checking, but for now resetting global is acceptable if we assume user saves one section at a time.
        // Actually, if I save Basic Info, I shouldn't lose Footer changes if they are in localSettings.
        // But updatePlatformSettings merges into global state.
        // The issue is `localSettings` might have Footer changes too. 
        // If I only save Basic Info fields, the Footer changes in `localSettings` persist but aren't pushed to global. 
        // So `localSettings` is still "ahead" of `platformSettings`.
        // So `hasChanges` should remain true if there are other diffs? 
        // For simplicity in this iteration: I'll just push specifically the Basic Info fields to global.
        // And keep localSettings as is.
        // A full "Save" saves everything. Granular saves only specific parts.
    };

    const saveFooterSocials = () => {
        updatePlatformSettings({
            ...platformSettings,
            footerDescription: localSettings.footerDescription,
            copyrightText: localSettings.copyrightText,
            socialLinks: localSettings.socialLinks,
        });
        alert("Footer & Socials saved successfully!");
        setHasChanges(false);
    };

    const saveAnalytics = () => {
        updatePlatformSettings({
            ...platformSettings,
            analytics: {
                gtmId: localSettings.analytics?.gtmId || '',
                enabled: localSettings.analytics?.enabled || false,
                headScripts: localSettings.analytics?.headScripts || '',
                bodyScripts: localSettings.analytics?.bodyScripts || ''
            }
        });
        alert("Analytics settings saved!");
        setHasChanges(false);
    };

    const saveLaunchControl = () => {
        updatePlatformSettings({
            ...platformSettings,
            maintenanceMode: localSettings.maintenanceMode,
            moduleToggles: localSettings.moduleToggles
        });
        alert("Launch control settings saved!");
        setHasChanges(false);
    };

    const saveShopSettings = () => {
        updatePlatformSettings({
            ...platformSettings,
            showFeaturedShops: localSettings.showFeaturedShops
        });
        alert("Shop settings saved!");
        setHasChanges(false);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Launch Control Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-2 border-amber-200 dark:border-amber-900/30">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            Launch Control & Maintenance
                        </h3>
                        <button
                            onClick={saveLaunchControl}
                            className="px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm font-bold"
                        >
                            Save Launch Settings
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white">Maintenance Mode</h4>
                                <p className="text-xs text-gray-500">Enable this to show a maintenance message to all non-admin users.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.maintenanceMode?.enabled || false}
                                    onChange={(e) => setLocalSettings(prev => ({
                                        ...prev,
                                        maintenanceMode: {
                                            enabled: e.target.checked,
                                            message: prev.maintenanceMode?.message || { en: 'Scheduled Maintenance', bn: 'পরিকল্পিত রক্ষণাবেক্ষণ' }
                                        }
                                    }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                            </label>
                        </div>
                        {localSettings.maintenanceMode?.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Maintenance Message (EN)</label>
                                    <input
                                        type="text"
                                        value={localSettings.maintenanceMode?.message?.en || ''}
                                        onChange={(e) => setLocalSettings(prev => ({
                                            ...prev,
                                            maintenanceMode: { ...prev.maintenanceMode!, message: { ...prev.maintenanceMode!.message, en: e.target.value } }
                                        }))}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Maintenance Message (BN)</label>
                                    <input
                                        type="text"
                                        value={localSettings.maintenanceMode?.message?.bn || ''}
                                        onChange={(e) => setLocalSettings(prev => ({
                                            ...prev,
                                            maintenanceMode: { ...prev.maintenanceMode!, message: { ...prev.maintenanceMode!.message, bn: e.target.value } }
                                        }))}
                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-800 dark:text-white mb-3">Module Visibility (Feature Flags)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {(['wholesale', 'resell', 'rentacar', 'flights', 'delivery'] as const).map(module => (
                                <button
                                    key={module}
                                    onClick={() => setLocalSettings(prev => ({
                                        ...prev,
                                        moduleToggles: {
                                            ...(prev.moduleToggles || { wholesale: true, resell: true, rentacar: true, flights: true, delivery: true }),
                                            [module]: !prev.moduleToggles?.[module]
                                        }
                                    }))}
                                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${localSettings.moduleToggles?.[module] !== false
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500'
                                        : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700'
                                        }`}
                                >
                                    <span className="text-xs font-bold capitalize">{module === 'rentacar' ? 'Rent-a-Car' : module}</span>
                                    <span className="text-[10px] uppercase font-bold">{localSettings.moduleToggles?.[module] !== false ? 'Enabled' : 'Disabled'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Configuration Section */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-2 border-blue-200 dark:border-blue-900/30">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                            Shops Page Configuration
                        </h3>
                        <button
                            onClick={saveShopSettings}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm font-bold"
                        >
                            Save Shop Settings
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">Featured Shops Section</h4>
                                <p className="text-[10px] text-gray-500">Toggle visibility of the "Featured" section on the Shops page.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={localSettings.showFeaturedShops !== false}
                                    onChange={(e) => setLocalSettings(prev => ({
                                        ...prev,
                                        showFeaturedShops: e.target.checked
                                    }))}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Basic Info</h3>
                        <button
                            onClick={saveBasicInfo}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                        >
                            Save Basic Info
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Name</label>
                        <input
                            type="text"
                            value={localSettings.appName || ''}
                            onChange={(e) => handleChange('appName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                        <input
                            type="text"
                            value={localSettings.logoUrl || ''}
                            onChange={(e) => handleChange('logoUrl', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                        <input
                            type="email"
                            value={localSettings.supportEmail}
                            onChange={(e) => handleChange('supportEmail', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Phone</label>
                        <input
                            type="text"
                            value={localSettings.supportPhone}
                            onChange={(e) => handleChange('supportPhone', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Footer & Socials</h3>
                        <button
                            onClick={saveFooterSocials}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                        >
                            Save Footer & Socials
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Footer Description (EN)</label>
                            <textarea
                                rows={2}
                                value={localSettings.footerDescription?.en || ''}
                                onChange={(e) => handleNestedChange('footerDescription', 'en', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Footer Description (BN)</label>
                            <textarea
                                rows={2}
                                value={localSettings.footerDescription?.bn || ''}
                                onChange={(e) => handleNestedChange('footerDescription', 'bn', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Copyright Text (EN)</label>
                            <input
                                type="text"
                                value={localSettings.copyrightText?.en || ''}
                                onChange={(e) => handleNestedChange('copyrightText', 'en', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Copyright Text (BN)</label>
                            <input
                                type="text"
                                value={localSettings.copyrightText?.bn || ''}
                                onChange={(e) => handleNestedChange('copyrightText', 'bn', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Facebook URL</label>
                            <input
                                type="text"
                                value={localSettings.socialLinks?.facebook || ''}
                                onChange={(e) => handleNestedChange('socialLinks', 'facebook', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter URL</label>
                            <input
                                type="text"
                                value={localSettings.socialLinks?.twitter || ''}
                                onChange={(e) => handleNestedChange('socialLinks', 'twitter', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="https://twitter.com/..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instagram URL</label>
                            <input
                                type="text"
                                value={localSettings.socialLinks?.instagram || ''}
                                onChange={(e) => handleNestedChange('socialLinks', 'instagram', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
                            <input
                                type="text"
                                value={localSettings.socialLinks?.youtube || ''}
                                onChange={(e) => handleNestedChange('socialLinks', 'youtube', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="https://youtube.com/..."
                            />
                        </div>
                    </div>
                </div>

            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Analytics & Tracking</h3>
                        <button
                            onClick={saveAnalytics}
                            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                        >
                            Save Analytics
                        </button>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Tag Manager ID (GTM-XXXX)</label>
                            <input
                                type="text"
                                value={localSettings.analytics?.gtmId || ''}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    analytics: { ...prev.analytics!, gtmId: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm font-mono"
                                placeholder="GTM-XXXXXX"
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localSettings.analytics?.enabled || false}
                                    onChange={(e) => setLocalSettings(prev => ({
                                        ...prev,
                                        analytics: { ...prev.analytics!, enabled: e.target.checked, gtmId: prev.analytics?.gtmId || '' }
                                    }))}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Enable Tracking
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-bold">Additional Head Scripts</label>
                            <p className="text-[10px] text-gray-500 mb-1">Injected high in the &lt;head&gt; section. Use for GTM scripts, pixels, etc.</p>
                            <textarea
                                rows={4}
                                value={localSettings.analytics?.headScripts || ''}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    analytics: { ...(prev.analytics || { gtmId: '', enabled: false }), headScripts: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm font-mono"
                                placeholder="<!-- GTM Head Code -->\n<script>...</script>"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 font-bold">Additional Body Scripts</label>
                            <p className="text-[10px] text-gray-500 mb-1">Injected immediately after the opening &lt;body&gt; tag. Use for GTM noscript tags.</p>
                            <textarea
                                rows={4}
                                value={localSettings.analytics?.bodyScripts || ''}
                                onChange={(e) => setLocalSettings(prev => ({
                                    ...prev,
                                    analytics: { ...(prev.analytics || { gtmId: '', enabled: false }), bodyScripts: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm font-mono"
                                placeholder="<!-- GTM Body Code -->\n<noscript>...</noscript>"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
