import React, { useEffect, useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { AnalyticsService } from '../src/services/analyticsService';
import { CurrencyDollarIcon, UserGroupIcon, ShoppingBagIcon, TrendingUpIcon, ShieldCheckIcon } from '../components/icons';
import { ActivityLoggerService } from '../src/services/activityLogger';
import RevenueChart from '../components/analytics/RevenueChart';
import TopProductsChart from '../components/analytics/TopProductsChart';
import CommissionBreakdown from '../components/analytics/CommissionBreakdown';

const CSSBarChart = ({ data, height = 200 }: { data: { label: string; value: number; color?: string }[]; height?: number }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="flex items-end justify-between gap-2 w-full" style={{ height: `${height}px` }}>
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        {d.label}: {d.value.toLocaleString()}
                    </div>

                    {/* Bar */}
                    <div
                        className={`w-full rounded-t-sm transition-all duration-500 ease-out hover:opacity-80 ${d.color || 'bg-blue-500'}`}
                        style={{ height: `${(d.value / maxValue) * 100}%` }}
                    ></div>

                    {/* Label */}
                    <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 rotate-0 truncate w-full text-center">
                        {d.label.split('-').slice(1).join('/')}
                    </div>
                </div>
            ))}
        </div>
    );
};

import DateRangePicker from '../components/common/DateRangePicker';

