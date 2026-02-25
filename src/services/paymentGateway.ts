// Payment Gateway Integration Service
// Supports: bKash, Nagad, SSL Commerz (Cards)

export type PaymentMethod = 'bkash' | 'nagad' | 'card' | 'wallet' | 'cod';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface PaymentConfig {
    // bKash
    bkashBaseUrl?: string;
    bkashAppKey?: string;
    bkashAppSecret?: string;
    bkashUsername?: string;
    bkashPassword?: string;

    // Nagad
    nagadBaseUrl?: string;
    nagadMerchantId?: string;
    nagadPublicKey?: string;
    nagadPrivateKey?: string;

    // SSL Commerz
    sslStoreId?: string;
    sslStorePassword?: string;
    sslBaseUrl?: string;
}

export interface PaymentRequest {
    amount: number;
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress?: string;
    description?: string;
}

export interface PaymentResponse {
    success: boolean;
    paymentUrl?: string;
    transactionId?: string;
    message?: string;
    error?: string;
}

/**
 * bKash Payment Gateway
 */
export class BkashService {
    private config: PaymentConfig;
    private token?: string;

    constructor(config: PaymentConfig) {
        this.config = config;
    }

    /**
     * Step 1 & 2: Create payment request via Cloud Function
     */
    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            // Import dynamically or assume 'functions' is available from firebase.ts
            // We need to make sure firebase is initialized and functions exported
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');

            const createPaymentFn = httpsCallable(functions, 'createPayment');

            // Call Backend
            const result = await createPaymentFn({
                amount: request.amount,
                method: 'bkash',
                reference: request.orderId
            });

            const data = result.data as any;

            if (data.redirectURL) {
                return {
                    success: true,
                    paymentUrl: data.redirectURL,
                    transactionId: data.paymentID
                };
            }

            return {
                success: false,
                error: 'Failed to retrieve payment URL from backend'
            };

        } catch (error: any) {
            console.error('bKash create payment error:', error);
            return {
                success: false,
                error: error.message || 'Backend error'
            };
        }
    }

    /**
     * Step 3: Execute payment via Cloud Function
     */
    async executePayment(paymentID: string): Promise<PaymentResponse> {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');

            const executePaymentFn = httpsCallable(functions, 'executePayment');

            // Call Backend
            const result = await executePaymentFn({
                paymentID,
                method: 'bkash'
            });

            const data = result.data as any;

            if (data.success) {
                return {
                    success: true,
                    transactionId: data.trxID,
                    message: data.message
                };
            }

            return {
                success: false,
                error: 'Payment execution failed on backend'
            };

        } catch (error: any) {
            console.error('bKash execute payment error:', error);
            return {
                success: false,
                error: error.message || 'Backend execution error'
            };
        }
    }
}

/**
 * Nagad Payment Gateway
 */
export class NagadService {
    private config: PaymentConfig;

    constructor(config: PaymentConfig) {
        this.config = config;
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');

            const createPaymentFn = httpsCallable(functions, 'createPayment');

            // Call Backend (Hardened)
            const result = await createPaymentFn({
                amount: request.amount,
                method: 'nagad',
                reference: request.orderId
            });

            const data = result.data as any;

            if (data.redirectURL) {
                return {
                    success: true,
                    paymentUrl: data.redirectURL,
                    transactionId: data.paymentID
                };
            }

            return {
                success: false,
                error: 'Failed to retrieve Nagad payment URL from backend'
            };
        } catch (error: any) {
            console.error('Nagad payment error:', error);
            return {
                success: false,
                error: error.message || 'Backend error'
            };
        }
    }

    private getClientIP(): string {
        // Return client IP - in production get from request
        return '192.168.0.1';
    }

    private generateChallenge(): string {
        // Generate random challenge for Nagad
        return Math.random().toString(36).substring(7);
    }

    async verifyPayment(paymentRefId: string): Promise<PaymentResponse> {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');
            const verifyNagadPaymentFn = httpsCallable(functions, 'verifyNagadPayment');

            const result = await verifyNagadPaymentFn({ paymentRefId });
            const data = result.data as any;

            if (data.success) {
                return {
                    success: true,
                    transactionId: data.transactionId,
                    message: 'Payment verified successfully'
                };
            }
            return {
                success: false,
                error: data.error || 'Verification failed'
            };
        } catch (error: any) {
            console.error('Nagad verification error:', error);
            return {
                success: false,
                error: error.message || 'Backend verification error'
            };
        }
    }
}

/**
 * SSL Commerz Payment Gateway (For Credit/Debit Cards)
 */
