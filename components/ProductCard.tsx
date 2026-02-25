
import React from 'react';
import { Product } from '../types';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { useApp } from '../src/context/AppContext';
import { HeartIcon, ArchiveBoxIcon } from './icons';
import { AnalyticsService } from '../src/services/analyticsService';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { language, addToCart, isProductInWishlist, addToWishlist, removeFromWishlist, vendors, users } = useApp();
  const navigate = useNavigate();

  const vendor = vendors.find(v => v.id === product.vendorId);
  const isOffline = vendor?.onlineStatus === 'Offline';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOffline) return;
    addToCart(product, 1);
    // Analytics: Track Add to Cart
    AnalyticsService.trackAddToCart({
      ...product,
      quantity: 1
    });
    toast.success(`${product.name[language]} added to cart!`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProductInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
      AnalyticsService.trackAddToWishlist(product);
    }
  };

  const inWishlist = isProductInWishlist(product.id);

  const getSellerName = () => {
    if (product.sellerId) {
      const seller = users.find(u => u.id === product.sellerId);
      return seller ? `${language === 'en' ? 'Sold by' : 'বিক্রেতা:'} ${seller.name}` : 'Private Seller';
    }
    if (product.vendorId) {
      return vendor ? vendor.name[language] : 'Unknown Shop';
    }
    return 'Unknown Seller';
  };


  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer group relative"
      onClick={() => navigate(`/product/${product.slug || product.id}`)}
    >
      {isOffline && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <span className="text-white font-bold text-lg bg-gray-800/50 px-4 py-2 rounded-lg">{language === 'en' ? 'Offline' : 'অফলাইন'}</span>
        </div>
      )}
      <div className="relative">
        <img src={product.images[0]} alt={product.name[language]} className="w-full h-48 md:h-56 object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-20">
          {product.productType === 'resell' && product.condition && (
            <div className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
              {product.condition}
            </div>
          )}
          {product.wholesaleEnabled && (
            <div className="bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <ArchiveBoxIcon className="w-3 h-3" />
              {language === 'en' ? 'Wholesale' : 'পাইকারি'}
            </div>
          )}
          {product.isPreorder && (
            <div className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
              PRE-ORDER
            </div>
          )}
        </div>
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:scale-110 active:scale-95 transition-all z-20"
        >
          <HeartIcon className={`h-5 w-5 ${inWishlist ? 'text-rose-500 fill-current' : 'text-gray-600 dark:text-gray-300'}`} />
        </button>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-20">
          {/* Subtle overlay */}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 z-30 pointer-events-none">
          <div className="w-full px-6 pointer-events-auto">
            <button
              onClick={handleAddToCart}
              disabled={isOffline}
              className={`w-full ${product.isPreorder ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#FF9B9B] hover:bg-[#ff8282]'} text-white font-bold py-3 rounded-full text-sm shadow-2xl transition-all active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed border-2 border-white/50`}
            >
              {isOffline ? (language === 'en' ? 'Offline' : 'অফলাইন') : (product.isPreorder ? (language === 'en' ? 'Pre-order Now' : 'এখনই প্রি-অর্ডার করুন') : (language === 'en' ? 'Add to Cart' : 'কার্টে যোগ করুন'))}
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate" style={{ fontFamily: 'Noto Sans Bengali, Poppins, sans-serif' }}>
          {product.name[language]}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{getSellerName()}</p>
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-[#795548] dark:text-rose-300">৳{product.price}</p>
          <div className="flex items-center space-x-1">
            <StarRating rating={product.rating} className="h-4 w-4" />
            <span className="text-xs text-gray-500 dark:text-gray-400">({product.rating})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;