import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Order } from '../../types';

interface CommissionBreakdownProps {
    orders: Order[];
    categoryCommissions: any[];
    language: 'en' | 'bn';
}

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const CommissionBreakdown: React.FC<CommissionBreakdownProps> = ({ orders, categoryCommissions, language }) => {
    // Calculate commission breakdown
    const calculateCommissions = () => {
        let totalRevenue = 0;
        let totalPlatformFee = 0;

        orders.forEach(order => {
            if (order.status === 'Delivered' || order.status === 'Confirmed') {
                totalRevenue += order.total;

                // Get category commission rate (default 10%)
                const rate = 10; // Simplified for display
                totalPlatformFee += (order.total * rate) / 100;
            }
        });

        const vendorEarnings = totalRevenue - totalPlatformFee;

        return [
            {
                name: language === 'en' ? 'Vendor Earnings' : 'বিক্রেতা আয়',
                value: Number(vendorEarnings.toFixed(2)),
                percentage: totalRevenue > 0 ? ((vendorEarnings / totalRevenue) * 100).toFixed(1) : 0
            },
            {
                name: language === 'en' ? 'Platform Fee' : 'প্ল্যাটফর্ম ফি',
                value: Number(totalPlatformFee.toFixed(2)),
                percentage: totalRevenue > 0 ? ((totalPlatformFee / totalRevenue) * 100).toFixed(1) : 0
            }
        ];
    };

    const data = calculateCommissions();

    if (data.every(d => d.value === 0)) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <p>{language === 'en' ? 'No commission data available' : 'কোনো কমিশন ডেটা নেই'}</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 dark:bg-slate-800 p-3 rounded-lg border border-gray-700">
                    <p className="text-white font-semibold">{payload[0].name}</p>
                    <p className="text-green-400">৳{payload[0].value.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">{payload[0].payload.percentage}%</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default CommissionBreakdown;