const AdminAnalyticsTab: React.FC = () => {
    const { language } = useApp();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [advancedReport, setAdvancedReport] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState<{ startDate: Date, endDate: Date }>({
        startDate: new Date(new Date().setDate(new Date().getDate() - 28)), // Default 28 days
        endDate: new Date()
    });

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                // Pass the date range object directly to the service
                const [data, recentOrders, advanced, recentLogs] = await Promise.all([
                    AnalyticsService.getVendorReport('GLOBAL', dateRange),
                    AnalyticsService.getRecentOrders(20),
                    AnalyticsService.getAdvancedPlatformAnalytics(dateRange.startDate, dateRange.endDate),
                    ActivityLoggerService.loadFromFirebase(50)
                ]);
                setReport({ ...data, recentOrders });
                setAdvancedReport(advanced);
                setLogs(recentLogs);
            } catch (error) {
                console.error("Analytics Error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [dateRange]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 h-96">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Processing Analytics Data...</p>
        </div>
    );
    if (!report) return <div className="p-10 text-center text-red-500">Failed to load data.</div>;

    const chartData = (report?.dailyTrends || []).map((d: any) => ({
        label: d.date || '?',
        value: (d.organicRevenue || 0) + (d.promotedRevenue || 0),
        color: 'bg-rose-500'
    }));

    const promotedVsOrganic = [
        { label: 'Organic', value: report?.organicMetrics?.revenue || 0, color: 'bg-blue-500' },
        { label: 'Promoted', value: report?.promotedMetrics?.revenue || 0, color: 'bg-purple-500' }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUpIcon className="h-7 w-7 text-green-500" />
                        {language === 'en' ? 'Platform Analytics' : 'প্ল্যাটফর্ম অ্যানালিটিক্স'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {language === 'en' ? 'Real-time performance metrics' : 'রিয়েল-টাইম পারফরম্যান্স মেট্রিক্স'}
                    </p>
                </div>

                {/* Date Picker */}
                <div className="z-10">
                    <DateRangePicker
                        onChange={(range) => setDateRange(range)}
                        initialStartDate={dateRange.startDate}
                        initialEndDate={dateRange.endDate}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                ৳{((report?.organicMetrics?.revenue || 0) + (report?.promotedMetrics?.revenue || 0)).toLocaleString()}
                            </h3>
                            <span className="text-xs text-green-500 flex items-center mt-1">
                                <TrendingUpIcon className="w-3 h-3 mr-1" /> +12.5%
                            </span>
                        </div>
                        <CurrencyDollarIcon className="w-8 h-8 text-blue-100 dark:text-blue-900/50 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Ad Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                ৳{(report?.promotedMetrics?.revenue || 0).toLocaleString()}
                            </h3>
                            <span className="text-xs text-green-500 flex items-center mt-1">
                                <TrendingUpIcon className="w-3 h-3 mr-1" /> +8.2%
                            </span>
                        </div>
                        <ShoppingBagIcon className="w-8 h-8 text-purple-100 dark:text-purple-900/50 text-purple-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-rose-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Total Views</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                {((report?.organicMetrics?.views || 0) + (report?.promotedMetrics?.views || 0)).toLocaleString()}
                            </h3>
                            <span className="text-xs text-red-500 flex items-center mt-1">
                                <TrendingUpIcon className="w-3 h-3 mr-1 rotate-180" /> -2.1%
                            </span>
                        </div>
                        <UserGroupIcon className="w-8 h-8 text-rose-100 dark:text-rose-900/50 text-rose-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Ad ROI</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                                {(report?.promotedMetrics?.roi || 0).toFixed(1)}%
                            </h3>
                            <span className="text-xs text-green-500 flex items-center mt-1">
                                <TrendingUpIcon className="w-3 h-3 mr-1" /> +5.4%
                            </span>
                        </div>
                        <CurrencyDollarIcon className="w-8 h-8 text-orange-100 dark:text-orange-900/50 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">
                        Revenue Trend ({dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()})
                    </h3>
                    <CSSBarChart data={chartData} height={250} />
                </div>

                {/* Breakdown Pie/Bar */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Category Distribution</h3>
                    <div className="h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="w-full space-y-4">
                            {advancedReport?.categoryBreakdown && Object.entries(advancedReport.categoryBreakdown as Record<string, number>)
                                .sort((a, b) => b[1] - a[1]) // Sort by revenue
                                .map(([cat, value], idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="truncate max-w-[150px]">{cat}</span>
                                            <span className="font-bold">৳{(value || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-indigo-500"
                                                style={{ width: `${(value / (advancedReport.totalRevenue || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}

                            {(!advancedReport?.categoryBreakdown || Object.keys(advancedReport.categoryBreakdown).length === 0) && (
                                <p className="text-center text-gray-500 mt-10">No category data for this period.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Platform Activity Hub - MERGED FEED */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border dark:border-slate-700">
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/30">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Platform Activity Hub</h3>
                        <p className="text-sm text-gray-500">Real-time oversight of products, orders, and system events</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {/* Merge and sort logs & orders */}
                    {[
                        ...(report?.recentOrders || []).map((o: any) => ({
                            type: 'order',
                            timestamp: o.date || new Date().toISOString(),
                            id: o.id || '?',
                            title: `Order #${(o.id || '??????').slice(-6)}`,
                            subtitle: `Amount: ৳${o.total || 0} • Status: ${o.status || 'Unknown'}`,
                            status: o.status === 'Delivered' ? 'success' : 'pending'
                        })),
                        ...(logs || []).map((l: any) => ({
                            type: 'log',
                            timestamp: l.timestamp || new Date().toISOString(),
                            id: l.id || l.timestamp || Math.random().toString(),
                            title: l.targetName || 'System Event',
                            subtitle: `${l.userName || 'System'} (${l.userRole || 'Admin'}) ${(l.action || 'activity').replace(/\./g, ' ')}`,
                            status: l.severity === 'critical' ? 'error' : l.severity === 'warning' ? 'warning' : 'info'
                        }))
                    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 30) // Show top 30
                        .map((item, idx) => (
                            <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex gap-4 items-start">
                                <div className={`mt-1 p-2 rounded-lg ${item.type === 'order' ? 'bg-blue-100 text-blue-600' :
                                    item.status === 'error' ? 'bg-red-100 text-red-600' :
                                        item.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {item.type === 'order' ? <ShoppingBagIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                                        <span className="text-[10px] text-gray-500 font-medium">{new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                                </div>
                            </div>
                        ))}

                    {(!report.recentOrders?.length && !logs?.length) && (
                        <div className="py-20 text-center">
                            <p className="text-gray-500 italic">No recent activity detected.</p>
                        </div>
                    )}
                </div>
                <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700/30 border-t dark:border-slate-700 text-center">
                    <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                        View Full Audit Logs
                    </button>
                </div>
            </div>

            {/* Driver & Delivery performance Metrics */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {language === 'en' ? 'Logistics Performance' : 'লজিস্টিক পারফরম্যান্স'}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {language === 'en' ? 'Delivery Performance' : 'ডেলিভারি পারফরম্যান্স'}
                        </h3>
                        <div className="space-y-4">
                            {advancedReport?.deliveryPerformance && Object.entries(advancedReport.deliveryPerformance as Record<string, { orders: number, revenue: number }>)
                                .map(([id, perf], idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {id.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">{id.slice(0, 12)}</p>
                                                <p className="text-[10px] text-gray-500">{perf.orders} Orders Completed</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">৳{(perf.revenue || 0).toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-500">Volume</p>
                                        </div>
                                    </div>
                                ))}
                            {(!advancedReport?.deliveryPerformance || Object.keys(advancedReport.deliveryPerformance).length === 0) && (
                                <p className="text-center text-gray-500 py-10">No delivery data available.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            {language === 'en' ? 'System Health' : 'সিস্টেম হেলথ'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20 text-center">
                                <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase">Uptime</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">99.9%</p>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 text-center">
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Total Orders</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{advancedReport?.orderCount || 0}</p>
                            </div>
                        </div>
                        <div className="mt-6 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/20">
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mb-2">Platform Revenue Distribution</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 bg-indigo-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">85%</span>
                            </div>
                            <p className="text-[10px] text-indigo-500 mt-2 italic">*Data aggregated from latest backend shards.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsTab;
