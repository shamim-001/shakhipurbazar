import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order } from '../../types';

interface RevenueChartProps {
    orders: Order[];
    period: 'daily' | 'weekly' | 'monthly';
}

const RevenueChart: React.FC<RevenueChartProps> = ({ orders, period }) => {
    // Aggregate revenue by period
    const aggregateData = () => {
        const dataMap = new Map<string, number>();

        orders.forEach(order => {
            if (order.status === 'Delivered' || order.status === 'Confirmed' || order.status === 'Ride Completed') {
                const date = new Date(order.date);
                let key: string;

                if (period === 'daily') {
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else if (period === 'weekly') {
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else {
                    key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }

                dataMap.set(key, (dataMap.get(key) || 0) + order.total);
            }
        });

        return Array.from(dataMap.entries())
            .map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-30); // Last 30 periods
    };

    const data = aggregateData();

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <p>No revenue data available</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `৳${value}`}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff'
                    }}
                    formatter={(value: number) => [`৳${value.toFixed(2)}`, 'Revenue']}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default RevenueChart;
