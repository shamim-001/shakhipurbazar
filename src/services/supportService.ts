
import { db } from '../lib/firebase';
import { collection, doc, addDoc, updateDoc, query, where, orderBy, onSnapshot, getDoc, getDocs, Timestamp, arrayUnion } from 'firebase/firestore';
import { SupportTicket, SupportCategory, TicketStatus } from '../../types';

export class SupportService {
    private static collectionName = 'support_tickets';

    static async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<string> {
        const now = new Date().toISOString();
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...ticketData,
            status: 'Open',
            createdAt: now,
            updatedAt: now,
            messages: []
        });
        return docRef.id;
    }

    static async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
        const docRef = doc(db, this.collectionName, ticketId);
        await updateDoc(docRef, {
            status,
            updatedAt: new Date().toISOString()
        });
    }

    static async addMessage(ticketId: string, message: { senderId: string, senderName: string, content: string, isAdmin: boolean, attachmentUrl?: string, attachmentType?: 'image' | 'file' }): Promise<void> {
        const docRef = doc(db, this.collectionName, ticketId);
        await updateDoc(docRef, {
            messages: arrayUnion({
                ...message,
                id: `MSG-${Date.now()}`,
                timestamp: new Date().toISOString()
            }),
            updatedAt: new Date().toISOString()
        });
    }

    static async getTicket(ticketId: string): Promise<SupportTicket | null> {
        const docRef = doc(db, this.collectionName, ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as SupportTicket;
        }
        return null;
    }

    static subscribeToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void) {
        const q = query(
            collection(db, this.collectionName),
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket)));
        });
    }

    static subscribeToAllTickets(callback: (tickets: SupportTicket[]) => void) {
        const q = query(
            collection(db, this.collectionName),
            orderBy('updatedAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket)));
        });
    }
}
