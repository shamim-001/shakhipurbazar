import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../../src/services/analyticsService';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ShieldCheckIcon,
    TruckIcon,
    WalletIcon,
    DocumentTextIcon,
    ArrowPathIcon
} from '../../components/icons';

interface HealthReport {
    timestamp: string;
    wallets: { status: 'healthy' | 'warning' | 'danger'; issues: string[]; pendingPayouts?: number };
    logistics: { status: 'healthy' | 'warning' | 'danger'; issues: string[]; pendingOrders?: number };
    logs: { criticalCount: number };
    summary: string;
}

const AdminHealthTab: React.FC = () => {
    const [report, setReport] = useState<HealthReport | any>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchHealth = async (deepScan: boolean = false) => {
        if (deepScan) setScanning(true);
        else setLoading(true);
        setError(null);
        try {
            const data = await AnalyticsService.getSystemHealthReport(deepScan);
            setReport(data);
            setLastRefresh(new Date());
        } catch (err: any) {
            console.error("Health fetch failed:", err);
            setError(err.message || "Failed to fetch health report");
        } finally {
            setLoading(false);
            setScanning(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Auto refresh every 5 minutes
        const interval = setInterval(() => fetchHealth(), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'healthy':
                return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <CheckCircleIcon className="h-3 w-3" /> Healthy
                </span>;
            case 'warning':
                return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3 w-3" /> Needs Attention
                </span>;
            case 'danger':
                return <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <ExclamationTriangleIcon className="h-3 w-3" /> Critical
                </span>;
            default:
                return null;
        }
    };

    if (loading && !report) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <ArrowPathIcon className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Running system diagnostics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
                        System Health Monitor
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Live diagnostics and integrity checks</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchHealth(true)}
                        className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-lg transition-colors"
                        disabled={scanning || loading}
                    >
                        {scanning ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShieldCheckIcon className="h-4 w-4" />}
                        Run Deep Scan
                    </button>
                    <button
                        onClick={() => fetchHealth(false)}
                        className="flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 px-4 py-2 rounded-lg transition-colors"
                        disabled={loading || scanning}
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Quick Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded dark:bg-rose-900/20">
                    <p className="text-rose-700 dark:text-rose-400 text-sm">{error}</p>
                </div>
            )}

            {report && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Overall Summary */}
                    <div className={`col-span-full p-6 rounded-2xl border-2 transition-all ${report.summary.includes('CRITICAL') ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30' :
                        report.summary === 'All systems operational' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' :
                            'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full transition-colors ${report.summary.includes('CRITICAL') ? 'bg-rose-500' :
                                report.summary === 'All systems operational' ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                                {report.summary === 'All systems operational' ? <CheckCircleIcon className="h-8 w-8" /> : <ExclamationTriangleIcon className="h-8 w-8" />}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{report.summary}</h3>
                                <p className="text-gray-600 dark:text-gray-400">Last check: {new Date(report.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Integrity Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <WalletIcon className="h-6 w-6" />
                            </div>
                            <StatusBadge status={report.wallets.status} />
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Wallet & Financials</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {report.wallets.pendingPayouts} Pending Payouts
                        </div>
                        {report.wallets.issues.length > 0 && (
                            <ul className="space-y-2 mt-4 border-t pt-4 border-gray-100 dark:border-slate-700">
                                {report.wallets.issues.map((issue: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
                                        <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Logistics Status Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                                <TruckIcon className="h-6 w-6" />
                            </div>
                            <StatusBadge status={report.logistics.status} />
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Logistics & Orders</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {report.logistics.pendingOrders} Pending Orders
                        </div>
                        {report.logistics.issues.length > 0 && (
                            <ul className="space-y-2 mt-4 border-t pt-4 border-gray-100 dark:border-slate-700">
                                {report.logistics.issues.map((issue: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                        <ClockIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Sharding Integrity Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <ShieldCheckIcon className="h-6 w-6" />
                            </div>
                            <StatusBadge status={report.sharding?.status || 'healthy'} />
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Sharding Integrity</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {report.sharding?.status === 'healthy' ? 'Verified' : 'Check Required'}
                        </div>
                        {report.sharding?.issues.length > 0 ? (
                            <ul className="space-y-2 mt-4 border-t pt-4 border-gray-100 dark:border-slate-700">
                                {report.sharding.issues.map((issue: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                        <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 border-t pt-4 border-gray-100 dark:border-slate-700">
                                Sharded balance consistency check passed.
                            </p>
                        )}
                    </div>

                    {/* System Logs Stats Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm col-span-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-600 dark:text-rose-400">
                                <DocumentTextIcon className="h-6 w-6" />
                            </div>
                            <div className={`px-2 py-0.5 rounded text-xs font-medium ${report.logs.criticalCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {report.logs.criticalCount} Critical (24h)
                            </div>
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Security & Critical Events</h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {report.logs.criticalCount === 0 ? 'No Critical Alerts' : `${report.logs.criticalCount} System Alerts Detected`}
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center text-xs text-gray-400 mt-12 mb-4 flex items-center justify-center gap-2">
                <ClockIcon className="h-3 w-3" />
                Next automated check at: {new Date(lastRefresh.getTime() + 5 * 60 * 1000).toLocaleTimeString()}
            </div>
        </div>
    );
};

export default AdminHealthTab;
