


import React from 'react';
import { Vendor } from '../types';
import { useApp } from '../src/context/AppContext';
import StarRating from './StarRating';
import { useNavigate } from 'react-router-dom';

interface ShopCardProps {
  vendor: Vendor;
}

const ShopCard: React.FC<ShopCardProps> = ({ vendor }) => {
  const { language } = useApp();
  const navigate = useNavigate();
  const isOffline = vendor.onlineStatus === 'Offline';

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer group relative"
      onClick={() => navigate(`/vendor/${vendor.slug || vendor.id}`)}
    >
      {isOffline && (
        <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
          <span className="text-white font-bold text-base bg-gray-800/50 px-3 py-1 rounded-lg">{language === 'en' ? 'Offline' : 'অফলাইন'}</span>
        </div>
      )}
      <div className="relative">
        <img src={vendor.bannerImage} alt={vendor.name[language]} className="w-full h-32 object-cover" />
      </div>
      <div className="p-4">
        <h3 className="text-md font-bold text-gray-800 dark:text-gray-100 truncate" style={{ fontFamily: 'Noto Sans Bengali, Poppins, sans-serif' }}>
          {vendor.name[language]}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 h-8">{vendor.category[language]}</p>
        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center">
            <StarRating rating={vendor.rating} className="h-4 w-4" />
            <span className="ml-1">({vendor.rating})</span>
          </div>
          <span>{vendor.distance} {language === 'en' ? 'mi' : 'মাইল'}</span>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;