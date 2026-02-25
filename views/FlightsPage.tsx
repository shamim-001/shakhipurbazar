import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { ChevronLeftIcon, GlobeAltIcon, PaperAirplaneIcon, MapPinIcon, CalendarIcon, UserIcon, CheckCircleIcon, CurrencyDollarIcon, XIcon, ChatBubbleLeftRightIcon } from '../components/icons';
import SEO from '../src/components/SEO';
import { toast } from 'react-hot-toast';

const FlightsPage: React.FC = () => {
    const { language, requestFlightBooking, flightBookings, updateFlightBookingStatus, currentUser, users, startChat } = useApp();
    const navigate = useNavigate();

    // Form State
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [date, setDate] = useState('');
    const [passengers, setPassengers] = useState(1);
    const [travelClass, setTravelClass] = useState<'Economy' | 'Business'>('Economy');
    const [type, setType] = useState<'one-way' | 'round-trip'>('one-way');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            toast.error(language === 'en' ? 'Please login first' : 'অনুগ্রহ করে আগে লগইন করুন');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestFlightBooking({
                type,
                from,
                to,
                date,
                passengers,
                travelClass,
                passengerName: currentUser.name || 'Unknown',
            } as any);
            // Reset form
            setFrom('');
            setTo('');
            setDate('');
            toast.success(language === 'en' ? 'Request sent successfully!' : 'অনুরোধ সফলভাবে পাঠানো হয়েছে!');
        } catch (error) {
            console.error(error);
            toast.error(language === 'en' ? 'Failed to send request' : 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBook = async (id: string, price: number) => {
        if (!confirm(language === 'en' ? `Confirm payment of ৳${price}?` : `৳${price} পেমেন্ট নিশ্চিত করুন?`)) return;
        try {
            await updateFlightBookingStatus(id, 'confirmed');
            toast.success(language === 'en' ? 'Payment successful! Booking confirmed.' : 'পেমেন্ট সফল! বুকিং নিশ্চিত হয়েছে।');
        } catch (error) {
            console.error(error);
            toast.error(language === 'en' ? 'Payment failed' : 'পেমেন্ট ব্যর্থ হয়েছে');
        }
    };

    const content = {
        en: {
            title: "Flight Booking",
            subtitle: "Request a quote for your journey",
            back: "Back",
            formTitle: "Where do you want to fly?",
            from: "From",
            to: "To",
            date: "Date",
            passengers: "Passengers",
            class: "Class",
            requestQuote: "Request Quote",
            myBookings: "My Flight Requests",
            noBookings: "No booking requests yet.",
            status: {
                pending: "Pending",
                quoted: "Quoted",
                confirmed: "Confirmed",
                issued: "Ticket Issued",
                cancelled: "Cancelled"
            },
            viewDetails: "View Details"
        },
        bn: {
            title: "ফ্লাইট বুকিং",
            subtitle: "আপনার ভ্রমণের জন্য একটি উদ্ধৃতি অনুরোধ করুন",
            back: "ফিরে যান",
            formTitle: "আপনি কোথায় যেতে চান?",
            from: "কোথা থেকে",
            to: "কোথায় যাবেন",
            date: "তারিখ",
            passengers: "যাত্রী",
            class: "ক্লাস",
            requestQuote: "উদ্ধৃতি অনুরোধ করুন",
            myBookings: "আমার ফ্লাইট অনুরোধ",
            noBookings: "এখনো কোনো বুকিং অনুরোধ নেই।",
            status: {
                pending: "অপেক্ষমান",
                quoted: "উদ্ধৃত",
                confirmed: "নিশ্চিত",
                issued: "টিকিট ইস্যু করা হয়েছে",
                cancelled: "বাতিল"
            },
            viewDetails: "বিস্তারিত দেখুন"
        }
    };

    return (
        <div className="bg-sky-50 dark:bg-slate-900 min-h-screen">
            <SEO
                title={content[language].title}
                description={content[language].subtitle}
                url="https://sakhipur-bazar.web.app/flights"
                schema={{
                    "@context": "https://schema.org/",
                    "@type": "Service",
                    "name": content[language].title,
                    "description": content[language].subtitle,
                    "provider": {
                        "@type": "LocalBusiness",
                        "name": "Sakhipur Bazar Travel Agency",
                        "address": {
                            "@type": "PostalAddress",
                            "addressLocality": "Sakhipur",
                            "addressCountry": "BD"
                        }
                    }
                }}
            />

            {/* Header Area */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-700 pb-32 pt-8 px-4 rounded-b-[3rem] shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="container mx-auto relative z-10">
                    <button onClick={() => navigate('/')} className="flex items-center text-white/80 hover:text-white mb-8 transition-colors">
                        <ChevronLeftIcon className="h-5 w-5 mr-1" />
                        {content[language].back}
                    </button>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold mb-3 flex items-center gap-3">
                                <PaperAirplaneIcon className="w-10 h-10 -rotate-45" /> {content[language].title}
                            </h1>
                            <p className="text-sky-100 text-lg">{content[language].subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-24 relative z-20 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Request Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{content[language].formTitle}</h2>
                            <form onSubmit={handleRequest} className="space-y-4">
                                {/* Type Selection */}
                                <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setType('one-way')}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'one-way' ? 'bg-white dark:bg-slate-600 shadow text-sky-600 dark:text-sky-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                    >
                                        One Way
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('round-trip')}
                                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === 'round-trip' ? 'bg-white dark:bg-slate-600 shadow text-sky-600 dark:text-sky-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                    >
                                        Round Trip
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{content[language].from}</label>
                                    <div className="relative">
                                        <GlobeAltIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all"
                                            placeholder="Dhaka (DAC)"
                                            value={from}
                                            onChange={e => setFrom(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{content[language].to}</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all"
                                            placeholder="Cox's Bazar (CXB)"
                                            value={to}
                                            onChange={e => setTo(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{content[language].date}</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="date"
                                            required
                                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{content[language].passengers}</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                required
                                                className="w-full pl-10 p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all"
                                                value={passengers}
                                                onChange={e => setPassengers(parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">{content[language].class}</label>
                                        <select
                                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-sky-400 outline-none text-gray-900 dark:text-white transition-all appearance-none"
                                            value={travelClass}
                                            onChange={e => setTravelClass(e.target.value as any)}
                                        >
                                            <option value="Economy">Economy</option>
                                            <option value="Business">Business</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-sky-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <PaperAirplaneIcon className="w-5 h-5 -rotate-45" />
                                            {content[language].requestQuote}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* My Bookings List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px]">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{content[language].myBookings}</h2>
                            </div>

                            <div className="p-6 space-y-4">
                                {flightBookings.length > 0 ? (
                                    flightBookings.map((booking) => (
                                        <div key={booking.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${booking.status === 'confirmed' || booking.status === 'issued' ? 'bg-green-100 text-green-600' :
                                                        booking.status === 'quoted' ? 'bg-blue-100 text-blue-600' :
                                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                                'bg-amber-100 text-amber-600'
                                                        }`}>
                                                        <PaperAirplaneIcon className="w-6 h-6 -rotate-45" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.status === 'confirmed' || booking.status === 'issued' ? 'bg-green-100 text-green-700' :
                                                                booking.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                                }`}>
                                                                {content[language].status[booking.status]}
                                                            </span>
                                                            <span className="text-xs text-gray-400">#{booking.id.slice(-6)}</span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                                            {booking.from} <span className="text-gray-400 mx-2">→</span> {booking.to}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                                                            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {new Date(booking.date).toLocaleDateString()}</span>
                                                            <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" /> {booking.passengers}</span>
                                                            {/* @ts-ignore - travelClass added to types but might lag */}
                                                            <span className="bg-gray-100 dark:bg-slate-600 px-2 rounded text-xs">{booking.travelClass || 'Economy'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2">
                                                    {booking.quoteAmount ? (
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">Quoted Price</p>
                                                            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">৳{booking.quoteAmount.toLocaleString()}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500 italic">Waiting for quote...</p>
                                                        </div>
                                                    )}

                                                    {booking.status === 'quoted' && (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={async () => {
                                                                    const adminId = users.find(u => u.role === 'admin')?.id;
                                                                    if (adminId) {
                                                                        const threadId = await startChat(adminId, {
                                                                            type: 'flight',
                                                                            id: booking.id,
                                                                            orderId: booking.id, // Reusing orderId field for ID
                                                                            vendorId: adminId, // Target is admin
                                                                            prefilledMessage: language === 'en'
                                                                                ? `Inquiry about Flight Request #${booking.id.slice(-6)}`
                                                                                : `ফ্লাইট অনুরোধ #${booking.id.slice(-6)} সম্পর্কে জানতে চাই`
                                                                        });
                                                                        if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                                    } else {
                                                                        toast.error("Support currently unavailable");
                                                                    }
                                                                }}
                                                                className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                            >
                                                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                                Chat
                                                            </button>
                                                            <button
                                                                onClick={() => handleBook(booking.id, booking.quoteAmount || 0)}
                                                                className="px-4 py-2 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200 dark:shadow-none"
                                                            >
                                                                Book Now
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Confirmed/Issued State Chat */}
                                            {['confirmed', 'issued', 'pending'].includes(booking.status) && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                                                    <button
                                                        onClick={async () => {
                                                            const adminId = users.find(u => u.role === 'admin')?.id;
                                                            if (adminId) {
                                                                const threadId = await startChat(adminId, {
                                                                    type: 'flight',
                                                                    id: booking.id,
                                                                    orderId: booking.id,
                                                                    vendorId: adminId,
                                                                    prefilledMessage: language === 'en'
                                                                        ? `Regarding Flight Booking #${booking.id.slice(-6)}`
                                                                        : `ফ্লাইট বুকিং #${booking.id.slice(-6)} সম্পর্কে`
                                                                });
                                                                if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                                                            } else {
                                                                toast.error("Support currently unavailable");
                                                            }
                                                        }}
                                                        className="text-gray-500 hover:text-sky-600 text-sm font-bold flex items-center gap-2 transition-colors mr-auto"
                                                    >
                                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                        {language === 'en' ? 'Contact Support' : 'সাপোর্টে কথা বলুন'}
                                                    </button>

                                                    {/* Admin/Agent Note or Ticket Link could go here */}
                                                    {booking.ticketUrl && booking.status === 'issued' && (
                                                        <div className="ml-auto">
                                                            <a href={booking.ticketUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-bold hover:underline">
                                                                <CheckCircleIcon className="w-5 h-5" /> Download Ticket
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 flex flex-col items-center">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                            <PaperAirplaneIcon className="w-10 h-10 -rotate-45" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400">{content[language].noBookings}</h3>
                                        <p className="text-gray-400 text-sm max-w-xs mx-auto mt-2">Any flight requests you make will appear here with their status updates.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default FlightsPage;
