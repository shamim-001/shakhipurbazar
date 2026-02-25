
import React, { useState, useEffect } from 'react';
import { useApp } from '../src/context/AppContext';
import { SupportService } from '../src/services/supportService';
import * as NotificationService from '../src/services/notificationService';
import { SupportTicket, FAQItem, SupportCategory } from '../types';
import { ChatBubbleLeftRightIcon, CheckCircleIcon, ClockIcon, TrashIcon, PlusIcon, ChevronRightIcon, UserIcon } from '../components/icons';
import toast from 'react-hot-toast';

const AdminSupportTab = () => {
    const { language, platformSettings, updatePlatformSettings } = useApp();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [activeTab, setActiveTab] = useState<'tickets' | 'faqs'>('tickets');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [reply, setReply] = useState('');

    useEffect(() => {
        const unsub = SupportService.subscribeToAllTickets(setTickets);
        return () => unsub();
    }, []);

    const handleStatusChange = async (ticketId: string, status: any) => {
        try {
            await SupportService.updateTicketStatus(ticketId, status);
            toast.success('Ticket status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !reply.trim()) return;
        try {
            await SupportService.addMessage(selectedTicket.id, {
                senderId: 'admin',
                senderName: 'Admin Support',
                content: reply,
                isAdmin: true
            });

            // Create Notification for the user
            await NotificationService.createNotification({
                userId: selectedTicket.userId, // Assuming userId exists on ticket ticket, based on previous inspection it seems user details are there
                title: { en: 'New Support Message', bn: 'নতুন সাপোর্ট মেসেজ' },
                body: { en: `Admin replied: ${reply.substring(0, 50)}...`, bn: `এডমিন রিপ্লাই দিয়েছে: ${reply.substring(0, 50)}...` },
                type: 'message',
                relatedId: selectedTicket.id,
                link: JSON.stringify({ name: 'Support', params: { ticketId: selectedTicket.id } }) // Adjust link structure as needed
            });

            setReply('');
            toast.success('Reply sent');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send reply');
        }
    };

    const handleAddFAQ = () => {
        const newFAQ: FAQItem = {
            id: `FAQ-${Date.now()}`,
            category: 'Help Center',
            question: { en: 'New Question', bn: 'নতুন প্রশ্ন' },
            answer: { en: 'New Answer', bn: 'নতুন উত্তর' }
        };
        const updatedFAQs = [...(platformSettings.faqs || []), newFAQ];
        updatePlatformSettings({ faqs: updatedFAQs });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Help & Support Management</h2>
                <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'tickets' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        Tickets ({tickets.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('faqs')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === 'faqs' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                    >
                        FAQs
                    </button>
                </div>
            </div>

            {activeTab === 'tickets' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedTicket?.id === ticket.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent bg-white dark:bg-slate-800 hover:border-gray-200'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.status === 'Open' ? 'bg-green-100 text-green-700' :
                                        ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="font-bold text-sm mb-1 dark:text-white truncate">{ticket.subject}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{ticket.userName}</p>
                            </div>
                        ))}
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col min-h-[500px]">
                        {selectedTicket ? (
                            <>
                                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">{selectedTicket.subject}</h3>
                                        <p className="text-sm text-gray-500">From: {selectedTicket.userName} | Category: {selectedTicket.category}</p>
                                    </div>
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                                        className="bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-lg text-sm p-2"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>

                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                        <p className="text-sm dark:text-gray-200">{selectedTicket.description}</p>
                                    </div>

                                    {selectedTicket.messages?.map(msg => (
                                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 dark:text-white'}`}>
                                                <p>{msg.content}</p>
                                                <span className="text-[10px] opacity-70 mt-1 block">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 border-t dark:border-slate-700 flex gap-2">
                                    <input
                                        type="text"
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 bg-gray-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
                                <ChatBubbleLeftRightIcon className="w-16 h-16 opacity-20 mb-4" />
                                <p>Select a ticket to view conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleAddFAQ}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
                        >
                            <PlusIcon className="w-5 h-5" /> Add FAQ
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {platformSettings.faqs?.map((faq, index) => (
                            <div key={faq.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-blue-600 uppercase">{faq.category}</span>
                                    <button
                                        onClick={() => {
                                            const updated = platformSettings.faqs.filter(f => f.id !== faq.id);
                                            updatePlatformSettings({ faqs: updated });
                                        }}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={faq.question.en}
                                    onChange={(e) => {
                                        const updated = [...platformSettings.faqs];
                                        updated[index].question.en = e.target.value;
                                        updatePlatformSettings({ faqs: updated });
                                    }}
                                    className="w-full font-bold mb-2 bg-transparent border-b dark:border-slate-700 focus:outline-none dark:text-white"
                                />
                                <textarea
                                    value={faq.answer.en}
                                    onChange={(e) => {
                                        const updated = [...platformSettings.faqs];
                                        updated[index].answer.en = e.target.value;
                                        updatePlatformSettings({ faqs: updated });
                                    }}
                                    className="w-full text-sm text-gray-500 dark:text-gray-400 bg-transparent focus:outline-none resize-none"
                                    rows={3}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupportTab;
