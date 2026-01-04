'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { FileText, ArrowRight, Loader2, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from "@/lib/i18n/I18nContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Contract {
    id: string;
    contractNumber: string;
    status: string;
    totalContractValue: number;
    wonPrice?: number | null;
    createdAt: string;
    opportunity: {
        title: string;
        customer: {
            companyName: string;
        };
    };
    drafter?: {
        username: string;
    };
}

import { ContractAnalytics } from "@/components/contracts/ContractAnalytics";

export default function ContractsPage() {
    const { t } = useI18n();
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // Dashboard Filters
    const [activeFilter, setActiveFilter] = useState<{ type: string; value: string | null }>({ type: '', value: null });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const data = await api.get('/contracts');
            setContracts(data);
        } catch (error) {
            console.error("Failed to fetch contracts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (type: string, value: string | null) => {
        setActiveFilter({ type, value });
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/contracts/${id}`);
            fetchContracts(); // Refresh list
        } catch (error) {
            console.error("Failed to delete contract", error);
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-slate-500';
            case 'CustomerReview': return 'bg-orange-500';
            case 'InternalReview': return 'bg-blue-500';
            case 'CustomerSeal': return 'bg-purple-500';
            case 'InternalSeal': return 'bg-indigo-500';
            case 'Signed': return 'bg-green-600';
            case 'Terminated': return 'bg-red-600';
            default: return 'bg-slate-500';
        }
    };

    const filteredContracts = contracts.filter(c => {
        // Text Search
        const matchesSearch = c.contractNumber.toLowerCase().includes(searchText.toLowerCase()) ||
            c.opportunity.customer.companyName.toLowerCase().includes(searchText.toLowerCase()) ||
            c.opportunity.title.toLowerCase().includes(searchText.toLowerCase());

        // Dashboard Filter
        let matchesFilter = true;
        if (activeFilter.value) {
            if (activeFilter.type === 'status') {
                matchesFilter = c.status === activeFilter.value;
            } else if (activeFilter.type === 'drafter') {
                matchesFilter = c.drafter?.username === activeFilter.value;
            }
        }

        return matchesSearch && matchesFilter;
    });

    const sortedContracts = [...filteredContracts].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue: any = a[sortConfig.key as keyof Contract];
        let bValue: any = b[sortConfig.key as keyof Contract];

        if (sortConfig.key === 'customer') {
            aValue = a.opportunity.customer.companyName;
            bValue = b.opportunity.customer.companyName;
        } else if (sortConfig.key === 'project') {
            aValue = a.opportunity.title;
            bValue = b.opportunity.title;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">{t("contract.title")}</h1>
            </div>

            <ContractAnalytics
                contracts={contracts}
                onFilterChange={handleFilterChange}
                activeFilters={activeFilter}
            />

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder={t("opportunities.searchPlaceholder") || "Search contracts..."}
                        className="pl-9"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t("common.filter")}
                </Button>
            </div>

            <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[180px]">
                                    <Button variant="ghost" onClick={() => handleSort('contractNumber')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("contract.number") || "Contract No."} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('customer')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.client")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('project')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.project")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('wonPrice')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        中标金额 (Won Price) <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('status')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.status")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[100px] text-right">{t("common.actions") || "Actions"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedContracts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">{t("contract.noContracts")}</TableCell>
                                </TableRow>
                            ) : (
                                sortedContracts.map((contract) => (
                                    <TableRow key={contract.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/contracts/${contract.id}`)}>
                                        <TableCell className="font-mono text-sm font-medium text-slate-700">
                                            {contract.contractNumber}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {contract.opportunity.customer.companyName}
                                        </TableCell>
                                        <TableCell>{contract.opportunity.title}</TableCell>
                                        <TableCell className="font-semibold text-green-700">
                                            {contract.wonPrice
                                                ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(contract.wonPrice)
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(contract.status)} border-0`}>
                                                {t(`contract.status.${contract.status}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the contract
                                                                <b> {contract.contractNumber}</b>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(contract.id)}>
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
