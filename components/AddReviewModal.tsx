import React, { useState } from 'react';
import { ReviewService } from '../src/services/reviewService';
import { useApp } from '../src/context/AppContext';
import { StarIcon, XIcon } from './icons';
import { Product } from '../types';
import { toast } from 'react-hot-toast';

interface AddReviewModalProps {
    product: Product;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ product, onClose, onSuccess }) => {
    const { language, currentUser } = useApp();
    const [rating, setRating] = useState(5);
    const [commentEn, setCommentEn] = useState('');
    const [commentBn, setCommentBn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const toastId = toast.loading(language === 'en' ? "Submitting review..." : "রিভিউ জমা হচ্ছে...");
        setIsSubmitting(true);
        try {
            await ReviewService.addReview(product.id, {
                productId: product.id,
                customerId: currentUser.id,
                customerName: currentUser.name,
                customerImage: currentUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}`,
                rating,
                comment: {
                    en: commentEn || commentBn,
                    bn: commentBn || commentEn
                }
            });
            toast.success(
                language === 'en'
                    ? "Review submitted! It will be visible after admin approval."
                    : "রিভিউ জমা দেওয়া হয়েছে! অ্যাডমিন অনুমোদনের পর এটি দেখা যাবে।",
                { id: toastId, duration: 5000 }
            );
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast.error(language === 'en' ? "Failed to submit review. Please try again." : "রিভিউ জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border dark:border-slate-700">
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                            <StarIcon className="w-6 h-6 text-rose-500 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {language === 'en' ? 'Review Product' : 'পণ্য রিভিউ দিন'}
                            </h3>
                            <p className="text-xs text-gray-500 truncate w-48 md:w-64">
                                {product.name[language]}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <XIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Star Rating */}
                    <div className="flex flex-col items-center">
                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                            {language === 'en' ? 'Quality Rating' : 'পণ্যের মান'}
                        </label>
                        <div className="flex gap-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-all duration-300 transform hover:scale-125 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'} `}
                                >
                                    <StarIcon className={`w-12 h-12 ${star <= rating ? 'fill-current' : ''} `} />
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 text-sm font-bold text-rose-500">
                            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                        </p>
                    </div>

                    {/* Comments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase">
                                English Comment
                            </label>
                            <textarea
                                value={commentEn}
                                onChange={(e) => setCommentEn(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none text-sm"
                                rows={4}
                                placeholder="What did you like about it?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase font-noto">
                                বাংলা মন্তব্য
                            </label>
                            <textarea
                                value={commentBn}
                                onChange={(e) => setCommentBn(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none font-noto text-sm"
                                rows={4}
                                placeholder="আপনার মন্তব্য লিখুন..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-100 dark:border-slate-600"
                        >
                            {language === 'en' ? 'Cancel' : 'বাতিল'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (!commentEn && !commentBn)}
                            className="flex-1 py-4 px-6 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting
                                ? (language === 'en' ? 'Saving...' : 'জমা হচ্ছে...')
                                : (language === 'en' ? 'Post Review' : 'রিভিউ পোস্ট দিন')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddReviewModal;
