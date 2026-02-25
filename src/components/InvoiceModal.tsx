import React from 'react';
import { Order, PlatformSettings } from '../../types';
import { XIcon, PrinterIcon } from '../../components/icons';

interface InvoiceModalProps {
    order: Order;
    onClose: () => void;
    language: 'en' | 'bn';
    platformSettings?: PlatformSettings;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose, language, platformSettings }) => {
    const handlePrint = () => {
        window.print();
    };

    const content = {
        en: {
            title: "Invoice",
            billTo: "Bill To",
            orderId: "Order ID",
            date: "Date",
            item: "Item",
            qty: "Qty",
            price: "Price",
            subtotal: "Subtotal",
            delivery: "Delivery Fee",
            total: "Grand Total",
            thankYou: "Thank you for shopping with us!",
            note: "Note: This is a system-generated invoice.",
            address: "Address"
        },
        bn: {
            title: "ইনভয়েস",
            billTo: "বিল টু",
            orderId: "অর্ডার আইডি",
            date: "তারিখ",
            item: "আইটেম",
            qty: "পরিমাণ",
            price: "মূল্য",
            subtotal: "সাবটোটাল",
            delivery: "ডেলিভারি ফি",
            total: "সর্বমোট",
            thankYou: "আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!",
            note: "দ্রষ্টব্য: এটি একটি সিস্টেম-জেনারেটেড ইনভয়েস।",
            address: "ঠিকানা"
        }
    };

    const t = content[language];

    // Fallback brand info
    const brandName = platformSettings?.appName || "SAKHIPUR BAZAR";
    const brandEmail = platformSettings?.supportEmail || "support@sakhipurbazar.com";
    const brandPhone = platformSettings?.supportPhone || "+880 17XX XXX XXX";

    // Subtotal calculation based on items
    const subtotal = order.items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-start pt-10 sm:items-center sm:pt-0 p-4 overflow-y-auto print:p-0 print:bg-white" onClick={onClose}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        padding: 20px;
                        margin: 0;
                        box-shadow: none;
                        background: white !important;
                    }
                    .no-print { display: none !important; }
                    .dark { background: white !important; color: black !important; }
                }
            `}} />

            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col print-area print:rounded-none print:shadow-none border dark:border-slate-800 my-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Controls */}
                <div className="bg-gray-50 dark:bg-slate-800/80 px-8 py-4 flex justify-between items-center no-print border-b dark:border-slate-800">
                    <h2 className="font-black text-gray-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <PrinterIcon className="w-5 h-5 text-white" />
                        </div>
                        {t.title}
                    </h2>
                    <div className="flex gap-4">
                        <button
                            onClick={handlePrint}
                            className="bg-violet-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 dark:shadow-none flex items-center gap-2"
                        >
                            <PrinterIcon className="w-4 h-4" /> Print
                        </button>
                        <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl transition-colors">
                            <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* Invoice Body */}
                <div className="p-10 md:p-16 dark:bg-slate-900">
                    {/* Brand */}
                    <div className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
                        <div>
                            <h1 className="text-4xl font-black text-violet-600 mb-3 tracking-tighter">{brandName.toUpperCase()}</h1>
                            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                                <p className="flex items-center gap-2">{brandPhone}</p>
                                <p>{brandEmail}</p>
                                <p>Sakhipur, Tangail, Bangladesh</p>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white uppercase tracking-widest mb-2 opacity-10">{t.title}</h2>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">#{order.id.slice(-8).toUpperCase()}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(order.date).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 pb-12 border-b dark:border-slate-800">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">{t.billTo}</h3>
                            <div className="space-y-1">
                                <p className="text-xl font-black text-gray-900 dark:text-white">Customer #{order.customerId.slice(-5).toUpperCase()}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{order.payment} Payment</p>
                            </div>
                        </div>
                        <div className="text-left md:text-right">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">{t.orderId}</h3>
                            <p className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 p-2 rounded-lg inline-block">{order.id}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full mb-16">
                            <thead>
                                <tr className="text-left">
                                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.item}</th>
                                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.qty}</th>
                                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.price}</th>
                                    <th className="pb-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.subtotal}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {order.items.map((item, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-6 pr-4">
                                            <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-600 transition-colors">
                                                {item.productName[language]}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1 uppercase">Product ID: {item.productId.slice(-6)}</p>
                                        </td>
                                        <td className="py-6 text-center text-gray-600 dark:text-gray-400 font-medium">{item.quantity}</td>
                                        <td className="py-6 text-right text-gray-600 dark:text-gray-400 font-medium">৳{item.priceAtPurchase}</td>
                                        <td className="py-6 text-right font-black text-gray-900 dark:text-white">৳{item.priceAtPurchase * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Calculation */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-sm space-y-4 pt-8">
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t.subtotal}</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">৳{subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest">{t.delivery}</span>
                                <span className="font-bold text-gray-800 dark:text-gray-200">৳{order.deliveryFee || 0}</span>
                            </div>
                            <div className="flex justify-between items-center py-6 border-t dark:border-slate-800 mt-4">
                                <span className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t.total}</span>
                                <span className="text-3xl font-black text-violet-600">৳{order.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-24 text-center">
                        <div className="inline-block px-8 py-3 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-100 dark:border-violet-900/20">
                            <p className="font-bold text-violet-600 text-sm">{t.thankYou}</p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-8 uppercase tracking-[0.3em]">{t.note}</p>

                        <div className="mt-8 mb-4 no-print sm:hidden">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold"
                            >
                                Close Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
