
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { VendorDialog } from "./components/VendorDialog";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function VendorsPage() {
    const { t } = useI18n();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<any>(null);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const data = await api.get("/vendors");
            setVendors(data);
        } catch (error) {
            console.error("Failed to fetch vendors", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleEdit = (vendor: any) => {
        setSelectedVendor(vendor);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedVendor(null);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("确定要删除这个厂商吗？")) {
            try {
                await api.delete(`/vendors/${id}`);
                fetchVendors();
            } catch (error) {
                console.error("Failed to delete", error);
                alert("删除失败");
            }
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">厂商管理</h1>
                    <p className="text-slate-500">维护合作伙伴和供应商信息</p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    新建厂商
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle>厂商列表</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="搜索厂商..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>名称</TableHead>
                                <TableHead>品牌</TableHead>
                                <TableHead>类型</TableHead>
                                <TableHead>行业</TableHead>
                                <TableHead>区域</TableHead>
                                <TableHead>联系人</TableHead>
                                <TableHead>电话</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        加载中...
                                    </TableCell>
                                </TableRow>
                            ) : filteredVendors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(
                                    filteredVendors.reduce((groups, vendor) => {
                                        const brand = vendor.brand || "其他";
                                        if (!groups[brand]) {
                                            groups[brand] = [];
                                        }
                                        groups[brand].push(vendor);
                                        return groups;
                                    }, {} as Record<string, typeof filteredVendors>)
                                ).map(([brand, vendors]) => (
                                    <React.Fragment key={brand}>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableCell colSpan={8} className="py-2 font-semibold text-slate-700">
                                                {brand as string} ({(vendors as any[]).length})
                                            </TableCell>
                                        </TableRow>
                                        {(vendors as any[]).map((vendor: any) => (
                                            <TableRow key={vendor.id}>
                                                <TableCell className="font-medium pl-8">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-slate-400" />
                                                            {vendor.name}
                                                        </div>
                                                        {vendor.parent && (
                                                            <span className="text-xs text-slate-400 ml-6">
                                                                ↳ 属: {vendor.parent.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{vendor.brand || "-"}</TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                        {vendor.type || "未分类"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{vendor.industry || "-"}</TableCell>
                                                <TableCell>{vendor.region || "-"}</TableCell>
                                                <TableCell>{vendor.contactName || "-"}</TableCell>
                                                <TableCell>{vendor.contactPhone || "-"}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vendor)}>
                                                            <Pencil className="h-4 w-4 text-slate-500" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(vendor.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <VendorDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                vendor={selectedVendor}
                onSuccess={fetchVendors}
            />
        </div>
    );
}
