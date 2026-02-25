import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { AppleShareIcon, PlusIcon, XIcon, ArrowUpOnSquareIcon } from './icons';
import { useApp } from '../src/context/AppContext';

export const PWABanner = () => {
    const { isInstallable, isIOS, isStandalone, isDismissed, install, dismiss } = usePWA();
    const [isVisible, setIsVisible] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);
    const { language } = useApp();

    useEffect(() => {
        if (!isStandalone && !isDismissed && (isInstallable || isIOS)) {
            const timer = setTimeout(() => setIsVisible(true), 5000);
            return () => clearTimeout(timer);
        }
    }, [isStandalone, isDismissed, isInstallable, isIOS]);

    if (!isVisible) return null;

    return (
        <>
            {/* Bottom Banner */}
            <div className={`fixed bottom-4 left-4 right-4 z-50 transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-[#795548] p-2 rounded-xl">
                            <PlusIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                {language === 'en' ? 'Install App' : 'অ্যাপ ইনস্টল করুন'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'en' ? 'For a better experience' : 'আরও ভালো অভিজ্ঞতার জন্য'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {isIOS ? (
                            <button
                                onClick={() => setShowIOSModal(true)}
                                className="bg-[#795548] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#5d4037] transition-colors"
                            >
                                {language === 'en' ? 'Install' : 'ইনস্টল'}
                            </button>
                        ) : (
                            <button
                                onClick={install}
                                className="bg-[#795548] text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#5d4037] transition-colors"
                            >
                                {language === 'en' ? 'Install' : 'ইনস্টল'}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                dismiss();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* iOS Instructions Modal */}
            {showIOSModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowIOSModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>

                        <div className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <AppleShareIcon className="w-8 h-8 text-[#007AFF]" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {language === 'en' ? 'Install on iPhone' : 'আইফোনে ইনস্টল করুন'}
                            </h3>

                            <div className="text-left space-y-4 text-gray-600 dark:text-gray-300 text-sm">
                                <p>1. {language === 'en' ? 'Tap the' : 'ক্লিক করুন'} <span className="inline-block align-middle"><AppleShareIcon className="w-5 h-5 text-[#007AFF]" /></span> {language === 'en' ? 'Share button below' : 'শেয়ার বাটনে'}</p>
                                <p>2. {language === 'en' ? 'Scroll down and select' : 'নিচে স্ক্রল করুন এবং নির্বাচন করুন'} <span className="font-bold text-gray-800 dark:text-white">'Add to Home Screen'</span> <span className="inline-block align-middle"><ArrowUpOnSquareIcon className="w-5 h-5 text-gray-800 dark:text-white" /></span></p>
                            </div>

                            <button
                                onClick={() => setShowIOSModal(false)}
                                className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-semibold mt-4"
                            >
                                {language === 'en' ? 'Got it!' : 'বুঝতে পেরেছি!'}
                            </button>
                        </div>

                        {/* Pointing Arrow at bottom for visual context if needed, but centering is safer generally */}
                    </div>
                </div>
            )}
        </>
    );
};
