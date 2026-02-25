import React, { useState, useEffect } from 'react';
import { db } from '../../src/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { UserReview, Product } from '../../types';
import { ReviewService } from '../../src/services/reviewService';
import { CheckIcon, XIcon, StarIcon, ChatBubbleLeftRightIcon, ArrowPathIcon } from '../../components/icons';
import { toast } from 'react-hot-toast';
import { useApp } from '../../src/context/AppContext';

const ReviewModerationTab: React.FC = () => {
    const { language, products } = useApp();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Setup real-time listener for reviews
        const q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserReview));
            setReviews(reviewsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const runAutoApproval = async () => {
        const toastId = toast.loading("Checking for auto-approvals...");
        try {
            const count = await ReviewService.checkAutoApproval();
            if (count > 0) {
                toast.success(language === 'en'
                    ? `Auto-approved ${count} old reviews.`
                    : `${count}টি পুরানো রিভিউ স্বয়ংক্রিয়ভাবে অনুমোদিত হয়েছে।`, { id: toastId });
            } else {
                toast.success("No pending reviews older than 7 days.", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Auto-approval check failed", { id: toastId });
        }
    };

    const handleApprove = async (reviewId: string) => {
        try {
            await ReviewService.approveReview(reviewId);
            toast.success(language === 'en' ? "Review approved and published!" : "রিভিউ অনুমোদন এবং পাবলিশ করা হয়েছে!");
        } catch (error) {
            console.error(error);
            toast.error(`Failed to approve review: ${(error as any).message}`);
        }
    };

    const handleReject = async (reviewId: string) => {
        const reason = prompt(language === 'en' ? "Reason for rejection:" : "প্রত্যাখ্যানের কারণ:");
        if (reason === null) return;
        try {
            await ReviewService.rejectReview(reviewId, reason);
            toast.success("Review rejected.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to reject review.");
        }
    };

    if (loading) return <div className="p-20 text-center">Loading reviews...</div>;

    const pendingCount = reviews.filter(r => r.status === 'Pending').length;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {language === 'en' ? 'Review Moderation' : 'রিভিউ মডারেশন'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'en' ? `${pendingCount} reviews waiting for approval` : `${pendingCount}টি রিভিউ অনুমোদনের অপেক্ষায়`}
                    </p>
                </div>
                <button
                    onClick={runAutoApproval}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                    <ArrowPathIcon className="w-4 h-4" />
                    {language === 'en' ? 'Check Auto-Approval' : 'স্বয়ংক্রিয় অনুমোদন চেক করুন'}
                </button>
            </div>

            <div className="space-y-4">
                {reviews.map(review => (
                    <div key={review.id} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 transition-all ${review.status === 'Pending' ? 'border-yellow-500 shadow-yellow-50 shadow-md' :
                        review.status === 'Approved' ? 'border-green-500' : 'border-red-500'
                        }`}>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex gap-4">
                                <img src={review.customerImage} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{review.customerName}</h4>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${review.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                            review.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {review.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <StarIcon key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(review.date).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-700 mb-3 italic">
                                        "{review.comment[language] || review.comment.en}"
                                    </p>

                                    {/* Product Context */}
                                    {products.find(p => p.id === review.productId) && (
                                        <div className="flex items-center gap-3 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                            <img
                                                src={products.find(p => p.id === review.productId)?.images[0]}
                                                alt=""
                                                className="w-10 h-10 rounded-lg object-cover"
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-blue-900 dark:text-blue-300 truncate">
                                                    {products.find(p => p.id === review.productId)?.name[language]}
                                                </p>
                                                <div className="flex gap-1 items-center">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${products.find(p => p.id === review.productId)?.productType === 'resell'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {products.find(p => p.id === review.productId)?.productType === 'resell' ? 'Used Item' : 'New Product'}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400">ID: {review.productId.slice(-6)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex md:flex-col gap-2 justify-end">
                                {review.status === 'Pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(review.id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 dark:shadow-none"
                                        >
                                            <CheckIcon className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(review.id)}
                                            className="px-4 py-2 bg-white dark:bg-slate-700 text-red-500 rounded-xl font-bold border border-red-100 dark:border-red-900/30 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XIcon className="w-4 h-4" /> Reject
                                        </button>
                                    </>
                                )}
                                {review.status === 'Approved' && (
                                    <button
                                        disabled
                                        className="px-4 py-2 bg-green-50 text-green-500 rounded-xl font-bold flex items-center justify-center gap-2 opacity-50 cursor-default"
                                    >
                                        <CheckIcon className="w-4 h-4" /> Published
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-dashed border-gray-100">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews yet</h3>
                        <p className="text-gray-500">When customers submit product reviews, they will appear here for moderation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewModerationTab;
