import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../src/context/AppContext';
import { getPagePath } from '../src/utils/navigation';
import { ImageService } from '../src/services/imageService';
import { FlightBooking } from '../types';
import { TicketIcon, UserIcon, GlobeAltIcon, PaperAirplaneIcon, CurrencyDollarIcon, CheckCircleIcon, ArrowUpOnSquareIcon, ClockIcon, ChatBubbleLeftRightIcon, XIcon } from '../components/icons';
import WithdrawalModal from '../src/components/WithdrawalModal';
import { toast } from 'react-hot-toast';
import InboxPage from './InboxPage';

type AgencyTab = 'overview' | 'requests' | 'active' | 'earnings' | 'messages';

const AgencyDashboardPage = () => {
    const { language, currentUser, flightBookings, updateFlightBookingStatus, vendors, updateVendor, requestVendorPayout, startChat } = useApp();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<AgencyTab>('requests');
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);

    const agency = vendors.find(v => v.id === currentUser?.agencyId);

    // Modal States
    const [selectedBooking, setSelectedBooking] = useState<FlightBooking | null>(null);
    const [quotePrice, setQuotePrice] = useState<number>(0);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [agentNotes, setAgentNotes] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Name Edit State
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [newNameEn, setNewNameEn] = useState(agency?.name?.en || '');
    const [newNameBn, setNewNameBn] = useState(agency?.name?.bn || '');

    const handleNameUpdate = async () => {
        if (!agency || !newNameEn.trim()) return;
        try {
            await updateVendor(agency.id, {
                name: {
                    en: newNameEn.trim(),
                    bn: newNameBn.trim() || newNameEn.trim()
                }
            });
            toast.success(language === 'en' ? 'Agency name updated!' : 'এজেন্সির নাম আপডেট করা হয়েছে!');
            setIsEditNameOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update name');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !agency) return;

        setUploadingLogo(true);
        const toastId = toast.loading("Uploading logo...");

        try {
            const downloadUrl = await ImageService.uploadImage(
                file,
                `agency_logos/${agency.id}_${Date.now()}`
            );

            await updateVendor(agency.id, { logo: downloadUrl });
            toast.success("Agency logo updated!", { id: toastId });
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload logo.", { id: toastId });
        } finally {
            setUploadingLogo(false);
        }
    };

    if (!currentUser || !currentUser.agencyId) {
        return <div className="p-8 text-center text-red-500">Access Denied. You are not a registered travel agency.</div>;
    }

    if (!agency) {
        return <div className="p-8 text-center text-red-500">Agency Profile Not Found.</div>;
    }

    const pendingRequests = flightBookings.filter(b => b.status === 'pending');
    const activeBookings = flightBookings.filter(b => b.status === 'confirmed' || b.status === 'quoted' || b.status === 'issued');

    // Calculate Earnings (Mock logic based on 'confirmed' or 'issued' items)
    const totalEarnings = flightBookings
        .filter(b => b.status === 'confirmed' || b.status === 'issued')
        .reduce((sum, b) => sum + (b.quoteAmount || 0), 0);

    const handleDeclineRequest = async () => {
        if (!selectedBooking) return;
        if (!confirm(language === 'en' ? "Are you sure you want to decline this request?" : "আপনি কি নিশ্চিত যে আপনি এই অনুরোধটি প্রত্যাখ্যান করতে চান?")) return;

        try {
            await updateFlightBookingStatus(selectedBooking.id, 'cancelled');
            toast.success(language === 'en' ? "Request declined." : "অনুরোধ প্রত্যাখ্যান করা হয়েছে");
            setSelectedBooking(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to decline request");
        }
    };

    const handleSendQuote = async () => {
        if (!selectedBooking || quotePrice <= 0) return;
        try {
            await updateFlightBookingStatus(selectedBooking.id, 'quoted', { quoteAmount: quotePrice });
            setIsQuoteModalOpen(false);
            setQuotePrice(0);
            setSelectedBooking(null);
            toast.success("Quote sent successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send quote");
        }
    };

    const handleIssueTicket = async () => {
        if (!selectedBooking || !selectedFile) return;

        // Validation for PDF/Image
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error(language === 'en' ? "Please upload a PDF or Image ticket." : "দয়া করে একটি PDF বা ইমেজ টিকিট আপলোড করুন।");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(language === 'en' ? "Uploading ticket..." : "টিকিট আপলোড করা হচ্ছে...");
        try {
            const ticketPath = `tickets/${agency.id}/${selectedBooking.id}_${Date.now()}_${selectedFile.name}`;
            const downloadUrl = await ImageService.uploadImage(selectedFile, ticketPath);

            // Update with new fields
            const currentTickets = selectedBooking.issuedTickets || [];
            await updateFlightBookingStatus(selectedBooking.id, 'issued', {
                issuedTickets: [...currentTickets, downloadUrl],
                ticketUrl: downloadUrl, // Backward compatibility
                agentNotes: agentNotes
            });

            toast.success(language === 'en' ? "Ticket issued successfully!" : "টিকিট সফলভাবে ইস্যু করা হয়েছে!", { id: toastId });
            setIsUploadModalOpen(false);
            setSelectedBooking(null);
            setSelectedFile(null);
            setAgentNotes("");
        } catch (error) {
            console.error(error);
            toast.error(language === 'en' ? "Failed to issue ticket" : "টিকিট ইস্যু করতে ব্যর্থ হয়েছে", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const content = {
        en: {
            title: "Agency Dashboard",
            overview: "Overview",
            requests: "New Requests",
            active: "Active Bookings",
            earnings: "Earnings",
            noRequests: "No new flight requests.",
            noActive: "No active bookings.",
            sendQuote: "Send Quote",
            uploadTicket: "Upload Ticket",
            viewDetails: "View Details",
            status: "Status",
            actions: "Actions",
            messages: "Messages",
            backProfile: "Back to Profile"
        },
        bn: {
            title: "এজেন্সি ড্যাশবোর্ড",
            overview: "একনজরে",
            requests: "নতুন অনুরোধ",
            active: "সক্রিয় বুকিং",
            earnings: "উপার্জন",
            noRequests: "কোনো নতুন ফ্লাইট অনুরোধ নেই।",
            noActive: "কোনো সক্রিয় বুকিং নেই।",
            sendQuote: "উদ্ধৃতি পাঠান",
            uploadTicket: "টিকিট আপলোড করুন",
            viewDetails: "বিস্তারিত দেখুন",
            status: "অবস্থা",
            actions: "ক্রিয়াকলাপ",
            messages: "মেসেজ",
            backProfile: "প্রোফাইলে ফিরে যান"
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-700',
            quoted: 'bg-blue-100 text-blue-700',
            confirmed: 'bg-green-100 text-green-700',
            issued: 'bg-purple-100 text-purple-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status as keyof typeof colors] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    const renderBookingCard = (booking: FlightBooking, showActions: boolean) => (
        <div key={booking.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-full">
                        <PaperAirplaneIcon className="w-5 h-5 text-sky-600 dark:text-sky-400 -rotate-45" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {booking.from} <span className="text-gray-400">➔</span> {booking.to}
                        </h3>
                        <p className="text-xs text-gray-500">Req #{booking.id.slice(-6)} • {new Date(booking.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg">
                <div>
                    <p className="text-gray-500 text-xs uppercase">Passenger</p>
                    <p className="font-semibold dark:text-gray-200">{booking.passengerName}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase">Travel Date</p>
                    <p className="font-semibold dark:text-gray-200">{new Date(booking.date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase">Details</p>
                    <p className="font-semibold dark:text-gray-200">{booking.type} • {booking.travelClass || 'Economy'}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase">Pax</p>
                    <p className="font-semibold dark:text-gray-200">{booking.passengers} Person(s)</p>
                </div>
            </div>

            {showActions && (
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={async () => {
                            const threadId = await startChat(booking.userId, { type: 'flight', id: booking.id });
                            if (threadId) navigate(getPagePath({ name: 'chat', threadId }));
                        }}
                        className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" /> {language === 'en' ? 'Chat' : 'চ্যাট'}
                    </button>

                    {booking.status === 'pending' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSelectedBooking(booking); handleDeclineRequest(); }}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <XIcon className="w-4 h-4" /> {language === 'en' ? 'Decline' : 'প্রত্যাখ্যান'}
                            </button>
                            <button
                                onClick={() => { setSelectedBooking(booking); setIsQuoteModalOpen(true); }}
                                className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700 transition-colors flex items-center gap-2"
                            >
                                <CurrencyDollarIcon className="w-4 h-4" /> {content[language].sendQuote}
                            </button>
                        </div>
                    )}
                    {booking.status === 'confirmed' && (
                        <button
                            onClick={() => { setSelectedBooking(booking); setIsUploadModalOpen(true); }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <ArrowUpOnSquareIcon className="w-4 h-4" /> {content[language].uploadTicket}
                        </button>
                    )}
                    {booking.status === 'issued' && (
                        <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                            <CheckCircleIcon className="w-4 h-4" /> Ticket Issued
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-b-4 border-amber-500">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Pending Requests</p>
                                <ClockIcon className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{pendingRequests.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-b-4 border-sky-500">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Active Bookings</p>
                                <PaperAirplaneIcon className="w-6 h-6 text-sky-500" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{activeBookings.length}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-b-4 border-green-500">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-500 dark:text-gray-400 text-sm uppercase font-bold">Total Sales</p>
                                <CurrencyDollarIcon className="w-6 h-6 text-green-500" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">৳{totalEarnings.toLocaleString()}</p>
                        </div>
                    </div>
                );
            case 'requests':
                return (
                    <div className="space-y-4">
                        {pendingRequests.length > 0 ? pendingRequests.map(b => renderBookingCard(b, true)) : (
                            <div className="text-center py-10 text-gray-500 bg-white dark:bg-slate-800 rounded-xl">{content[language].noRequests}</div>
                        )}
                    </div>
                );
            case 'active':
                return (
                    <div className="space-y-4">
                        {activeBookings.length > 0 ? activeBookings.map(b => renderBookingCard(b, true)) : (
                            <div className="text-center py-10 text-gray-500 bg-white dark:bg-slate-800 rounded-xl">{content[language].noActive}</div>
                        )}
                    </div>
                );
            case 'earnings':
                return (
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center">
                        <CurrencyDollarIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{content[language].earnings}</h2>
                        <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">৳{totalEarnings.toLocaleString()}</p>
                        <p className="text-gray-500 mt-2 mb-6">Total Ticket Value</p>

                        <button
                            onClick={() => setIsWithdrawalModalOpen(true)}
                            className="bg-sky-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-sky-700 disabled:opacity-50"
                            disabled={(agency.walletBalance || 0) <= 0}
                        >
                            {language === 'en' ? 'Withdraw Funds' : 'তহবিল উত্তোলন করুন'}
                        </button>
                        <WithdrawalModal
                            isOpen={isWithdrawalModalOpen}
                            onClose={() => setIsWithdrawalModalOpen(false)}
                            onSubmit={(amount, methodDetails) => requestVendorPayout(agency.id, amount, methodDetails)}
                            maxAmount={agency.walletBalance || 0}
                            currentBalance={agency.walletBalance || 0}
                            language={language}
                        />
                    </div>
                );
            case 'messages':
                return <InboxPage />;
            default: return null;
        }
    };

    return (
        <div className="bg-gray-50 dark:bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="bg-sky-600 text-white p-6 pb-12 rounded-b-[2rem] shadow-lg relative">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-2xl font-bold">{content[language].title}</h1>
                    <button onClick={() => navigate('/profile')} className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                        {content[language].backProfile}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="bg-white/20 p-1 rounded-2xl backdrop-blur-md w-20 h-20 overflow-hidden border-2 border-white/30">
                            {agency.logo ? (
                                <img src={agency.logo} alt={agency.name[language]} className="w-full h-full object-cover" />
                            ) : (
                                <GlobeAltIcon className="w-full h-full text-white p-4" />
                            )}
                            {uploadingLogo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-white text-sky-600 p-1.5 rounded-lg cursor-pointer shadow-lg hover:bg-sky-50 transition-transform hover:scale-110">
                            <ArrowUpOnSquareIcon className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                        </label>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">{agency.name[language]}</h2>
                            <button
                                onClick={() => {
                                    setNewNameEn(agency.name.en);
                                    setNewNameBn(agency.name.bn);
                                    setIsEditNameOpen(true);
                                }}
                                className="p-1 text-sky-100 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <ArrowUpOnSquareIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sky-100 text-sm">{currentUser.name} • {agency.agencyLicense || 'Verified Agency'}</p>
                    </div>
                </div>
            </div>

            {/* Edit Name Modal */}
            {isEditNameOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setIsEditNameOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl text-gray-800" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 dark:text-white">{language === 'en' ? 'Edit Agency Name' : 'এজেন্সির নাম পরিবর্তন করুন'}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Name (English)' : 'নাম (ইংরেজি)'}</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={newNameEn}
                                    onChange={e => setNewNameEn(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">{language === 'en' ? 'Name (Bengali)' : 'নাম (বাংলা)'}</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    value={newNameBn}
                                    onChange={e => setNewNameBn(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsEditNameOpen(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200">
                                {language === 'en' ? 'Cancel' : 'বাতিল'}
                            </button>
                            <button onClick={handleNameUpdate} className="flex-1 py-2 rounded-lg bg-sky-600 text-white font-bold">
                                {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="container mx-auto px-4 -mt-8 relative z-10 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-1 flex shadow-lg border border-gray-100 dark:border-slate-700 overflow-x-auto">
                    {(['overview', 'requests', 'messages', 'active', 'earnings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {content[language][tab]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 pb-20">
                {renderContent()}
            </div>

            {/* Quote Modal */}
            {isQuoteModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => setIsQuoteModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 dark:text-white">Send Quote</h3>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-500 mb-1">Enter Quoted Price (BDT)</label>
                            <input
                                type="number"
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-lg font-bold"
                                autoFocus
                                value={quotePrice}
                                onChange={e => setQuotePrice(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsQuoteModalOpen(false)} className="flex-1 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200">Cancel</button>
                            <button onClick={handleSendQuote} className="flex-1 py-2 rounded-lg bg-sky-600 text-white font-bold">Send Quote</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Ticket Modal */}
            {isUploadModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={() => { setIsUploadModalOpen(false); setAgentNotes(""); setSelectedFile(null); }}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-4 dark:text-white">
                            {language === 'en' ? 'Issue Tickets' : 'টিকিট ইস্যু করুন'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    {language === 'en' ? 'Select Ticket File (PDF/Image)' : 'টিকিট ফাইল নির্বাচন করুন (PDF/Image)'}
                                </label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        id="ticket-upload"
                                        className="hidden"
                                        accept=".pdf,image/*"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    <label
                                        htmlFor="ticket-upload"
                                        className={`w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/10'
                                            }`}
                                    >
                                        <ArrowUpOnSquareIcon className={`w-8 h-8 mb-2 ${selectedFile ? 'text-green-500' : 'text-gray-400 group-hover:text-sky-500'}`} />
                                        <span className={`text-xs font-medium text-center ${selectedFile ? 'text-green-600' : 'text-gray-500'}`}>
                                            {selectedFile ? selectedFile.name : (language === 'en' ? 'Click to upload PDF or Image' : 'PDF বা ইমেজ আপলোড করতে ক্লিক করুন')}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-500 mb-1">
                                    {language === 'en' ? 'Agent Notes (Optional)' : 'এজেন্ট নোট (ঐচ্ছিক)'}
                                </label>
                                <textarea
                                    className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                                    rows={3}
                                    placeholder={language === 'en' ? "Add details about flight or baggage..." : "ফ্লাইট বা ব্যাগেজ সম্পর্কে বিস্তারিত যোগ করুন..."}
                                    value={agentNotes}
                                    onChange={e => setAgentNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setIsUploadModalOpen(false); setAgentNotes(""); setSelectedFile(null); }}
                                className="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-700 font-bold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-200"
                            >
                                {language === 'en' ? 'Cancel' : 'বাতিল'}
                            </button>
                            <button
                                onClick={handleIssueTicket}
                                disabled={!selectedFile || isUploading}
                                className="flex-1 py-2.5 rounded-lg bg-sky-600 text-white font-bold disabled:opacity-50 transition-colors hover:bg-sky-700"
                            >
                                {isUploading ? (language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...') : (language === 'en' ? 'Issue Ticket' : 'টিকিট ইস্যু করুন')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyDashboardPage;
