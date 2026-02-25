import React, { useState, useEffect } from 'react';
import { useApp } from '../../src/context/AppContext';
import { ChatService } from '../../src/services/chatService';
import { ChatThread, ChatMessage, User } from '../../types';
import { TrashIcon, EyeIcon, UserIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon } from '../../components/icons';

const ChatModerationTab: React.FC = () => {
    const { language, chatThreads, users, vendors, currentUser } = useApp();
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const thread = chatThreads.find(t => t.id === selectedThreadId);

    useEffect(() => {
        if (selectedThreadId) {
            const unsubscribe = ChatService.subscribeToMessages(selectedThreadId, setMessages);
            return () => unsubscribe();
        }
    }, [selectedThreadId]);

    const filteredThreads = chatThreads.filter(t => {
        const participantNames = t.participantIds.map(id => users.find(u => u.id === id)?.name || '').join(' ').toLowerCase();
        return participantNames.includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getUserName = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user?.shopId) {
            const vendor = vendors.find(v => v.id === user.shopId);
            return vendor ? `${vendor.name[language]} (Vendor)` : user.name;
        }
        return user?.name || 'Unknown User';
    };

    return (
        <div className="flex h-[calc(100vh-250px)] gap-6 animate-fade-in">
            {/* Thread List */}
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b dark:border-slate-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Conversations</h3>
                    <input
                        type="text"
                        placeholder="Search threads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredThreads.map(t => (
                        <div
                            key={t.id}
                            onClick={() => setSelectedThreadId(t.id)}
                            className={`p-4 cursor-pointer border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedThreadId === t.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {t.participantIds.map(id => getUserName(id).split(' ')[0]).join(' & ')}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                    {t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString() : 'No date'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t.lastMessage || 'No messages'}</p>
                            <div className="mt-2 flex gap-1">
                                {t.productId && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">Product</span>}
                                {t.orderId && <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">Order</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden">
                {selectedThreadId ? (
                    <>
                        <div className="p-4 border-b dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Conversation Preview</h3>
                                <p className="text-[10px] text-gray-500">Thread ID: {selectedThreadId}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Block Users">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                </button>
                                <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors" title="Delete Archive">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 dark:bg-slate-900/10">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-gray-400">{getUserName(m.senderId)}</span>
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.senderId === currentUser?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-600 rounded-tl-none'}`}>
                                        <p className="text-sm">{m.text}</p>
                                        <p className="text-[9px] mt-1 opacity-60">
                                            {new Date(m.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <ChatBubbleLeftRightIcon className="w-20 h-20 mb-4 text-gray-300" />
                        <p className="text-gray-500">Select a conversation to moderate</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatModerationTab;
