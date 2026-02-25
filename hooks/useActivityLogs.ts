import { useState, useEffect, useMemo } from 'react';
import { ActivityLog, LogFilters, ActivityAction } from '../types';
import { useApp } from '../src/context/AppContext';

/**
 * Hook for managing activity logs
 */
export const useActivityLogs = (initialFilters?: LogFilters) => {
    const { activityLogs, getActivityLogs, exportActivityLogs } = useApp();
    const [filters, setFilters] = useState<LogFilters>(initialFilters || {});
    const [searchTerm, setSearchTerm] = useState('');

    // Apply filters
    const filteredLogs = useMemo(() => {
        return getActivityLogs({ ...filters, searchTerm });
    }, [activityLogs, filters, searchTerm, getActivityLogs]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: filteredLogs.length,
            today: filteredLogs.filter(log => {
                const today = new Date().toDateString();
                return new Date(log.timestamp).toDateString() === today;
            }).length,
            critical: filteredLogs.filter(log => log.severity === 'critical').length,
            warning: filteredLogs.filter(log => log.severity === 'warning').length,
            info: filteredLogs.filter(log => log.severity === 'info').length
        };
    }, [filteredLogs]);

    // Group by date
    const logsByDate = useMemo(() => {
        const grouped: Record<string, ActivityLog[]> = {};

        filteredLogs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(log);
        });

        return grouped;
    }, [filteredLogs]);

    // Filter helpers
    const filterByAction = (action: ActivityAction) => {
        setFilters(prev => ({ ...prev, action }));
    };

    const filterByUser = (userId: string) => {
        setFilters(prev => ({ ...prev, userId }));
    };

    const filterBySeverity = (severity: 'info' | 'warning' | 'critical') => {
        setFilters(prev => ({ ...prev, severity }));
    };

    const filterByDateRange = (dateFrom: string, dateTo: string) => {
        setFilters(prev => ({ ...prev, dateFrom, dateTo }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    const handleExport = () => {
        exportActivityLogs(filters);
    };

    return {
        // Data
        logs: filteredLogs,
        logsByDate,
        stats,

        // Filters
        filters,
        searchTerm,
        setSearchTerm,
        filterByAction,
        filterByUser,
        filterBySeverity,
        filterByDateRange,
        clearFilters,

        // Actions
        export: handleExport
    };
};

export default useActivityLogs;