export class SSLCommerzService {
    private config: PaymentConfig;

    constructor(config: PaymentConfig) {
        this.config = config;
    }

    async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');

            const initiateSSLPaymentFn = httpsCallable(functions, 'initiateSSLPayment');

            const result = await initiateSSLPaymentFn({
                amount: request.amount,
                customerName: request.customerName,
                customerEmail: request.customerEmail,
                customerPhone: request.customerPhone,
                customerAddress: request.customerAddress,
                reference: request.orderId
            });

            const data = result.data as any;

            if (data.success && data.paymentUrl) {
                return {
                    success: true,
                    paymentUrl: data.paymentUrl,
                    transactionId: data.transactionId
                };
            }

            return {
                success: false,
                error: 'Failed to initiate payment via backend'
            };
        } catch (error: any) {
            console.error('SSL Commerz payment error:', error);
            return {
                success: false,
                error: error.message || 'Backend error'
            };
        }
    }

    async validatePayment(valId: string): Promise<boolean> {
        try {
            const { functions } = await import('../lib/firebase');
            const { httpsCallable } = await import('firebase/functions');

            const validateSSLPaymentFn = httpsCallable(functions, 'validateSSLPayment');

            const result = await validateSSLPaymentFn({ val_id: valId });
            const data = result.data as any;

            return data.success;
        } catch (error) {
            console.error('SSL Commerz validation error:', error);
            return false;
        }
    }
}

/**
 * Unified Payment Gateway Service
 */
export class PaymentGatewayService {
    private bkash?: BkashService;
    private nagad?: NagadService;
    private sslCommerz?: SSLCommerzService;

    constructor(config: PaymentConfig) {
        // Initialize services based on available config
        if (config.bkashAppKey) {
            this.bkash = new BkashService(config);
        }
        if (config.nagadMerchantId) {
            this.nagad = new NagadService(config);
        }
        if (config.sslStoreId) {
            this.sslCommerz = new SSLCommerzService(config);
        }
    }

    /**
     * Process payment with specified method
     */
    async processPayment(method: PaymentMethod, request: PaymentRequest): Promise<PaymentResponse> {
        switch (method) {
            case 'bkash':
                if (!this.bkash) {
                    return { success: false, error: 'bKash not configured' };
                }
                return await this.bkash.createPayment(request);

            case 'nagad':
                if (!this.nagad) {
                    return { success: false, error: 'Nagad not configured' };
                }
                return await this.nagad.createPayment(request);

            case 'card':
                if (!this.sslCommerz) {
                    return { success: false, error: 'SSL Commerz not configured' };
                }
                return await this.sslCommerz.initiatePayment(request);

            case 'wallet':
                // Handled internally - no external gateway
                return {
                    success: true,
                    message: 'Wallet payment processed internally'
                };

            case 'cod':
                // Cash on delivery - no payment processing needed
                return {
                    success: true,
                    message: 'Cash on delivery - no online payment needed'
                };

            default:
                return {
                    success: false,
                    error: 'Unsupported payment method'
                };
        }
    }

    async verifyPayment(method: PaymentMethod, paymentId: string): Promise<PaymentResponse> {
        if (method === 'nagad' && this.nagad) {
            return await this.nagad.verifyPayment(paymentId);
        }
        // Future: Add bKash/SSL verify support if standardized
        return { success: false, error: 'Verification not supported for this method yet' };
    }
}

// Export default configuration (will be replaced with env variables in production)
export const defaultPaymentConfig: PaymentConfig = {
    // bKash Sandbox (for testing)
    bkashBaseUrl: 'https://tokenized.sandbox.bkash.com',
    bkashAppKey: process.env.REACT_APP_BKASH_APP_KEY || '',
    bkashAppSecret: process.env.REACT_APP_BKASH_APP_SECRET || '',
    bkashUsername: process.env.REACT_APP_BKASH_USERNAME || '',
    bkashPassword: process.env.REACT_APP_BKASH_PASSWORD || '',

    // Nagad Sandbox
    nagadBaseUrl: 'https://sandbox.mynagad.com',
    nagadMerchantId: process.env.REACT_APP_NAGAD_MERCHANT_ID || '',

    // SSL Commerz Sandbox
    sslBaseUrl: 'https://sandbox.sslcommerz.com',
    sslStoreId: process.env.REACT_APP_SSL_STORE_ID || '',
    sslStorePassword: process.env.REACT_APP_SSL_STORE_PASSWORD || ''
};

export default PaymentGatewayService;
