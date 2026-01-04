
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface FundTransaction {
    id: string;
    type: string;
    status: string;
    description: string;
    totalAmount: number;
    principalAmount: number;
    costRate: number;
    allocations: any[];
    collections: any[];
    payouts: any[];
    project?: { description?: string; contractId?: string };
}

export default function FundDashboard() {
    const [transactions, setTransactions] = useState<FundTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/transactions`)
            .then(res => res.json())
            .then(data => {
                setTransactions(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const totalOccupied = transactions
        .filter(t => t.type === 'ADVANCE' && t.status === 'ACTIVE')
        .reduce((sum, t) => sum + Number(t.principalAmount), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">资金管理 (Fund Management)</h1>
                <Link href="/finance/funds/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新建交易
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">当前资金占用 (Total Capital Occupied)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">¥{totalOccupied.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">进行中的垫资交易</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">活跃交易数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactions.filter(t => t.status === 'ACTIVE').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">快捷操作</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2">
                        <Button variant="outline" size="sm">生成对账单</Button>
                        <Button variant="outline" size="sm">审计记录</Button>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border">
                <div className="p-4">
                    <h3 className="font-semibold mb-4">最近交易</h3>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">日期</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">类型</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">描述</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">关联项目</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">金额</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">状态</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle">N/A</td>
                                        {/* Ideally created_at but interface needs update */}
                                        <td className="p-4 align-middle font-medium">{tx.type}</td>
                                        <td className="p-4 align-middle">{tx.description}</td>
                                        <td className="p-4 align-middle">{tx.project?.description || '-'}</td>
                                        <td className="p-4 align-middle text-right">
                                            {tx.type === 'ADVANCE' ? `¥${Number(tx.principalAmount).toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${tx.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-secondary text-secondary-foreground'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                            暂无交易记录。请点击“新建交易”开始。
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
