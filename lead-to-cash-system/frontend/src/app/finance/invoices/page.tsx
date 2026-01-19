'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, ArrowLeft, Plus, ChevronRight, ChevronDown, FileText, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/I18nContext';
import { cn } from '@/lib/utils';

interface InvoiceGroup {
    id: string; // Contract ID
    title: string;
    subtitle: string;
    customer: string;
    totalAmount: number;
    invoices: any[];
    isExpanded: boolean;
}

export default function InvoicesPage() {
    const { t } = useI18n();
    const [invoiceGroups, setInvoiceGroups] = useState<InvoiceGroup[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        if (searchTerm && invoiceGroups.length > 0) {
            // If user searches, auto-expand groups that have matches or match themselves
            const newExpanded = new Set<string>();
            const lowerTerm = searchTerm.toLowerCase();

            invoiceGroups.forEach(group => {
                const groupMatch = group.title.toLowerCase().includes(lowerTerm) ||
                    group.customer.toLowerCase().includes(lowerTerm);
                const hasChildMatch = group.invoices.some(inv => inv.invoiceNumber.toLowerCase().includes(lowerTerm));

                if (groupMatch || hasChildMatch) {
                    newExpanded.add(group.id);
                }
            });

            if (newExpanded.size > 0) {
                setExpandedGroups(newExpanded);
            }
        }
    }, [searchTerm, invoiceGroups.length]);

    const fetchInvoices = async () => {
        try {
            const data = await api.get('/finance/invoices');

            // Group By Contract
            const groups: { [key: string]: InvoiceGroup } = {};
            const noContractId = 'no-contract';

            data.forEach((invoice: any) => {
                const contract = invoice.contract;
                const groupId = contract?.id || noContractId;

                if (!groups[groupId]) {
                    groups[groupId] = {
                        id: groupId,
                        title: contract?.opportunity?.title || contract?.contractNumber || '无关联合同/项目',
                        subtitle: contract?.contractNumber || '-',
                        customer: contract?.opportunity?.customer?.companyName || '未知客户',
                        totalAmount: 0,
                        invoices: [],
                        isExpanded: true // Default expanded for visibility
                    };
                }

                groups[groupId].invoices.push(invoice);
                groups[groupId].totalAmount += Number(invoice.totalAmount);
            });

            // Sort groups by latest invoice date derived from children
            const sortedGroups = Object.values(groups).map(g => {
                // Sort invoices within group desc
                g.invoices.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
                return g;
            }).sort((a, b) => {
                // Sort groups by most recent invoice
                const lastDateA = a.invoices[0] ? new Date(a.invoices[0].invoiceDate).getTime() : 0;
                const lastDateB = b.invoices[0] ? new Date(b.invoices[0].invoiceDate).getTime() : 0;
                return lastDateB - lastDateA;
            });

            setInvoiceGroups(sortedGroups);
            // Initially expand all
            setExpandedGroups(new Set(sortedGroups.map(g => g.id)));

        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    const getStatusBadge = (status: string) => {
        const variants: any = {
            Draft: 'secondary',
            Issued: 'default',
            PartiallyPaid: 'warning',
            Paid: 'success',
            Overdue: 'destructive',
            Cancelled: 'outline'
        };
        const labels: any = {
            Draft: '草稿',
            Issued: '已开票',
            PartiallyPaid: '部分收款',
            Paid: '已收款',
            Overdue: '已逾期',
            Cancelled: '已作废'
        };

        return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
    };

    const filteredGroups = invoiceGroups.filter(group => {
        if (!searchTerm) return true;
        const lowerTerm = searchTerm.toLowerCase();

        // Match group fields
        if (group.title.toLowerCase().includes(lowerTerm) ||
            group.customer.toLowerCase().includes(lowerTerm)) {
            return true;
        }

        // Match any invoice
        return group.invoices.some(inv => inv.invoiceNumber.toLowerCase().includes(lowerTerm));
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">加载中...</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        发票管理
                    </h1>
                </div>
                <Link href="/finance/invoices/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        创建发票
                    </Button>
                </Link>
            </div>

            <Card>
                <div className="p-4 border-b">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            placeholder="搜索合同、客户、发票号..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">合同 / 发票</TableHead>
                                <TableHead className="w-[20%]">客户</TableHead>
                                <TableHead className="w-[15%]">金额</TableHead>
                                <TableHead className="w-[10%]">状态</TableHead>
                                <TableHead className="w-[15%] text-right">开票日期</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredGroups.map(group => {
                                const isExpanded = expandedGroups.has(group.id);
                                return (
                                    <React.Fragment key={group.id}>
                                        {/* Group Header Row */}
                                        <TableRow
                                            className="bg-slate-50/80 hover:bg-slate-100 cursor-pointer group"
                                            onClick={() => toggleGroup(group.id)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900">{group.title}</span>
                                                        <span className="text-xs text-slate-500">{group.subtitle}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Building2 className="h-3 w-3" />
                                                    {group.customer}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-700">
                                                ¥{group.totalAmount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white">
                                                    {group.invoices.length} 笔发票
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-500 text-sm">
                                                -
                                            </TableCell>
                                        </TableRow>

                                        {/* Invoice Rows (Children) */}
                                        {isExpanded && group.invoices.map(invoice => (
                                            <TableRow key={invoice.id} className="hover:bg-slate-50">
                                                <TableCell className="pl-10 relative">
                                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-px bg-slate-200" />
                                                        <FileText className="h-3 w-3 text-slate-400" />
                                                        <Link href={`/finance/invoices/${invoice.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                                                            {invoice.invoiceNumber}
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">
                                                    {/* Repeat customer or leave blank? Blank is cleaner for tree view */}
                                                </TableCell>
                                                <TableCell className="text-slate-900 font-medium">
                                                    ¥{Number(invoice.totalAmount).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(invoice.status)}
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-slate-500">
                                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                );
                            })}

                            {filteredGroups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        暂无发票记录
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
