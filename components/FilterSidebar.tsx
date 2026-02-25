import React from 'react';
import { useApp } from '../src/context/AppContext';
import { Product, Vendor } from '../types';
import { XIcon } from './icons';

interface FilterSidebarProps {
  categories: string[];
  products: Product[];
  vendors: Vendor[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: number;
  setPriceRange: (price: number) => void;
  selectedVendor: string;
  setSelectedVendor: (vendorId: string) => void;
  onClose?: () => void;
  // Optional props for resell condition filter
  conditions?: string[];
  selectedCondition?: string;
  setSelectedCondition?: (condition: string) => void;
  maxPrice?: number;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  products,
  vendors,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  selectedVendor,
  setSelectedVendor,
  onClose,
  conditions,
  selectedCondition,
  setSelectedCondition,
  maxPrice = 3000
}) => {
  const { language } = useApp();

  const getCategoryName = (catEn: string) => {
    if (catEn === 'All') return language === 'en' ? 'All' : 'সব';
    const product = products.find(p => p.category.en === catEn);
    return language === 'bn' ? product?.category.bn || catEn : catEn;
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-[#6D4C41] dark:text-rose-200">
          {language === 'en' ? 'Filters' : 'ফিল্টার'}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <XIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-grow">
        {/* Category Filter */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{language === 'en' ? 'Category' : 'ক্যাটাগরি'}</h4>
          <ul className="space-y-2">
            {categories.map(cat => (
              <li key={cat}>
                <button
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#FEF3E0] dark:bg-rose-900/50 text-[#6D4C41] dark:text-rose-200 font-bold'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {getCategoryName(cat)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Condition Filter (only for resell) */}
        {conditions && selectedCondition && setSelectedCondition && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{language === 'en' ? 'Condition' : 'কন্ডিশন'}</h4>
            <ul className="space-y-2">
              {conditions.map(cond => (
                <li key={cond}>
                  <button
                    onClick={() => setSelectedCondition(cond)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                      selectedCondition === cond
                        ? 'bg-[#FEF3E0] dark:bg-rose-900/50 text-[#6D4C41] dark:text-rose-200 font-bold'
                        : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {cond === 'All' ? (language === 'en' ? 'All' : 'সব') : cond}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{language === 'en' ? 'Price Range' : 'মূল্য পরিসীমা'}</h4>
          <input
            type="range"
            min="100"
            max={maxPrice}
            step="50"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#F48FB1]"
          />
          <div className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">
            {language === 'en' ? 'Up to' : 'পর্যন্ত'} ৳{priceRange}
          </div>
        </div>

        {/* Vendor Filter */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">{language === 'en' ? 'Vendor' : 'বিক্রেতা'}</h4>
          <div className="relative">
            <select
              value={selectedVendor}
              onChange={e => setSelectedVendor(e.target.value)}
              className="w-full appearance-none bg-white text-gray-800 dark:bg-slate-700 dark:text-gray-200 border dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-[#F48FB1] cursor-pointer"
            >
              <option value="All">{language === 'en' ? 'All Vendors' : 'সব বিক্রেতা'}</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name[language]}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
