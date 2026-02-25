import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useApp } from '../src/context/AppContext';
import { ChevronLeftIcon, FilterIcon } from '../components/icons';
import FilterSidebar from '../components/FilterSidebar';
import SEO from '../src/components/SEO';

const WholesalePage: React.FC = () => {
  const { language, products, vendors } = useApp();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(5500);
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFilterOpen]);

  const wholesaleProducts = useMemo(() => products.filter(p => (p.productType === 'wholesale' || p.wholesaleEnabled) && p.status === 'Approved'), [products]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(wholesaleProducts.map(p => p.category.en)))], [wholesaleProducts]);
  const availableVendorIds = useMemo(() => [...new Set(wholesaleProducts.map(p => p.vendorId))], [wholesaleProducts]);
  const availableVendors = useMemo(() => vendors.filter(v => availableVendorIds.includes(v.id)), [availableVendorIds]);

  const filteredProducts = useMemo(() => {
    let filtered = wholesaleProducts;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category.en === selectedCategory);
    }
    if (selectedVendor !== 'All') {
      filtered = filtered.filter(p => p.vendorId === selectedVendor);
    }
    filtered = filtered.filter(p => p.price <= priceRange);

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else { // newest
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    return filtered;
  }, [wholesaleProducts, selectedCategory, priceRange, selectedVendor, sortBy]);

  const filterSidebarProps = {
    categories,
    products: wholesaleProducts,
    vendors: availableVendors,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    selectedVendor,
    setSelectedVendor,
    maxPrice: 5500,
  };

  const content = {
    en: {
      title: "Wholesale Products",
      back: "Back",
      sortBy: "Sort by:",
      newest: "Newest",
      priceAsc: "Price: Low to High",
      priceDesc: "Price: High to Low",
      noProducts: "No Wholesale Products Found",
      noProductsDesc: "Check back later for our bulk purchasing options.",
      showFilters: "Show Filters"
    },
    bn: {
      title: "পাইকারি পণ্য",
      back: "ফিরে যান",
      sortBy: "সাজান:",
      newest: "নতুন",
      priceAsc: "মূল্য: কম থেকে বেশি",
      priceDesc: "মূল্য: বেশি থেকে কম",
      noProducts: "কোনো পাইকারি পণ্য পাওয়া যায়নি",
      noProductsDesc: "আমাদের বাল্ক ক্রয়ের বিকল্পগুলির জন্য পরে আবার দেখুন।",
      showFilters: "ফিল্টার দেখান",
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate('/')} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#795548] dark:hover:text-rose-300 mb-4">
        <ChevronLeftIcon className="h-5 w-5 mr-1" />
        {content[language].back}
      </button>

      <SEO
        title={content[language].title}
        description={content[language].noProductsDesc}
        url="https://sakhipur-bazar.web.app/wholesale"
        schema={{
          "@context": "https://schema.org/",
          "@type": "CollectionPage",
          "name": content[language].title,
          "description": content[language].noProductsDesc,
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": filteredProducts.map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://sakhipur-bazar.web.app/product/${p.slug || p.id}`
            }))
          }
        }}
      />

      <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200 mb-6">{content[language].title}</h1>

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
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
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
  );
};

export default WholesalePage;