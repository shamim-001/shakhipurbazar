
import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { TicketIcon } from '../components/icons';

const AgencyRegistrationPage = () => {
    const { language, registerAgency } = useApp();
    const navigate = useNavigate();

    const [formState, setFormState] = useState({
        agencyName: '',
        phone: '',
        email: '',
        address: '',
        license: '',
        password: '',
        name: '' // Owner name
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
            const newUser = await registerAgency(formState);
            if (newUser) {
                navigate('/agency-dashboard');
            } else {
                setError("Registration failed. This email might already be in use.");
            }
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        }
    };

    const content = {
        en: {
            title: "Register as Travel Agency",
            description: "List flights and manage travel bookings on Sakhipur Bazar.",
            agencyInfo: "Agency Information",
            agencyName: "Agency Name",
            ownerName: "Owner Full Name",
            phone: "Business Phone",
            email: "Email Address",
            address: "Office Address",
            licenseInfo: "License & Security",
            license: "Travel Agency License No.",
            password: "Password",
            submit: "Register Agency",
            haveAccount: "Already have an account?",
            login: "Log In"
        },
        bn: {
            title: "ট্রাভেল এজেন্সি হিসেবে নিবন্ধন করুন",
            description: "সখিপুর বাজারে ফ্লাইট তালিকাভুক্ত করুন এবং ভ্রমণ বুকিং পরিচালনা করুন।",
            agencyInfo: "এজেন্সি তথ্য",
            agencyName: "এজেন্সির নাম",
            ownerName: "মালিকের পুরো নাম",
            phone: "ব্যবসায়িক ফোন",
            email: "ইমেইল ঠিকানা",
            address: "অফিসের ঠিকানা",
            licenseInfo: "লাইসেন্স ও নিরাপত্তা",
            license: "ট্রাভেল এজেন্সি লাইসেন্স নম্বর",
            password: "পাসওয়ার্ড",
            submit: "এজেন্সি নিবন্ধন করুন",
            haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
            login: "লগইন করুন"
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-xl mx-auto">
                <div className="text-center mb-10">
                    <div className="bg-sky-100 dark:bg-sky-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TicketIcon className="w-8 h-8 text-sky-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#795548] dark:text-rose-200 mb-2">{content[language].title}</h1>
                    <p className="text-gray-600 dark:text-gray-300">{content[language].description}</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg space-y-8">
                    <fieldset className="space-y-4">
                        <legend className="text-lg font-bold text-gray-800 dark:text-gray-100 border-b dark:border-slate-700 pb-2 mb-4 w-full">{content[language].agencyInfo}</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].agencyName}</label>
                            <input type="text" name="agencyName" value={formState.agencyName} onChange={handleInputChange} required className="w-full border border-gray-300 dark:border-slate-600 rounded-md p-2 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{content[language].ownerName}</label>
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

                    <button type="submit" className="w-full bg-sky-600 text-white font-bold py-3 rounded-lg hover:bg-sky-700 transition-colors">
                        {content[language].submit}
                    </button>
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

export default AgencyRegistrationPage;
