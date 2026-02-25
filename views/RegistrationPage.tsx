
import React, { useState } from 'react';
import { useApp } from '../src/context/AppContext';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
    const { language, register } = useApp();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const content = {
        en: {
            title: "Create an Account",
            subtitle: "Join Sakhipur Bazar today.",
            nameLabel: "Full Name",
            emailLabel: "Email Address",
            passwordLabel: "Password",
            registerButton: "Sign Up",
            haveAccount: "Already have an account?",
            login: "Log In",
            regFailed: "Registration failed. Please try again.",
        },
        bn: {
            title: "অ্যাকাউন্ট তৈরি করুন",
            subtitle: "আজই সখিপুর বাজারে যোগ দিন।",
            nameLabel: "পুরো নাম",
            emailLabel: "ইমেল ঠিকানা",
            passwordLabel: "পাসওয়ার্ড",
            registerButton: "সাইন আপ করুন",
            haveAccount: "ইতিমধ্যে একটি অ্যাকাউন্ট আছে?",
            login: "লগইন করুন",
            regFailed: "নিবন্ধন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await register(name, email, password); // Updated to pass password
            navigate('/');
        } catch (err: any) {
            console.error("Registration error:", err);
            const errorMessage = err.code ? `${err.code}: ${err.message}` : err.message;
            setError(errorMessage || content[language].regFailed);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1
                        className="text-center text-4xl font-bold text-[#795548] dark:text-rose-300 cursor-pointer"
                        onClick={() => navigate('/')}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                        Sakhipur<span className="text-[#FFB6B6]">Bazar</span>
                    </h1>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {content[language].title}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {content[language].subtitle}
                    </p>
                </div>
                <form className="mt-8 space-y-6 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg" onSubmit={handleRegister}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="full-name" className="sr-only">{content[language].nameLabel}</label>
                            <input
                                id="full-name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 dark:bg-slate-700 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                placeholder={content[language].nameLabel}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">{content[language].emailLabel}</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 dark:bg-slate-700 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                placeholder={content[language].emailLabel}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">{content[language].passwordLabel}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 dark:bg-slate-700 focus:outline-none focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                                placeholder={content[language].passwordLabel}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FFB6B6] hover:bg-[#e6a4a4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                            {content[language].registerButton}
                        </button>
                    </div>
                </form>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {content[language].haveAccount}{' '}
                    <a onClick={() => navigate('/login')} className="font-medium text-rose-500 hover:text-rose-600 cursor-pointer">
                        {content[language].login}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;