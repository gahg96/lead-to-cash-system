'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface GroupedInvoices {
    projectId: string;
    projectName: string;
    customerName: string;
    contractValue: number;
    invoices: any[];
    totalInvoiced: number;
    totalCollected: number;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [activeInvoices, setActiveInvoices] = useState<any[]>([]);
    const [cancelledInvoices, setCancelledInvoices] = useState<any[]>([]);
    const [groupedInvoices, setGroupedInvoices] = useState<GroupedInvoices[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCancelled, setShowCancelled] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        // Separate active and cancelled invoices
        const active = invoices.filter(inv => inv.status !== 'Cancelled');
        const cancelled = invoices.filter(inv => inv.status === 'Cancelled');

        setActiveInvoices(active);
        setCancelledInvoices(cancelled);

        // Group active invoices by project
        const grouped = groupInvoicesByProject(active);
        setGroupedInvoices(grouped);
    }, [invoices]);

    const fetchInvoices = async () => {
        try {
            const data = await api.get('/finance/invoices');
            setInvoices(data);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupInvoicesByProject = (invoiceList: any[]): GroupedInvoices[] => {
        const projectMap = new Map<string, GroupedInvoices>();

        invoiceList.forEach(invoice => {
            const groupingKey = invoice.contract?.id || 'unknown';
            const projectName = invoice.contract?.contractNumber || '未知项目';
            const customerName = invoice.contract?.opportunity?.customer?.companyName || '未知客户';
            const contractValue = Number(invoice.contract?.totalContractValue || 0);

            if (!projectMap.has(groupingKey)) {
                projectMap.set(groupingKey, {
                    projectId: groupingKey,
                    projectName,
                    customerName,
                    contractValue,
                    invoices: [],
                    totalInvoiced: 0,
                    totalCollected: 0,
                });
            }

            const group = projectMap.get(groupingKey)!;
            group.invoices.push(invoice);
            group.totalInvoiced += Number(invoice.totalAmount || 0);

            // Calculate collected amount from payments
            const collected = invoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
            group.totalCollected += collected;
        });

        return Array.from(projectMap.values());
    };

    const getStatusBadge = (status: string) => {
        const variants: any = {
            Draft: 'secondary',
            Issued: 'default',
            PartiallyPaid: 'warning',
            Paid: 'success',
            Overdue: 'destructive',
            Cancelled: 'outline',
        };

        const labels: any = {
            Draft: '草稿',
            Issued: '已开具',
            PartiallyPaid: '部分收款',
            Paid: '已收款',
            Overdue: '已逾期',
            Cancelled: '已作废',
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {labels[status] || status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg">加载中...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/finance">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">发票管理</h1>
                        <p className="text-muted-foreground mt-1">
                            有效发票 {activeInvoices.length} 张 · 已作废 {cancelledInvoices.length} 张
                        </p>
                    </div>
                </div>
                <Link href="/finance/invoices/new">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        创建发票
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索发票号或客户名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Active Invoices - Grouped by Project */}
            <div className="space-y-4">
                {groupedInvoices.map((group) => (
                    <Card key={group.projectId}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{group.projectName}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{group.customerName}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-sm text-muted-foreground">合同金额</div>
                                    <div className="font-bold">¥{group.contractValue.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Collection Summary */}
                            <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <div className="text-xs text-muted-foreground">开票总额</div>
                                    <div className="text-lg font-semibold text-blue-600">
                                        ¥{group.totalInvoiced.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">已收款</div>
                                    <div className="text-lg font-semibold text-green-600">
                                        ¥{group.totalCollected.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">待收款</div>
                                    <div className="text-lg font-semibold text-orange-600">
                                        ¥{(group.totalInvoiced - group.totalCollected).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {group.invoices.map((invoice) => (
                                    <Link key={invoice.id} href={`/finance/invoices/${invoice.id}`}>
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="font-medium">{invoice.invoiceNumber}</div>
                                                    {getStatusBadge(invoice.status)}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    开票日期: {new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">¥{invoice.totalAmount?.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {invoice.type === 'Service' ? '服务 6%' : '产品 13%'}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {groupedInvoices.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                暂无有效发票记录
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Cancelled Invoices - Collapsed Section */}
            {cancelledInvoices.length > 0 && (
                <Collapsible open={showCancelled} onOpenChange={setShowCancelled}>
                    <Card>
                        <CollapsibleTrigger asChild>
                            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {showCancelled ? (
                                            <ChevronDown className="h-5 w-5" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5" />
                                        )}
                                        <CardTitle>已作废发票</CardTitle>
                                        <Badge variant="outline">{cancelledInvoices.length} 张</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <CardContent>
                                <div className="space-y-2">
                                    {cancelledInvoices.map((invoice) => (
                                        <Link key={invoice.id} href={`/finance/invoices/${invoice.id}`}>
                                            <div className="flex items-center justify-between p-3 border border-dashed rounded-lg hover:bg-accent transition-colors cursor-pointer opacity-60">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-medium line-through">{invoice.invoiceNumber}</div>
                                                        {getStatusBadge(invoice.status)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {invoice.contract?.opportunity?.customer?.companyName || '未知客户'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold line-through">¥{invoice.totalAmount?.toLocaleString()}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(invoice.invoiceDate).toLocaleDateString('zh-CN')}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            )}
        </div>
    );
}
