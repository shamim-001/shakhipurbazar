import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChatThread, Notification, User } from '../../types';
import { ChatService } from '../services/chatService';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';

interface ChatContextType {
    chatThreads: ChatThread[];
    notifications: Notification[];
    sendMessage: (threadId: string, text: string) => Promise<void>;
    startChat: (participantId: string, context?: any) => Promise<string>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    sendAttachment: (threadId: string, file: File | Blob, type: 'image' | 'file') => Promise<void>;
    startSupportChat: (subject: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ currentUser: User | null; children: React.ReactNode }> = ({ currentUser, children }) => {
    const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        if (!currentUser) return;
        const unsubThreads = ChatService.subscribeToUserThreads(currentUser.id, setChatThreads);
        const qNotif = query(collection(db, `users/${currentUser.id}/notifications`), orderBy('date', 'desc'), limit(50));
        const unsubNotifs = onSnapshot(qNotif, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
        });
        return () => { unsubThreads(); unsubNotifs(); };
    }, [currentUser]);

    const sendMessage = async (threadId: string, text: string) => {
        if (currentUser) await ChatService.sendMessage(threadId, currentUser.id, text);
    };

    const startChat = async (participantId: string, ctx?: any): Promise<string> => {
        if (currentUser) {
            const threadId = await ChatService.startChat([currentUser.id, participantId], ctx);
            return threadId;
        }
        return '';
    };

    const markNotificationAsRead = async (id: string) => {
        if (currentUser) await updateDoc(doc(db, `users/${currentUser.id}/notifications`, id), { read: true });
    };

    const markAllNotificationsAsRead = async () => {
        if (!currentUser) return;
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
            batch.update(doc(db, `users/${currentUser.id}/notifications`, n.id), { read: true });
        });
        await batch.commit();
    };

    const sendAttachment = async (threadId: string, file: File | Blob, type: 'image' | 'file') => {
        if (currentUser) await ChatService.sendAttachment(threadId, currentUser.id, file, type);
    };

    const startSupportChat = async (subject: string) => {
        if (currentUser) return await ChatService.startChat([currentUser.id, 'support_center'], {
            contextType: 'support',
            subject
        });
        return '';
    };

    return (
        <ChatContext.Provider value={{ chatThreads, notifications, sendMessage, startChat, markNotificationAsRead, markAllNotificationsAsRead, sendAttachment, startSupportChat }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error('useChat must be used within a ChatProvider');
    return context;
};
