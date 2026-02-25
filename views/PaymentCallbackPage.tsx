
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentService } from '../src/services/paymentService';

const PaymentCallbackPage: React.FC = () => {
    const { method } = useParams<{ method: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Verifying payment...');

    useEffect(() => {
        const verify = async () => {
            try {
                if (method === 'nagad') {
                    const refId = searchParams.get('payment_ref_id');
                    const nagadStatus = searchParams.get('status');

                    if (nagadStatus !== 'Success') {
                        navigate('/cart?paymentStatus=failed');
                        return;
                    }

                    if (refId) {
                        const success = await PaymentService.verifyPayment(refId, 'nagad');
                        if (success) {
                            navigate(`/order-success?paymentStatus=success&trxID=${refId}`);
                        } else {
                            navigate('/cart?paymentStatus=failed&reason=verification_failed');
                        }
                    } else {
                        navigate('/cart?paymentStatus=failed&reason=invalid_callback');
                    }
                } else if (method === 'bkash') {
                    // bKash callback logic (if needed in future)
                    const status = searchParams.get('status');
                    if (status === 'success') navigate('/order-success');
                    else navigate('/cart?paymentStatus=failed');
                } else {
                    navigate('/');
                }
            } catch (error) {
                console.error("Payment Callback Error:", error);
                navigate('/cart?paymentStatus=error');
            }
        };

        verify();
    }, [method, searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{status}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Please wait while we confirm your transaction...</p>
            </div>
        </div>
    );
};

export default PaymentCallbackPage;
