
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { UserDialog } from "./components/UserDialog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/users");
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleDelete = async (user: any) => {
        if (user.role === 'ADMIN' && user.username === 'admin') {
            alert("不能删除系统预设管理员");
            return;
        }
        if (!confirm(`确定要删除用户 "${user.displayName}" 吗？此操作无法撤销。`)) return;
        try {
            await api.delete(`/users/${user.id}`);
            fetchUsers();
        } catch (e) {
            console.error(e);
            alert("Deletion failed");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回首页
            </Link>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">内部人员管理</h1>
                    <p className="text-muted-foreground mt-1">管理系统用户、角色和权限。</p>
                </div>
                <Button onClick={() => { setSelectedUser(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> 新建用户
                </Button>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <div className="p-4 border-b">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索用户..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>用户 (Username)</TableHead>
                            <TableHead>显示名称</TableHead>
                            <TableHead>角色</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                                    <TableCell className="font-medium">{user.displayName}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSuccess={fetchUsers}
            />
        </div>
    );
}
