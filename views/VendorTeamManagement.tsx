import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { User } from '../types';
import { UserGroupIcon, PlusIcon, TrashIcon, PencilIcon, XIcon } from '../components/icons';

const VendorTeamManagement: React.FC<{ vendorId: string }> = ({ vendorId }) => {
    const { language, users, createAdminUser, updateUserById, deleteUserById, currentUser } = useApp();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // New user form state
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'vendor' as User['role'],
        address: '',
        password: ''
    });

    // Get vendor's team members - Filter strictly and exclude customers for safety
    const vendorTeam = React.useMemo(() => {
        if (!vendorId) return [];
        return users.filter(u => (u.shopId === vendorId || u.employerVendorId === vendorId) && u.role !== 'customer');
    }, [users, vendorId]);

    const content = {
        en: {
            title: 'Team Management',
            subtitle: 'Manage your shop staff and assign roles',
            addUser: 'Add Team Member',
            teamMembers: 'Team Members',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            role: 'Role',
            address: 'Address',
            password: 'Password',
            actions: 'Actions',
            cancel: 'Cancel',
            save: 'Save',
            create: 'Create User',
            edit: 'Edit User',
            delete: 'Delete',
            noTeam: 'No team members yet. Add your first team member!',
            roles: {
                vendor: 'Vendor/Manager',
                staff: 'Staff Member',
                delivery: 'Delivery Person'
            }
        },
        bn: {
            title: 'টিম ব্যবস্থাপনা',
            subtitle: 'আপনার দোকানের কর্মীদের পরিচালনা করুন এবং ভূমিকা নির্ধারণ করুন',
            addUser: 'টিম সদস্য যোগ করুন',
            teamMembers: 'টিম সদস্যরা',
            name: 'নাম',
            email: 'ইমেইল',
            phone: 'ফোন',
            role: 'ভূমিকা',
            address: 'ঠিকানা',
            password: 'পাসওয়ার্ড',
            actions: 'ক্রিয়া',
            cancel: 'বাতিল',
            save: 'সংরক্ষণ',
            create: 'ব্যবহারকারী তৈরি করুন',
            edit: 'ব্যবহারকারী সম্পাদনা',
            delete: 'মুছুন',
            noTeam: 'এখনও কোন টিম সদস্য নেই। আপনার প্রথম টিম সদস্য যোগ করুন!',
            roles: {
                vendor: 'বিক্রেতা/ম্যানেজার',
                staff: 'স্টাফ সদস্য',
                delivery: 'ডেলিভারি ব্যক্তি'
            }
        }
    };

    const t = content[language];

    const handleCreateUser = () => {
        if (!newUser.name || !newUser.email || !newUser.phone) {
            alert(language === 'en' ? 'Please fill all required fields' : 'সমস্ত প্রয়োজনীয় ক্ষেত্র পূরণ করুন');
            return;
        }

        const userData: Omit<User, 'id' | 'walletBalance'> = {
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            address: newUser.address,
            shopId: vendorId, // Link to this vendor
            employerVendorId: vendorId, // Track who employs them
            status: 'active',
            createdAt: new Date().toISOString()
        };

        createAdminUser(userData);
        setShowAddModal(false);
        setNewUser({
            name: '',
            email: '',
            phone: '',
            role: 'vendor',
            address: '',
            password: ''
        });
    };

    const handleUpdateUser = () => {
        if (!editingUser) return;
        updateUserById(editingUser.id, editingUser);
        setEditingUser(null);
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm(language === 'en' ? 'Are you sure you want to remove this team member?' : 'আপনি কি এই টিম সদস্যকে সরাতে চান?')) {
            deleteUserById(userId);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="h-7 w-7 text-rose-500" />
                        {t.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.subtitle}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    {t.addUser}
                </button>
            </div>

            {/* Team Members Table */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                {vendorTeam.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        <UserGroupIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p>{t.noTeam}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.name}</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.email}</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.phone}</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.role}</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                {vendorTeam.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{member.name}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{member.email}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{member.phone}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                member.role === 'vendor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                }`}>
                                                {t.roles[member.role as keyof typeof t.roles] || member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingUser(member)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title={t.edit}
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                {member.id !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(member.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title={t.delete}
                                                    >
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.create}</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <XIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.phone}</label>
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="01XXXXXXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User['role'] })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="vendor">{t.roles.vendor}</option>
                                    <option value="staff">{t.roles.staff}</option>
                                    <option value="delivery">{t.roles.delivery}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.address}</label>
                                <input
                                    type="text"
                                    value={newUser.address}
                                    onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                    placeholder="Complete address"
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleCreateUser}
                                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg"
                            >
                                {t.create}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t.edit}</h3>
                            <button onClick={() => setEditingUser(null)}>
                                <XIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.name}</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.email}</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.phone}</label>
                                <input
                                    type="tel"
                                    value={editingUser.phone}
                                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.role}</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as User['role'] })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="vendor">{t.roles.vendor}</option>
                                    <option value="staff">{t.roles.staff}</option>
                                    <option value="delivery">{t.roles.delivery}</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t dark:border-slate-700 flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg"
                            >
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorTeamManagement;
