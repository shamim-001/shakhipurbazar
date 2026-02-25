import React, { useState, useEffect } from 'react';
import { db } from '../../src/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { useApp } from '../../src/context/AppContext';
import {
    ClockIcon,
    UserIcon,
    CogIcon,
    ShieldCheckIcon,
    SearchIcon as MagnifyingGlassIcon
} from '../../components/icons';

interface LogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata: any;
    severity: 'info' | 'warning' | 'critical';
}

const AdminActivityLogTab: React.FC = () => {
    const { language } = useApp();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        const logsRef = collection(db, 'system_logs');
        let q = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

        if (filterType !== 'all') {
            q = query(logsRef, where('targetType', '==', filterType), orderBy('timestamp', 'desc'), limit(50));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLogs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as LogEntry[];
            setLogs(fetchedLogs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [filterType]);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-900/10';
            case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
            default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/10';
        }
    };

    const getActionLabel = (action: string) => {
        // Simple humanizer for action strings
        return action.replace(/\./g, ' ').replace(/_/g, ' ').toUpperCase();
    };

    return (
        <div className="p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {language === 'en' ? 'System Activity Logs' : 'সিস্টেম অ্যাক্টিভিটি লগ'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'en' ? 'Audit trail for all sensitive system operations.' : 'সকল সংবেদনশীল সিস্টেম অপারেশনের অডিট ট্রেইল।'}
                    </p>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm"
                    >
                        <option value="all">All Targets</option>
                        <option value="payout">Payouts</option>
                        <option value="order">Orders</option>
                        <option value="user">Users</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Target</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Metadata</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading audit trail...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No matching activity found.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-gray-400" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-indigo-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.userEmail}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{log.userId.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${getSeverityColor(log.severity)}`}>
                                                {getActionLabel(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <span className="text-gray-500 font-medium capitalize">{log.targetType}: </span>
                                                <span className="text-gray-900 dark:text-white font-mono">{log.targetId.slice(0, 12)}...</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-500 bg-gray-50 dark:bg-slate-900/30 p-2 rounded">
                                                {JSON.stringify(log.metadata)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminActivityLogTab;
