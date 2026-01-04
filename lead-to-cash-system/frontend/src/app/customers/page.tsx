
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { CustomerDialog } from "./components/CustomerDialog";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/customers");
            setCustomers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c =>
        c.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (customer: any) => {
        setSelectedCustomer(customer);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除该客户吗？")) return;
        try {
            // Assuming delete endpoint exists or we add it later. Usually soft delete.
            // For now, let's just alert as backend delete wasn't explicitly added for customers yet.
            // Wait, CustomersController didn't have Delete. 
            // I will just skip delete call for now or update backend plan. 
            // Let's implement UI but mock action or update backend if needed.
            // Actually, user deleted is riskier. Let's keep it view/edit focused for now.
            alert("暂不支持删除操作");
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">客户管理</h1>
                    <p className="text-muted-foreground mt-1">管理客户信息和联系人。</p>
                </div>
                <Button onClick={() => { setSelectedCustomer(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> 新建客户
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索客户..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>客户名称</TableHead>
                            <TableHead>行业</TableHead>
                            <TableHead>规模</TableHead>
                            <TableHead>主要联系人</TableHead>
                            <TableHead>职位</TableHead>
                            <TableHead>电话</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.companyName}</TableCell>
                                    <TableCell>{customer.industry || '-'}</TableCell>
                                    <TableCell>{customer.companySize || '-'}</TableCell>
                                    <TableCell>{customer.contactName || '-'}</TableCell>
                                    <TableCell>{customer.contactTitle || '-'}</TableCell>
                                    <TableCell>{customer.contactPhone || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CustomerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                customer={selectedCustomer}
                onSuccess={fetchCustomers}
            />
        </div>
    );
}
