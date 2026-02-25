
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../src/context/AppContext';
import { ChevronLeftIcon, PaperAirplaneIcon, UserIcon, ShoppingBagIcon, ChatBubbleLeftRightIcon, TicketIcon, PaperClipIcon, XIcon, ShieldCheckIcon, LifebuoyIcon } from '../components/icons';
import { ChatMessage, QuickReply } from '../types';
import { db } from '../src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ChatService } from '../src/services/chatService';
import { storage } from '../src/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

import { useParams, useNavigate } from 'react-router-dom';

const ChatPage: React.FC = () => {
    const { threadId } = useParams<{ threadId: string }>();
    const { language, chatThreads, sendMessage, currentUser, users, vendors, products, orders } = useApp();
    const navigate = useNavigate();
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

    const thread = chatThreads.find(t => t.id === threadId);
    const isSupport = thread?.contextType === 'support' || thread?.metadata?.contextType === 'support';
    const subject = thread?.subject || thread?.metadata?.subject;

    // Metadata lookups
    const contextType = thread?.metadata?.type || thread?.contextType;
    const contextId = thread?.metadata?.id || thread?.metadata?.orderId || thread?.metadata?.productId || thread?.contextId; // Fallback

    // ... products/orders lookups ...
    const linkedProduct = (contextType === 'product' || thread?.productId)
        ? products.find(p => p.id === (thread?.metadata?.productId || thread?.productId))
        : null;

    const linkedOrder = (contextType === 'order' || thread?.orderId)
        ? orders.find(o => o.id === (thread?.metadata?.orderId || thread?.orderId))
        : null;

    const isFlightContext = contextType === 'flight';

    const otherParticipantId = thread?.participantIds.find(id => id !== currentUser?.id);
    const otherParticipant = users.find(u => u.id === otherParticipantId);

    const isResellChat = linkedProduct?.productType === 'resell';

    const vendorId = !isResellChat ? (otherParticipant?.shopId || otherParticipant?.driverId || thread?.vendorId) : null;
    const vendorInfo = vendorId ? vendors.find(v => v.id === vendorId) : null;

    const participantName = isSupport
        ? (language === 'en' ? 'Support Center' : 'সাপোর্ট সেন্টার')
        : (vendorInfo ? vendorInfo.name[language] : otherParticipant?.name || 'Unknown User');

    const participantAvatar = isSupport ? null : (vendorInfo ? vendorInfo.logo : otherParticipant?.image);

    const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Real-time messages subscription
    useEffect(() => {
        if (!threadId) return;
        setLoading(true);
        const unsubscribe = ChatService.subscribeToMessages(threadId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            setLoading(false);
            setTimeout(() => scrollToBottom(messages.length === 0 ? "auto" : "smooth"), 100);
        });
        return () => unsubscribe();
    }, [threadId]);

    // Typing indicator subscription
    useEffect(() => {
        if (!threadId || !currentUser?.id) return;
        const unsubscribe = ChatService.subscribeToTyping(threadId, (users) => {
            setTypingUsers(users.filter(id => id !== currentUser.id));
        });
        return () => unsubscribe();
    }, [threadId, currentUser?.id]);

    // Mark as read when viewing
    useEffect(() => {
        if (threadId && currentUser?.id && (thread?.unreadCount?.[currentUser.id] || 0) > 0) {
            ChatService.markAsRead(threadId, currentUser.id);
        }
    }, [threadId, currentUser?.id, thread?.unreadCount]);

    // Fetch Quick Replies
    useEffect(() => {
        const fetchQuickReplies = async () => {
            try {
                const snap = await getDocs(collection(db, 'quick_replies'));
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickReply));
                setQuickReplies(data);
            } catch (error) {
                console.error("Failed to fetch quick replies", error);
            }
        };
        fetchQuickReplies();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!threadId || !currentUser?.id) return;

        // Set typing to true
        ChatService.setTypingStatus(threadId, currentUser.id, true);

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to clear typing status after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            ChatService.setTypingStatus(threadId, currentUser.id, false);
        }, 3000);
    };

    if (!currentUser) return <div>Please log in</div>;
    if (!thread && !loading) {
        return (
            <div className="p-4 text-center min-h-screen bg-gray-50 dark:bg-slate-900">
                <p className="dark:text-white">Chat session not found.</p>
                <button onClick={() => navigate('/inbox')} className="text-rose-500 mt-2">Go back to Inbox</button>
            </div>
        );
    }

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const msg = newMessage.trim();
        if (msg) {
            // Immediate UI feedback & clear typing status
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (threadId && currentUser?.id) {
                ChatService.setTypingStatus(threadId, currentUser.id, false);
            }

            try {
                setNewMessage(''); // Optimistic clear
                await sendMessage(threadId!, msg);
            } catch (error) {
                setNewMessage(msg); // Restore on failure
                toast.error(language === 'en' ? "Failed to send message" : "বার্তা পাঠাতে ব্যর্থ হয়েছে");
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !threadId || !currentUser) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File is too large (Max 5MB)");
            return;
        }

        setUploading(true);
        const toastId = toast.loading("Uploading image...");

        try {
            const storageRef = ref(storage, `chat_attachments/${threadId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await ChatService.sendMessage(threadId, currentUser.id, downloadURL, 'image');
            toast.dismiss(toastId);
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload image", { id: toastId });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return '';
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp.toDate();
        return date.toLocaleTimeString(
            language === 'bn' ? 'bn-BD' : 'en-US',
            { hour: 'numeric', minute: 'numeric', hour12: true }
        );
    }

    const Avatar = ({ src, alt }: { src: any, alt: string }) => {
        if (src) {
            return <img src={src} alt={alt} className="w-8 h-8 rounded-full object-cover" />;
        }
        return (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-400" />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 safe-bottom">
            {/* Chat Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate('/inbox')} className="text-gray-500 hover:text-rose-500 transition-colors">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <div className="relative">
                        <Avatar src={participantAvatar} alt={participantName} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                    </div>
                    <div className="flex-grow min-w-0">
                        <h1 className="font-bold text-base text-gray-800 dark:text-gray-100 truncate">{participantName}</h1>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {vendorInfo ? (language === 'en' ? 'Vendor' : 'বিক্রেতা') : (language === 'en' ? 'Customer' : 'ক্রেতা')}
                        </p>
                    </div>
                </div>

                {/* Metadata Context Bar */}
                {(linkedProduct || linkedOrder || isFlightContext) && (
                    <div className="bg-gray-100 dark:bg-slate-700/50 px-4 py-2 flex items-center gap-3 border-t border-gray-200 dark:border-slate-700 animate-slide-down">
                        {linkedProduct ? (
                            <>
                                <img src={linkedProduct.images[0]} alt="" className="w-10 h-10 rounded object-cover shadow-sm" />
                                <div className="flex-grow min-w-0">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Inquiry About</p>
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{linkedProduct.name[language]}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/product/${linkedProduct.id}`)}
                                    className="text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 px-2 py-1 rounded-full font-bold"
                                >
                                    View
                                </button>
                            </>
                        ) : linkedOrder ? (
                            <>
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded flex items-center justify-center">
                                    <ShoppingBagIcon className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Order #{linkedOrder.id.slice(-6)}</p>
                                    <p className={`text-xs font-bold ${linkedOrder.status === 'Delivered' ? 'text-green-500' : 'text-blue-500'}`}>
                                        {linkedOrder.status}
                                    </p>
                                </div>
                            </>
                        ) : isFlightContext ? (
                            <>
                                <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/40 rounded flex items-center justify-center">
                                    <TicketIcon className="w-6 h-6 text-sky-500" />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Flight Inquiry</p>
                                    <p className="text-xs font-bold text-sky-600">
                                        {thread?.metadata?.id ? `Ref: ${thread.metadata.id.slice(-6)}` : 'New Request'}
                                    </p>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500 mb-2"></div>
                        <p className="text-xs dark:text-gray-400">Loading messages...</p>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="text-center py-10 opacity-60">
                                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm dark:text-gray-400">Send a message to start the conversation</p>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div key={message.id} className={`flex flex-col ${message.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                {message.metadata?.isAdminAction && (
                                    <div className="flex items-center gap-1 mb-1 ml-1">
                                        <ShieldCheckIcon className="w-3 h-3 text-rose-500" />
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Support Team</span>
                                    </div>
                                )}
                                <div className={`max-w-[85%] md:max-w-[70%] p-3 shadow-sm ${message.senderId === currentUser.id
                                    ? 'bg-rose-500 text-white rounded-2xl rounded-tr-none'
                                    : message.metadata?.isAdminAction
                                        ? 'bg-rose-50 dark:bg-rose-900/20 text-gray-800 dark:text-rose-100 border border-rose-200 dark:border-rose-800 rounded-2xl'
                                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none border border-gray-100 dark:border-slate-700'
                                    }`}>
                                    {message.type === 'image' ? (
                                        <div className="relative group">
                                            <img
                                                src={message.text}
                                                alt="Attachment"
                                                className="max-w-full rounded-lg max-h-60 object-cover border border-white/20"
                                                loading="lazy"
                                                onClick={() => window.open(message.text, '_blank')}
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                                    )}
                                    <div className={`flex items-center gap-1.5 mt-1.5 opacity-70 ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <p className="text-[10px]">
                                            {formatTimestamp(message.timestamp)}
                                        </p>
                                        {message.senderId === currentUser.id && message.seenBy && Object.keys(message.seenBy).length > 1 && (
                                            <span className="text-[9px] font-bold uppercase tracking-tighter bg-white/20 px-1 rounded">Seen</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-1 mb-2 animate-pulse">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                        <p className="text-[10px] italic text-gray-500 dark:text-gray-400">
                            {participantName} {language === 'en' ? 'is typing...' : 'টাইপ করছেন...'}
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
            </main>

            {/* Message Input & Quick Replies */}
            <footer className="bg-white dark:bg-slate-800 border-t dark:border-slate-700 p-3 pt-2">
                {/* Role-Based Predefined Messages / Quick Replies */}
                {(currentUser.role === 'vendor' || currentUser.role === 'delivery' || currentUser.role === 'admin') && (
                    <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar -mx-1 px-1">
                        {quickReplies
                            .filter(q => q.role === currentUser.role || (currentUser.role === 'admin' && q.role === 'admin'))
                            .map((q) => (
                                <button
                                    key={q.id}
                                    onClick={() => {
                                        sendMessage(threadId!, q.template[language]);
                                    }}
                                    className="whitespace-nowrap bg-gray-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-[10px] font-bold py-1.5 px-3 rounded-full border border-gray-200 dark:border-slate-600 transition-colors"
                                >
                                    {q.template[language]}
                                </button>
                            ))}
                        {/* Fallback default replies if none found */}
                        {quickReplies.length === 0 && [
                            { en: 'Order ready', bn: 'অর্ডার প্রস্তুত' },
                            { en: 'Picked up', bn: 'পিকড আপ' },
                            { en: 'Almost there', bn: 'কাছেই আছি' },
                            { en: 'Payment received', bn: 'পেমেন্ট পেয়েছি' },
                            { en: 'Ticket issued', bn: 'টিকিট ইস্যু করা হয়েছে' }
                        ].map((q, idx) => (
                            <button
                                key={`default-${idx}`}
                                onClick={() => {
                                    sendMessage(threadId!, q[language]);
                                }}
                                className="whitespace-nowrap bg-gray-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-[10px] font-bold py-1.5 px-3 rounded-full border border-gray-200 dark:border-slate-600 transition-colors"
                            >
                                {q[language]}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder={language === 'en' ? "Send a message..." : "বার্তা পাঠান..."}
                        className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-900/50 text-sm text-gray-800 dark:text-gray-100"
                    />

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <PaperClipIcon className="h-5 w-5" />
                    </button>

                    <button
                        type="submit"
                        disabled={!newMessage.trim() || uploading}
                        className="bg-rose-500 text-white rounded-xl p-2.5 hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        <PaperAirplaneIcon className="h-5 w-5 transform -rotate-45" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatPage;