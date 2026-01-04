'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';

interface ProjectHealth {
    id: string;
    displayName: string;
    customerName: string;
    contractValue: number;
    billedAmount: number;
    collectedAmount: number;
    totalCost: number;
    grossMargin: number;
    profitMargin: number;
    blockerCount: number;
}

interface ProjectHealthTableProps {
    projects: ProjectHealth[];
}

export function ProjectHealthTable({ projects }: ProjectHealthTableProps) {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>项目经营健康度 (Project Financial Health)</CardTitle>
                <CardDescription>收入、成本与毛利分析</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>项目/商机</TableHead>
                            <TableHead>客户</TableHead>
                            <TableHead className="text-right">合同额</TableHead>
                            <TableHead className="text-right">开票额</TableHead>
                            <TableHead className="text-right">总成本</TableHead>
                            <TableHead className="text-right">毛利润</TableHead>
                            <TableHead className="text-right">毛利率</TableHead>
                            <TableHead className="text-right">回款进度</TableHead>
                            <TableHead className="text-center">风险提示</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.map((project) => (
                            <TableRow key={project.id}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/delivery/${project.id}`}
                                        className="hover:underline hover:text-primary transition-colors"
                                    >
                                        {project.displayName}
                                    </Link>
                                </TableCell>
                                <TableCell>{project.customerName}</TableCell>
                                <TableCell className="text-right">¥{project.contractValue.toLocaleString()}</TableCell>
                                <TableCell className={`text-right ${project.billedAmount > project.contractValue ? 'text-red-600 font-bold' : ''}`}>
                                    ¥{project.billedAmount.toLocaleString()}
                                    {project.billedAmount > project.contractValue && (
                                        <span className="text-xs ml-1">⚠️</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">¥{project.totalCost.toLocaleString()}</TableCell>
                                <TableCell className={`text-right ${project.grossMargin < 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                    ¥{project.grossMargin.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant={project.profitMargin < 20 ? "destructive" : "secondary"}>
                                        {project.profitMargin.toFixed(1)}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="w-[180px]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span className="text-blue-600 font-medium">开票: {Math.round((project.billedAmount / project.contractValue) * 100)}%</span>
                                            <span className="text-emerald-600 font-medium">回款: {Math.round((project.collectedAmount / project.contractValue) * 100)}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                                            {/* Collected Part (Green) */}
                                            <div
                                                className="h-full bg-emerald-500"
                                                style={{ width: `${Math.min((project.collectedAmount / project.contractValue) * 100, 100)}%` }}
                                            />
                                            {/* Invoiced but not Collected Part (Blue) */}
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${Math.max(0, Math.min((project.billedAmount / project.contractValue) * 100, 100) - Math.min((project.collectedAmount / project.contractValue) * 100, 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    {project.blockerCount > 0 && (
                                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                                            {project.blockerCount} 个节点未开票
                                        </Badge>
                                    )}
                                    {project.collectedAmount < project.totalCost && (
                                        <Badge variant="outline" className="ml-2 text-red-600 border-red-600">
                                            垫资中
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
