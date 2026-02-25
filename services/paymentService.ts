import { httpsCallable } from 'firebase/functions';
import { functions } from '../src/lib/firebase';

interface CreatePaymentResponse {
    paymentID: string;
    createTime: string;
    orgLogo?: string;
    transactionStatus: string;
    redirectURL: string;
}

interface ExecutePaymentResponse {
    success: boolean;
    trxID: string;
    message: string;
}

export const PaymentService = {
    /**
     * Calls the backend to create a payment request.
     */
    createPayment: async (amount: number, method: 'bKash' | 'Nagad' | 'Bank Card'): Promise<CreatePaymentResponse> => {
        const createPaymentFn = httpsCallable<any, CreatePaymentResponse>(functions, 'createPayment');
        try {
            const result = await createPaymentFn({ amount, method });
            return result.data;
        } catch (error) {
            console.error("PaymentService.createPayment error:", error);
            throw error;
        }
    },

    /**
     * Calls the backend to execute (finalize) a payment.
     */
    executePayment: async (paymentID: string, amount: number, method: string): Promise<ExecutePaymentResponse> => {
        const executePaymentFn = httpsCallable<any, ExecutePaymentResponse>(functions, 'executePayment');
        try {
            const result = await executePaymentFn({ paymentID, amount, method });
            return result.data;
        } catch (error) {
            console.error("PaymentService.executePayment error:", error);
            throw error;
        }
    }
};
