import { ActivityLog, ActivityAction, ChangeRecord, LogFilters } from '../../types';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

/**
 * Activity Logger Service
 * Tracks all admin and system actions for audit trail
 */
export class ActivityLoggerService {
    private static logs: ActivityLog[] = [];
    private static readonly MAX_LOGS = 1000; // Keep last 1000 logs in memory

    /**
     * Log an activity
     */
    static async log(
        action: ActivityAction,
        userId: string,
        userName: string,
        userRole: string,
        target: {
            type: 'user' | 'vendor' | 'order' | 'product' | 'payout' | 'settings' | 'category';
            id: string;
            name: string;
            changes?: ChangeRecord[];
            metadata?: any;
        }
    ): Promise<void> {
        const severity = this.determineSeverity(action);

        const log: ActivityLog = {
            id: `LOG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            userId,
            userName,
            userRole,
            action,
            targetType: target.type,
            targetId: target.id,
            targetName: target.name,
            changes: target.changes,
            metadata: target.metadata,
            severity
        };

        this.logs.unshift(log); // Add to beginning

        // Keep only last MAX_LOGS
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(0, this.MAX_LOGS);
        }

        // In production, also save to Firebase
        await this.saveToFirebase(log);

        console.log(`[Activity Log] ${action}: ${target.name} by ${userName}`);
    }

    /**
     * Get filtered logs
     */
    static getLogs(filters?: LogFilters): ActivityLog[] {
        let filtered = [...this.logs];

        if (filters) {
            if (filters.userId) {
                filtered = filtered.filter(log => log.userId === filters.userId);
            }

            if (filters.action) {
                filtered = filtered.filter(log => log.action === filters.action);
            }

            if (filters.targetType) {
                filtered = filtered.filter(log => log.targetType === filters.targetType);
            }

            if (filters.severity) {
                filtered = filtered.filter(log => log.severity === filters.severity);
            }

            if (filters.dateFrom) {
                filtered = filtered.filter(log => log.timestamp >= filters.dateFrom!);
            }

            if (filters.dateTo) {
                filtered = filtered.filter(log => log.timestamp <= filters.dateTo!);
            }

            if (filters.searchTerm) {
                const term = filters.searchTerm.toLowerCase();
                filtered = filtered.filter(log =>
                    log.userName.toLowerCase().includes(term) ||
                    log.targetName.toLowerCase().includes(term) ||
                    log.action.toLowerCase().includes(term)
                );
            }
        }

        return filtered;
    }

    /**
     * Export logs to CSV
     */
    static exportToCSV(filters?: LogFilters): string {
        const logs = this.getLogs(filters);

        const headers = ['Timestamp', 'User', 'Role', 'Action', 'Target Type', 'Target', 'Severity'];
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.userName,
            log.userRole,
            log.action,
            log.targetType,
            log.targetName,
            log.severity
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csv;
    }

    /**
     * Clear old logs (older than N days)
     */
    static clearOldLogs(daysToKeep: number = 90): void {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffISO = cutoffDate.toISOString();

        this.logs = this.logs.filter(log => log.timestamp >= cutoffISO);
        console.log(`[Activity Logger] Cleared logs older than ${daysToKeep} days`);
    }

    /**
     * Get all logs (for state management)
     */
    static getAllLogs(): ActivityLog[] {
        return [...this.logs];
    }

    /**
     * Determine severity based on action
     */
    private static determineSeverity(action: ActivityAction): 'info' | 'warning' | 'critical' {
        const criticalActions: ActivityAction[] = [
            'user.deleted',
            'vendor.suspended',
            'bulk.delete',
            'settings.updated'
        ];

        const warningActions: ActivityAction[] = [
            'user.suspended',
            'vendor.rejected',
            'product.rejected',
            'payout.rejected',
            'order.cancelled',
            'order.refunded',
            'auth.login_failed'
        ];

        if (criticalActions.includes(action)) {
            return 'critical';
        }

        if (warningActions.includes(action)) {
            return 'warning';
        }

        return 'info';
    }

    /**
     * Save to Firebase (placeholder for production)
     */
    private static async saveToFirebase(log: ActivityLog): Promise<void> {
        try {
            // Non-blocking write for activity logs
            addDoc(collection(db, 'system_logs'), log).catch(err =>
                console.error('[Activity Logger] Background save failed:', err)
            );
        } catch (error) {
            console.error('[Activity Logger] Failed to initiate log save:', error);
        }
    }

    /**
     * Load from Firebase
     */
    static async loadFromFirebase(limitCount = 100): Promise<ActivityLog[]> {
        try {
            const q = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({ ...doc.data() } as ActivityLog));
            this.logs = logs;
            return logs;
        } catch (error) {
            console.error('[Activity Logger] Failed to load logs:', error);
            return [];
        }
    }
}

export default ActivityLoggerService;
