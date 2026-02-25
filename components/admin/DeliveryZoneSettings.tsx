
import React, { useState } from 'react';
import { useApp } from '../../src/context/AppContext';
import { DeliveryZone } from '../../types';
import Modal from '../common/Modal';

const DeliveryZoneSettings: React.FC = () => {
    const { platformSettings, updatePlatformSettings } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

    // Form State
    const [nameEn, setNameEn] = useState('');
    const [nameBn, setNameBn] = useState('');
    const [fee, setFee] = useState('');
    const [isActive, setIsActive] = useState(true);

    const openAddModal = () => {
        setEditingZone(null);
        setNameEn('');
        setNameBn('');
        setFee('');
        setIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (zone: DeliveryZone) => {
        setEditingZone(zone);
        setNameEn(zone.name.en);
        setNameBn(zone.name.bn);
        setFee(zone.fee.toString());
        setIsActive(zone.isActive);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!nameEn || !nameBn || !fee) {
            alert("Please fill in all fields");
            return;
        }

        const feeAmount = Number(fee);
        if (isNaN(feeAmount)) {
            alert("Fee must be a number");
            return;
        }

        const zones = platformSettings.deliveryZones || [];
        let updatedZones;

        if (editingZone) {
            // Edit existing
            updatedZones = zones.map(z => z.id === editingZone.id ? {
                ...z,
                name: { en: nameEn, bn: nameBn },
                fee: feeAmount,
                isActive: isActive
            } : z);
        } else {
            // Add new
            const newZone: DeliveryZone = {
                id: `zone-${Date.now()}`,
                name: { en: nameEn, bn: nameBn },
                fee: feeAmount,
                isActive: isActive
            };
            updatedZones = [...zones, newZone];
        }

        updatePlatformSettings({
            ...platformSettings,
            deliveryZones: updatedZones
        });

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this zone?")) {
            const zones = platformSettings.deliveryZones || [];
            updatePlatformSettings({
                ...platformSettings,
                deliveryZones: zones.filter(z => z.id !== id)
            });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delivery Zones & Fees</h3>
                    <p className="text-sm text-gray-500">Manage location-based delivery pricing</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    + Add Zone
                </button>
            </div>

            <div className="mb-6 bg-gray-50 dark:bg-slate-900 rounded-lg overflow-hidden border dark:border-slate-700">
                <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-slate-800 border-b dark:border-slate-700">
                        <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Zone Name</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Fee</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {(platformSettings.deliveryZones || []).map(zone => (
                            <tr key={zone.id} className="hover:bg-gray-100 dark:hover:bg-slate-800/50">
                                <td className="py-3 px-4">
                                    <div className="font-medium text-gray-900 dark:text-white">{zone.name.en}</div>
                                    <div className="text-xs text-gray-500">{zone.name.bn}</div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="font-bold text-gray-900 dark:text-white">৳{zone.fee}</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {zone.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => openEditModal(zone)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 font-medium text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(zone.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 font-medium text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!platformSettings.deliveryZones || platformSettings.deliveryZones.length === 0) && (
                            <tr>
                                <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                                    No delivery zones configured. Click "+ Add Zone" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Free Delivery Threshold */}
            <div className="border-t dark:border-slate-700 pt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Free Delivery Threshold (Tk)
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="number"
                        value={platformSettings.freeDeliveryThreshold}
                        onChange={(e) => updatePlatformSettings({ ...platformSettings, freeDeliveryThreshold: Number(e.target.value) })}
                        className="w-full md:w-1/3 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <span className="text-xs text-gray-500">Orders above this amount get free delivery.</span>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone Name (English)</label>
                        <input
                            type="text"
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="e.g. Within City"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone Name (Bengali)</label>
                        <input
                            type="text"
                            value={nameBn}
                            onChange={(e) => setNameBn(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="e.g. শহরের ভিতরে"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Fee (Tk)</label>
                        <input
                            type="number"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            placeholder="50"
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            id="zone-active"
                            className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <label htmlFor="zone-active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 mt-4 border-t dark:border-slate-700">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            Save Zone
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DeliveryZoneSettings;
