import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ActivityLog {
    timestamp: string;
    userId: string;
    userEmail: string;
    action: string;
    targetType: 'order' | 'product' | 'user' | 'payout' | 'system' | 'vendor';
    targetId: string;
    severity: 'info' | 'warning' | 'critical';
    metadata: any;
}

export const ActivityService = {
    /**
     * Log a sensitive system activity for the audit trail
     */
    log: async (
        actor: { id: string; email: string },
        action: string,
        targetType: ActivityLog['targetType'],
        targetId: string,
        severity: ActivityLog['severity'] = 'info',
        metadata: any = {}
    ): Promise<void> => {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                createdAt: serverTimestamp(),
                userId: actor.id,
                userEmail: actor.email,
                action,
                targetType,
                targetId,
                severity,
                metadata
            };

            await addDoc(collection(db, 'system_logs'), logEntry);
        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    }
};
