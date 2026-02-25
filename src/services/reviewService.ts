import { db } from '../lib/firebase';
import { collection, doc, updateDoc, getDoc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Product, Order, UserReview } from '../../types';


export const ReviewService = {
    /**
     * Submit a new review for a product (Starts as Pending)
     */
    addReview: async (
        productId: string,
        review: Omit<UserReview, 'id' | 'date' | 'status'>
    ): Promise<string> => {
        // 0. CHECK ELIGIBILITY: Must have a delivered order for this product
        const ordersRef = collection(db, 'orders');
        const eligibilityQuery = query(
            ordersRef,
            where('customerId', '==', review.customerId),
            where('status', 'in', ['Delivered', 'Completed'])
        );
        const orderSnap = await getDocs(eligibilityQuery);
        const hasPurchased = orderSnap.docs.some(doc => {
            const order = doc.data() as Order;
            return order.items.some(item => item.productId === productId);
        });

        if (!hasPurchased) {
            throw new Error("Purchase required to review this product.");
        }

        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            throw new Error("Product not found");
        }

        const product = productSnap.data() as Product;
        const newReviewId = `REV-${Date.now()}`;
        const newReviewDate = new Date().toISOString();

        // 1. Add to global reviews collection for tracking/moderation
        const globalReviewData: UserReview = {
            ...review,
            id: newReviewId,
            vendorId: product.vendorId || product.sellerId, // Added: Ensure backlink to vendor/seller
            date: newReviewDate,
            status: 'Pending',
            createdAt: serverTimestamp()
        };

        const globalRef = await addDoc(collection(db, 'reviews'), globalReviewData);
        return globalRef.id;
    },

    /**
     * Approve a review (Moves to product and updates ratings)
     */
    approveReview: async (reviewId: string): Promise<void> => {
        const reviewRef = doc(db, 'reviews', reviewId);
        const reviewSnap = await getDoc(reviewRef);
        if (!reviewSnap.exists()) throw new Error("Review not found");
        const review = reviewSnap.data() as UserReview;

        const productRef = doc(db, 'products', review.productId);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) throw new Error("Product not found");
        const product = productSnap.data() as Product;

        const currentReviews = product.reviews || [];
        const newReview = {
            id: review.id,
            customerName: review.customerName,
            customerImage: review.customerImage,
            rating: review.rating,
            comment: review.comment,
            date: review.date,
            status: 'Approved'
        };

        const updatedReviews = [...currentReviews, newReview];
        const totalRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
        const newAverageRating = Number((totalRating / updatedReviews.length).toFixed(1));

        // 1. Update Review status
        await updateDoc(reviewRef, { status: 'Approved' });

        // 2. Update Product document
        await updateDoc(productRef, {
            reviews: updatedReviews,
            rating: newAverageRating
        });

        // 3. Update Vendor Rating
        if (product.vendorId) {
            await ReviewService.updateVendorRating(product.vendorId);
        }
    },

    /**
     * Reject a review
     */
    rejectReview: async (reviewId: string, reason?: string): Promise<void> => {
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
            status: 'Rejected',
            rejectionReason: reason || 'Not approved by admin.'
        });
    },

    /**
     * Get all approved reviews for a product
     */
    getApprovedReviewsForProduct: async (productId: string): Promise<UserReview[]> => {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
            reviewsRef,
            where('productId', '==', productId),
            where('status', '==', 'Approved')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReview));
    },

    /**
     * Re-calculate and update Vendor average rating
     */
    updateVendorRating: async (vendorId: string): Promise<void> => {
        try {
            // 1. Get all products by this vendor that have ratings
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('vendorId', '==', vendorId));
            const querySnapshot = await getDocs(q);

            let totalRating = 0;
            let totalReviews = 0;

            querySnapshot.forEach((doc) => {
                const product = doc.data() as Product;
                if (product.rating && product.reviews && product.reviews.length > 0) {
                    // Weight by number of reviews per product for a more accurate global average
                    totalRating += (product.rating * product.reviews.length);
                    totalReviews += product.reviews.length;
                }
            });

            const newVendorRating = totalReviews > 0
                ? Number((totalRating / totalReviews).toFixed(1))
                : 0;

            // 2. Update Vendor document in 'vendors' collection
            const vendorRef = doc(db, 'vendors', vendorId);
            // We verify existence first to avoid errors if vendor was deleted
            const vendorSnap = await getDoc(vendorRef);

            if (vendorSnap.exists()) {
                const updates: any = { rating: newVendorRating };
                const vendorData = vendorSnap.data();

                // If it's a delivery man or rider, they might have a profile rating too
                if (vendorData.deliveryManProfile) {
                    updates['deliveryManProfile.rating'] = newVendorRating;
                }

                await updateDoc(vendorRef, updates);
                console.log(`Vendor ${vendorId} rating updated to ${newVendorRating}`);
            } else {
                console.warn(`Vendor ${vendorId} not found for rating update`);
            }

        } catch (error) {
            console.error("Error updating vendor rating:", error);
        }
    },

    /**
     * Check for pending reviews older than 7 days and auto-approve them.
         * Use a safe, client-side filtering approach to avoid complex index requirements.
         */
    checkAutoApproval: async (): Promise<number> => {
        try {
            console.log("Checking for auto-approval of reviews...");
            const reviewsRef = collection(db, 'reviews');
            // We only query for 'Pending' status to keep it simple and index-free
            const q = query(reviewsRef, where('status', '==', 'Pending'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return 0;

            const now = Date.now();
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
            let approvedCount = 0;

            for (const docSnap of snapshot.docs) {
                const review = docSnap.data() as UserReview;

                // Parse date: handle both Firestore Timestamp and ISO string
                let reviewTime = 0;
                if (review.createdAt && typeof (review.createdAt as any).toDate === 'function') {
                    reviewTime = (review.createdAt as any).toDate().getTime();
                } else if (review.date) {
                    reviewTime = new Date(review.date).getTime();
                }

                // If review is older than 7 days, approve it
                if (reviewTime > 0 && (now - reviewTime) > SEVEN_DAYS_MS) {
                    await ReviewService.approveReview(docSnap.id);
                    approvedCount++;
                }
            }

            if (approvedCount > 0) {
                console.log(`Auto-approved ${approvedCount} reviews.`);
            }
            return approvedCount;
        } catch (error) {
            console.error("Auto-approval check failed:", error);
            return 0;
        }
    }
};
