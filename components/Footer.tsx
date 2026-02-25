
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../src/context/AppContext';
import { ChevronRightIcon } from './icons';

const Footer = () => {
    const { language, platformSettings, theme, currentUser } = useApp();
    const navigate = useNavigate();

    const content = {
        en: {
            about: 'About Us',
            contact: 'Contact',
            becomeSeller: 'Become a Seller',
            privacy: 'Privacy Policy',
            terms: 'Terms of Service',
            messages: 'Messages & Notifications',
            support: 'Support'
        },
        bn: {
            about: 'আমাদের সম্পর্কে',
            contact: 'যোগাযোগ',
            becomeSeller: 'বিক্রেতা হন',
            privacy: 'গোপনীয়তা নীতি',
            terms: 'পরিষেবার শর্তাবলী',
            messages: 'মেসেজ এবং বিজ্ঞপ্তি',
            support: 'সহায়তা'
        }
    }

    return (
        <footer className="bg-[#FFF3E0] dark:bg-slate-900 text-[#795548] dark:text-gray-300 pt-12 pb-24 md:pb-8 border-t dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div
                            className="text-2xl font-bold mb-4 dark:text-rose-300 cursor-pointer flex items-center gap-2"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                            onClick={() => navigate('/')}
                        >
                            {theme === 'light' && platformSettings.logoUrl ? (
                                <img src={platformSettings.logoUrl} alt={platformSettings.appName} className="h-8" />
                            ) : (
                                <span>{platformSettings.appName || 'Sakhipur Bazar'}</span>
                            )}
                        </div>
                        <p className="text-sm mb-4">{platformSettings.footerDescription?.[language]}</p>
                        {/* Dynamic Contact Info */}
                        <div className="text-sm space-y-1">
                            <p><strong>{content[language].support}:</strong></p>
                            <p>{platformSettings.supportPhone}</p>
                            <p>{platformSettings.supportEmail}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{language === 'en' ? 'Quick Links' : 'দ্রুত লিঙ্ক'}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><NavLink to="/about" className="hover:text-[#FFB6B6]">{content[language].about}</NavLink></li>
                            <li><NavLink to="/contact" className="hover:text-[#FFB6B6]">{content[language].contact}</NavLink></li>
                            <li><NavLink to="/vendor/register" className="hover:text-[#FFB6B6]">{content[language].becomeSeller}</NavLink></li>
                            <li><button onClick={() => navigate('/inbox')} className="hover:text-[#FFB6B6] text-left">{content[language].messages}</button></li>
                            <li><button
                                onClick={() => {
                                    if (!currentUser) {
                                        toast.error(language === 'en' ? 'Please log in to contact support.' : 'সহায়তার জন্য লগ ইন করুন।');
                                        navigate('/login');
                                    } else {
                                        navigate('/profile?tab=support');
                                    }
                                }}
                                className="font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-all hover:translate-x-1"
                            >
                                {language === 'en' ? 'Help & Support' : 'সাহায্য এবং সহায়তা'}
                                <ChevronRightIcon className="w-4 h-4" />
                            </button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{language === 'en' ? 'Legal' : 'আইনি'}</h4>
                        <ul className="space-y-2 text-sm">
                            <li><NavLink to="/privacy" className="hover:text-[#FFB6B6]">{content[language].privacy}</NavLink></li>
                            <li><NavLink to="/terms" className="hover:text-[#FFB6B6]">{content[language].terms}</NavLink></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">{language === 'en' ? 'Follow Us' : 'আমাদের অনুসরণ করুন'}</h4>
                        <div className="flex space-x-4">
                            {platformSettings.socialLinks?.facebook && (
                                <a href={platformSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-[#1877F2] rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" /></svg>
                                </a>
                            )}
                            {platformSettings.socialLinks?.twitter && (
                                <a href={platformSettings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-black dark:bg-white dark:text-black rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.64l-5.214-6.817-5.968 6.817H1.696l7.732-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h-.001zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                </a>
                            )}
                            {platformSettings.socialLinks?.instagram && (
                                <a href={platformSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="h-8 w-8 bg-gradient-to-tr from-[#FFDC80] via-[#FD1D1D] to-[#E1306C] rounded-full flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-[#ffc8c8] dark:border-rose-900/50 text-center text-sm">
                    <p>{platformSettings.copyrightText?.[language]}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
