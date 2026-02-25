

import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { ChevronLeftIcon, XIcon, FilterIcon, TagIcon } from '../components/icons';
import FilterSidebar from '../components/FilterSidebar';
import ComingSoon from '../components/ComingSoon';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../src/lib/firebase';
import SEO from '../src/components/SEO';

const SellItemModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // ... existing code
    const { language, addProduct, currentUser, vendors } = useApp();

    const [itemNameEn, setItemNameEn] = useState('');
    const [itemNameBn, setItemNameBn] = useState('');
    const [itemCategory, setItemCategory] = useState('Electronics');
    const [itemPrice, setItemPrice] = useState('');
    const [itemCondition, setItemCondition] = useState<'Like New' | 'Gently Used' | 'Used'>('Gently Used');
    const [itemDescriptionEn, setItemDescriptionEn] = useState('');
    const [itemDescriptionBn, setItemDescriptionBn] = useState('');
    const [itemNegotiable, setItemNegotiable] = useState(false);
    const [itemImages, setItemImages] = useState<FileList | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const resellCategories = useMemo(() => {
        return ['Electronics', 'Vehicles', 'Books', 'Home Goods', 'Apparel', 'Other'];
    }, []);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('You must be logged in to sell an item.');
            return;
        }

        setIsUploading(true);
        try {
            const imageUrls: string[] = [];
            if (itemImages && itemImages.length > 0) {
                for (let i = 0; i < itemImages.length; i++) {
                    const file = itemImages[i];
                    const storageRef = ref(storage, `resell/${Date.now()}_${file.name}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    imageUrls.push(url);
                }
            } else {
                imageUrls.push(`https://picsum.photos/600/600?random=${Date.now()}`);
            }

            const newProduct: Product = {
                id: `R${Date.now()}`,
                name: { en: itemNameEn, bn: itemNameBn || itemNameEn },
                category: { en: itemCategory, bn: itemCategory }, // Simplified for demo
                price: Number(itemPrice),
                sellerId: currentUser.id,
                stock: 1,
                rating: 0, // New items have no rating yet
                description: { en: itemDescriptionEn, bn: itemDescriptionBn || itemDescriptionEn },
                images: imageUrls,
                productType: 'resell',
                condition: itemCondition,
                negotiable: itemNegotiable,
                resellStatus: 'active',
                status: 'Approved' // Auto-approve for now or set to 'Pending'
            };

            await addProduct(newProduct);

            // Auto-enable Reseller Mode on first listing
            if (!currentUser.isReseller) {
                const { enableResellerMode } = useApp();
                await enableResellerMode(currentUser.id);
            }

            alert('Your item has been successfully listed for sale!');
            onClose();
        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Failed to upload images or list item. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const content = {
        en: {
            modalTitle: "List Your Item for Sale",
            itemNameEn: "Item Name (English)",
            itemNameBn: "Item Name (Bengali)",
            category: "Category",
            price: "Price (৳)",
            condition: "Condition",
            descriptionEn: "Description (English)",
            descriptionBn: "Description (Bengali)",
            uploadImages: "Upload Images",
            uploadLabel: "Upload files",
            dragDrop: "or drag and drop",
            imageHint: "PNG, JPG up to 10MB",
            cancel: "Cancel",
            listItem: "List Item",
        },
        bn: {
            modalTitle: "আপনার আইটেম বিক্রির জন্য তালিকাভুক্ত করুন",
            itemNameEn: "আইটেমের নাম (English)",
            itemNameBn: "আইটেমের নাম (Bengali)",
            category: "ক্যাটাগরি",
            price: "মূল্য (৳)",
            condition: "কন্ডিশন",
            descriptionEn: "বিবরণ (English)",
            descriptionBn: "বিবরণ (Bengali)",
            uploadImages: "ছবি আপলোড করুন",
            uploadLabel: "ফাইল আপলোড করুন",
            dragDrop: "অথবা টেনে আনুন",
            imageHint: "PNG, JPG 10MB পর্যন্ত",
            cancel: "বাতিল করুন",
            listItem: "আইটেম তালিকাভুক্ত করুন",
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-700 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-[#795548] dark:text-rose-200">{content[language].modalTitle}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="itemNameEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].itemNameEn}</label>
                                <input type="text" id="itemNameEn" value={itemNameEn} onChange={e => setItemNameEn(e.target.value)} required className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400" />
                            </div>
                            <div>
                                <label htmlFor="itemNameBn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].itemNameBn}</label>
                                <input type="text" id="itemNameBn" value={itemNameBn} onChange={e => setItemNameBn(e.target.value)} className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].category}</label>
                                <select id="itemCategory" value={itemCategory} onChange={e => setItemCategory(e.target.value)} required className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400">
                                    {resellCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].price}</label>
                                <input type="number" id="itemPrice" value={itemPrice} onChange={e => setItemPrice(e.target.value)} required placeholder="0" className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400" />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="itemCondition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].condition}</label>
                            <select id="itemCondition" value={itemCondition} onChange={e => setItemCondition(e.target.value as any)} required className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400">
                                <option value="Like New">Like New</option>
                                <option value="Gently Used">Gently Used</option>
                                <option value="Used">Used</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="itemNegotiable"
                                checked={itemNegotiable}
                                onChange={e => setItemNegotiable(e.target.checked)}
                                className="w-4 h-4 text-rose-500 focus:ring-rose-500 rounded"
                            />
                            <label htmlFor="itemNegotiable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {language === 'en' ? 'Price is Negotiable' : 'মূল্য আলোচনা সাপেক্ষ'}
                            </label>
                        </div>

                        <div>
                            <label htmlFor="itemDescriptionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].descriptionEn}</label>
                            <textarea id="itemDescriptionEn" rows={3} value={itemDescriptionEn} onChange={e => setItemDescriptionEn(e.target.value)} required className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400"></textarea>
                        </div>
                        <div>
                            <label htmlFor="itemDescriptionBn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].descriptionBn}</label>
                            <textarea id="itemDescriptionBn" rows={3} value={itemDescriptionBn} onChange={e => setItemDescriptionBn(e.target.value)} className="mt-1 w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-rose-400 focus:border-rose-400"></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{content[language].uploadImages}</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-700 rounded-md font-medium text-rose-500 hover:text-rose-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-rose-500">
                                            <span>{content[language].uploadLabel}</span>
                                            <input id="file-upload" name="file-upload" type="file" multiple onChange={e => setItemImages(e.target.files)} className="sr-only" />
                                        </label>
                                        <p className="pl-1">{content[language].dragDrop}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">{content[language].imageHint}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors" disabled={isUploading}>{content[language].cancel}</button>
                            <button type="submit" className="bg-rose-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-600 transition-colors disabled:bg-gray-400" disabled={isUploading}>
                                {isUploading ? 'Listing...' : content[language].listItem}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const ResellPage: React.FC = () => {
    const { language, products, vendors } = useApp();
    const navigate = useNavigate();
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState(25000);
    const [selectedVendor, setSelectedVendor] = useState('All');
    const [selectedCondition, setSelectedCondition] = useState('All');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = isFilterOpen ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isFilterOpen]);

    const resellProducts = useMemo(() => products.filter(p => p.productType === 'resell' && p.status === 'Approved'), [products]);

    // If no resell products at all, show empty state with "Sell Your Item" button
    if (resellProducts.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-slate-900 min-h-screen pb-20">
                <div className="container mx-auto px-4 py-8">
                    <button onClick={() => navigate('/')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        {language === 'en' ? 'Back' : 'ফিরে যান'}
                    </button>

                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200">
                            {language === 'en' ? 'Resell Products' : 'পুনঃবিক্রয় পণ্য'}
                        </h1>
                        <button
                            onClick={() => setIsSellModalOpen(true)}
                            className="bg-rose-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-600 transition-colors"
                        >
                            {language === 'en' ? 'Sell Your Item' : 'আপনার আইটেম বিক্রি করুন'}
                        </button>
                    </div>

                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                            {language === 'en' ? 'No Resell Products Found' : 'কোনো পুনঃবিক্রয় পণ্য পাওয়া যায়নি'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            {language === 'en' ? 'Be the first to list a secondhand item!' : 'প্রথম secondhand আইটেম তালিকাভুক্ত করুন!'}
                        </p>
                    </div>
                </div>
                {isSellModalOpen && <SellItemModal onClose={() => setIsSellModalOpen(false)} />}
            </div>
        );
    }

    const categories = useMemo(() => ['All', ...Array.from(new Set(resellProducts.map(p => p.category.en)))], [resellProducts]);
    const conditions = useMemo(() => ['All', ...Array.from(new Set(resellProducts.map(p => p.condition).filter(Boolean))) as string[]], [resellProducts]);
    const availableVendorIds = useMemo(() => [...new Set(resellProducts.map(p => p.vendorId).filter(Boolean))], [resellProducts]);
    const availableVendors = useMemo(() => vendors.filter(v => availableVendorIds.includes(v.id)), [availableVendorIds, vendors]);

    const filteredProducts = useMemo(() => {
        let filtered = resellProducts;

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(p => p.category.en === selectedCategory);
        }
        if (selectedVendor !== 'All') {
            filtered = filtered.filter(p => p.vendorId === selectedVendor);
        }
        if (selectedCondition !== 'All') {
            filtered = filtered.filter(p => p.condition === selectedCondition);
        }
        filtered = filtered.filter(p => p.price <= priceRange);

        switch (sortBy) {
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => {
                    const idA = a.id.startsWith('R') ? parseInt(a.id.substring(1)) : 0;
                    const idB = b.id.startsWith('R') ? parseInt(b.id.substring(1)) : 0;
                    return idB - idA;
                });
                break;
        }

        return filtered;
    }, [resellProducts, selectedCategory, priceRange, selectedVendor, selectedCondition, sortBy]);

    const filterSidebarProps = {
        categories,
        products: resellProducts,
        vendors: availableVendors,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        selectedVendor,
        setSelectedVendor,
        conditions,
        selectedCondition,
        setSelectedCondition,
        maxPrice: 25000,
    };

    const content = {
        en: {
            title: "Resell Products",
            back: "Back",
            sellYourItem: "Sell Your Item",
            sortBy: "Sort by:",
            newest: "Newest",
            priceAsc: "Price: Low to High",
            priceDesc: "Price: High to Low",
            noProducts: "No Resell Products Found",
            noProductsDesc: "Be the first to list a secondhand item!",
            showFilters: "Show Filters",
        },
        bn: {
            title: "পুনঃবিক্রয় পণ্য",
            back: "ফিরে যান",
            sellYourItem: "আপনার আইটেম বিক্রি করুন",
            sortBy: "সাজান:",
            newest: "নতুন",
            priceAsc: "মূল্য: কম থেকে বেশি",
            priceDesc: "মূল্য: বেশি থেকে কম",
            noProducts: "কোনো পুনঃবিক্রয় পণ্য পাওয়া যায়নি",
            noProductsDesc: "প্রথম secondhand আইটেম তালিকাভুক্ত করুন!",
            showFilters: "ফিল্টার দেখান",
        }
    }

    return (
        <>
            <SEO
                title={content[language].title}
                description={content[language].noProductsDesc}
                url="https://sakhipur-bazar.web.app/resell"
            />
            <div className="container mx-auto px-4 py-8">
                <button onClick={() => navigate('/')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
                    <ChevronLeftIcon className="h-5 w-5 mr-1" />
                    {content[language].back}
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200">{content[language].title}</h1>
                    <button
                        onClick={() => setIsSellModalOpen(true)}
                        className="bg-rose-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-rose-600 transition-colors whitespace-nowrap"
                    >
                        {content[language].sellYourItem}
                    </button>
                </div>

                {/* Mobile Filter Button */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg shadow-md"
                    >
                        <FilterIcon className="h-5 w-5" />
                        {content[language].showFilters}
                    </button>
                </div>

                {/* Mobile Filter Overlay */}
                {isFilterOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 md:hidden"
                        onClick={() => setIsFilterOpen(false)}
                    >
                        <div
                            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white dark:bg-slate-900 shadow-xl transform transition-transform duration-300"
                            onClick={e => e.stopPropagation()}
                        >
                            <FilterSidebar {...filterSidebarProps} onClose={() => setIsFilterOpen(false)} />
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden md:block md:w-1/4 lg:w-1/5">
                        <FilterSidebar {...filterSidebarProps} />
                    </aside>

                    {/* Product Grid */}
                    <main className="w-full md:w-3/4 lg:w-4/5">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm gap-4">
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {language === 'en' ? `Showing ${filteredProducts.length} results` : `${filteredProducts.length}টি ফলাফল দেখানো হচ্ছে`}
                            </p>
                            <div className="flex items-center space-x-2">
                                <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-300">{content[language].sortBy}</label>
                                <select
                                    id="sort"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value)}
                                    className="border border-gray-300 dark:border-slate-600 rounded-md p-2 text-sm focus:ring-[#FFB6B6] focus:border-[#FFB6B6] bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                                >
                                    <option value="newest">{content[language].newest}</option>
                                    <option value="price-asc">{content[language].priceAsc}</option>
                                    <option value="price-desc">{content[language].priceDesc}</option>
                                </select>
                            </div>
                        </div>

                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => {
                                    return <ProductCard key={product.id} product={product} />
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{content[language].noProducts}</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{content[language].noProductsDesc}</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {isSellModalOpen && <SellItemModal onClose={() => setIsSellModalOpen(false)} />}
        </>
    );
};

export default ResellPage;