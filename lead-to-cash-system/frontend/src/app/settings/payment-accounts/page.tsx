'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Plus, Trash2, Star } from 'lucide-react';

interface PaymentAccount {
    id: string;
    accountName: string;
    bankName: string;
    accountNumber: string;
    isDefault: boolean;
    isActive: boolean;
    description?: string;
}

export default function PaymentAccountsPage() {
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        accountName: '',
        bankName: '',
        accountNumber: '',
        isDefault: false,
        description: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const data = await api.get('/payment-accounts');
            setAccounts(data);
        } catch (error) {
            console.error(error);
            toast.error('加载失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/payment-accounts/${editingId}`, formData);
                toast.success('更新成功');
            } else {
                await api.post('/payment-accounts', formData);
                toast.success('添加成功');
            }
            resetForm();
            fetchAccounts();
        } catch (error) {
            console.error(error);
            toast.error('操作失败');
        }
    };

    const handleEdit = (account: PaymentAccount) => {
        setFormData({
            accountName: account.accountName,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            isDefault: account.isDefault,
            description: account.description || ''
        });
        setEditingId(account.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个收款账户吗？')) return;
        try {
            await api.delete(`/payment-accounts/${id}`);
            toast.success('删除成功');
            fetchAccounts();
        } catch (error) {
            console.error(error);
            toast.error('删除失败');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await api.patch(`/payment-accounts/${id}`, { isDefault: true });
            toast.success('已设为默认');
            fetchAccounts();
        } catch (error) {
            console.error(error);
            toast.error('操作失败');
        }
    };

    const resetForm = () => {
        setFormData({
            accountName: '',
            bankName: '',
            accountNumber: '',
            isDefault: false,
            description: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    if (loading) return <div className="p-8">加载中...</div>;

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">收款账户管理</h1>
                    <p className="text-slate-500 mt-1">管理公司收款账户信息</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {showForm ? '取消' : '添加账户'}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>{editingId ? '编辑账户' : '新增账户'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>账户名称 *</Label>
                                    <Input
                                        required
                                        value={formData.accountName}
                                        onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                        placeholder="公司全称"
                                    />
                                </div>
                                <div>
                                    <Label>开户银行 *</Label>
                                    <Input
                                        required
                                        value={formData.bankName}
                                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        placeholder="如：中国工商银行深圳分行"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>收款账号 *</Label>
                                    <Input
                                        required
                                        value={formData.accountNumber}
                                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                        placeholder="银行账号"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>备注说明</Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="可选"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isDefault}
                                            onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                        />
                                        <span>设为默认账户</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">保存</Button>
                                <Button type="button" variant="outline" onClick={resetForm}>取消</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {accounts.map(account => (
                    <Card key={account.id}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">{account.accountName}</h3>
                                        {account.isDefault && (
                                            <Badge variant="default" className="bg-blue-600">
                                                <Star className="h-3 w-3 mr-1" />
                                                默认
                                            </Badge>
                                        )}
                                        {!account.isActive && (
                                            <Badge variant="secondary">已停用</Badge>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <div><span className="font-medium">开户银行：</span>{account.bankName}</div>
                                        <div><span className="font-medium">账号：</span><span className="font-mono">{account.accountNumber}</span></div>
                                        {account.description && (
                                            <div className="text-slate-500 mt-2">{account.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!account.isDefault && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSetDefault(account.id)}
                                        >
                                            设为默认
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEdit(account)}
                                    >
                                        编辑
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(account.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {accounts.length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center text-slate-500">
                            暂无收款账户，点击"添加账户"开始配置
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
