'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AgingChartProps {
    data: {
        notDue: number;
        overdue30: number;
        overdue90: number;
        overdueMore: number;
    };
}

export function AgingChart({ data }: AgingChartProps) {
    const chartData = [
        {
            name: '未逾期',
            amount: data.notDue,
            color: '#22c55e' // Green
        },
        {
            name: '逾期 1-30 天',
            amount: data.overdue30,
            color: '#3b82f6' // Blue
        },
        {
            name: '逾期 30-90 天',
            amount: data.overdue90,
            color: '#f59e0b' // Amber/Orange
        },
        {
            name: '逾期 >90 天',
            amount: data.overdueMore,
            color: '#ef4444' // Red
        }
    ];

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>账龄分析 (Aging Analysis)</CardTitle>
                <CardDescription>按逾期时长分布的应收账款</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `¥${value}`}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [`¥${(value || 0).toLocaleString()}`, '金额']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
