import { PaymentGatewayService, defaultPaymentConfig, PaymentMethod, PaymentResponse } from './paymentGateway';

export interface PaymentInitiationResult {
    success: boolean;
    paymentId?: string;
    redirectUrl?: string; // For API compat
    paymentUrl?: string; // New field from Gateway
    error?: string;
}

// Initialize the gateway service with default config
const gateway = new PaymentGatewayService(defaultPaymentConfig);

export const PaymentService = {
    /**
     * Initiate a payment using the unified gateway
     */
    initiatePayment: async (
        orderId: string,
        method: 'bKash' | 'Nagad' | 'SSLCommerz' | 'Card', // Map these to PaymentMethod
        amount: number,
        customerInfo?: {
            name: string;
            email: string;
            phone: string;
            address?: string;
        }
    ): Promise<PaymentInitiationResult> => {

        let gatewayMethod: PaymentMethod = 'bkash';
        if (method === 'Nagad') gatewayMethod = 'nagad';
        else if (method === 'SSLCommerz' || method === 'Card') gatewayMethod = 'card';

        // Default dummy info if not provided (for backward compat with App.tsx calls that might miss it)
        const info = customerInfo || {
            name: 'Guest',
            email: 'guest@example.com',
            phone: '01700000000',
            address: 'Dhaka'
        };

        const response: PaymentResponse = await gateway.processPayment(gatewayMethod, {
            amount,
            orderId,
            customerName: info.name,
            customerEmail: info.email,
            customerPhone: info.phone,
            customerAddress: info.address
        });

        if (response.success) {
            return {
                success: true,
                paymentId: response.transactionId,
                redirectUrl: response.paymentUrl, // Mapping paymentUrl to redirectUrl for compatibility
                paymentUrl: response.paymentUrl
            };
        } else {
            return {
                success: false,
                error: response.error || 'Payment Failed'
            };
        }
    },

    // Verify payment (could verify with gateway)
    verifyPayment: async (paymentId: string, method?: string): Promise<boolean> => {
        if (method && method.toLowerCase() === 'nagad') {
            const res = await gateway.verifyPayment('nagad', paymentId);
            return res.success;
        }
        // For sandbox/others, we assume success or implement validation logic
        return true;
    }
};
