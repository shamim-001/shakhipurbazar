import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order, Product } from '../../types';

interface TopProductsChartProps {
    orders: Order[];
    products: Product[];
    language: 'en' | 'bn';
}

const TopProductsChart: React.FC<TopProductsChartProps> = ({ orders, products, language }) => {
    // Calculate top products by revenue
    const getTopProducts = () => {
        const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();

        orders.forEach(order => {
            if (order.status === 'Delivered' || order.status === 'Confirmed') {
                order.items.forEach(item => {
                    const productId = item.productId || item.id;
                    const product = products.find(p => p.id === productId);
                    const productName = product?.name[language] || item.productName[language];

                    if (productRevenue.has(productId)) {
                        const existing = productRevenue.get(productId)!;
                        existing.revenue += item.price * item.quantity;
                        existing.quantity += item.quantity;
                    } else {
                        productRevenue.set(productId, {
                            name: productName,
                            revenue: item.price * item.quantity,
                            quantity: item.quantity
                        });
                    }
                });
            }
        });

        return Array.from(productRevenue.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(item => ({
                name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
                revenue: Number(item.revenue.toFixed(2)),
                quantity: item.quantity
            }));
    };

    const data = getTopProducts();

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <p>{language === 'en' ? 'No product sales yet' : 'এখনো কোনো পণ্য বিক্রয় নেই'}</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                    type="number"
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `৳${value}`}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    width={100}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                    formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [`৳${value.toFixed(2)}`, language === 'en' ? 'Revenue' : 'আয়'];
                        return [value, language === 'en' ? 'Sold' : 'বিক্রীত'];
                    }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#8B5CF6" name={language === 'en' ? 'Revenue' : 'আয়'} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default TopProductsChart;
