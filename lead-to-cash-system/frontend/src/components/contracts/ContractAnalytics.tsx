"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { DollarSign, FileText, CheckCircle, Users } from "lucide-react";

interface ContractAnalyticsProps {
    contracts: any[];
    onFilterChange: (type: string, value: string | null) => void;
    activeFilters: { type: string; value: string | null };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7f50'];

export function ContractAnalytics({ contracts, onFilterChange, activeFilters }: ContractAnalyticsProps) {
    const { t } = useI18n();

    // 1. Calculate Summary Metrics
    const metrics = useMemo(() => {
        const totalValue = contracts.reduce((sum, c) => sum + (Number(c.wonPrice || c.totalContractValue) || 0), 0);

        const signedContracts = contracts.filter(c => c.status === 'Signed');
        const signedValue = signedContracts.reduce((sum, c) => sum + (Number(c.wonPrice || c.totalContractValue) || 0), 0);

        const signingRate = contracts.length > 0
            ? Math.round((signedContracts.length / contracts.length) * 100)
            : 0;

        // Top Drafter / Sales Owner
        const userMap = new Map<string, number>();
        signedContracts.forEach(c => {
            const user = c.drafter?.username || 'Unknown';
            userMap.set(user, (userMap.get(user) || 0) + 1);
        });
        let topUser = "-";
        let maxCount = 0;
        userMap.forEach((count, user) => {
            if (count > maxCount) {
                maxCount = count;
                topUser = user;
            }
        });

        const totalCollected = contracts.reduce((sum, c) => {
            if (!c.invoices) return sum;
            const collected = c.invoices.reduce((invSum: number, inv: any) => {
                const payments = inv.payments?.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0) || 0;
                return invSum + payments;
            }, 0);
            return sum + collected;
        }, 0);

        const totalOutstanding = signedValue - totalCollected;

        return { totalValue, signedValue, signingRate, topUser, totalCollected, totalOutstanding };
    }, [contracts]);

    // 2. Prepare Chart Data
    const charts = useMemo(() => {
        // Status Distribution
        const statusMap = new Map<string, number>();
        contracts.forEach(c => {
            const status = c.status || 'Draft';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

        // Value by Status
        const valueMap = new Map<string, number>();
        contracts.forEach(c => {
            const status = c.status || 'Draft';
            const val = Number(c.wonPrice || c.totalContractValue) || 0;
            valueMap.set(status, (valueMap.get(status) || 0) + val);
        });
        const valueData = Array.from(valueMap.entries()).map(([name, value]) => ({ name, value }));

        // Top Drafters by Value
        const drafterMap = new Map<string, number>();
        contracts.forEach(c => {
            const user = c.drafter?.username || 'Unknown';
            const val = Number(c.wonPrice || c.totalContractValue) || 0;
            drafterMap.set(user, (drafterMap.get(user) || 0) + val);
        });
        const drafterData = Array.from(drafterMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { statusData, valueData, drafterData };
    }, [contracts]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6 mb-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card className="bg-white border-slate-200 col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t("contract.analytics.totalValue")}</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
                        <p className="text-xs text-slate-500 mt-1">{t("contract.analytics.totalValueDesc")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t("contract.analytics.signedValue")}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.signedValue)}</div>
                        <p className="text-xs text-slate-500 mt-1">{t("contract.analytics.signedValueDesc")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t("contract.analytics.signingRate")}</CardTitle>
                        <FileText className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.signingRate}%</div>
                        <p className="text-xs text-slate-500 mt-1">{t("contract.analytics.signingRateDesc")}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">{t("contract.analytics.topDrafter")}</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{metrics.topUser}</div>
                        <p className="text-xs text-slate-500 mt-1">{t("contract.analytics.topDrafterDesc")}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">已收账款 (Collected)</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalCollected)}</div>
                        <p className="text-xs text-slate-500 mt-1">Total Collected Amount</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-slate-200 col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">待收账款 (Outstanding)</CardTitle>
                        <DollarSign className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.totalOutstanding > 0 ? metrics.totalOutstanding : 0)}</div>
                        <p className="text-xs text-slate-500 mt-1">Total Outstanding Amount</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t("contract.analytics.statusDist")}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => onFilterChange('status', activeFilters.value === data.name ? null : data.name)}
                                    className="cursor-pointer"
                                >
                                    {charts.statusData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={activeFilters.type === 'status' && activeFilters.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => [value, t("common.count") || 'Count']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Value by Status */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t("contract.analytics.valueDist")}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.valueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `¥${val / 10000}万`} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} formatter={(value: any) => formatCurrency(Number(value))} />
                                <Bar
                                    dataKey="value"
                                    fill="#8884d8"
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) => onFilterChange('status', activeFilters.value === data.name ? null : (data.name || null))}
                                    className="cursor-pointer"
                                >
                                    {charts.valueData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={activeFilters.type === 'status' && activeFilters.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Drafter Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t("contract.analytics.drafterRanking")}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.drafterData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={60} fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} cursor={{ fill: 'transparent' }} />
                                <Bar
                                    dataKey="value"
                                    fill="#82ca9d"
                                    radius={[0, 4, 4, 0]}
                                    onClick={(data) => onFilterChange('drafter', activeFilters.value === data.name ? null : (data.name || null))}
                                    className="cursor-pointer"
                                >
                                    {charts.drafterData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill="#82ca9d"
                                            opacity={activeFilters.type === 'drafter' && activeFilters.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
