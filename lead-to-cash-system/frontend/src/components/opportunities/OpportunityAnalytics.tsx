"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/I18nContext";
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

interface OpportunityAnalyticsProps {
    opportunities: any[];
    onFilterChange: (type: string, value: string | null) => void;
    activeFilters: { type: string; value: string | null };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function OpportunityAnalytics({ opportunities, onFilterChange, activeFilters }: OpportunityAnalyticsProps) {
    const { t } = useI18n();

    // 1. Calculate Summary Metrics
    const metrics = useMemo(() => {
        const totalValue = opportunities.reduce((sum, opp) => sum + (Number(opp.estimatedValue) || 0), 0);
        const wonOpps = opportunities.filter(opp => opp.status === 'Won');
        const wonValue = wonOpps.reduce((sum, opp) => {
            const wonProcurement = opp.procurements?.find((p: any) => p.status === 'Won');
            return sum + (Number(wonProcurement?.wonPrice) || Number(opp.estimatedValue) || 0);
        }, 0);

        const winRate = opportunities.length > 0
            ? Math.round((wonOpps.length / opportunities.length) * 100)
            : 0;

        // Top Sales Rep
        const salesMap = new Map<string, number>();
        wonOpps.forEach(opp => {
            const rep = opp.salesOwner || 'Unknown';
            salesMap.set(rep, (salesMap.get(rep) || 0) + 1);
        });
        let topRep = "-";
        let maxWins = 0;
        salesMap.forEach((wins, rep) => {
            if (wins > maxWins) {
                maxWins = wins;
                topRep = rep;
            }
        });

        return { totalValue, wonValue, winRate, topRep };
    }, [opportunities]);

    // 2. Prepare Chart Data
    const charts = useMemo(() => {
        // Source Distribution
        const sourceMap = new Map<string, number>();
        opportunities.forEach(opp => {
            const source = opp.source || 'Other';
            sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
        });
        const sourceData = Array.from(sourceMap.entries()).map(([name, value]) => ({ name, value }));

        // Status Distribution
        const statusMap = new Map<string, number>();
        opportunities.forEach(opp => {
            const status = opp.status || 'New';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

        // Sales Rep Performance (Top 5 by Value)
        const repMap = new Map<string, number>();
        opportunities.forEach(opp => {
            const rep = opp.salesOwner || 'Unknown';
            repMap.set(rep, (repMap.get(rep) || 0) + (Number(opp.estimatedValue) || 0));
        });
        const repData = Array.from(repMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { sourceData, statusData, repData };
    }, [opportunities]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-6 mb-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">商机总额 (Pipeline)</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
                        <p className="text-xs text-slate-500 mt-1">所有潜在商机的预算总和</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">已赢单总额</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.wonValue)}</div>
                        <p className="text-xs text-slate-500 mt-1">基于中标金额统计</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">平均赢单率</CardTitle>
                        <Target className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{metrics.winRate}%</div>
                        <p className="text-xs text-slate-500 mt-1">按商机数量计算</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-slate-500">最佳销售</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{metrics.topRep}</div>
                        <p className="text-xs text-slate-500 mt-1">赢单数量最多</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Source Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">商机来源分布</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={charts.sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    onClick={(data) => onFilterChange('source', activeFilters.value === data.name ? null : data.name)}
                                    className="cursor-pointer"
                                >
                                    {charts.sourceData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={activeFilters.type === 'source' && activeFilters.value !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value: any) => [value, '数量']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">状态分布</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                <Bar
                                    dataKey="value"
                                    fill="#8884d8"
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) => onFilterChange('status', activeFilters.value === data.name ? null : (data.name || null))}
                                    className="cursor-pointer"
                                >
                                    {charts.statusData.map((entry, index) => (
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

                {/* Sales Rep Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">销售业绩排行 (Total Value)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.repData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={60} fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} cursor={{ fill: 'transparent' }} />
                                <Bar
                                    dataKey="value"
                                    fill="#82ca9d"
                                    radius={[0, 4, 4, 0]}
                                    onClick={(data) => onFilterChange('salesOwner', activeFilters.value === data.name ? null : (data.name || null))}
                                    className="cursor-pointer"
                                >
                                    {charts.repData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill="#82ca9d"
                                            opacity={activeFilters.type === 'salesOwner' && activeFilters.value !== entry.name ? 0.3 : 1}
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

