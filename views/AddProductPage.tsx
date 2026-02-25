import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { ImageService } from '../src/services/imageService';
import { Product } from '../types';
import { ChevronLeftIcon, XIcon, PlusIcon, TrashIcon, ArrowUpOnSquareIcon, ArchiveBoxIcon } from '../components/icons';
import { storage, db } from '../src/lib/firebase'; // Static import
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Static import
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface AddProductPageProps {
    productToEdit?: Product;
}

const AddProductPage: React.FC<AddProductPageProps> = ({ productToEdit: initialProduct }) => {
    const { language, currentUser, addProduct, updateProduct, categoryCommissions } = useApp();
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const location = useLocation();
    const forcedType = new URLSearchParams(location.search).get('type') as 'new' | 'wholesale' | 'resell' | null;

    const [productToEdit, setProductToEdit] = useState<Product | undefined>(initialProduct);
    const [isEditing, setIsEditing] = useState(!!initialProduct);
    const [isLoading, setIsLoading] = useState(!!productId && !initialProduct);
    const [isUploading, setIsUploading] = useState(false);

    const [formState, setFormState] = useState({
        name: { en: '', bn: '' },
        category: { en: 'Restaurant', bn: 'রেস্তোরাঁ' },
        subCategory: { en: '', bn: '' },
        price: 0,
        stock: 0,
        description: { en: '', bn: '' },
        images: [] as string[],
        videoUrl: '',
        customizations: [] as any[],
        productType: 'new',
        wholesaleEnabled: false,
        minOrderQuantity: 1,
        wholesalePrice: 0,
        condition: 'Like New',
        negotiable: false,
        authenticityVerified: false,
        colorOptions: [] as string[],
        sizeOptions: [] as string[],
        isPreorder: false,
        preorderReleaseDate: '',
        preorderNote: '',
    });

    // Initialize productType from URL if available and not editing
    useEffect(() => {
        if (!isEditing && forcedType && (forcedType === 'new' || forcedType === 'wholesale' || forcedType === 'resell')) {
            setFormState(prev => ({ ...prev, productType: forcedType }));
        }
    }, [forcedType, isEditing]);

    // Fetch product/draft if ID is in URL but not passed via props
    useEffect(() => {
        const fetchData = async () => {
            if (productId && !initialProduct) {
                setIsLoading(true);
                try {
                    // Try products collection first
                    let docRef = doc(db, 'products', productId);
                    let docSnap = await getDoc(docRef);

                    // If not in products, try product_drafts
                    if (!docSnap.exists()) {
                        docRef = doc(db, 'product_drafts', productId);
                        docSnap = await getDoc(docRef);
                    }

                    if (docSnap.exists()) {
                        const data = { id: docSnap.id, ...docSnap.data() } as Product;
                        setProductToEdit(data);
                        setIsEditing(true);
                        setFormState({
                            name: data.name || { en: '', bn: '' },
                            category: data.category || { en: 'Restaurant', bn: 'রেস্তোরাঁ' },
                            subCategory: data.subCategory || { en: '', bn: '' },
                            price: data.price || 0,
                            stock: data.stock || 0,
                            description: data.description || { en: '', bn: '' },
                            images: data.images || [],
                            videoUrl: data.videoUrl || '',
                            customizations: data.customizations || [],
                            productType: data.productType || 'new',
                            wholesaleEnabled: data.wholesaleEnabled || false,
                            minOrderQuantity: data.minOrderQuantity || 1,
                            wholesalePrice: data.wholesalePrice || 0,
                            condition: data.condition || 'Like New',
                            negotiable: data.negotiable || false,
                            authenticityVerified: data.authenticityVerified || false,
                            colorOptions: data.colorOptions || [],
                            sizeOptions: data.sizeOptions || [],
                            isPreorder: data.isPreorder || false,
                            preorderReleaseDate: data.preorderReleaseDate || '',
                            preorderNote: data.preorderNote || '',
                        });
                    } else {
                        toast.error("Product or Draft not found");
                    }
                } catch (error) {
                    console.error("Error fetching product:", error);
                    toast.error("Failed to load data");
                } finally {
                    setIsLoading(false);
                }
            } else if (initialProduct) {
                // If initialProduct is provided, sync form state
                setFormState({
                    name: initialProduct.name,
                    category: initialProduct.category,
                    subCategory: initialProduct.subCategory || { en: '', bn: '' },
                    price: initialProduct.price,
                    stock: initialProduct.stock,
                    description: initialProduct.description,
                    images: initialProduct.images,
                    videoUrl: initialProduct.videoUrl || '',
                    customizations: initialProduct.customizations || [],
                    productType: initialProduct.productType,
                    wholesaleEnabled: initialProduct.wholesaleEnabled || false,
                    minOrderQuantity: initialProduct.minOrderQuantity || 1,
                    wholesalePrice: initialProduct.wholesalePrice || 0,
                    condition: initialProduct.condition || 'Like New',
                    negotiable: initialProduct.negotiable || false,
                    authenticityVerified: initialProduct.authenticityVerified || false,
                    colorOptions: initialProduct.colorOptions || [],
                    sizeOptions: initialProduct.sizeOptions || [],
                    isPreorder: initialProduct.isPreorder || false,
                    preorderReleaseDate: initialProduct.preorderReleaseDate || '',
                    preorderNote: initialProduct.preorderNote || '',
                });
            }
        };

        fetchData();
    }, [productId, initialProduct]);

    const categories = useMemo(() => {
        return categoryCommissions
            .filter(cat => {
                if (!cat.isActive) return false;
                // If type is not set, assume it's for vendors (backward compatibility)
                const catType = cat.type || 'vendor';
                if (formState.productType === 'resell') {
                    return catType === 'reseller' || catType === 'both';
                } else {
                    return catType === 'vendor' || catType === 'both';
                }
            })
            .map(cat => cat.category);
    }, [categoryCommissions, formState.productType]);

    const allSubCategories = useMemo(() => {
        // Flatten all subcategories with parent reference, also filtered by type
        const all: { en: string; bn: string; parentEn: string }[] = [];
        categoryCommissions.forEach(cat => {
            if (!cat.isActive) return;

            // Check if this category matches current product type
            const catType = cat.type || 'vendor';
            const isMatch = (formState.productType === 'resell')
                ? (catType === 'reseller' || catType === 'both')
                : (catType === 'vendor' || catType === 'both');

            if (isMatch && cat.subCategories) {
                cat.subCategories.forEach(sub => {
                    all.push({
                        en: sub.name?.en || (sub as any).en || '',
                        bn: sub.name?.bn || (sub as any).bn || '',
                        parentEn: cat.category.en
                    });
                });
            }
        });
        return all;
    }, [categoryCommissions, formState.productType]);

    const availableSubCategories = useMemo(() => {
        if (!formState.category.en) return allSubCategories;
        return allSubCategories.filter(sub => sub.parentEn === formState.category.en);
    }, [allSubCategories, formState.category.en]);

    // Auto-match parent category when subcategory selected
    useEffect(() => {
        if (formState.subCategory.en && !formState.category.en) {
            const match = allSubCategories.find(s => s.en === formState.subCategory.en);
            if (match) {
                const parent = categoryCommissions.find(c => c.category.en === match.parentEn);
                if (parent) {
                    setFormState(prev => ({ ...prev, category: parent.category }));
                    toast.success(`Category auto-matched: ${parent.category.en}`);
                }
            }
        }
    }, [formState.subCategory.en, allSubCategories, categoryCommissions, formState.category.en]);

    const handleInputChange = (field: 'name' | 'description', lang: 'en' | 'bn', value: any) => {
        setFormState(prev => ({
            ...prev,
            [field]: { ...prev[field], [lang]: value }
        }));
    };

    const handleSimpleChange = (field: keyof typeof formState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }

    // Customizations handlers
    const addCustomizationGroup = () => {
        const newGroup = { title: { en: '', bn: '' }, type: 'single' as 'single' | 'multiple', options: [] };
        handleSimpleChange('customizations', [...formState.customizations, newGroup]);
    };

    const updateCustomizationGroup = (index: number, field: 'title' | 'type', value: any, lang?: 'en' | 'bn') => {
        const newCustoms = [...formState.customizations];
        if (field === 'title' && lang) {
            newCustoms[index].title[lang] = value;
        } else {
            (newCustoms[index] as any)[field] = value;
        }
        handleSimpleChange('customizations', newCustoms);
    };

    const removeCustomizationGroup = (index: number) => {
        const newCustoms = formState.customizations.filter((_, i) => i !== index);
        handleSimpleChange('customizations', newCustoms);
    };

    const addCustomizationOption = (groupIndex: number) => {
        const newCustoms = [...formState.customizations];
        newCustoms[groupIndex].options.push({ en: '', bn: '', priceModifier: 0 });
        handleSimpleChange('customizations', newCustoms);
    };

    const updateCustomizationOption = (groupIndex: number, optionIndex: number, field: 'en' | 'bn' | 'priceModifier', value: string | number) => {
        const newCustoms = [...formState.customizations];
        (newCustoms[groupIndex].options[optionIndex] as any)[field] = value;
        handleSimpleChange('customizations', newCustoms);
    };

    const removeCustomizationOption = (groupIndex: number, optionIndex: number) => {
        const newCustoms = [...formState.customizations];
        newCustoms[groupIndex].options = newCustoms[groupIndex].options.filter((_, i) => i !== optionIndex);
        handleSimpleChange('customizations', newCustoms);
    };

    const [isSaving, setIsSaving] = useState(false);

    const navigateToDashboard = () => {
        if (formState.productType === 'resell') {
            navigate('/reseller-dashboard');
        } else if (currentUser?.role === 'vendor') {
            navigate('/vendor-dashboard');
        } else if (currentUser?.role === 'agency') {
            navigate('/agency-dashboard');
        } else if (currentUser?.role === 'driver') {
            navigate('/rider-dashboard');
        } else {
            navigate(-1); // Fallback to previous page
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        // Basic validation
        if (!formState.name.en) {
            toast.error(language === 'en' ? 'Product name is required.' : 'পণ্যের নাম প্রয়োজন।');
            return;
        }
        if (formState.price <= 0) {
            toast.error(language === 'en' ? 'Price must be greater than 0.' : 'দাম ০ এর বেশি হতে হবে।');
            return;
        }
        if (formState.images.length === 0) {
            toast.error(language === 'en' ? 'Please upload at least one image.' : 'অনুগ্রহ করে অন্তত একটি ছবি আপলোড করুন।');
            return;
        }

        const effectiveVendorId = (formState.productType === 'resell' ? undefined : (currentUser?.shopId || (currentUser?.role === 'vendor' ? currentUser?.id : '') || currentUser?.driverId || currentUser?.deliveryManId || currentUser?.agencyId || currentUser?.employerVendorId || ''));

        if (formState.productType !== 'resell' && !effectiveVendorId && currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
            toast.error(language === 'en' ? 'Vendor Profile Error: Missing Shop ID.' : 'ভেন্ডর প্রোফাইল ত্রুটি: শপ আইডি নেই।');
            return;
        }

        setIsSaving(true);
        try {
            const isDraft = productToEdit?.status === 'draft';
            const isAdmin = currentUser?.role === 'admin';
            const isSuperAdmin = currentUser?.role === 'super_admin';

            const rawProduct: Product = {
                id: (isEditing && !isDraft) ? productToEdit.id : `P${Date.now()}`, // Generate new ID if draft
                name: formState.name,
                category: formState.category,
                subCategory: formState.subCategory.en ? { en: formState.subCategory.en, bn: formState.subCategory.bn } : undefined,
                price: Number(formState.price),
                stock: Number(formState.stock),
                vendorId: (formState.productType === 'resell' ? undefined : (currentUser?.shopId || (currentUser?.role === 'vendor' ? currentUser?.id : '') || currentUser?.driverId || currentUser?.deliveryManId || currentUser?.agencyId || currentUser?.employerVendorId || '')),
                sellerId: formState.productType === 'resell' ? currentUser?.id : undefined,
                rating: (isEditing && !isDraft) ? productToEdit.rating : 0,
                description: formState.description,
                images: formState.images, // Validated above
                videoUrl: formState.videoUrl,
                productType: formState.productType as any,
                customizations: formState.customizations,
                status: (isEditing && !isDraft) ? productToEdit.status : 'Pending', // Default to pending for new/draft-submitted
                // Wholesale
                wholesaleEnabled: formState.wholesaleEnabled,
                minOrderQuantity: formState.wholesaleEnabled ? Number(formState.minOrderQuantity) : undefined,
                wholesalePrice: formState.wholesaleEnabled ? Number(formState.wholesalePrice) : undefined,
                // Resell
                condition: formState.productType === 'resell' ? formState.condition as any : undefined,
                negotiable: formState.productType === 'resell' ? formState.negotiable : undefined,
                authenticityVerified: (isAdmin || isSuperAdmin) ? formState.authenticityVerified : (productToEdit?.authenticityVerified || false),
                colorOptions: formState.colorOptions,
                sizeOptions: formState.sizeOptions,
                isPreorder: formState.isPreorder,
                preorderReleaseDate: formState.isPreorder ? formState.preorderReleaseDate : undefined,
                preorderNote: formState.isPreorder ? formState.preorderNote : undefined,
            };

            // Enforce Resell Stock: 1
            if (rawProduct.productType === 'resell') {
                rawProduct.stock = 1;
            }

            // Remove undefined values to prevent Firestore errors
            const finalProduct = JSON.parse(JSON.stringify(rawProduct));

            // Saving product data

            if (isEditing && !isDraft) {
                // RISK-BASED APPROVAL SYSTEM:
                if (productToEdit.status === 'Approved') {
                    const pendingChanges: Partial<Product> = {
                        ...finalProduct,
                        id: productToEdit.id,
                        status: 'Approved',
                    };

                    await updateProduct({
                        ...productToEdit,
                        pendingChanges: finalProduct,
                        approvalStatus: 'pending_review',
                        lastRiskCheck: new Date().toISOString()
                    });

                    toast.success(language === 'en'
                        ? 'Changes submitted for review. Your product remains live.'
                        : 'পরিবর্তনগুলি পর্যালোচনার জন্য জমা দেওয়া হয়েছে।');
                } else {
                    await updateProduct(finalProduct);
                    toast.success(language === 'en' ? 'Product saved successfully!' : 'পণ্যটি সফলভাবে সংরক্ষিত হয়েছে!');
                }
            } else {
                // New Product OR Draft Submission
                await addProduct(finalProduct);

                if (isDraft) {
                    await deleteDoc(doc(db, 'product_drafts', productToEdit.id));
                    toast.success("Draft submitted and deleted!");
                } else {
                    toast.success(language === 'en' ? 'Product saved successfully!' : 'পণ্যটি সফলভাবে সংরক্ষিত হয়েছে!');
                }
            }
            // Navigate back
            setTimeout(() => navigateToDashboard(), 1000);
        } catch (error: any) {
            console.error("Failed to save product:", error);
            toast.error(language === 'en'
                ? `Failed to save product: ${error.message || 'Unknown error'}`
                : `পণ্য সংরক্ষণ করতে ব্যর্থ হয়েছে: ${error.message || 'অজানা ত্রুটি'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!formState.name.en) {
            toast.error(language === 'en' ? 'Product name is required for draft.' : 'ড্রাফটের জন্য পণ্যের নাম প্রয়োজন।');
            return;
        }

        setIsSaving(true);
        try {
            const draftId = isEditing && productToEdit?.id.startsWith('DRAFT-') ? productToEdit.id : `DRAFT-${Date.now()}`;
            const draftProduct: any = {
                id: draftId,
                name: formState.name,
                category: formState.category,
                subCategory: formState.subCategory,
                price: Number(formState.price) || 0,
                stock: Number(formState.stock) || 0,
                vendorId: currentUser?.shopId || currentUser?.driverId || currentUser?.deliveryManId || currentUser?.agencyId || '',
                description: formState.description,
                images: formState.images,
                videoUrl: formState.videoUrl,
                productType: formState.productType,
                customizations: formState.customizations,
                status: 'draft',
                updatedAt: serverTimestamp(),
                createdAt: isEditing && productToEdit?.status === 'draft' ? productToEdit?.createdAt : serverTimestamp() // Preserve if editing draft
            };

            // If editing an existing draft, update it
            // If editing a REAL product, save as NEW draft (copy)? Or fail?
            // "Save as Draft" usually implies saving current progress.
            // If I am editing a LIVE product, "Save as Draft" should probably create a draft COPY.

            await setDoc(doc(db, 'product_drafts', draftId), draftProduct);
            toast.success("Draft saved successfully!");
            setTimeout(() => navigateToDashboard(), 1000);
        } catch (error) {
            console.error("Failed to save draft:", error);
            toast.error("Failed to save draft.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Loading product details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => navigateToDashboard()} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                {language === 'en' ? 'Back to Dashboard' : 'ড্যাশবোর্ডে ফিরে যান'}
            </button>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
                <h1 className="text-2xl font-bold text-[#795548] dark:text-rose-200">{isEditing ? (language === 'en' ? 'Edit Product' : 'পণ্য সম্পাদনা করুন') : (language === 'en' ? 'Add New Product' : 'নতুন পণ্য যোগ করুন')}</h1>

                {/* Basic Info */}
                <fieldset className="space-y-4 p-4 border dark:border-slate-700 rounded-lg">
                    <legend className="text-lg font-semibold px-2">{language === 'en' ? 'Basic Information' : 'মৌলিক তথ্য'}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Product Name (EN)" value={formState.name.en} onChange={e => handleInputChange('name', 'en', e.target.value)} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                        <input type="text" placeholder="Product Name (BN)" value={formState.name.bn} onChange={e => handleInputChange('name', 'bn', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={formState.productType}
                            onChange={e => handleSimpleChange('productType', e.target.value)}
                            disabled={forcedType === 'resell' || (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin' && !currentUser?.shopId)}
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                        >
                            {(!currentUser?.shopId || forcedType === 'resell') && <option value="resell">Resell (Used Item)</option>}
                            {currentUser?.shopId && forcedType !== 'resell' && (
                                <>
                                    <option value="new">New Product</option>
                                    <option value="wholesale">Wholesale</option>
                                </>
                            )}
                            {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && forcedType !== 'resell' && !currentUser?.shopId && (
                                <>
                                    <option value="new">New Product</option>
                                    <option value="wholesale">Wholesale</option>
                                </>
                            )}
                        </select>
                        <select value={formState.category.en} onChange={e => {
                            const newCategory = categories.find(c => c.en === e.target.value);
                            setFormState(prev => ({
                                ...prev,
                                category: newCategory || { en: '', bn: '' },
                                subCategory: { en: '', bn: '' } // Reset subcategory on category change
                            }));
                        }} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white">
                            <option value="">{language === 'en' ? 'Select Category' : 'CATEGORY নির্বাচন করুন'}</option>
                            {categories.map(cat => <option key={cat.en} value={cat.en}>{cat[language]}</option>)}
                        </select>
                        <select value={formState.subCategory.en} onChange={e => handleSimpleChange('subCategory', allSubCategories.find(c => c.en === e.target.value))} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" disabled={availableSubCategories.length === 0 && formState.category.en !== ''}>
                            <option value="">{language === 'en' ? 'Select Subcategory' : 'উপশ্রেণী নির্বাচন করুন'}</option>
                            {availableSubCategories.map((sub, idx) => (
                                <option key={`${sub.en}-${idx}`} value={sub.en}>
                                    {sub[language]} {(!formState.category.en) && `(${sub.parentEn})`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="number" placeholder="Price (৳)" value={formState.price || ''} onChange={e => handleSimpleChange('price', Number(e.target.value))} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                        {!formState.isPreorder && (
                            <input type="number" placeholder="Stock" value={formState.stock || ''} onChange={e => handleSimpleChange('stock', Number(e.target.value))} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                        )}
                    </div>

                    {/* Pre-order Toggle */}
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-100 dark:border-purple-900/20">
                        <input
                            type="checkbox"
                            id="isPreorder"
                            checked={formState.isPreorder}
                            onChange={e => handleSimpleChange('isPreorder', e.target.checked)}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <label htmlFor="isPreorder" className="text-sm font-bold text-purple-700 dark:text-purple-300">{language === 'en' ? 'Is this a Pre-order Item?' : 'এটি কি একটি প্রি-অর্ডার আইটেম?'}</label>
                    </div>

                    {formState.isPreorder && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/20">
                            <div>
                                <label className="block text-xs font-bold text-purple-600 mb-1">{language === 'en' ? 'Release Date' : 'মুক্তির তারিখ'}</label>
                                <input
                                    type="date"
                                    value={formState.preorderReleaseDate}
                                    onChange={e => handleSimpleChange('preorderReleaseDate', e.target.value)}
                                    required={formState.isPreorder}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-purple-600 mb-1">{language === 'en' ? 'Pre-order Note (e.g. Shipping starts Jan 20)' : 'প্রি-অর্ডার নোট'}</label>
                                <input
                                    type="text"
                                    placeholder="Note"
                                    value={formState.preorderNote}
                                    onChange={e => handleSimpleChange('preorderNote', e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-900/10 rounded border border-rose-100 dark:border-rose-900/20">
                        <input
                            type="checkbox"
                            id="wholesaleEnabled"
                            checked={formState.wholesaleEnabled}
                            onChange={e => handleSimpleChange('wholesaleEnabled', e.target.checked)}
                            className="w-4 h-4 text-rose-600 focus:ring-rose-500 rounded"
                        />
                        <label htmlFor="wholesaleEnabled" className="text-sm font-bold text-rose-700">Enable Wholesale Pricing</label>
                    </div>

                    {formState.wholesaleEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-900/20">
                            <div>
                                <label className="block text-xs font-bold text-rose-600 mb-1">Wholesale Price (৳)</label>
                                <input type="number" placeholder="Wholesale Price" value={formState.wholesalePrice || ''} onChange={e => handleSimpleChange('wholesalePrice', Number(e.target.value))} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-rose-600 mb-1">Min Order Quantity (MOQ)</label>
                                <input type="number" placeholder="MOQ" value={formState.minOrderQuantity || ''} onChange={e => handleSimpleChange('minOrderQuantity', Number(e.target.value))} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                    )}

                    {formState.productType === 'resell' && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/20">
                            <div>
                                <label className="block text-xs font-bold text-amber-600 mb-1">Item Condition</label>
                                <select
                                    value={formState.condition}
                                    onChange={e => handleSimpleChange('condition', e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                                >
                                    <option value="Like New">Like New</option>
                                    <option value="Gently Used">Gently Used</option>
                                    <option value="Used">Used</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="negotiable"
                                    checked={formState.negotiable}
                                    onChange={e => handleSimpleChange('negotiable', e.target.checked)}
                                    className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded"
                                />
                                <label htmlFor="negotiable" className="text-sm font-bold text-amber-700">Price is Negotiable</label>
                            </div>
                            {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                                    <input
                                        type="checkbox"
                                        id="authenticityVerified"
                                        checked={formState.authenticityVerified}
                                        onChange={e => handleSimpleChange('authenticityVerified', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                                    />
                                    <label htmlFor="authenticityVerified" className="text-sm font-bold text-blue-700">Authenticity Verified (Admin Only)</label>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Color & Size Options */}
                    {(formState.category.en.includes('Fashion') || formState.productType === 'wholesale') && (
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border dark:border-slate-700 mt-4">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">{language === 'en' ? 'Fashion Options (Color & Size)' : 'ফ্যাশন অপশন (রঙ ও সাইজ)'}</h4>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase">{language === 'en' ? 'Available Colors' : 'উপলব্ধ রঙ'}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formState.colorOptions.map((color, i) => (
                                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                                            {color}
                                            <button type="button" onClick={() => setFormState(prev => ({ ...prev, colorOptions: prev.colorOptions.filter((_, idx) => idx !== i) }))} className="text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={language === 'en' ? 'Add color (e.g. Red)' : 'রঙ যোগ করুন (যেমন: লাল)'}
                                        id="new-color-input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val && !formState.colorOptions.includes(val)) {
                                                    setFormState(prev => ({ ...prev, colorOptions: [...prev.colorOptions, val] }));
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        className="flex-grow p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new-color-input') as HTMLInputElement;
                                            const val = input.value.trim();
                                            if (val && !formState.colorOptions.includes(val)) {
                                                setFormState(prev => ({ ...prev, colorOptions: [...prev.colorOptions, val] }));
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Brown', 'Navy'].map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => !formState.colorOptions.includes(c) && setFormState(prev => ({ ...prev, colorOptions: [...prev.colorOptions, c] }))}
                                            className="text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-slate-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500"
                                        >
                                            + {c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t dark:border-slate-700">
                                <label className="block text-xs font-bold text-gray-500 uppercase">{language === 'en' ? 'Available Sizes' : 'উপলব্ধ সাইজ'}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formState.sizeOptions.map((size, i) => (
                                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                                            {size}
                                            <button type="button" onClick={() => setFormState(prev => ({ ...prev, sizeOptions: prev.sizeOptions.filter((_, idx) => idx !== i) }))} className="text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={language === 'en' ? 'Add size (e.g. XL)' : 'সাইজ যোগ করুন (যেমন: XL)'}
                                        id="new-size-input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const val = (e.target as HTMLInputElement).value.trim();
                                                if (val && !formState.sizeOptions.includes(val)) {
                                                    setFormState(prev => ({ ...prev, sizeOptions: [...prev.sizeOptions, val] }));
                                                    (e.target as HTMLInputElement).value = '';
                                                }
                                            }
                                        }}
                                        className="flex-grow p-2 text-sm border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new-size-input') as HTMLInputElement;
                                            const val = input.value.trim();
                                            if (val && !formState.sizeOptions.includes(val)) {
                                                setFormState(prev => ({ ...prev, sizeOptions: [...prev.sizeOptions, val] }));
                                                input.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44'].map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => !formState.sizeOptions.includes(s) && setFormState(prev => ({ ...prev, sizeOptions: [...prev.sizeOptions, s] }))}
                                            className="text-[10px] px-2 py-0.5 bg-gray-200 dark:bg-slate-600 rounded hover:bg-gray-300 dark:hover:bg-slate-500"
                                        >
                                            + {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </fieldset>

                {/* Description */}
                <fieldset className="space-y-4 p-4 border dark:border-slate-700 rounded-lg">
                    <legend className="text-lg font-semibold px-2">{language === 'en' ? 'Description' : 'বিবরণ'}</legend>
                    <p className="text-sm text-gray-500 mb-2">{language === 'en' ? 'Please provide a detailed description of the product.' : 'অনুগ্রহ করে পণ্যের বিস্তারিত বিবরণ প্রদান করুন।'}</p>
                    <textarea rows={4} placeholder="Description (EN)" value={formState.description.en} onChange={e => handleInputChange('description', 'en', e.target.value)} required className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"></textarea>
                    <textarea rows={4} placeholder="Description (BN)" value={formState.description.bn} onChange={e => handleInputChange('description', 'bn', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"></textarea>
                </fieldset>

                {/* Media (Images & Video) */}
                <fieldset className="p-4 border dark:border-slate-700 rounded-lg">
                    <legend className="text-lg font-semibold px-2">{language === 'en' ? 'Media (Images & Video)' : 'মিডিয়া (ছবি ও ভিডিও)'}</legend>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'en' ? 'Product Video' : 'পণ্য ভিডিও'}</label>
                        <input
                            type="text"
                            placeholder="Video URL (e.g. YouTube or .mp4 link)"
                            value={formState.videoUrl}
                            onChange={e => handleSimpleChange('videoUrl', e.target.value)}
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div
                        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isUploading
                            ? 'border-indigo-300 bg-indigo-50 dark:bg-slate-700/50'
                            : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                        onClick={() => !isUploading && document.getElementById('image-upload-input')?.click()}
                    >
                        <div className="space-y-1 text-center">
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            ) : (
                                <ArrowUpOnSquareIcon className="mx-auto h-12 w-12 text-gray-400" />
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isUploading
                                    ? (language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...')
                                    : (language === 'en' ? 'Upload images' : 'ছবি আপলোড করুন')
                                }
                            </p>
                            <p className="text-xs text-gray-400">{language === 'en' ? 'PNG, JPG, GIF up to 5MB (Max 5 images)' : 'PNG, JPG, GIF ৫MB পর্যন্ত (সর্বোচ্চ ৫টি ছবি)'}</p>
                        </div>
                    </div>
                    <input
                        id="image-upload-input"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                const currentImageCount = formState.images.length;
                                const files = Array.from(e.target.files) as File[];

                                if (currentImageCount + files.length > 5) {
                                    toast.error(language === 'en' ? 'You can only upload a maximum of 5 images.' : 'আপনি সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন।');
                                    e.target.value = ''; // Reset
                                    return;
                                }

                                setIsUploading(true);
                                const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024);

                                if (validFiles.length !== files.length) {
                                    toast.error("Some files were skipped because they are larger than 5MB.");
                                }

                                try {
                                    // Use standard Firebase Storage upload
                                    const uploadPromises = validFiles.map(async (file) => {
                                        const userId = currentUser?.id || 'anonymous';

                                        // Compress image before upload
                                        let fileToUpload: Blob | File = file;
                                        try {
                                            const compressed = await ImageService.compressImage(file, 1200, 0.8); // 1200px max width, 80% quality
                                            fileToUpload = compressed;
                                        } catch (compressError) {
                                            console.warn("Compression failed, uploading original:", compressError);
                                        }

                                        const storageRef = ref(storage, `products/${userId}/${Date.now()}_${file.name}`);
                                        await uploadBytes(storageRef, fileToUpload);
                                        return getDownloadURL(storageRef);
                                    });

                                    const urls = await Promise.all(uploadPromises);
                                    setFormState(prev => ({ ...prev, images: [...prev.images, ...urls] }));
                                    toast.success(language === 'en' ? 'Images uploaded successfully!' : 'ছবি সফলভাবে আপলোড হয়েছে!');
                                } catch (storageError) {
                                    console.error("Storage upload failed:", storageError);
                                    toast.error(language === 'en' ? 'Failed to upload images. Please check your connection.' : 'ছবি আপলোড ব্যর্থ হয়েছে। সংযোগ পরীক্ষা করুন।');
                                } finally {
                                    setIsUploading(false);
                                    // Reset input so same file can be selected again
                                    e.target.value = '';
                                }
                            }
                        }}
                    />
                    <div className="flex flex-wrap gap-4 mt-4">
                        {formState.images.map((img, i) => (
                            <div key={i} className="relative w-24 h-24 group">
                                <img src={img} className="w-full h-full object-cover rounded-md border dark:border-slate-600" />
                                <button type="button" onClick={() => {
                                    setFormState(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
                                }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transform transition-transform hover:scale-110">
                                    <XIcon className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </fieldset>

                {/* Customizations */}
                <fieldset className="p-4 border dark:border-slate-700 rounded-lg">
                    <legend className="text-lg font-semibold px-2">{language === 'en' ? 'Customizations & Add-ons' : 'কাস্টমাইজেশন ও অ্যাড-অন'}</legend>
                    <div className="space-y-6">
                        {formState.customizations.map((group, gIndex) => (
                            <div key={gIndex} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <input type="text" placeholder="Group Title (e.g., Size)" value={group.title.en} onChange={e => updateCustomizationGroup(gIndex, 'title', e.target.value, 'en')} className="font-semibold p-1 bg-transparent border-b dark:border-slate-600 text-gray-900 dark:text-white" />
                                    <select value={group.type} onChange={e => updateCustomizationGroup(gIndex, 'type', e.target.value)} className="text-sm p-1 rounded bg-transparent border dark:border-slate-600 text-gray-900 dark:text-white">
                                        <option value="single">Single Choice</option>
                                        <option value="multiple">Multiple Choice</option>
                                    </select>
                                    <button type="button" onClick={() => removeCustomizationGroup(gIndex)}><TrashIcon className="w-5 h-5 text-red-500" /></button>
                                </div>
                                <div className="space-y-2">
                                    {group.options.map((opt, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-2">
                                            <input type="text" placeholder="Option Name (EN)" value={opt.en} onChange={e => updateCustomizationOption(gIndex, oIndex, 'en', e.target.value)} className="w-full p-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                                            <input type="number" placeholder="Price Add-on (+৳)" value={opt.priceModifier || ''} onChange={e => updateCustomizationOption(gIndex, oIndex, 'priceModifier', Number(e.target.value))} className="w-32 p-2 border rounded text-sm dark:bg-slate-700 dark:border-slate-600 text-gray-900 dark:text-white" />
                                            <button type="button" onClick={() => removeCustomizationOption(gIndex, oIndex)}><XIcon className="w-4 h-4 text-gray-500" /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => addCustomizationOption(gIndex)} className="text-sm text-blue-500 font-semibold mt-3 flex items-center gap-1"><PlusIcon className="w-4 h-4" /> Add Option</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addCustomizationGroup} className="mt-4 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200 font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><PlusIcon className="w-5 h-5" /> Add Customization Group</button>
                </fieldset>

                <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-slate-700">
                    <button type="button" disabled={isSaving} onClick={handleSaveDraft} className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors">
                        <ArchiveBoxIcon className="w-5 h-5" />
                        {language === 'en' ? 'Save as Draft' : 'ড্রাফট হিসেবে সংরক্ষণ'}
                    </button>
                    <div className="flex gap-4">
                        <button type="button" disabled={isSaving} onClick={() => navigateToDashboard()} className="bg-gray-200 dark:bg-slate-600 px-6 py-2 rounded-lg text-sm font-bold text-gray-800 dark:text-gray-200 disabled:opacity-50">{language === 'en' ? 'Cancel' : 'বাতিল'}</button>
                        <button type="submit" disabled={isSaving || isUploading} className="bg-rose-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                            {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            {isEditing ? (language === 'en' ? 'Submit Changes' : 'পরিবর্তন জমা দিন') : (language === 'en' ? 'Submit for Review' : 'রিভিউয়ের জন্য জমা দিন')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddProductPage;
