import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../src/context/AppContext';
import { ChatService } from '../../src/services/chatService';
import { ChatThread, ChatMessage, User, Vendor } from '../../types';
import {
    TrashIcon, EyeIcon, UserIcon, ShieldCheckIcon,
    ChatBubbleLeftRightIcon, MagnifyingGlassIcon,
    FunnelIcon, PaperAirplaneIcon, BookmarkIcon,
    ExclamationTriangleIcon, BoltIcon, TagIcon, LifebuoyIcon
} from '../../components/icons';
import toast from 'react-hot-toast';

const AdminChatHubTab: React.FC = () => {
    const { language, chatThreads, users, vendors, currentUser } = useApp();
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<'all' | 'order' | 'product' | 'support'>('all');
    const [adminMessage, setAdminMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const thread = chatThreads.find(t => t.id === selectedThreadId);

    useEffect(() => {
        if (selectedThreadId) {
            const unsubscribe = ChatService.subscribeToMessages(selectedThreadId, setMessages);
            return () => unsubscribe();
        }
    }, [selectedThreadId]);

    const getUserDetails = (userId: string) => {
        const user = users.find(u => u.id === userId);
        const vendor = vendors.find(v => v.id === user?.shopId);
        return { user, vendor };
    };

    const getUserName = (userId: string) => {
        const { user, vendor } = getUserDetails(userId);
        if (vendor) return `${vendor.name[language]} (Vendor)`;
        return user?.name || 'Unknown User';
    };

    const filteredThreads = useMemo(() => {
        return chatThreads.filter(t => {
            const participantNames = t.participantIds.map(id => getUserName(id).toLowerCase()).join(' ');
            const matchesSearch = participantNames.includes(searchTerm.toLowerCase()) ||
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = activeCategory === 'all' ||
                (activeCategory === 'order' && (t.orderId || t.contextType === 'order')) ||
                (activeCategory === 'product' && (t.productId || t.contextType === 'product')) ||
                (activeCategory === 'support' && (t.contextType === 'support' || (t.participantIds.includes('support_center') && !t.orderId && !t.productId)));

            return matchesSearch && matchesCategory;
        });
    }, [chatThreads, searchTerm, activeCategory, users, vendors, language]);

    const handleSendMessage = async () => {
        if (!selectedThreadId || !adminMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            await ChatService.sendMessage(selectedThreadId, currentUser!.id, adminMessage, 'system', {
                isAdminAction: true,
                senderName: "Platform Admin"
            });
            setAdminMessage('');
            toast.success("Message sent as Admin");
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-250px)] gap-6 animate-fade-in bg-gray-50/50 dark:bg-slate-900/50 p-6 rounded-3xl">
            {/* Sidebar: Thread List */}
            <div className="w-80 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-5 border-b dark:border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-gray-900 dark:text-white tracking-tight">Active Channels</h3>
                        <span className="bg-sky-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{filteredThreads.length}</span>
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {(['all', 'order', 'product', 'support'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat
                                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-200 dark:shadow-none'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredThreads.length > 0 ? (
                        filteredThreads.map(t => {
                            const isSupport = t.contextType === 'support' || t.participantIds.includes('support_center');
                            const subject = t.subject || t.metadata?.subject;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedThreadId(t.id)}
                                    className={`p-4 cursor-pointer border-b dark:border-slate-700 transition-all ${selectedThreadId === t.id
                                        ? 'bg-sky-50/80 dark:bg-sky-900/20 border-l-4 border-l-sky-500'
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isSupport ? (
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <LifebuoyIcon className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                                                    {t.participantIds[0]?.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-800 dark:text-gray-200 truncate pr-2">
                                                    {isSupport ? (language === 'en' ? 'Support Center' : 'সাপোর্ট সেন্টার') : t.participantIds.map(id => getUserName(id).split(' ')[0]).join(' & ')}
                                                </p>
                                                <span className="text-[9px] text-gray-400 block truncate">
                                                    {isSupport && subject ? subject : (t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {isSupport && <LifebuoyIcon className="w-3 h-3 text-blue-500" />}
                                            {t.orderId && <TagIcon className="w-3 h-3 text-sky-500" />}
                                            {t.productId && <BoltIcon className="w-3 h-3 text-amber-500" />}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate pl-10">
                                        {t.lastMessage || (isSupport ? 'Support request opened...' : 'Channel established...')}
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center p-10 opacity-30">
                            <MagnifyingGlassIcon className="w-10 h-10 mb-2" />
                            <p className="text-xs font-bold">No results found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content: Chat View & Intervention */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden relative">
                {selectedThreadId ? (
                    <>
                        {/* Header */}
                        <div className="p-5 border-b dark:border-slate-700 bg-gray-50/30 dark:bg-slate-700/30 flex justify-between items-center backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                                    <ShieldCheckIcon className="w-6 h-6 text-sky-600" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Live Monitor</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <p className="text-[10px] text-gray-500 font-mono">{selectedThreadId}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="p-2.5 text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:scale-110 transition-transform" title="Flag Conversation">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:scale-110 transition-transform" title="Terminate Channel">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Message Feed */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/10 dark:bg-slate-900/10 custom-scrollbar">
                            <div className="flex justify-center mb-8">
                                <span className="bg-gray-100 dark:bg-slate-700 text-[10px] px-4 py-1.5 rounded-full font-black text-gray-500 uppercase tracking-widest border dark:border-slate-600">
                                    End-to-End Encrypted Monitoring
                                </span>
                            </div>
                            {messages.map((m, i) => {
                                const isPlatformAdmin = m.metadata?.isAdminAction;
                                return (
                                    <div key={i} className={`flex flex-col ${m.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${isPlatformAdmin ? 'text-rose-500' : 'text-gray-400'}`}>
                                                {isPlatformAdmin ? 'SYSTEM ADMIN' : getUserName(m.senderId)}
                                            </span>
                                            <span className="text-[8px] text-gray-300">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm relative group overflow-hidden ${isPlatformAdmin
                                            ? 'bg-rose-500 text-white rounded-tr-none border-2 border-rose-400 shadow-rose-200'
                                            : m.senderId === currentUser?.id
                                                ? 'bg-sky-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-600 rounded-tl-none shadow-gray-100'
                                            }`}>
                                            <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                                            {isPlatformAdmin && (
                                                <div className="absolute top-0 right-0 p-1">
                                                    <ShieldCheckIcon className="w-3 h-3 opacity-50" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Admin Intervention Panel */}
                        <div className="p-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <BoltIcon className="w-4 h-4 text-rose-500" />
                                    <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Admin Voice Activated</span>
                                </div>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={adminMessage}
                                            onChange={(e) => setAdminMessage(e.target.value)}
                                            placeholder="Broadcast support message to participants..."
                                            rows={2}
                                            className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all pr-12 resize-none"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!adminMessage.trim() || isSending}
                                            className="absolute bottom-4 right-4 p-2 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                        >
                                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-400 italic">
                                    Admin messages are visible to all participants and marked as "Platform Admin".
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="w-32 h-32 bg-sky-50 dark:bg-sky-900/10 rounded-full flex items-center justify-center animate-pulse">
                            <ChatBubbleLeftRightIcon className="w-16 h-16 text-sky-200 dark:text-sky-800" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-xl font-black text-gray-300 uppercase tracking-widest">Select Frequency</h4>
                            <p className="text-xs text-gray-400 font-medium">Monitoring station ready for input</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChatHubTab;
