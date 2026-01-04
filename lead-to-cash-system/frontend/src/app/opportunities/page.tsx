"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ArrowLeft, ArrowUpDown } from "lucide-react";
import { OpportunityAnalytics } from "@/components/opportunities/OpportunityAnalytics";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useRouter } from "next/navigation";

export default function OpportunitiesPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [opportunities, setOpportunities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dashboard Filters
    const [activeFilter, setActiveFilter] = useState<{ type: string; value: string | null }>({ type: '', value: null });

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const fetchOpportunities = async () => {
        try {
            const data = await api.get("/opportunities");
            setOpportunities(data);
        } catch (error) {
            console.error("Failed to fetch opportunities", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (type: string, value: string | null) => {
        setActiveFilter({ type, value });
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredOpportunities = opportunities.filter(opp => {
        if (!activeFilter.value) return true;
        if (activeFilter.type === 'source') return opp.source === activeFilter.value;
        if (activeFilter.type === 'status') return opp.status === activeFilter.value;
        if (activeFilter.type === 'salesOwner') return opp.salesOwner === activeFilter.value;
        return true;
    });

    const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
        if (!sortConfig) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Specific handling for nested or number fields if needed
        if (sortConfig.key === 'customer.companyName') {
            aValue = a.customer?.companyName || '';
            bValue = b.customer?.companyName || '';
        } else if (sortConfig.key === 'winningPrice') {
            const aProc = a.procurements?.find((p: any) => p.status === 'Won');
            const bProc = b.procurements?.find((p: any) => p.status === 'Won');
            aValue = Number(aProc?.wonPrice || 0);
            bValue = Number(bProc?.wonPrice || 0);
        } else if (sortConfig.key === 'estimatedValue') {
            aValue = Number(a.estimatedValue || 0);
            bValue = Number(b.estimatedValue || 0);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("nav.opportunities")}</h1>
                            <p className="text-slate-500 mt-1">{t("opportunities.subtitle")}</p>
                        </div>
                    </div>
                    <Link href="/opportunities/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("action.newLead")}
                        </Button>
                    </Link>
                </div>

                {/* Dashboard */}
                <OpportunityAnalytics
                    opportunities={opportunities}
                    onFilterChange={handleFilterChange}
                    activeFilters={activeFilter}
                />

                {/* Filters (Placeholder) */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input placeholder={t("opportunities.searchPlaceholder")} className="pl-9" />
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        {t("common.filter")}
                    </Button>
                </div>

                {/* Data Table */}
                <Card className="shadow-sm border-slate-200">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('customer.companyName')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            {t("table.client")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>{t("table.project")}</TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('estimatedValue')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            预算金额 <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('winningPrice')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            中标金额 <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('source')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            商机来源 <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('salesOwner')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            销售 <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button variant="ghost" onClick={() => handleSort('status')} className="hover:bg-transparent px-0 font-semibold text-slate-500">
                                            {t("table.status")} <ArrowUpDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">{t("common.loading")}</TableCell>
                                    </TableRow>
                                ) : opportunities.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-slate-500">{t("opportunities.noData")}</TableCell>
                                    </TableRow>
                                ) : (
                                    sortedOpportunities.map((opp) => {
                                        const wonProcurement = opp.procurements?.find((p: any) => p.status === 'Won');
                                        const winningPrice = wonProcurement?.wonPrice;

                                        return (
                                            <TableRow key={opp.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/opportunities/${opp.id}`)}>
                                                <TableCell className="font-mono text-xs text-slate-600">{opp.opportunityNumber || `#${opp.id.slice(0, 8)}`}</TableCell>
                                                <TableCell className="font-medium text-slate-900">{opp.customer?.companyName || "Unknown"}</TableCell>
                                                <TableCell>{opp.title}</TableCell>
                                                <TableCell className="font-semibold text-slate-700">
                                                    {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(opp.estimatedValue)}
                                                </TableCell>
                                                <TableCell className="font-semibold text-green-700">
                                                    {winningPrice
                                                        ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(winningPrice)
                                                        : opp.status === 'Won' ? '-' : ''}
                                                </TableCell>
                                                <TableCell>{t(`options.source.${opp.source}`) || opp.source || '-'}</TableCell>
                                                <TableCell>{opp.salesOwner || '-'}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${opp.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                            opp.status === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                                                                opp.status === 'Lost' ? 'bg-slate-100 text-slate-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}>
                                                        {t(`status.${opp.status.toLowerCase()}`)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
