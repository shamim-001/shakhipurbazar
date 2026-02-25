
import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { CategoryCommission, Language } from '../types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryService } from '../src/services/categoryService';
import { ProductService } from '../src/services/productService';
import { FeaturedSectionService } from '../src/services/featuredSectionService';
import { PencilIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, SparklesIcon } from '../components/icons';

interface SortableItemProps {
    id: UniqueIdentifier;
    children?: React.ReactNode;
    className?: string;
    handle?: boolean;
    key?: React.Key;
}

const SortableItem = ({ id, className, children, handle = false }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        touchAction: 'none'
    };

    return (
        <div ref={setNodeRef} style={style} className={className}>
            {handle ? (
                <div {...attributes} {...listeners} className="cursor-grab p-2 text-gray-400 hover:text-gray-600">
                    ⋮⋮
                </div>
            ) : (
                <div {...attributes} {...listeners} className="w-full h-full">
                    {children}
                </div>
            )}
            {handle && children}
        </div>
    );
};

const AdminCategoriesTab: React.FC = () => {
    const {
        language,
        categoryCommissions,
        addCategoryCommission,
        currentUser,
        logActivity,
        homepageSections
        // deleteCategoryCommission - Replacing with direct service call for transaction safety
    } = useApp();

    const categories = categoryCommissions;

    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [openSubcategories, setOpenSubcategories] = useState<{ [key: string]: boolean }>({});

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Forms
    const [newCategory, setNewCategory] = useState({ en: '', bn: '', commissionRate: 10, icon: '👽', type: 'vendor' as 'vendor' | 'reseller' | 'both' });
    const [editingCategory, setEditingCategory] = useState<CategoryCommission | null>(null);
    const [editFormData, setEditFormData] = useState({ en: '', bn: '', commissionRate: 0, icon: '', type: 'vendor' as 'vendor' | 'reseller' | 'both' });
    const [applyCommissionToSubs, setApplyCommissionToSubs] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const isSubcategory = (id: UniqueIdentifier) => String(id).startsWith('SUB::');

    const getDragInstruction = (id: UniqueIdentifier) => {
        const idStr = String(id);
        if (idStr.startsWith('SUB::')) {
            const parts = idStr.split('::');
            const parentId = parts[1];
            const subName = parts.slice(2).join('::');
            return { type: 'SUB', parentId, subName };
        }
        return { type: 'CAT', id: idStr };
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event: DragOverEvent) => {
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeInstruction = getDragInstruction(active.id);
        const overInstruction = getDragInstruction(over.id);

        if (activeInstruction.type === 'CAT' && overInstruction.type === 'CAT') {
            if (active.id !== over.id) {
                const oldIndex = categories.findIndex((c) => c.id === active.id);
                const newIndex = categories.findIndex((c) => c.id === over.id);
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newCategories = arrayMove(categories, oldIndex, newIndex);
                    // Use Transaction-based reorder
                    await CategoryService.reorderCategories(newCategories);
                }
            }
        }

        if (activeInstruction.type === 'SUB') {
            const sourceCat = categories.find(c => c.id === activeInstruction.parentId);
            if (!sourceCat) return;

            let destCatId = '';
            let targetIndex = -1;

            if (overInstruction.type === 'CAT') {
                destCatId = overInstruction.id;
                const destCat = categories.find(c => c.id === destCatId);
                targetIndex = destCat ? destCat.subCategories.length : 0;
            } else if (overInstruction.type === 'SUB') {
                destCatId = overInstruction.parentId;
                const destCat = categories.find(c => c.id === destCatId);
                if (destCat) {
                    targetIndex = destCat.subCategories.findIndex(s => s.name.en === overInstruction.subName);
                }
            }

            if (!destCatId) return;
            const destCat = categories.find(c => c.id === destCatId);
            if (!destCat) return;

            const movingSub = sourceCat.subCategories.find(s => s.name.en === activeInstruction.subName);
            if (!movingSub) return;

            let newSourceSubs = [...sourceCat.subCategories];
            let newDestSubs = sourceCat.id === destCat.id ? newSourceSubs : [...destCat.subCategories];

            const sourceIndex = newSourceSubs.findIndex(s => s.name.en === activeInstruction.subName);
            if (sourceIndex === -1) return;

            newSourceSubs.splice(sourceIndex, 1);

            if (sourceCat.id === destCat.id) {
                const oldIdx = sourceCat.subCategories.findIndex(s => s.name.en === activeInstruction.subName);
                const newIdxIndex = sourceCat.subCategories.findIndex(s => s.name.en === overInstruction.subName);
                if (oldIdx !== -1 && newIdxIndex !== -1 && oldIdx !== newIdxIndex) {
                    const reorderedSubs = arrayMove(sourceCat.subCategories, oldIdx, newIdxIndex);
                    await CategoryService.updateSubCategories(sourceCat.id, reorderedSubs);
                }
            } else {
                if (targetIndex >= 0) {
                    newDestSubs.splice(targetIndex, 0, movingSub);
                } else {
                    newDestSubs.push(movingSub);
                }
                await CategoryService.moveSubCategory(sourceCat.id, destCat.id, newSourceSubs, newDestSubs);
                setOpenSubcategories(prev => ({ ...prev, [destCat.id]: true }));
            }
        }
    };

    // --- Manual Reorder Handlers ---
    const handleMoveCategory = async (catId: string, direction: 'up' | 'down') => {
        const index = categories.findIndex(c => c.id === catId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const newCategories = arrayMove(categories, index, newIndex);
        await CategoryService.reorderCategories(newCategories);
    };

    // --- CRUD Handlers ---

    const handleAddCategory = async () => {
        if (!newCategory.en || !newCategory.bn) {
            alert("Please enter both English and Bengali names.");
            return;
        }

        const newCat: CategoryCommission = {
            id: `CAT-${Date.now()}`,
            category: { en: newCategory.en, bn: newCategory.bn },
            commissionRate: newCategory.commissionRate,
            isActive: true,
            icon: newCategory.icon || '👽',
            type: newCategory.type || 'vendor',
            subCategories: [],
            order: categories.length
        };

        try {
            await addCategoryCommission(newCat);
            setShowAddModal(false);
            setNewCategory({ en: '', bn: '', commissionRate: 10, icon: '👽', type: 'vendor' });
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Failed to add category");
        }
    };

    const handleEditCategory = (cat: CategoryCommission) => {
        setEditingCategory(cat);
        setEditFormData({
            en: cat.category.en,
            bn: cat.category.bn,
            commissionRate: cat.commissionRate,
            icon: cat.icon || '',
            type: cat.type || 'vendor'
        });
        setApplyCommissionToSubs(false);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editFormData.en || !editFormData.bn) return;

        const nameChanged = editingCategory.category.en !== editFormData.en;

        try {
            // Update Category Details
            await CategoryService.updateCategoryDetails(editingCategory.id, {
                category: { en: editFormData.en, bn: editFormData.bn },
                commissionRate: editFormData.commissionRate,
                icon: editFormData.icon,
                type: editFormData.type
            });

            // If name changed, cascade to all products in this category
            if (nameChanged) {
                await ProductService.updateProductCategory(editingCategory.category.en, {
                    en: editFormData.en,
                    bn: editFormData.bn
                });
            }

            setShowEditModal(false);
            setEditingCategory(null);
        } catch (error) {
            console.error("Error updating category:", error);
            alert("Failed to update category.");
        }
    };

    const handleDeleteCategory = async (cat: CategoryCommission) => {
        if (confirm(`Are you sure you want to delete "${cat.category.en}"? This will re-index remaining categories.`)) {
            try {
                // Use new service method with re-indexing
                await CategoryService.deleteCategory(cat.id);
            } catch (error) {
                console.error("Delete failed:", error);
                alert("Failed to delete category.");
            }
        }
    };

    // Subcategory Handlers
    const toggleSubcategories = (catId: string) => {
        setOpenSubcategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const toggleCategoryVisibility = async (catId: string, currentStatus: boolean) => {
        try {
            await CategoryService.updateCategoryDetails(catId, { isActive: !currentStatus });
        } catch (error) {
            console.error("Error toggling category visibility:", error);
        }
    };

    const toggleSubCategoryVisibility = async (catId: string, subId: string) => {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
            const newSubs = cat.subCategories.map(s =>
                s.id === subId ? { ...s, isActive: s.isActive === false ? true : false } : s
            );
            await CategoryService.updateSubCategories(catId, newSubs);
        }
    };

    const handleDeleteSubCategory = async (catId: string, subNameEn: string) => {
        if (confirm(`Delete subcategory "${subNameEn}"?`)) {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
                const newSubs = cat.subCategories.filter(s => s.name.en !== subNameEn);
                await CategoryService.updateSubCategories(catId, newSubs);
            }
        }
    };

    const handleEditSubCategory = async (catId: string, sub: { name: { en: string, bn: string } }) => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return;

        const newEn = prompt("Edit Subcategory Name (English):", sub.name.en);
        if (newEn === null) return;
        const newBn = prompt("Edit Subcategory Name (Bengali):", sub.name.bn);
        if (newBn === null) return;

        if (newEn && newBn) {
            const nameChanged = sub.name.en !== newEn;

            try {
                // Update in CategoryCommission
                const newSubs = cat.subCategories.map(s =>
                    s.name.en === sub.name.en ? { ...s, name: { en: newEn, bn: newBn } } : s
                );
                await CategoryService.updateSubCategories(catId, newSubs);

                // Cascade change to all products in this subcategory
                if (nameChanged) {
                    await ProductService.updateProductSubCategory(cat.category.en, sub.name.en, { en: newEn, bn: newBn });
                }
            } catch (error) {
                console.error("Error updating subcategory:", error);
                alert("Failed to update subcategory.");
            }
        }
    };

    const handleAddSubCategory = async (catId: string) => {
        const nameEn = prompt("Enter Subcategory Name (English):")?.trim();
        if (!nameEn) return;
        const nameBn = prompt("Enter Subcategory Name (Bengali):")?.trim();
        if (!nameBn) return;

        const cat = categories.find(c => c.id === catId);
        if (cat) {
            const newSub = {
                id: `SUB-${Date.now()}`,
                name: { en: nameEn, bn: nameBn },
                value: nameEn.toLowerCase().replace(/\s+/g, '-'),
                isActive: true
            };
            const newSubs = [...cat.subCategories, newSub];
            await CategoryService.updateSubCategories(catId, newSubs);
        }
    };

    const handlePinToHomepage = async (targetId: string, name: { en: string, bn: string }) => {
        const isPinned = homepageSections.some(s => s.targetCategoryId === targetId);
        if (isPinned) {
            if (confirm(`Are you sure you want to unpin "${name.en}" from the homepage?`)) {
                const section = homepageSections.find(s => s.targetCategoryId === targetId);
                if (section) {
                    await FeaturedSectionService.deleteSection(section.id);
                    logActivity('category.updated', {
                        type: 'category',
                        id: targetId,
                        name: name.en,
                        metadata: { action: 'unpinned_from_homepage' }
                    });
                }
            }
        } else {
            if (confirm(`Are you sure you want to pin "${name.en}" to the homepage?`)) {
                await FeaturedSectionService.addSection({
                    id: `SEC-${Date.now()}`,
                    title: name,
                    targetCategoryId: targetId,
                    priority: homepageSections.length,
                    isActive: true,
                    displayLimit: 8
                });
                logActivity('category.updated', {
                    type: 'category',
                    id: targetId,
                    name: name.en,
                    metadata: { action: 'pinned_to_homepage' }
                });
            }
        }
    };

    // --- Render Helpers ---
    const renderDragOverlay = () => {
        if (!activeId) return null;
        const activeInstruction = getDragInstruction(activeId);

        if (activeInstruction.type === 'CAT') {
            const cat = categories.find(c => c.id === activeId);
            return cat ? (
                <div className="bg-white dark:bg-slate-800 p-4 shadow-xl rounded border-2 border-indigo-500 flex justify-between items-center opacity-90 cursor-grabbing">
                    <span className="font-bold text-lg">{cat.category[language]}</span>
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{cat.subCategories.length} Subs</span>
                </div>
            ) : null;
        } else {
            return (
                <div className="bg-indigo-50 dark:bg-slate-700 p-2 shadow-lg rounded border border-indigo-300 w-64 opacity-90 cursor-grabbing">
                    {activeInstruction.subName}
                </div>
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Category Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag to reorder, click Edit to change details.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md flex items-center gap-2"
                >
                    <span>+</span> Add New Category
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden min-h-[500px]">
                    <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {categories.map((cat, index) => (
                                <SortableItem key={cat.id} id={cat.id} className="bg-white dark:bg-slate-800 transition-colors group">
                                    <div className="p-4 flex flex-col">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                {/* Drag Handle */}
                                                <SortableItem id={cat.id} handle={true} className="inline-block" />

                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                        <span className="text-2xl">{cat.icon || '👽'}</span>
                                                        {cat.category[language]}
                                                        <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                            {cat.commissionRate}% Comm.
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${cat.type === 'reseller' ? 'bg-purple-100 text-purple-700' :
                                                            cat.type === 'both' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {cat.type || 'vendor'}
                                                        </span>
                                                        {!cat.isActive && (
                                                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-bold">Hidden</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {cat.subCategories.length} Subcategories
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col mr-2">
                                                    <button
                                                        onClick={() => handleMoveCategory(cat.id, 'up')}
                                                        disabled={index === 0}
                                                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUpIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveCategory(cat.id, 'down')}
                                                        disabled={index === categories.length - 1}
                                                        className="text-gray-400 hover:text-indigo-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDownIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => toggleSubcategories(cat.id)}
                                                    className={`text-sm px-3 py-1 rounded transition-colors ${openSubcategories[cat.id] ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {openSubcategories[cat.id] ? 'Collapse' : 'Expand'}
                                                </button>
                                                <button
                                                    onClick={() => toggleCategoryVisibility(cat.id, cat.isActive)}
                                                    title={cat.isActive ? "Hide Category" : "Unhide Category"}
                                                    className={`p-1 transition-colors ${cat.isActive ? 'text-gray-400 hover:text-indigo-600' : 'text-red-500 hover:text-red-700'}`}
                                                >
                                                    {cat.isActive ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                                                </button>
                                                <button
                                                    onClick={() => handlePinToHomepage(cat.id, cat.category)}
                                                    title={homepageSections.some(s => s.targetCategoryId === cat.id) ? "Unpin from Homepage" : "Pin to Homepage"}
                                                    className={`p-1 transition-colors ${homepageSections.some(s => s.targetCategoryId === cat.id) ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                                                >
                                                    <SparklesIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleEditCategory(cat)} className="text-blue-600 hover:text-blue-800 p-1">Edit</button>
                                                <button onClick={() => handleDeleteCategory(cat)} className="text-red-600 hover:text-red-800 p-1">Delete</button>
                                            </div>
                                        </div>

                                        {/* subCategories List */}
                                        {openSubcategories[cat.id] && (
                                            <div className="ml-12 mt-3 pl-4 border-l-2 border-indigo-100 dark:border-slate-600">
                                                <SortableContext
                                                    items={cat.subCategories.map(sub => `SUB::${cat.id}::${sub.name.en}`)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    <div className="space-y-1">
                                                        {cat.subCategories.map((sub) => {
                                                            const subId = `SUB::${cat.id}::${sub.name.en}`;
                                                            return (
                                                                <SortableItem key={subId} id={subId} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 hover:border-indigo-300 transition-all">
                                                                    <div className='flex items-center gap-2'>
                                                                        <span className="text-gray-400 cursor-grab">⋮⋮</span>
                                                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                                            {sub.name[language]}
                                                                        </span>
                                                                    </div>
                                                                    <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                                                        <button
                                                                            onClick={() => handlePinToHomepage(`${cat.id}::${sub.name.en}`, sub.name)}
                                                                            title={homepageSections.some(s => s.targetCategoryId === `${cat.id}::${sub.name.en}`) ? "Unpin from Homepage" : "Pin to Homepage"}
                                                                            className={`p-1 transition-colors ${homepageSections.some(s => s.targetCategoryId === `${cat.id}::${sub.name.en}`) ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                                                                        >
                                                                            <SparklesIcon className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => toggleSubCategoryVisibility(cat.id, sub.id)}
                                                                            title={sub.isActive !== false ? "Hide Subcategory" : "Unhide Subcategory"}
                                                                            className={`text-xs ${sub.isActive !== false ? 'text-gray-400 hover:text-indigo-600' : 'text-red-500 hover:text-red-700'}`}
                                                                        >
                                                                            {sub.isActive !== false ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
                                                                        </button>
                                                                        <button onClick={() => handleEditSubCategory(cat.id, sub)} className="text-xs text-blue-500 hover:text-blue-700">Edit</button>
                                                                        <button onClick={() => handleDeleteSubCategory(cat.id, sub.name.en)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                                                    </div>
                                                                </SortableItem>
                                                            );
                                                        })}
                                                        {cat.subCategories.length === 0 && (
                                                            <div className="text-xs text-gray-400 italic py-2">No subcategories. Click below to add one.</div>
                                                        )}

                                                        <button
                                                            onClick={() => handleAddSubCategory(cat.id)}
                                                            className="mt-2 w-full py-2 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <span>+</span> Add Subcategory
                                                        </button>
                                                    </div>
                                                </SortableContext>
                                            </div>
                                        )}
                                    </div>
                                </SortableItem>
                            ))}
                        </div>
                    </SortableContext>
                </div>

                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                    {renderDragOverlay()}
                </DragOverlay>
            </DndContext>

            {/* Add/Edit Modals (unchanged logic) */}
            {/* ... (Modal JSX included in previous write steps) ... */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-700">
                        {/* ... Add Form ... */}
                        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2">Add New Category</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Name (English)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={newCategory.en} onChange={e => setNewCategory({ ...newCategory, en: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Name (Bengali)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={newCategory.bn} onChange={e => setNewCategory({ ...newCategory, bn: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Commission Rate (%)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" type="number" value={newCategory.commissionRate} onChange={e => setNewCategory({ ...newCategory, commissionRate: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Type</label>
                                <select
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    value={newCategory.type}
                                    onChange={e => setNewCategory({ ...newCategory, type: e.target.value as any })}
                                >
                                    <option value="vendor">Vendor (New Products)</option>
                                    <option value="reseller">Reseller (Used Items)</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Icon (Emoji, e.g. 👽)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={newCategory.icon} onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 border rounded-lg">Cancel</button>
                            <button onClick={handleAddCategory} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
                        </div>
                    </div>
                </div>
            )}
            {showEditModal && editingCategory && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-slate-700">
                        {/* ... Edit Form ... */}
                        <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-2">Edit Category</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Name (English)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={editFormData.en} onChange={e => setEditFormData({ ...editFormData, en: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Name (Bengali)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={editFormData.bn} onChange={e => setEditFormData({ ...editFormData, bn: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Commission Rate (%)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" type="number" value={editFormData.commissionRate} onChange={e => setEditFormData({ ...editFormData, commissionRate: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category Type</label>
                                <select
                                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                                    value={editFormData.type}
                                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value as any })}
                                >
                                    <option value="vendor">Vendor (New Products)</option>
                                    <option value="reseller">Reseller (Used Items)</option>
                                    <option value="both">Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Icon (Emoji, e.g. 👽)</label>
                                <input className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white" value={editFormData.icon} onChange={e => setEditFormData({ ...editFormData, icon: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="applySubs" checked={applyCommissionToSubs} onChange={e => setApplyCommissionToSubs(e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <label htmlFor="applySubs" className="text-sm text-gray-700 dark:text-gray-300">Apply this commission to all subcategories?</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 border rounded-lg">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoriesTab;
