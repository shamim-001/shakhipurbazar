
import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { TruckIcon } from '../components/icons';

const DeliveryManRegistrationPage = () => {
    const { language, registerDeliveryMan } = useApp();
    const navigate = useNavigate();

    const [formState, setFormState] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        license: '', // Can be NID for delivery men
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
            const newUser = await registerDeliveryMan(formState);
            if (newUser) {
                navigate('/delivery-dashboard');
            } else {
                setError("Registration failed. This email might already be in use.");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        }
    };

    const content = {
        en: {
            title: "Join as Delivery Man",
            description: "Earn money by delivering products from shops to customers.",
            personalInfo: "Personal Information",
            name: "Full Name",
            phone: "Phone Number",
            email: "Email Address",
            address: "Home/Base Address",
            licenseInfo: "Identification & Security",
            license: "NID / Birth Certificate Number",
            password: "Password",
            submit: "Register as Delivery Man",
            haveAccount: "Already have an account?",
            login: "Log In",
            isRider: "Want to rent your car/bike instead?",
            riderLink: "Register as Rider"
        },
        bn: {
            title: "ডেলিভারি ম্যান হিসেবে যোগ দিন",
            description: "দোকান থেকে গ্রাহকদের কাছে পণ্য পৌঁছে দিয়ে আয় করুন।",
            personalInfo: "ব্যক্তিগত তথ্য",
            name: "পুরো নাম",
            phone: "ফোন নম্বর",
            email: "ইমেইল ঠিকানা",
            address: "বাসার ঠিকানা",
            licenseInfo: "পরিচয়পত্র ও নিরাপত্তা",
            license: "এনআইডি / জন্ম নিবন্ধন নম্বর",
            password: "পাসওয়ার্ড",
            submit: "ডেলিভারি ম্যান হিসেবে নিবন্ধন করুন",
            haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
            login: "লগইন করুন",
            isRider: "গাড়ি/বাইক ভাড়া দিতে চান?",
            riderLink: "রাইডার হিসেবে নিবন্ধন করুন"
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TruckIcon className="w-8 h-8 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#795548] dark:text-green-200 mb-2">{content[language].title}</h1>
                    <p className="text-gray-600 dark:text-gray-300">{content[language].description}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b dark:border-slate-700 pb-2 mb-4 w-full">{content[language].personalInfo}</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].name}</label>
                            <input type="text" name="name" value={formState.name} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].phone}</label>
                                <input type="tel" name="phone" value={formState.phone} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].email}</label>
                                <input type="email" name="email" value={formState.email} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].address}</label>
                            <input type="text" name="address" value={formState.address} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                    </fieldset>

                    <fieldset className="space-y-4">
                        <legend className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b dark:border-slate-700 pb-2 mb-4 w-full">{content[language].licenseInfo}</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].license}</label>
                            <input type="text" name="license" value={formState.license} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].password}</label>
                            <input type="password" name="password" value={formState.password} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                    </fieldset>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button type="submit" className="w-full bg-[#2c3e50] text-white font-bold py-3 rounded-lg hover:bg-[#34495e] transition-colors">
                        {content[language].submit}
                    </button>
                </form>
                <div className="mt-4 text-center space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {content[language].haveAccount}{' '}
                        <a onClick={() => navigate('/login')} className="font-medium text-rose-500 hover:text-rose-600 cursor-pointer">
                            {content[language].login}
                        </a>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {content[language].isRider}{' '}
                        <a onClick={() => navigate('/rider/register')} className="font-medium text-blue-500 hover:text-blue-600 cursor-pointer">
                            {content[language].riderLink}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeliveryManRegistrationPage;
