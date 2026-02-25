import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { UserIcon, StoreIcon, IdentificationIcon, TruckIcon, GlobeAltIcon } from '../components/icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
    const { language, login, currentUser, pendingBooking, loginWithGoogle, loginWithFacebook } = useApp();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        if (currentUser) {
            navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    const content = {
        en: {
            title: "Welcome Back",
            subtitle: "Log in to your Sakhipur Bazar account.",
            emailLabel: "Email Address",
            passwordLabel: "Password",
            loginButton: "Log In",
            forgotPassword: "Forgot Password?",
            noAccount: "Don't have an account?",
            signUp: "Sign Up",
            invalidCreds: "Invalid email or password.",
            demoTitle: "Demo Accounts (Click to Auto-Login)",
            passwordHint: "Note: In this demo, you can use ANY password.",
            demoFilledAlert: "Demo credentials for a customer have been filled. Password can be anything!",
            demoFilledAlertBn: "ডেমো গ্রাহকের তথ্য পূরণ করা হয়েছে। যেকোনো পাসওয়ার্ড ব্যবহার করতে পারেন!"
        },
        bn: {
            title: "স্বাগতম",
            subtitle: "আপনার সখিপুর বাজার অ্যাকাউন্টে লগইন করুন।",
            emailLabel: "ইমেল ঠিকানা",
            passwordLabel: "পাসওয়ার্ড",
            loginButton: "লগইন করুন",
            forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
            noAccount: "অ্যাকাউন্ট নেই?",
            signUp: "সাইন আপ করুন",
            invalidCreds: "অবৈধ ইমেল বা পাসওয়ার্ড।",
            demoTitle: "ডেমো অ্যাকাউন্ট (স্বয়ংক্রিয় লগইনের জন্য ক্লিক করুন)",
            passwordHint: "নোট: এই ডেমোতে আপনি যেকোনো পাসওয়ার্ড ব্যবহার করতে পারেন।",
            demoFilledAlert: "Demo credentials for a customer have been filled. Password can be anything!",
            demoFilledAlertBn: "ডেমো গ্রাহকের তথ্য পূরণ করা হয়েছে। যেকোনো পাসওয়ার্ড ব্যবহার করতে পারেন!"
        }
    };

    const performLogin = async (loginEmail: string, loginPass: string) => {
        try {
            const firebaseUser = await login(loginEmail, loginPass) as any;
            if (firebaseUser) {
                // Fetch full user profile to get role
                const { UserService } = await import('../src/services/userService');
                const userDoc = await UserService.getUserProfile(firebaseUser.uid);

                if (!userDoc) {
                    // EMERGENCY RECOVERY for Admin
                    if (firebaseUser.email === 'mdnurul.work@gmail.com') {
                        const newAdmin = {
                            id: firebaseUser.uid,
                            name: 'Admin',
                            email: firebaseUser.email,
                            role: 'super_admin' as const,
                            image: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=Super+Admin`,
                            phone: '',
                            address: '',
                            walletBalance: 0,
                            addressBook: [],
                            createdAt: new Date().toISOString()
                        };
                        await UserService.createUserProfile(newAdmin);
                        navigate('/admin');
                        return;
                    } else {
                        // Regular user missing profile
                        setError("Account exists but profile is missing. Please contact support.");
                        return;
                    }
                } else {
                    // Start: Emergency Promotion for Existing Profile
                    if (firebaseUser.email === 'mdnurul.work@gmail.com' && userDoc.role !== 'super_admin') {
                        await UserService.updateUserProfile(firebaseUser.uid, { role: 'super_admin' });
                        userDoc.role = 'super_admin';
                        toast.success("Profile upgraded to Super Admin!");
                    }
                    // End: Emergency Promotion
                }

                // DATA RECOVERY: Comprehensive scan for all missing profiles
                if (userDoc) {
                    const { collection, query, where, getDocs } = await import('firebase/firestore');
                    const { db } = await import('../src/lib/firebase');

                    // Query vendors collection for this email
                    const q = query(collection(db, 'vendors'), where('email', '==', firebaseUser.email));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const updates: any = {};
                        let newRole = userDoc.role;

                        querySnapshot.forEach((doc) => {
                            const data = doc.data();
                            // Link Shop
                            if (data.type === 'shop' && !userDoc.shopId) {
                                updates.shopId = doc.id;
                                if (newRole === 'customer') newRole = 'vendor';
                            }
                            // Link Rider/Driver
                            else if ((data.type === 'rider' || data.type === 'driver') && !userDoc.driverId) {
                                updates.driverId = doc.id;
                                if (newRole === 'customer') newRole = 'driver';
                            }
                            // Link Delivery Man
                            else if (data.type === 'deliveryMan' && !userDoc.deliveryManId) {
                                updates.deliveryManId = doc.id;
                                if (newRole === 'customer') newRole = 'delivery';
                            }
                            // Link Agency
                            else if (data.type === 'agency' && !userDoc.agencyId) {
                                updates.agencyId = doc.id;
                                if (newRole === 'customer') newRole = 'agency';
                            }
                        });

                        // Apply updates if any new links were found
                        if (Object.keys(updates).length > 0) {
                            // Only update role if it's currently customer
                            if (newRole !== userDoc.role && userDoc.role === 'customer') {
                                updates.role = newRole;
                            }

                            await UserService.updateUserProfile(firebaseUser.uid, updates);
                            // Update local userDoc reference
                            Object.assign(userDoc, updates);
                        }
                    }
                }

                const role = userDoc.role || 'customer';

                // Role-based navigation
                if (role === 'admin' || role === 'super_admin') navigate('/admin');
                else if (role === 'vendor') navigate('/vendor-dashboard');
                else if (role === 'delivery') navigate('/delivery-dashboard');
                else if (role === 'driver') navigate('/rider-dashboard'); // Note: 'driver' role maps to rider-dashboard
                else navigate('/');
            }
        } catch (err: any) {
            console.error("Login error:", err);
            // Show user-friendly error message instead of Firebase error codes
            setError(content[language].invalidCreds);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        performLogin(email, password);
    };

    const handleForgotPassword = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error(language === 'en' ? 'Please enter a valid email address' : 'দয়া করে একটি বৈধ ইমেল ঠিকানা লিখুন');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            toast.success(
                language === 'en'
                    ? 'Password reset email sent! Check your inbox.'
                    : 'পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে! আপনার ইনবক্স চেক করুন।'
            );
        } catch (error: any) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/user-not-found') {
                toast.error(language === 'en' ? 'No account found with this email' : 'এই ইমেলে কোনো অ্যাকাউন্ট পাওয়া যায়নি');
            } else {
                toast.error(language === 'en' ? 'Failed to send password reset email' : 'পাসওয়ার্ড রিসেট ইমেল পাঠাতে ব্যর্থ হয়েছে');
            }
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6">
                <div>
                    <h1
                        className="text-center text-4xl font-bold text-[#795548] dark:text-rose-300 cursor-pointer font-poppins"
                        onClick={() => navigate('/')}
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

                {/* Demo Removed */}

                <form className="mt-8 space-y-6 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg" onSubmit={handleLogin}>
                    {/* ... (existing form content) ... */}

                    {/* Button Removed: Auto-promotion logic integrated into login */}




                    <div className="rounded-md shadow-sm -space-y-px">
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
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 dark:bg-slate-700 rounded-t-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                                placeholder={content[language].emailLabel}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">{content[language].passwordLabel}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 dark:text-gray-100 dark:bg-slate-700 rounded-b-md focus:outline-none focus:ring-rose-500 focus:border-rose-500 focus:z-10 sm:text-sm"
                                placeholder={content[language].passwordLabel}
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <a href="#" onClick={handleForgotPassword} className="font-medium text-rose-500 hover:text-rose-600">
                                {content[language].forgotPassword}
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FFB6B6] hover:bg-[#e6a4a4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors"
                        >
                            {content[language].loginButton}
                        </button>
                    </div>

                    {/* Login with Google Hidden for now */}
                </form>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {content[language].noAccount}{' '}
                    <a onClick={() => navigate('/register')} className="font-medium text-rose-500 hover:text-rose-600 cursor-pointer">
                        {content[language].signUp}
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
