import { db } from '../lib/firebase';
import { collection, doc, addDoc, updateDoc, arrayUnion, query, where, onSnapshot, orderBy, getDocs, getDoc, setDoc, limit, serverTimestamp, Timestamp, increment } from 'firebase/firestore';
import { ChatThread, ChatMessage } from '../../types';
import { ImageService } from './imageService';

export const ChatService = {
    // Subscribe to chat threads for a specific user
    subscribeToUserThreads: (userId: string, callback: (threads: ChatThread[]) => void) => {
        const q = query(
            collection(db, 'chats'),
            where('participantIds', 'array-contains', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const threads = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate().toISOString() : data.lastMessageAt
                } as ChatThread;
            });

            threads.sort((a, b) => {
                const timeA = new Date(a.lastMessageAt || 0).getTime();
                const timeB = new Date(b.lastMessageAt || 0).getTime();
                return timeB - timeA;
            });
            callback(threads);
        });
    },

    // Subscribe to ALL threads (Admin only)
    subscribeToAllThreads: (callback: (threads: ChatThread[]) => void) => {
        const q = query(collection(db, 'chats'));

        return onSnapshot(q, (snapshot) => {
            const threads = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    lastMessageAt: data.lastMessageAt instanceof Timestamp ? data.lastMessageAt.toDate().toISOString() : data.lastMessageAt
                } as ChatThread;
            });

            threads.sort((a, b) => {
                const timeA = new Date(a.lastMessageAt || 0).getTime();
                const timeB = new Date(b.lastMessageAt || 0).getTime();
                return timeB - timeA;
            });
            callback(threads);
        });
    },

    // Subscribe to messages for a specific thread
    subscribeToMessages: (threadId: string, callback: (messages: ChatMessage[]) => void) => {
        const messagesRef = collection(db, 'chats', threadId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp
                } as ChatMessage;
            });
            callback(messages);
        });
    },

    // Start a new chat or get existing one with CONTEXT awareness
    startChat: async (participantIds: string[], metadata?: {
        productId?: string,
        orderId?: string,
        vendorId?: string,
        customerId?: string,
        contextType?: 'order' | 'product' | 'flight' | 'general' | 'support',
        contextId?: string,
        subject?: string
    }): Promise<string> => {
        try {
            // normalize context
            const contextType = metadata?.contextType || 'general';
            const contextId = metadata?.contextId || null;

            // Find existing thread between these exact participants AND context
            const q = query(
                collection(db, 'chats'),
                where('participantIds', 'array-contains', participantIds[0])
            );

            const snapshot = await getDocs(q);
            const existingThread = snapshot.docs.find(doc => {
                const data = doc.data();
                const sameParticipants = data.participantIds.length === participantIds.length &&
                    participantIds.every(id => data.participantIds.includes(id));

                // Context Match Logic
                if (!sameParticipants) return false;

                if (contextId) {
                    // strict match for specific contexts
                    return data.contextType === contextType && data.contextId === contextId;
                } else {
                    // general chat match (either explicit 'general' or undefined/null context)
                    return !data.contextId || data.contextType === 'general';
                }
            });

            if (existingThread) {
                // Update metadata if provided and changed
                if (metadata) {
                    await updateDoc(doc(db, 'chats', existingThread.id), {
                        ...metadata,
                        contextType, // Ensure these are set
                        contextId,
                        updatedAt: serverTimestamp()
                    });
                }
                return existingThread.id;
            }

            // Create new thread
            const newThreadRef = doc(collection(db, 'chats'));
            const newThread: Partial<ChatThread> = {
                id: newThreadRef.id,
                participantIds,
                status: 'active',
                lastMessageAt: new Date().toISOString(),
                unreadCount: participantIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
                ...metadata,
                contextType,
                contextId
            };

            await setDoc(newThreadRef, newThread);
            return newThreadRef.id;
        } catch (error) {
            console.error("ChatService.startChat error:", error);
            throw error;
        }
    },

    sendMessage: async (threadId: string, senderId: string, text: string, type: ChatMessage['type'] = 'text', metadata?: ChatMessage['metadata']) => {
        try {
            const threadRef = doc(db, 'chats', threadId);
            const messagesRef = collection(threadRef, 'messages');

            const newMessageRef = doc(messagesRef);
            const newMessage: ChatMessage = {
                id: newMessageRef.id,
                senderId,
                text,
                timestamp: new Date().toISOString(),
                type,
                metadata,
                seenBy: { [senderId]: new Date().toISOString() }
            };

            // Get thread data to update unread counts
            const threadSnap = await getDoc(threadRef);
            const threadData = threadSnap.data() as ChatThread;

            const unreadUpdates: any = {};
            if (threadData?.participantIds) {
                threadData.participantIds.forEach(id => {
                    if (id !== senderId) {
                        unreadUpdates[`unreadCount.${id}`] = increment(1);
                    }
                });
            }

            await setDoc(newMessageRef, newMessage);
            await updateDoc(threadRef, {
                lastMessage: type === 'image' ? '🖼️ Photo' : ((type as string) === 'file' ? '📁 File' : text),
                lastMessageAt: serverTimestamp(),
                lastSenderId: senderId,
                lastActionBy: senderId,
                updatedAt: serverTimestamp(),
                ...unreadUpdates
            });
        } catch (error) {
            console.error("ChatService.sendMessage error:", error);
            throw error;
        }
    },

    // Upload and send attachment
    sendAttachment: async (threadId: string, senderId: string, file: File | Blob, type: 'image' | 'file') => {
        const filename = `${Date.now()}_${(file as File).name || 'attachment'}`;
        const path = `chats/${threadId}/attachments/${filename}`;

        // Use ImageService for compression if it's an image
        const url = await ImageService.uploadImage(file, path);

        return ChatService.sendMessage(threadId, senderId, url, type, {
            url,
            filename,
            size: (file as File).size || 0
        });
    },
    markAsRead: async (threadId: string, userId: string) => {
        try {
            const threadRef = doc(db, 'chats', threadId);
            await updateDoc(threadRef, {
                [`unreadCount.${userId}`]: 0
            });

            // Update seenBy in the last message
            const messagesRef = collection(db, 'chats', threadId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
            const lastMsgSnap = await getDocs(q);
            if (!lastMsgSnap.empty) {
                const lastMsgDoc = lastMsgSnap.docs[0];
                const lastMsgData = lastMsgDoc.data();
                if (lastMsgData.senderId !== userId && (!lastMsgData.seenBy || !lastMsgData.seenBy[userId])) {
                    await updateDoc(lastMsgDoc.ref, {
                        [`seenBy.${userId}`]: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error("ChatService.markAsRead error:", error);
        }
    },

    // Set typing status for a user in a thread
    setTypingStatus: async (threadId: string, userId: string, isTyping: boolean) => {
        const typingRef = doc(db, 'chats', threadId, 'typing', userId);
        if (isTyping) {
            await setDoc(typingRef, {
                isTyping: true,
                lastTypedAt: serverTimestamp()
            });
        } else {
            // Delete the typing doc or set isTyping to false
            await setDoc(typingRef, {
                isTyping: false,
                lastTypedAt: serverTimestamp()
            });
        }
    },

    // Subscribe to typing indicators for a thread
    subscribeToTyping: (threadId: string, callback: (typingUsers: string[]) => void) => {
        const typingRef = collection(db, 'chats', threadId, 'typing');
        const q = query(typingRef, where('isTyping', '==', true));

        return onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const typingUsers = snapshot.docs
                .filter(doc => {
                    const data = doc.data();
                    const lastTyped = data.lastTypedAt?.toDate?.()?.getTime() || 0;
                    // Only include users who typed within the last 5 seconds to prevent stale indicators
                    return now - lastTyped < 5000;
                })
                .map(doc => doc.id);
            callback(typingUsers);
        });
    }
};
