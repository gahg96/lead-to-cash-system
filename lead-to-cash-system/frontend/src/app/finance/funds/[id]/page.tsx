'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FundFlowSankey } from '@/components/finance/FundFlowSankey';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Trash2, Plus } from 'lucide-react';

interface FinancialSummary {
    totalAllocated: number;
    totalCollected: number;
    totalPayoutsNet: number;
    totalInterestCost: number;
    netMargin: number;
}

interface FundTransaction {
    id: string;
    type: string;
    status: string;
    description: string;
    allocations: any[];
    collections: any[];
    payouts: any[];
    project?: { description?: string };
}

export default function FundTransactionDetail() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const [transaction, setTransaction] = useState<FundTransaction | null>(null);
    const [summary, setSummary] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});

    // Add Item State
    const [addItemType, setAddItemType] = useState<'collection' | 'allocation' | 'payout' | null>(null);
    const [newItemData, setNewItemData] = useState<any>({});

    const fetchData = () => {
        setLoading(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/transactions/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setTransaction(data.transaction);
                setSummary(data.summary);
                setEditData({
                    description: data.transaction.description,
                    status: data.transaction.status
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (!params?.id) return;
        fetchData();
    }, [params?.id]);

    const handleSave = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/transactions/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                setIsEditing(false);
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteItem = async (type: 'allocations' | 'collections' | 'payouts', id: string) => {
        if (!confirm(t("common.confirmDelete") || "确认删除?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/${type}/${id}/delete`, {
                method: 'POST'
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const openAddDialog = (type: 'collection' | 'allocation' | 'payout') => {
        setAddItemType(type);
        setNewItemData({});
    };

    const handleAddItemSubmit = async () => {
        if (!addItemType) return;

        let endpoint = '';
        const payload = { transactionId: params.id, ...newItemData };

        if (addItemType === 'collection') endpoint = 'collections';
        else if (addItemType === 'allocation') endpoint = 'allocations';
        else if (addItemType === 'payout') endpoint = 'payouts';

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setAddItemType(null);
                setNewItemData({});
                fetchData();
            } else {
                alert('Add failed');
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div>{t("common.loading") || "加载中..."}</div>;
    if (!transaction) return <div>{t("funds.transactionNotFound") || "未找到交易"}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2 w-full">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{transaction.type}</Badge>
                            <Badge className={transaction.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                                {transaction.status}
                            </Badge>
                        </div>
                        {isEditing ? (
                            <div className="flex gap-2 items-center mt-2">
                                <Input
                                    value={editData.description}
                                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    className="text-lg font-bold"
                                />
                            </div>
                        ) : (
                            <h1 className="text-3xl font-bold tracking-tight">{transaction.description}</h1>
                        )}
                        <p className="text-muted-foreground">{transaction.project?.description || t("funds.noProjectLinked") || '无关联项目'}</p>
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>{t("common.cancel")}</Button>
                                <Button onClick={handleSave}>{t("common.save")}</Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)}>{t("common.edit")}</Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("funds.totalIn") || "收入总额"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ¥{summary?.totalCollected.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("funds.totalOut") || "支出总额"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ¥{summary?.totalAllocated.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("funds.costsPayouts") || "成本与支出"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-red-600 font-semibold">- ¥{summary?.totalInterestCost.toLocaleString()} {t("funds.cost") || "成本"}</div>
                        <div className="text-sm text-red-600 font-semibold">- ¥{summary?.totalPayoutsNet.toLocaleString()} {t("funds.fee") || "费用"}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t("funds.netMargin") || "净利润"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(summary?.netMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ¥{summary?.netMargin.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="statement">
                <TabsList>
                    <TabsTrigger value="statement">{t("funds.financialStatement") || "财务报表"}</TabsTrigger>
                    <TabsTrigger value="flow">{t("funds.fundFlow") || "资金流向"}</TabsTrigger>
                </TabsList>

                <TabsContent value="statement" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("funds.detailedStatement") || "详细报表"}</CardTitle>
                            <CardDescription>{t("funds.reconciliation") || "所有资金收支的对账"}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-green-700">{t("funds.revenueCollections") || "收入明细"}</h3>
                                        {isEditing && (
                                            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openAddDialog('collection')}>
                                                <Plus className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add</span>
                                            </Button>
                                        )}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">{t("funds.date") || "日期"}</th>
                                                <th className="text-left py-2">{t("funds.customer") || "客户"}</th>
                                                <th className="text-right py-2">{t("funds.amount") || "金额"}</th>
                                                {isEditing && <th className="w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.collections.map((c: any) => (
                                                <tr key={c.id} className="border-b group">
                                                    <td className="py-2">{new Date(c.receivedDate).toLocaleDateString()}</td>
                                                    <td>{c.customerName}</td>
                                                    <td className="text-right">¥{Number(c.amount).toLocaleString()}</td>
                                                    {isEditing && (
                                                        <td className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-red-500"
                                                                onClick={() => handleDeleteItem('collections', c.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-muted/20">
                                                <td colSpan={2} className="py-2 pl-2">{t("funds.totalCollections") || "收入合计"}</td>
                                                <td className="text-right pr-2">¥{summary?.totalCollected.toLocaleString()}</td>
                                                {isEditing && <td></td>}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-red-700">{t("funds.capitalAllocations") || "资金分配"}</h3>
                                        {isEditing && (
                                            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openAddDialog('allocation')}>
                                                <Plus className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add</span>
                                            </Button>
                                        )}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">{t("funds.date") || "日期"}</th>
                                                <th className="text-left py-2">{t("funds.vendor") || "供应商"}</th>
                                                <th className="text-right py-2">{t("funds.amount") || "金额"}</th>
                                                {isEditing && <th className="w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.allocations.map((a: any) => (
                                                <tr key={a.id} className="border-b">
                                                    <td className="py-2">{new Date(a.paymentDate).toLocaleDateString()}</td>
                                                    <td>{a.vendorName}</td>
                                                    <td className="text-right">¥{Number(a.amount).toLocaleString()}</td>
                                                    {isEditing && (
                                                        <td className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-red-500"
                                                                onClick={() => handleDeleteItem('allocations', a.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-muted/20">
                                                <td colSpan={2} className="py-2 pl-2">{t("funds.totalAllocations") || "支出合计"}</td>
                                                <td className="text-right pr-2">¥{summary?.totalAllocated.toLocaleString()}</td>
                                                {isEditing && <td></td>}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-semibold text-orange-700">{t("funds.expensePayouts") || "商务费用支出"}</h3>
                                        {isEditing && (
                                            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openAddDialog('payout')}>
                                                <Plus className="h-3.5 w-3.5" />
                                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add</span>
                                            </Button>
                                        )}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">{t("funds.beneficiary") || "受益人"}</th>
                                                <th className="text-left py-2">{t("funds.type") || "类型"}</th>
                                                <th className="text-right py-2">{t("funds.baseAmt") || "基数"}</th>
                                                <th className="text-right py-2">{t("funds.rate") || "比例"}</th>
                                                <th className="text-right py-2">{t("funds.netPayout") || "实付"}</th>
                                                {isEditing && <th className="w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.payouts.map((p: any) => (
                                                <tr key={p.id} className="border-b">
                                                    <td className="py-2">{p.beneficiary}</td>
                                                    <td>{p.payoutType}</td>
                                                    <td className="text-right">¥{Number(p.baseAmount).toLocaleString()}</td>
                                                    <td className="text-right">{Number(p.conversionRate) * 100}%</td>
                                                    <td className="text-right font-medium">¥{Number(p.netAmount).toLocaleString()}</td>
                                                    {isEditing && (
                                                        <td className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-red-500"
                                                                onClick={() => handleDeleteItem('payouts', p.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr className="font-bold bg-muted/20">
                                                <td colSpan={4} className="py-2 pl-2">{t("funds.totalPayouts") || "费用合计"}</td>
                                                <td className="text-right pr-2">¥{summary?.totalPayoutsNet.toLocaleString()}</td>
                                                {isEditing && <td></td>}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <Separator />
                                <div className="flex justify-end items-center gap-4 text-lg">
                                    <span>{t("funds.calculatedMargin") || "计算净利润"}:</span>
                                    <span className={`font-bold ${(summary?.netMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ¥{summary?.netMargin.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="flow">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("funds.flowDiagram") || "资金流向图"}</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[450px]">
                            <FundFlowSankey transaction={transaction} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!addItemType} onOpenChange={(open) => !open && setAddItemType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add {addItemType === 'collection' ? 'Collection' : addItemType === 'allocation' ? 'Allocation' : 'Payout'}</DialogTitle>
                        <DialogDescription>Input details for the new item.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {addItemType === 'collection' && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Customer Name</Label>
                                    <Input value={newItemData.customerName || ''} onChange={e => setNewItemData({ ...newItemData, customerName: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input type="number" value={newItemData.amount || ''} onChange={e => setNewItemData({ ...newItemData, amount: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={newItemData.receivedDate || ''} onChange={e => setNewItemData({ ...newItemData, receivedDate: e.target.value })} />
                                </div>
                            </>
                        )}
                        {addItemType === 'allocation' && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Vendor Name</Label>
                                    <Input value={newItemData.vendorName || ''} onChange={e => setNewItemData({ ...newItemData, vendorName: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input type="number" value={newItemData.amount || ''} onChange={e => setNewItemData({ ...newItemData, amount: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input type="date" value={newItemData.paymentDate || ''} onChange={e => setNewItemData({ ...newItemData, paymentDate: e.target.value })} />
                                </div>
                            </>
                        )}
                        {addItemType === 'payout' && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Beneficiary (受益人)</Label>
                                    <Input value={newItemData.beneficiary || ''} onChange={e => setNewItemData({ ...newItemData, beneficiary: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Type (类型)</Label>
                                    <Input value={newItemData.payoutType || ''} onChange={e => setNewItemData({ ...newItemData, payoutType: e.target.value })} placeholder="e.g. Commission" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Base Amount (基数)</Label>
                                    <Input type="number" value={newItemData.baseAmount || ''} onChange={e => setNewItemData({ ...newItemData, baseAmount: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Rate (比例 0-1)</Label>
                                    <Input type="number" step="0.01" value={newItemData.conversionRate || ''} onChange={e => setNewItemData({ ...newItemData, conversionRate: e.target.value })} />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddItemType(null)}>Cancel</Button>
                        <Button onClick={handleAddItemSubmit}>Add Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
