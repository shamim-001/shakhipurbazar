import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { AdminRole, Permission } from '../types';

const RoleManagementTab = () => {
    const { adminRoles, createRole, updateRole, deleteRole, users } = useApp();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
    const [newRoleData, setNewRoleData] = useState({
        name: '',
        description: '',
        permissions: [] as Permission[]
    });

    // Permission categories for organized display
    const permissionGroups = {
        'Users': ['users.view', 'users.create', 'users.edit', 'users.delete'],
        'Vendors': ['vendors.view', 'vendors.approve', 'vendors.suspend'],
        'Drivers': ['drivers.view', 'drivers.approve', 'drivers.suspend'],
        'Agencies': ['agencies.view', 'agencies.approve', 'agencies.suspend'],
        'Orders': ['orders.view', 'orders.edit', 'orders.cancel'],
        'Products': ['products.view', 'products.approve', 'products.delete'],
        'Payouts': ['payouts.view', 'payouts.approve', 'payouts.reject', 'payouts.create'],
        'Categories': ['categories.view', 'categories.edit', 'categories.delete'],
        'Pages': ['pages.view', 'pages.edit', 'pages.create', 'pages.delete'],
        'Logistics': ['delivery.view', 'delivery.edit', 'dropshipping.view'],
        'Communications': ['chats.view', 'chats.edit', 'chats.delete'],
        'System': ['settings.view', 'settings.edit', 'health.view', 'logs.view', 'analytics.view'],
        'Marketing': ['promotions.view', 'promotions.edit', 'promotions.create'],
        'Roles': ['roles.view', 'roles.create', 'roles.edit', 'roles.delete']
    };

    const handleAddRole = () => {
        if (!newRoleData.name || newRoleData.permissions.length === 0) {
            alert('Role name and at least one permission are required.');
            return;
        }

        createRole({
            ...newRoleData,
            isSystemRole: false,
            createdBy: 'admin'
        });

        setShowAddModal(false);
        setNewRoleData({ name: '', description: '', permissions: [] });
    };

    const handleEditRole = () => {
        if (!selectedRole) return;

        updateRole(selectedRole.id, {
            name: selectedRole.name,
            description: selectedRole.description,
            permissions: selectedRole.permissions
        });

        setShowEditModal(false);
        setSelectedRole(null);
    };

    const togglePermission = (permission: Permission, isEdit: boolean = false) => {
        if (isEdit && selectedRole) {
            const perms = selectedRole.permissions.includes(permission)
                ? selectedRole.permissions.filter(p => p !== permission)
                : [...selectedRole.permissions, permission];
            setSelectedRole({ ...selectedRole, permissions: perms });
        } else {
            const perms = newRoleData.permissions.includes(permission)
                ? newRoleData.permissions.filter(p => p !== permission)
                : [...newRoleData.permissions, permission];
            setNewRoleData({ ...newRoleData, permissions: perms });
        }
    };

    const getUserCountByRole = (roleId: string) => {
        return users.filter(u => u.adminRole === roleId).length;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Role Management</h2>
                    <p className="text-gray-600 dark:text-gray-400">Manage admin roles and permissions</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Create Role
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminRoles.map(role => (
                    <div
                        key={role.id}
                        className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">{role.name}</h3>
                                {role.isSystemRole && (
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 mt-1">
                                        System Role
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {getUserCountByRole(role.id)} users
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{role.description}</p>

                        <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Permissions ({role.permissions.includes('*') ? 'All' : role.permissions.length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {role.permissions.includes('*') ? (
                                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                        All Permissions
                                    </span>
                                ) : (
                                    role.permissions.slice(0, 5).map(perm => (
                                        <span
                                            key={perm}
                                            className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                        >
                                            {perm.split('.')[0]}
                                        </span>
                                    ))
                                )}
                                {role.permissions.length > 5 && !role.permissions.includes('*') && (
                                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                        +{role.permissions.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {!role.isSystemRole && (
                                <>
                                    <button
                                        onClick={() => { setSelectedRole(role); setShowEditModal(true); }}
                                        className="flex-1 px-3 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteRole(role.id)}
                                        className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                            {role.isSystemRole && (
                                <button
                                    onClick={() => { setSelectedRole(role); setShowEditModal(true); }}
                                    className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    View Details
                                </button>
                            )}
                        </div>

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                            Created {new Date(role.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl my-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Create New Role</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name *</label>
                                <input
                                    type="text"
                                    value={newRoleData.name}
                                    onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="e.g., Content Manager"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={newRoleData.description}
                                    onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    rows={3}
                                    placeholder="Describe what this role can do..."
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions *</label>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {Object.entries(permissionGroups).map(([group, perms]) => (
                                    <div key={group} className="border dark:border-slate-600 rounded-lg p-4">
                                        <div className="font-semibold text-gray-800 dark:text-white mb-2">{group}</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {perms.map(perm => (
                                                <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newRoleData.permissions.includes(perm as Permission)}
                                                        onChange={() => togglePermission(perm as Permission)}
                                                        className="rounded text-indigo-600"
                                                    />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {perm.split('.')[1]}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowAddModal(false); setNewRoleData({ name: '', description: '', permissions: [] }); }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddRole}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Create Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {showEditModal && selectedRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl my-8">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                            {selectedRole.isSystemRole ? 'View Role' : 'Edit Role'}
                        </h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    value={selectedRole.name}
                                    onChange={(e) => !selectedRole.isSystemRole && setSelectedRole({ ...selectedRole, name: e.target.value })}
                                    disabled={selectedRole.isSystemRole}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:opacity-50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={selectedRole.description}
                                    onChange={(e) => !selectedRole.isSystemRole && setSelectedRole({ ...selectedRole, description: e.target.value })}
                                    disabled={selectedRole.isSystemRole}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:opacity-50"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Permissions</label>
                            {selectedRole.permissions.includes('*') ? (
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                                    <div className="text-purple-700 dark:text-purple-300 font-semibold">All Permissions Granted</div>
                                    <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">This role has access to everything in the system</div>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {Object.entries(permissionGroups).map(([group, perms]) => (
                                        <div key={group} className="border dark:border-slate-600 rounded-lg p-4">
                                            <div className="font-semibold text-gray-800 dark:text-white mb-2">{group}</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map(perm => (
                                                    <label key={perm} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRole.permissions.includes(perm as Permission)}
                                                            onChange={() => !selectedRole.isSystemRole && togglePermission(perm as Permission, true)}
                                                            disabled={selectedRole.isSystemRole}
                                                            className="rounded text-indigo-600 disabled:opacity-50"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {perm.split('.')[1]}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowEditModal(false); setSelectedRole(null); }}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                                Close
                            </button>
                            {!selectedRole.isSystemRole && (
                                <button
                                    onClick={handleEditRole}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoleManagementTab;
