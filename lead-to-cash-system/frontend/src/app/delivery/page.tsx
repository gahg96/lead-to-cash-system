'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nContext";
import { Loader2, Plus, Calendar, Users, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ProjectDeliveryPage() {
    const { t } = useI18n();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await api.get('/projects');
            setProjects(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Initialization': return 'bg-blue-100 text-blue-800';
            case 'Planning': return 'bg-yellow-100 text-yellow-800';
            case 'Execution': return 'bg-green-100 text-green-800';
            case 'Delivery': return 'bg-purple-100 text-purple-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{t("project.title")}</h1>
                    <p className="text-slate-500">{t("project.subtitle")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.activeProjects")}</CardTitle>
                        <Calendar className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projects.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("project.fields.avgMargin")}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        {/* Calculate Average Margin */}
                        <div className="text-2xl font-bold">
                            {(() => {
                                if (projects.length === 0) return "0.0%";
                                const totalMargin = projects.reduce((sum, p) => {
                                    const contractValue = Number(p.contract?.wonPrice || p.contract?.totalContractValue || 0);
                                    if (contractValue === 0) return sum;

                                    const transactionTotal = p.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').reduce((tSum: number, tx: any) => tSum + Number(tx.totalAmount), 0) || 0;

                                    const cost = Number(p.laborCost || 0) +
                                        Number(p.outsourceCost || 0) +
                                        Number(p.travelCost || 0) +
                                        Number(p.thirdPartyEquipmentCost || 0) +
                                        Number(p.softwareCost || 0) +
                                        Number(p.otherWeight || 0) +
                                        Number(p.emergencySupportCost || 0) +
                                        transactionTotal;

                                    const margin = ((contractValue - cost) / contractValue) * 100;
                                    return sum + margin;
                                }, 0);
                                return (totalMargin / projects.length).toFixed(1) + "%";
                            })()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("project.fields.teamLoad")}</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        {/* Calculate Average Team Load */}
                        <div className="text-2xl font-bold">
                            {(() => {
                                const userLoadMap = new Map<string, number>();
                                projects.forEach(p => {
                                    if (p.status === 'Completed' || p.status === 'Archived') return;
                                    p.resources?.forEach((r: any) => {
                                        const uid = r.userId;
                                        userLoadMap.set(uid, (userLoadMap.get(uid) || 0) + (Number(r.allocationPct) || 0));
                                    });
                                });

                                if (userLoadMap.size === 0) return "0%";

                                let totalLoad = 0;
                                userLoadMap.forEach(load => totalLoad += load);
                                return Math.round(totalLoad / userLoadMap.size) + "%";
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t("dashboard.charts.projectStatus") || "项目状态分布"}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={(() => {
                                        const statusMap = new Map<string, number>();
                                        projects.forEach(p => {
                                            const status = t(`project.status.${p.status.toLowerCase()}`) || p.status;
                                            statusMap.set(status, (statusMap.get(status) || 0) + 1);
                                        });
                                        return Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
                                    })()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projects.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{t("dashboard.charts.projectMargins") || "项目利润率排行"}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(() => {
                                    return projects
                                        .map(p => {
                                            const contractValue = Number(p.contract?.wonPrice || p.contract?.totalContractValue || 0);
                                            const title = p.contract?.opportunity?.title || p.contract?.contractNumber || 'N/A';
                                            if (contractValue === 0) return { name: title, margin: 0 };

                                            const transactionTotal = p.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').reduce((tSum: number, tx: any) => tSum + Number(tx.totalAmount), 0) || 0;
                                            const cost = Number(p.laborCost || 0) +
                                                Number(p.outsourceCost || 0) +
                                                Number(p.travelCost || 0) +
                                                Number(p.thirdPartyEquipmentCost || 0) +
                                                Number(p.softwareCost || 0) +
                                                Number(p.otherWeight || 0) +
                                                Number(p.emergencySupportCost || 0) +
                                                transactionTotal;

                                            const margin = ((contractValue - cost) / contractValue) * 100;
                                            return {
                                                name: title.substring(0, 10) + '...',
                                                fullName: title,
                                                margin: parseFloat(margin.toFixed(1))
                                            };
                                        })
                                        .sort((a, b) => b.margin - a.margin)
                                        .slice(0, 5);
                                })()}
                                layout="vertical"
                                margin={{ left: 20, right: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" unit="%" />
                                <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    formatter={(value: any) => [`${value}%`, '利润率']}
                                    labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                />
                                <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("project.fields.activeEngagements")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("project.fields.projectContract")}</TableHead>
                                <TableHead>{t("project.fields.customer")}</TableHead>
                                <TableHead>{t("project.fields.status")}</TableHead>
                                <TableHead>{t("project.fields.timeline")}</TableHead>
                                <TableHead>{t("project.fields.resources")}</TableHead>
                                <TableHead className="text-right">{t("project.fields.action")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((proj) => (
                                <TableRow key={proj.id}>
                                    <TableCell>
                                        <div className="font-medium">{proj.contract?.opportunity?.title || proj.contract?.contractNumber || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{proj.contract?.contractNumber}</div>
                                    </TableCell>
                                    <TableCell>{proj.contract?.opportunity?.customer?.companyName || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(proj.status)} variant="outline">
                                            {t(`project.status.${proj.status.toLowerCase()}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : t("project.placeholders.tbd")} -
                                            {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : t("project.placeholders.tbd")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex -space-x-2">
                                            {proj.resources.map((r: any) => (
                                                <div key={r.id} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold" title={r.user.displayName}>
                                                    {r.user.displayName.charAt(0)}
                                                </div>
                                            ))}
                                            {proj.resources.length === 0 && <span className="text-xs text-slate-400">{t("project.placeholders.unassigned")}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/delivery/${proj.id}`}>
                                            <Button variant="ghost" size="sm">{t("project.actions.viewDetails")}</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {projects.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        {t("project.placeholders.noProjects")}
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
