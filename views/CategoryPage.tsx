
import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useApp } from '../src/context/AppContext';
import FilterSidebar from '../components/FilterSidebar';
import { FilterIcon, ShoppingBagIcon } from '../components/icons';
import EmptyState from '../components/EmptyState';
import { useParams } from 'react-router-dom';
import SEO from '../src/components/SEO';

const CategoryPage: React.FC = () => {
  const { category: urlCategory } = useParams<{ category: string }>();
  const { language, products, vendors, categoryCommissions } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const matchingCategory = useMemo(() => {
    return categoryCommissions.find(c => c.slug === urlCategory || c.category.en === urlCategory);
  }, [categoryCommissions, urlCategory]);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(matchingCategory ? matchingCategory.category.en : 'All');
    } else {
      setSelectedCategory('All');
    }
  }, [urlCategory, matchingCategory]);

  const [priceRange, setPriceRange] = useState(3000);
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isFilterOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFilterOpen]);

  const categories = useMemo(() => {
    const activeCats = categoryCommissions
      .filter(c => c.isActive)
      .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
      .map(c => c.category.en);
    return ['All', ...activeCats];
  }, [categoryCommissions]);

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.status === 'Approved');

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
  }, [selectedCategory, priceRange, selectedVendor, sortBy, products]);


  const filterSidebarProps = {
    categories,
    products,
    vendors,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    selectedVendor,
    setSelectedVendor,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={selectedCategory === 'All' ? (language === 'en' ? 'Shop All Products' : 'সকল পণ্য') : selectedCategory}
        description={`Browse our collection of ${selectedCategory} products. Best prices and fast delivery in Sakhipur.`}
        url={`https://sakhipur-bazar.web.app/category/${matchingCategory?.slug || selectedCategory}`}
        schema={{
          "@context": "https://schema.org/",
          "@type": "CollectionPage",
          "name": selectedCategory,
          "description": `Products in category ${selectedCategory}`,
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": filteredProducts.slice(0, 10).map((p, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://sakhipur-bazar.web.app/product/${p.slug || p.id}`
            }))
          }
        }}
      />
      {/* Mobile Filter Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg shadow-md"
        >
          <FilterIcon className="h-5 w-5" />
          {language === 'en' ? 'Show Filters' : 'ফিল্টার দেখান'}
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
              <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-300">{language === 'en' ? 'Sort by:' : 'সাজান:'}</label>
              <select
                id="sort"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="border border-gray-300 dark:border-slate-600 rounded-md p-2 text-sm focus:ring-[#FFB6B6] focus:border-[#FFB6B6] bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
              >
                <option value="newest">{language === 'en' ? 'Newest' : 'নতুন'}</option>
                <option value="price-asc">{language === 'en' ? 'Price: Low to High' : 'মূল্য: কম থেকে বেশি'}</option>
                <option value="price-desc">{language === 'en' ? 'Price: High to Low' : 'মূল্য: বেশি থেকে কম'}</option>
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
            <div className="mt-12">
              <EmptyState
                title={language === 'en' ? 'No Products Found' : 'কোনো পণ্য পাওয়া যায়নি'}
                message={language === 'en' ? "Try adjusting your filters to find what you're looking for." : "আপনি যা খুঁজছেন তা খুঁজে পেতে আপনার ফিল্টারগুলি সামঞ্জস্য করার চেষ্টা করুন।"}
                icon={ShoppingBagIcon}
                actionLabel={language === 'en' ? 'Clear Filters' : 'ফিল্টার মুছুন'}
                onAction={() => {
                  setSelectedCategory('All');
                  setPriceRange(100000); // Reset to high value
                  setSelectedVendor('All');
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;