import React, { useState, useEffect } from 'react';
import { useApp } from '../../src/context/AppContext';
import { db } from '../../src/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { QuickReply } from '../../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from '../../components/icons';

const QuickRepliesTab: React.FC = () => {
    const { language } = useApp();
    const [replies, setReplies] = useState<QuickReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newReply, setNewReply] = useState({
        role: 'vendor' as QuickReply['role'],
        en: '',
        bn: '',
        category: 'General'
    });

    useEffect(() => {
        fetchReplies();
    }, []);

    const fetchReplies = async () => {
        try {
            const snap = await getDocs(collection(db, 'quick_replies'));
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickReply));
            setReplies(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newReply.en || !newReply.bn) return;
        try {
            const docRef = await addDoc(collection(db, 'quick_replies'), {
                role: newReply.role,
                template: { en: newReply.en, bn: newReply.bn },
                category: newReply.category,
                createdAt: serverTimestamp()
            });
            setReplies([...replies, {
                id: docRef.id,
                role: newReply.role,
                template: { en: newReply.en, bn: newReply.bn },
                category: newReply.category
            }]);
            setIsAdding(false);
            setNewReply({ role: 'vendor', en: '', bn: '', category: 'General' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteDoc(doc(db, 'quick_replies', id));
            setReplies(replies.filter(r => r.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Reply Templates</h2>
                    <p className="text-sm text-gray-500">Manage predefined messages for Vendors and Delivery Riders</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create Template</span>
                </button>
            </div>

            {isAdding && (
                <div className="mb-8 p-6 bg-gray-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/30 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Target Role</label>
                            <select
                                value={newReply.role}
                                onChange={(e) => setNewReply({ ...newReply, role: e.target.value as any })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="vendor">Vendor</option>
                                <option value="delivery">Delivery Rider</option>
                                <option value="admin">Support/Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                            <input
                                placeholder="e.g. Greeting, Status Update"
                                value={newReply.category}
                                onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Template (English)</label>
                            <textarea
                                value={newReply.en}
                                onChange={(e) => setNewReply({ ...newReply, en: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Template (Bengali)</label>
                            <textarea
                                value={newReply.bn}
                                onChange={(e) => setNewReply({ ...newReply, bn: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-gray-500 font-medium">Cancel</button>
                        <button onClick={handleAdd} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Save Template</button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {['vendor', 'delivery', 'admin'].map(role => {
                    const roleReplies = replies.filter(r => r.role === role);
                    if (roleReplies.length === 0) return null;
                    return (
                        <div key={role}>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {role} Templates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {roleReplies.map(reply => (
                                    <div key={reply.id} className="group relative bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 p-4 rounded-xl hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] bg-white dark:bg-slate-800 text-gray-500 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-700">{reply.category}</span>
                                            <button onClick={() => handleDelete(reply.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">{reply.template.en}</p>
                                        <p className="text-sm text-gray-500 font-bn">{reply.template.bn}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {loading && (
                    <div className="text-center py-20 opacity-50">Loading templates...</div>
                )}
                {!loading && replies.length === 0 && (
                    <div className="text-center py-20 opacity-40">
                        <p>No quick reply templates found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickRepliesTab;
