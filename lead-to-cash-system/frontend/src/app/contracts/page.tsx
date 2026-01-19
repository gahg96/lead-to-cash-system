'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { ArrowUpDown, Plus, Search, Check, Briefcase, ShoppingCart, ChevronRight, ChevronDown, Monitor, List, FolderTree, FileText, ArrowRight, Loader2, Trash2, Filter, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from "@/lib/i18n/I18nContext";
import { toast } from 'sonner';
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
    contractType?: 'SALES' | 'PROCUREMENT';
    linkedProcurementContracts?: Contract[];
    relatedSalesContract?: Contract;
    endCustomer?: {
        companyName: string;
    };
    vendor?: {
        name: string;
    };
    procurementCategory?: string;
}

import { ContractAnalytics } from "@/components/contracts/ContractAnalytics";

export default function ContractsPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");

    // Dashboard Filters
    const [activeFilter, setActiveFilter] = useState<{ type: string; value: string | null }>({ type: '', value: null });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
    const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
    const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const data = await api.get('/contracts');
            setContracts(data);
        } catch (error) {
            console.error("Failed to fetch contracts", error);
            toast.error("Failed to fetch contracts.");
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
            toast.success("Contract deleted successfully.");
        } catch (error) {
            console.error("Failed to delete contract", error);
            toast.error("Failed to delete contract.");
        }
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleExpand = (contractId: string) => {
        setExpandedContracts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contractId)) {
                newSet.delete(contractId);
            } else {
                newSet.add(contractId);
            }
            return newSet;
        });
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
            c.opportunity?.customer?.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
            c.opportunity?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
            c.endCustomer?.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
            c.vendor?.name?.toLowerCase().includes(searchText.toLowerCase());

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

        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
            case 'contractNumber':
                aValue = a.contractNumber;
                bValue = b.contractNumber;
                break;
            case 'type':
                aValue = a.contractType || 'SALES';
                bValue = b.contractType || 'SALES';
                break;
            case 'customer':
                aValue = (a.contractType === 'SALES' ? a.opportunity?.customer?.companyName : (a.endCustomer?.companyName || a.relatedSalesContract?.opportunity?.customer?.companyName || a.vendor?.name)) || '';
                bValue = (b.contractType === 'SALES' ? b.opportunity?.customer?.companyName : (b.endCustomer?.companyName || b.relatedSalesContract?.opportunity?.customer?.companyName || b.vendor?.name)) || '';
                break;
            case 'title':
                aValue = a.opportunity?.title || a.procurementCategory || '';
                bValue = b.opportunity?.title || b.procurementCategory || '';
                break;
            case 'amount':
                aValue = a.wonPrice || a.totalContractValue || 0;
                bValue = b.wonPrice || b.totalContractValue || 0;
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
            default:
                aValue = a[sortConfig.key as keyof Contract];
                bValue = b[sortConfig.key as keyof Contract];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const buildContractTree = (contracts: Contract[]) => {
        const salesContracts = contracts.filter(c => c.contractType === 'SALES' || !c.contractType);
        const procurementContracts = contracts.filter(c => c.contractType === 'PROCUREMENT');

        const tree: { contract: Contract; children: Contract[] }[] = [];

        salesContracts.forEach(salesContract => {
            const children = procurementContracts.filter(
                procurementContract => procurementContract.relatedSalesContract?.id === salesContract.id
            );
            tree.push({ contract: salesContract, children: children });
        });

        // Add any procurement contracts that are not linked to a sales contract
        procurementContracts.forEach(procurementContract => {
            if (!procurementContract.relatedSalesContract) {
                tree.push({ contract: procurementContract, children: [] });
            }
        });

        return tree;
    };

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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>合同列表</CardTitle>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-md">
                        <Button
                            variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-2 ${viewMode === 'tree' ? 'shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setViewMode('tree')}
                        >
                            <FolderTree className="h-4 w-4 mr-1.5" />
                            {t("contract.treeView") || "树状"}
                        </Button>
                        <Button
                            variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
                            size="sm"
                            className={`h-8 px-2 ${viewMode === 'flat' ? 'shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                            onClick={() => setViewMode('flat')}
                        >
                            <List className="h-4 w-4 mr-1.5" />
                            {t("contract.flatView") || "列表"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[180px]">
                                    <Button variant="ghost" onClick={() => handleSort('contractNumber')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.contractNumber")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead className="w-[120px]">
                                    <Button variant="ghost" onClick={() => handleSort('type')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.type")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('customer')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.client")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('title')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.project")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button variant="ghost" onClick={() => handleSort('amount')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                        {t("table.amount")} <ArrowUpDown className="ml-2 h-4 w-4" />
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
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">{t("contract.noContracts")}</TableCell>
                                </TableRow>
                            ) : (
                                (viewMode === 'tree' ? buildContractTree(sortedContracts) : sortedContracts.map(c => ({ contract: c, children: [] }))).map((item: { contract: Contract; children: Contract[] }) => {
                                    const contract = item.contract;
                                    const children = item.children;
                                    const hasChildren = children && children.length > 0;
                                    const isExpanded = expandedContracts.has(contract.id);

                                    // Render main row logic
                                    const renderContractRow = (c: Contract, indent = 0, isChild = false) => (
                                        <TableRow
                                            key={c.id}
                                            className={`hover:bg-slate-50/50 cursor-pointer ${isChild ? 'bg-slate-50/30' : ''}`}
                                            onClick={() => router.push(`/contracts/${c.id}`)}
                                        >
                                            <TableCell className="font-mono text-sm font-medium text-slate-700">
                                                <div className="flex items-center" style={{ paddingLeft: `${indent * 20}px` }}>
                                                    {indent === 0 && hasChildren ? (
                                                        <button
                                                            className="p-1 hover:bg-slate-200 rounded mr-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(c.id);
                                                            }}
                                                        >
                                                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                        </button>
                                                    ) : indent === 0 ? (
                                                        <div className="w-6 mr-2" /> // spacer
                                                    ) : (
                                                        <Network className="h-3 w-3 text-slate-300 mr-2 -ml-2" style={{ transform: 'rotate(90deg)' }} /> // tree branch icon
                                                    )}
                                                    {c.contractNumber}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {(c.contractType || 'SALES') === 'SALES' ? (
                                                    <Badge variant="outline" className="gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {t("contract.sales") || "销售"}
                                                        {/* Only show badge in flat mode or if collapsed in tree mode */}
                                                        {(viewMode === 'flat' || !isExpanded) && (c.linkedProcurementContracts?.length || 0) > 0 && (
                                                            <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                                                                关联: {c.linkedProcurementContracts?.length}
                                                            </span>
                                                        )}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="gap-1">
                                                        <ShoppingCart className="h-3 w-3" />
                                                        {t("contract.procurement") || "采购"}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-900">
                                                {(c.contractType || 'SALES') === 'SALES'
                                                    ? (c.opportunity?.customer?.companyName || 'N/A')
                                                    : (c.endCustomer?.companyName
                                                        || c.relatedSalesContract?.opportunity?.customer?.companyName
                                                        || c.vendor?.name
                                                        || 'N/A')
                                                }
                                            </TableCell>
                                            <TableCell>{c.opportunity?.title || c.procurementCategory || 'N/A'}</TableCell>
                                            <TableCell className="font-semibold text-green-700">
                                                {(c.wonPrice || c.totalContractValue)
                                                    ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(c.wonPrice || c.totalContractValue)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(c.status)} border-0`}>
                                                    {t(`contract.status.${c.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/contracts/${c.id}`}>
                                                            {t("common.view")}
                                                        </Link>
                                                    </Button>
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
                                                                    <b> {c.contractNumber}</b>.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(c.id)}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );

                                    return (
                                        <React.Fragment key={contract.id}>
                                            {renderContractRow(contract)}
                                            {viewMode === 'tree' && isExpanded && children.map((child: Contract) => (
                                                renderContractRow(child, 1, true)
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

