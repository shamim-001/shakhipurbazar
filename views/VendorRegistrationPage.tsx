
import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { useNavigate } from 'react-router-dom';

const VendorRegistrationPage = () => {
    const { language, registerVendor } = useApp();
    const navigate = useNavigate();

    const [formState, setFormState] = useState({
        shopNameEn: '',
        shopNameBn: '',
        shopCategory: 'Cakes & Pastries',
        ownerName: '',
        phone: '',
        email: '',
        address: '',
        paymentMethod: 'bKash',
        paymentDetails: '',
        password: '',
    });
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const newUser = await registerVendor(formState);
            if (newUser) {
                // successful registration and login
                navigate('/vendor-dashboard');
            } else {
                setError("Registration failed. This email might already be in use.");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        }
    };

    const content = {
        en: {
            title: "Vendor Application",
            description: "Join our community of local entrepreneurs. Fill out the form below to get started.",
            shopInfo: "Shop Information",
            shopNameEn: "Shop Name (English)",
            shopNameBn: "Shop Name (Bengali)",
            shopCategory: "Shop Category",
            ownerInfo: "Owner Information",
            ownerName: "Full Name",
            phone: "Phone Number",
            email: "Email Address",
            password: "Password",
            address: "Shop Address",
            paymentInfo: "Payment Information",
            paymentMethod: "Preferred Payment Method",
            paymentDetails: "Payment Account Details",
            paymentPlaceholder: "e.g., bKash Number, Bank Account",
            submit: "Submit Application",
            haveAccount: "Already have an account?",
            login: "Log In"
        },
        bn: {
            title: "বিক্রেতার আবেদনপত্র",
            description: "আমাদের স্থানীয় উদ্যোক্তাদের সম্প্রদায়ে যোগ দিন। শুরু করতে নীচের ফর্মটি পূরণ করুন।",
            shopInfo: "দোকানের তথ্য",
            shopNameEn: "দোকানের নাম (English)",
            shopNameBn: "দোকানের নাম (বাংলা)",
            shopCategory: "দোকানের ক্যাটাগরি",
            ownerInfo: "মালিকের তথ্য",
            ownerName: "পুরো নাম",
            phone: "ফোন নম্বর",
            email: "ইমেইল ঠিকানা",
            password: "পাসওয়ার্ড",
            address: "দোকানের ঠিকানা",
            paymentInfo: "পেমেন্টের তথ্য",
            paymentMethod: "পছন্দের পেমেন্ট পদ্ধতি",
            paymentDetails: "পেমেন্ট অ্যাকাউন্টের বিবরণ",
            paymentPlaceholder: "যেমন, বিকাশ নম্বর, ব্যাংক অ্যাকাউন্ট",
            submit: "আবেদন জমা দিন",
            haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
            login: "লগইন করুন"
        }
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-center text-[#795548] dark:text-rose-200 mb-2">{content[language].title}</h1>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-10">{content[language].description}</p>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
                    {/* Shop Information */}
                    <fieldset className="space-y-4">
                        <legend className="text-xl font-bold text-[#795548] dark:text-rose-200 border-b dark:border-slate-700 pb-2 mb-4">{content[language].shopInfo}</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="shopNameEn">{content[language].shopNameEn}</label>
                                <input type="text" name="shopNameEn" id="shopNameEn" value={formState.shopNameEn} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="shopNameBn">{content[language].shopNameBn}</label>
                                <input type="text" name="shopNameBn" id="shopNameBn" value={formState.shopNameBn} onChange={handleInputChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="shopCategory">{content[language].shopCategory}</label>
                            <select name="shopCategory" id="shopCategory" value={formState.shopCategory} onChange={handleInputChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                <option>Cakes & Pastries</option>
                                <option>Restaurant</option>
                                <option>Baby & Mom Care</option>
                                <option>Electronics</option>
                                <option>Home Goods</option>
                                <option>Groceries</option>
                                <option>Apparel</option>
                                <option>Other</option>
                            </select>
                        </div>
                    </fieldset>

                    {/* Owner Information */}
                    <fieldset className="space-y-4">
                        <legend className="text-xl font-bold text-[#795548] dark:text-rose-200 border-b dark:border-slate-700 pb-2 mb-4">{content[language].ownerInfo}</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="ownerName">{content[language].ownerName}</label>
                            <input type="text" name="ownerName" id="ownerName" value={formState.ownerName} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="phone">{content[language].phone}</label>
                                <input type="tel" name="phone" id="phone" value={formState.phone} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">{content[language].email}</label>
                                <input type="email" name="email" id="email" value={formState.email} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">{content[language].password}</label>
                            <input type="password" name="password" id="password" value={formState.password} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="address">{content[language].address}</label>
                            <textarea name="address" id="address" rows={3} value={formState.address} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"></textarea>
                        </div>
                    </fieldset>

                    {/* Payment Information */}
                    <fieldset className="space-y-4">
                        <legend className="text-xl font-bold text-[#795548] dark:text-rose-200 border-b dark:border-slate-700 pb-2 mb-4">{content[language].paymentInfo}</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="paymentMethod">{content[language].paymentMethod}</label>
                            <select name="paymentMethod" id="paymentMethod" value={formState.paymentMethod} onChange={handleInputChange} className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200">
                                <option>bKash</option>
                                <option>Nagad</option>
                                <option>Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="paymentDetails">{content[language].paymentDetails}</label>
                            <input type="text" name="paymentDetails" id="paymentDetails" value={formState.paymentDetails} onChange={handleInputChange} required placeholder={content[language].paymentPlaceholder} className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                    </fieldset>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button type="submit" className="w-full bg-rose-500 text-white font-bold py-3 rounded-lg hover:bg-rose-600 transition-colors">
                            {content[language].submit}
                        </button>
                    </div>
                </form>
                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {content[language].haveAccount}{' '}
                    <a onClick={() => navigate('/login')} className="font-medium text-rose-500 hover:text-rose-600 cursor-pointer">
                        {content[language].login}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default VendorRegistrationPage;