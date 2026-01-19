'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle, XCircle, FileText, AlertTriangle, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from 'next/link';
import { useI18n } from "@/lib/i18n/I18nContext";

// Types
interface Contract {
    id: string;
    contractNumber: string;
    status: string;
    totalContractValue: number;
    wonPrice?: number;
    estimatedValue?: number;
    customerContactName?: string;
    customerContactPhone?: string;
    customerContactEmail?: string;
    customerContactTitle?: string;
    vendorName?: string;
    vendorContactName?: string;
    vendorContactPhone?: string;
    paymentTerms?: string;
    riskAssessment?: string;
    scope?: string;
    sla?: string;
    liability?: string;
    paymentTermsDetails?: string;
    startDate?: string;
    endDate?: string;
    // Payment & Financial
    paymentAccount?: string;
    bankName?: string;
    accountName?: string;
    // Contract Terms
    penalties?: string;
    warranty?: string;
    confidentiality?: string;
    disputeResolution?: string;
    specialTerms?: string;
    createdAt: string;
    opportunity: {
        id: string;
        title: string;
        customer: { companyName: string };
    };
    drafter?: { username: string };
    approver?: { username: string };
    milestones: any[];
    documents: any[];
    lineItems?: any[];
}

export default function ContractDetailPage() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [riskText, setRiskText] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
    const [paymentTerms, setPaymentTerms] = useState<string>(''); // Added based on instruction's useEffect
    const [documents, setDocuments] = useState<any[]>([]); // Added based on instruction's useEffect
    const [milestones, setMilestones] = useState<any[]>([]); // Added based on instruction's useEffect

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Contract>>({});

    // Milestone State
    const [newMilestone, setNewMilestone] = useState<any>({ name: '', amount: '', dueDate: '' });
    const [milestoneFilter, setMilestoneFilter] = useState('All');
    const [showMilestoneInput, setShowMilestoneInput] = useState(false);

    // Force Status Update State
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const id = params.id as string;

    useEffect(() => {
        if (id) {
            fetchContract();
            fetchPaymentAccounts();
        }
    }, [id]);

    useEffect(() => {
        if (contract) {
            setSelectedStatus(contract.status);
            setRiskText(contract.riskAssessment || '');
            setPaymentTerms(contract.paymentTerms || '');
            setDocuments(contract.documents || []);
            setMilestones(contract.milestones || []);
        }
    }, [contract]);

    const handleForceUpdateStatus = async () => {
        if (!selectedStatus) return;
        try {
            await api.patch(`/contracts/${id}/status`, { status: selectedStatus });
            toast.success(t("common.saved"));
            setShowStatusDialog(false);
            fetchContract();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t("common.error"));
        }
    };

    const fetchPaymentAccounts = async () => {
        try {
            const data = await api.get('/payment-accounts/active');
            setPaymentAccounts(data);
        } catch (error) {
            console.error('Failed to fetch payment accounts:', error);
        }
    };

    const fetchContract = async () => {
        try {
            const data = await api.get(`/contracts/${id}`);
            setContract(data);
            setEditData(data);
            setRiskText(data.riskAssessment || "");
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-save Risk Text
    useEffect(() => {
        if (!contract || riskText === (contract.riskAssessment || '')) return;

        const timer = setTimeout(() => {
            handleSaveRisk(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [riskText]);

    const handleSaveRisk = async (silent = false) => {
        setIsSaving(true);
        try {
            await api.patch(`/contracts/${id}`, { riskAssessment: riskText });
            if (!silent) toast.success(t("common.saved"));
            // Update local contract state to prevent auto-save loop
            setContract(prev => prev ? { ...prev, riskAssessment: riskText } : null);
        } catch (e: any) {
            console.error(e);
            if (!silent) toast.error(e.message || t("common.error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleGlobalSave = async () => {
        setIsSaving(true);
        try {
            const updatePayload = {
                // Contract Details
                scope: editData.scope,
                sla: editData.sla,
                liability: editData.liability,
                paymentTermsDetails: editData.paymentTermsDetails,
                startDate: editData.startDate,
                endDate: editData.endDate,
                // Payment & Financial
                paymentAccount: editData.paymentAccount,
                bankName: editData.bankName,
                accountName: editData.accountName,
                // Contract Terms
                penalties: editData.penalties,
                warranty: editData.warranty,
                confidentiality: editData.confidentiality,
                disputeResolution: editData.disputeResolution,
                specialTerms: editData.specialTerms,
                // Risk Assessment
                riskAssessment: riskText
            };
            await api.patch(`/contracts/${id}`, updatePayload);
            setIsEditing(false);
            toast.success(t("common.saved"));
            fetchContract();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || t("common.error"));
        }
        finally { setIsSaving(false); }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('docType', 'contract_attachment');

        try {
            await api.upload(`/contracts/${id}/documents`, formData);
            toast.success("Document uploaded");
            fetchContract();
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        }
    };

    const handleAddMilestone = async () => {
        if (!newMilestone.name || !newMilestone.amount) return;
        try {
            await api.post(`/contracts/${id}/milestones`, newMilestone);
            setNewMilestone({ name: '', amount: '', dueDate: '' });
            setShowMilestoneInput(false);
            fetchContract();
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || t("common.error"));
        }
    };

    const handleDeleteMilestone = async (mid: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await api.delete(`/contracts/milestones/${mid}`);
            fetchContract();
        } catch (e) { console.error(e); }
    };

    // Milestone Editing State
    const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
    const [editMilestoneData, setEditMilestoneData] = useState<any>({});

    const handleSaveMilestoneEdit = async (mid: string) => {
        try {
            await api.patch(`/contracts/milestones/${mid}`, editMilestoneData);
            setEditingMilestoneId(null);
            fetchContract();
            toast.success(t("common.saved"));
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || t("common.error"));
        }
    };



    const handleInitializeProject = async () => {
        try {
            const newProj = await api.post('/projects', {
                contractId: id,
                status: 'Initialization',
                description: `Project execution for ${contract?.contractNumber}`
            });
            router.push(`/delivery/${newProj.id}`);
        } catch (e) { console.error(e); }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'bg-slate-500 hover:bg-slate-600 text-white border-slate-600';
            case 'CustomerReview': return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600';
            case 'InternalReview': return 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600';
            case 'CustomerSeal': return 'bg-purple-500 hover:bg-purple-600 text-white border-purple-600';
            case 'InternalSeal': return 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-600';
            case 'Signed': return 'bg-green-600 hover:bg-green-700 text-white border-green-700';
            case 'Terminated': return 'bg-red-600 hover:bg-red-700 text-white border-red-700';
            default: return 'bg-slate-500 text-white';
        }
    };

    if (loading || !contract) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const status = contract.status;
    const isDraft = status === 'Draft';
    // Workflow: Draft -> CustomerReview -> InternalReview -> CustomerSeal -> InternalSeal -> Signed





    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="mb-6">
                <Link href="/contracts" className="flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t("contract.backToContracts")}
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {contract.contractNumber}
                                <Select
                                    value={contract.status}
                                    onValueChange={async (newStatus) => {
                                        try {
                                            await api.patch(`/contracts/${id}/status`, { status: newStatus });
                                            toast.success(t("common.saved"));
                                            fetchContract();
                                        } catch (e) {
                                            console.error(e);
                                            toast.error(t("common.error"));
                                        }
                                    }}
                                >
                                    <SelectTrigger className={`w-[180px] h-8 font-medium ${getStatusColor(contract.status)} border-0`}>
                                        <SelectValue>{t(`contract.status.${contract.status}`)}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">{t("contract.status.Draft")}</SelectItem>
                                        <SelectItem value="CustomerReview">{t("contract.status.CustomerReview")}</SelectItem>
                                        <SelectItem value="InternalReview">{t("contract.status.InternalReview")}</SelectItem>
                                        <SelectItem value="CustomerSeal">{t("contract.status.CustomerSeal")}</SelectItem>
                                        <SelectItem value="InternalSeal">{t("contract.status.InternalSeal")}</SelectItem>
                                        <SelectItem value="Signed">{t("contract.status.Signed")}</SelectItem>
                                        <SelectItem value="Terminated">{t("contract.status.Terminated")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {contract.opportunity
                                ? `${contract.opportunity.customer.companyName} - ${contract.opportunity.title}`
                                : (contract as any).vendor
                                    ? `${(contract as any).vendor.name} - ${(contract as any).procurementCategory || 'Procurement'}`
                                    : 'N/A'
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {contract.status === 'Signed' && !(contract as any).project && (
                            <Button onClick={handleInitializeProject} className="bg-orange-600 hover:bg-orange-700">{t("project.actions.initialize")}</Button>
                        )}
                        {contract.status === 'Signed' && (contract as any).project && (
                            <Link href={`/delivery/${(contract as any).project.id}`}>
                                <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">View Project</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>



            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">{t("contract.tabs.overview")}</TabsTrigger>
                    <TabsTrigger value="risk">{t("contract.tabs.risk")}</TabsTrigger>
                    <TabsTrigger value="milestones">{t("contract.tabs.milestones")}</TabsTrigger>
                    {/* Add Linked Contracts Tab for Sales Contracts */}
                    {(contract as any).contractType === 'SALES' && (
                        <TabsTrigger value="linked-contracts">关联采购合同</TabsTrigger>
                    )}
                    <TabsTrigger value="documents">{t("contract.documents.tab")}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t("contract.details")}</CardTitle>
                            {contract.status !== 'Signed' && contract.status !== 'Terminated' && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                                    {isEditing ? t("contract.fields.cancel") : t("contract.fields.editDetails")}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isEditing ? (
                                <div className="space-y-4">
                                    {/* Readonly Info in Edit Mode */}
                                    <div className="pb-4 border-b bg-slate-50 p-4 rounded space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm text-slate-500">合同总额</Label>
                                                <div className="text-xl font-bold text-blue-600">
                                                    ¥{Number(contract.wonPrice || contract.totalContractValue).toLocaleString()}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-slate-500">创建人</Label>
                                                <div className="text-sm">{contract.drafter?.username || '-'}</div>
                                            </div>
                                        </div>

                                        {/* Line Items in Edit Mode */}
                                        {contract.lineItems && contract.lineItems.length > 0 && (
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">分项报价</Label>
                                                <div className="space-y-2">
                                                    {contract.lineItems.map((item: any) => (
                                                        <div key={item.id} className="bg-white p-2 rounded text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">{item.itemName}</span>
                                                                <span className="font-semibold">¥{Number(item.totalAmount).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Customer Contact in Edit Mode */}
                                        {(contract.customerContactName || contract.customerContactPhone) && (
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">客户联系人</Label>
                                                <div className="text-sm">
                                                    {contract.customerContactName} {contract.customerContactTitle && `(${contract.customerContactTitle})`}
                                                    {contract.customerContactPhone && ` · ${contract.customerContactPhone}`}
                                                </div>
                                            </div>
                                        )}

                                        {/* Vendor Contact in Edit Mode */}
                                        {(contract.vendorName || contract.vendorContactName) && (
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">厂商信息</Label>
                                                <div className="text-sm">
                                                    {contract.vendorName}
                                                    {contract.vendorContactName && ` · ${contract.vendorContactName}`}
                                                    {contract.vendorContactPhone && ` · ${contract.vendorContactPhone}`}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>合同有效期 - 开始日期</Label>
                                                <Input type="date" value={editData.startDate?.split('T')[0] || ''} onChange={e => setEditData({ ...editData, startDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <Label>合同有效期 - 结束日期</Label>
                                                <Input type="date" value={editData.endDate?.split('T')[0] || ''} onChange={e => setEditData({ ...editData, endDate: e.target.value })} />
                                            </div>
                                        </div>

                                        {/* End Customer for Procurement Contracts */}
                                        {(contract as any).contractType === 'PROCUREMENT' && (
                                            <>
                                                {/* Related Sales Contract */}
                                                {(contract as any).relatedSalesContract && (
                                                    <div className="border-t pt-4">
                                                        <h4 className="font-semibold mb-3">关联销售合同</h4>
                                                        <div className="text-sm space-y-2">
                                                            <div>
                                                                <span className="text-slate-500">合同编号：</span>
                                                                <span className="font-medium ml-2">
                                                                    {(contract as any).relatedSalesContract.contractNumber}
                                                                </span>
                                                            </div>
                                                            {(contract as any).relatedSalesContract.opportunity && (
                                                                <div>
                                                                    <span className="text-slate-500">客户：</span>
                                                                    <span className="font-medium ml-2">
                                                                        {(contract as any).relatedSalesContract.opportunity.customer.companyName}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* End Customer */}
                                                <div className="border-t pt-4">
                                                    <h4 className="font-semibold mb-3">最终客户</h4>
                                                    <div className="text-sm">
                                                        {(contract as any).endCustomer ? (
                                                            <div className="font-medium">
                                                                {(contract as any).endCustomer.companyName}
                                                            </div>
                                                        ) : (contract as any).relatedSalesContract?.opportunity?.customer ? (
                                                            <div className="font-medium text-blue-600">
                                                                {(contract as any).relatedSalesContract.opportunity.customer.companyName}
                                                                <span className="text-xs text-slate-500 ml-2">(继承自关联合同)</span>
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-400">
                                                                未设置
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-semibold">
                                                    {(contract as any).contractType === 'PROCUREMENT' ? '付款账户' : '收款信息'}
                                                </h4>
                                                {paymentAccounts.length > 0 ? (
                                                    <div className="w-[300px]">
                                                        <Select onValueChange={(value) => {
                                                            const account = paymentAccounts.find((a: any) => a.id === value);
                                                            if (account) {
                                                                setEditData({
                                                                    ...editData,
                                                                    accountName: account.accountName,
                                                                    bankName: account.bankName,
                                                                    paymentAccount: account.accountNumber
                                                                });
                                                            }
                                                        }}>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="点击选择公司收款账户" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {paymentAccounts.map((account: any) => (
                                                                    <SelectItem key={account.id} value={account.id}>
                                                                        {account.accountName} - {account.bankName}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-yellow-600 flex items-center">
                                                        <AlertTriangle className="h-4 w-4 mr-1" />
                                                        请先在系统设置中配置收款账户
                                                    </div>
                                                )}
                                            </div>

                                            {/* Read-only display of selected payment info */}
                                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                {editData.accountName || editData.paymentAccount ? (
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <Label className="text-slate-500 text-xs block mb-1">账户名称</Label>
                                                            <div className="font-medium">{editData.accountName || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <Label className="text-slate-500 text-xs block mb-1">开户银行</Label>
                                                            <div className="font-medium">{editData.bankName || '-'}</div>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <Label className="text-slate-500 text-xs block mb-1">收款账号</Label>
                                                            <div className="font-mono font-medium text-blue-600">{editData.paymentAccount || '-'}</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-slate-400 py-2">
                                                        {(contract as any).contractType === 'PROCUREMENT'
                                                            ? '暂无付款账户信息，请从上方选择账户'
                                                            : '暂无收款信息，请从上方选择账户'
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                            <div className="hidden">
                                                {/* Hidden inputs to keep values in state if needed, though state is managed by React */}
                                            </div>
                                        </div>

                                        <div className="border-t pt-4">
                                            <h4 className="font-semibold mb-3">合同条款</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>{t("contract.scope")}</Label>
                                                    <Textarea value={editData.scope || ''} onChange={e => setEditData({ ...editData, scope: e.target.value })} placeholder="合同范围说明" />
                                                </div>
                                                <div>
                                                    <Label>{t("contract.sla")}</Label>
                                                    <Textarea value={editData.sla || ''} onChange={e => setEditData({ ...editData, sla: e.target.value })} placeholder="服务水平协议" />
                                                </div>
                                                <div>
                                                    <Label>{t("contract.liability")}</Label>
                                                    <Textarea value={editData.liability || ''} onChange={e => setEditData({ ...editData, liability: e.target.value })} placeholder="责任条款" />
                                                </div>
                                                <div>
                                                    <Label>{t("contract.paymentTerms")}</Label>
                                                    <Textarea value={editData.paymentTermsDetails || ''} onChange={e => setEditData({ ...editData, paymentTermsDetails: e.target.value })} placeholder="付款条件详情" />
                                                </div>
                                                <div>
                                                    <Label>罚则/违约条款</Label>
                                                    <Textarea value={editData.penalties || ''} onChange={e => setEditData({ ...editData, penalties: e.target.value })} placeholder="违约责任及罚则" />
                                                </div>
                                                <div>
                                                    <Label>质保条款</Label>
                                                    <Textarea value={editData.warranty || ''} onChange={e => setEditData({ ...editData, warranty: e.target.value })} placeholder="质保期限及条件" />
                                                </div>
                                                <div>
                                                    <Label>保密条款</Label>
                                                    <Textarea value={editData.confidentiality || ''} onChange={e => setEditData({ ...editData, confidentiality: e.target.value })} placeholder="保密义务及范围" />
                                                </div>
                                                <div>
                                                    <Label>争议解决</Label>
                                                    <Textarea value={editData.disputeResolution || ''} onChange={e => setEditData({ ...editData, disputeResolution: e.target.value })} placeholder="争议解决方式（如仲裁、诉讼等）" />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label>特殊条款</Label>
                                                    <Textarea value={editData.specialTerms || ''} onChange={e => setEditData({ ...editData, specialTerms: e.target.value })} placeholder="其他特殊约定" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4 border-t">
                                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                                {t("contract.fields.cancel")}
                                            </Button>
                                            <Button onClick={handleGlobalSave} disabled={isSaving}>
                                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {t("common.save")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                            ) : (
                                <div className="space-y-6">
                                    {/* Pricing Information */}
                                    <div className="pb-4 border-b">
                                        <div>
                                            <Label className="text-sm text-slate-500">合同总额</Label>
                                            <div className="text-2xl font-bold text-blue-600">
                                                ¥{Number(contract.wonPrice || contract.totalContractValue).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project Execution & Financial Status */}
                                    {(contract as any).project && (
                                        <div className="pb-4 border-b">
                                            <div className="flex justify-between items-center mb-3">
                                                <Label className="text-base font-semibold block">项目执行与财务状况</Label>
                                                <Button variant="outline" size="sm" onClick={() => router.push(`/delivery/${(contract as any).project.id}`)}>
                                                    查看项目详情
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Card className="bg-slate-50 border-slate-200 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">财务健康度</div>
                                                        <div className="flex items-end gap-2">
                                                            <div className={`text-xl font-bold ${((contract as any).project.targetProfitMargin && (contract as any).project.budget) ?
                                                                (Number(((((contract as any).wonPrice - (contract as any).project.budget) / (contract as any).wonPrice) * 100)) >= (contract as any).project.targetProfitMargin ? 'text-green-600' : 'text-orange-600')
                                                                : 'text-slate-600'
                                                                }`}>
                                                                {(contract as any).project.budget ?
                                                                    `${((Number((contract as any).wonPrice || 0) - Number((contract as any).project.budget)) / Number((contract as any).wonPrice || 1) * 100).toFixed(1)}%`
                                                                    : 'N/A'}
                                                            </div>
                                                            <div className="text-xs text-slate-400 mb-1">实际利润率</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-slate-50 border-slate-200 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">开票状态</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {(contract as any).project.requiresInvoicing ? (
                                                                (contract as any).project.invoicingCompleted ? (
                                                                    <Badge className="bg-green-600 hover:bg-green-700">已完成开票</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">待完成开票</Badge>
                                                                )
                                                            ) : (
                                                                <Badge variant="secondary">无需开票</Badge>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                                <Card className="bg-slate-50 border-slate-200 shadow-sm">
                                                    <CardContent className="p-4">
                                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">资金回款进度</div>
                                                        <div className="flex items-end gap-2">
                                                            <div className="text-xl font-bold text-blue-600">
                                                                {(contract as any).project.fundTransactions ?
                                                                    `${(((contract as any).project.fundTransactions.reduce((sum: number, tx: any) => sum + (tx.collections?.reduce((cSum: number, c: any) => cSum + Number(c.amount), 0) || 0), 0) / Number((contract as any).wonPrice || 1)) * 100).toFixed(0)}%`
                                                                    : '0%'}
                                                            </div>
                                                            <div className="text-xs text-slate-400 mb-1">已回款</div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    )}

                                    {/* Line Items */}
                                    {contract.lineItems && contract.lineItems.length > 0 && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">分项报价</Label>
                                            <div className="space-y-3">
                                                {contract.lineItems.map((item: any) => (
                                                    <div key={item.id} className="bg-slate-50 p-3 rounded">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1">
                                                                <div className="font-medium">{item.itemName}</div>
                                                                {item.description && (
                                                                    <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                                                                )}
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <div className="font-semibold">¥{Number(item.totalAmount).toLocaleString()}</div>
                                                                <div className="text-xs text-slate-500">
                                                                    {item.itemType === 'PRODUCT' ? '产品' : '服务'} ({(Number(item.taxRate) * 100).toFixed(0)}%)
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-600 flex gap-4">
                                                            <span>不含税: ¥{Number(item.subtotal).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span>税额: ¥{Number(item.taxAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="pt-2 border-t text-sm text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span>不含税合计:</span>
                                                        <span className="font-semibold">¥{contract.lineItems.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>税额合计:</span>
                                                        <span className="font-semibold">¥{contract.lineItems.reduce((sum: number, item: any) => sum + Number(item.taxAmount), 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Customer Contact */}
                                    {(contract.customerContactName || contract.customerContactPhone) && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">客户联系人</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {contract.customerContactName && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">姓名</Label>
                                                        <div>{contract.customerContactName} {contract.customerContactTitle && `(${contract.customerContactTitle})`}</div>
                                                    </div>
                                                )}
                                                {contract.customerContactPhone && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">电话</Label>
                                                        <div>{contract.customerContactPhone}</div>
                                                    </div>
                                                )}
                                                {contract.customerContactEmail && (
                                                    <div className="col-span-2">
                                                        <Label className="text-xs text-slate-500">邮箱</Label>
                                                        <div>{contract.customerContactEmail}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vendor Contact */}
                                    {(contract.vendorName || contract.vendorContactName) && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">厂商信息</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {contract.vendorName && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">厂商名称</Label>
                                                        <div>{contract.vendorName}</div>
                                                    </div>
                                                )}
                                                {contract.vendorContactName && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">联系人</Label>
                                                        <div>{contract.vendorContactName}</div>
                                                    </div>
                                                )}
                                                {contract.vendorContactPhone && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">联系电话</Label>
                                                        <div>{contract.vendorContactPhone}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contract Details */}
                                    <div className="pb-4 border-b">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>{t("contract.createdBy")}</Label>
                                                <div>{contract.drafter?.username || '-'}</div>
                                            </div>
                                            <div>
                                                <Label>创建时间</Label>
                                                <div>{new Date(contract.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            {contract.startDate && (
                                                <div>
                                                    <Label>合同有效期 - 开始日期</Label>
                                                    <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                            {contract.endDate && (
                                                <div>
                                                    <Label>合同有效期 - 结束日期</Label>
                                                    <div>{new Date(contract.endDate).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Related Sales Contract for Procurement (Read-only) */}
                                    {(contract as any).contractType === 'PROCUREMENT' && (contract as any).relatedSalesContract && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">关联销售合同</Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs text-slate-500">合同编号</Label>
                                                    <div>{(contract as any).relatedSalesContract.contractNumber}</div>
                                                </div>
                                                {(contract as any).relatedSalesContract.opportunity?.customer && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">客户</Label>
                                                        <div>{(contract as any).relatedSalesContract.opportunity.customer.companyName}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* End Customer for Procurement (Read-only) */}
                                    {(contract as any).contractType === 'PROCUREMENT' && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">最终客户</Label>
                                            <div>
                                                {(contract as any).endCustomer ? (
                                                    <div className="font-medium">
                                                        {(contract as any).endCustomer.companyName}
                                                    </div>
                                                ) : (contract as any).relatedSalesContract?.opportunity?.customer ? (
                                                    <div className="font-medium text-blue-600">
                                                        {(contract as any).relatedSalesContract.opportunity.customer.companyName}
                                                        <span className="text-xs text-slate-500 ml-2">(继承自关联合同)</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-400">未设置</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Information */}
                                    {(contract.paymentAccount || contract.bankName) && (
                                        <div className="pb-4 border-b">
                                            <Label className="text-base font-semibold mb-3 block">
                                                {(contract as any).contractType === 'PROCUREMENT' ? '付款账户' : '收款信息'}
                                            </Label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {contract.accountName && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">账户名称</Label>
                                                        <div>{contract.accountName}</div>
                                                    </div>
                                                )}
                                                {contract.bankName && (
                                                    <div>
                                                        <Label className="text-xs text-slate-500">开户银行</Label>
                                                        <div>{contract.bankName}</div>
                                                    </div>
                                                )}
                                                {contract.paymentAccount && (
                                                    <div className="col-span-2">
                                                        <Label className="text-xs text-slate-500">收款账号</Label>
                                                        <div className="font-mono">{contract.paymentAccount}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Contract Terms */}
                                    <div className="space-y-3">
                                        {contract.scope && (
                                            <div>
                                                <Label>{t("contract.scope")}</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.scope}</div>
                                            </div>
                                        )}
                                        {contract.paymentTermsDetails && (
                                            <div>
                                                <Label>{t("contract.paymentTerms")}</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.paymentTermsDetails}</div>
                                            </div>
                                        )}
                                        {contract.sla && (
                                            <div>
                                                <Label>服务水平协议 (SLA)</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.sla}</div>
                                            </div>
                                        )}
                                        {contract.liability && (
                                            <div>
                                                <Label>责任条款</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.liability}</div>
                                            </div>
                                        )}
                                        {contract.penalties && (
                                            <div>
                                                <Label>罚则/违约条款</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.penalties}</div>
                                            </div>
                                        )}
                                        {contract.warranty && (
                                            <div>
                                                <Label>质保条款</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.warranty}</div>
                                            </div>
                                        )}
                                        {contract.confidentiality && (
                                            <div>
                                                <Label>保密条款</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.confidentiality}</div>
                                            </div>
                                        )}
                                        {contract.disputeResolution && (
                                            <div>
                                                <Label>争议解决</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.disputeResolution}</div>
                                            </div>
                                        )}
                                        {contract.specialTerms && (
                                            <div>
                                                <Label>特殊条款</Label>
                                                <div className="p-2 bg-slate-50 rounded text-sm whitespace-pre-wrap">{contract.specialTerms}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risk">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("contract.risk.title")}</CardTitle>
                            <CardDescription>{t("contract.risk.subtitle")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                value={riskText}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRiskText(e.target.value)}
                                placeholder={t("contract.risk.placeholder")}
                                className="min-h-[150px]"
                                disabled={contract.status === 'Signed'}
                            />
                            <div className="flex justify-between items-center text-sm text-slate-500">
                                <div>
                                    {isSaving ? "Saving..." : contract.riskAssessment === riskText ? "All changes saved" : "Unsaved changes"}
                                </div>
                                <Button onClick={() => handleSaveRisk(false)} disabled={isSaving || contract.status === 'Signed'}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {t("common.save")}
                                </Button>
                            </div>

                            {!isDraft && contract.approver && (
                                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-green-800 flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    <div>
                                        <div className="font-semibold">{t("contract.risk.processedBy")} {contract.approver.username}</div>
                                        <div className="text-sm">{t("table.status")}: {t(`contract.status.${contract.status}`)}</div>
                                    </div>
                                </div>
                            )}
                            {contract.status === 'Terminated' && (
                                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-800 flex items-center gap-2">
                                    <XCircle className="h-5 w-5" />
                                    <div>{t("contract.risk.rejectedBy")} {contract.approver?.username}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="milestones">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>{t("contract.milestones.title")}</CardTitle>
                                <CardDescription>{t("contract.milestones.subtitle")}</CardDescription>
                            </div>
                            {isDraft && (
                                <Button size="sm" onClick={() => setShowMilestoneInput(!showMilestoneInput)}>
                                    {showMilestoneInput ? t("contract.milestones.cancel") : t("contract.milestones.add")}
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {showMilestoneInput && (
                                <div className="mb-4 p-4 border rounded bg-slate-50 space-y-2">
                                    <Label>{t("contract.milestones.name")}</Label>
                                    <Input value={newMilestone.name} onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })} placeholder={t("contract.milestones.namePlaceholder")} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><Label>{t("contract.milestones.amount")}</Label><Input type="number" value={newMilestone.amount} onChange={e => setNewMilestone({ ...newMilestone, amount: e.target.value })} /></div>
                                        <div><Label>{t("contract.milestones.dueDate")}</Label><Input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} /></div>
                                    </div>
                                    <Button onClick={handleAddMilestone} size="sm">{t("contract.milestones.save")}</Button>
                                </div>
                            )}

                            <div className="space-y-4">
                                {contract.milestones && contract.milestones.length > 0 ? (
                                    contract.milestones.map((ms: any) => (
                                        <div key={ms.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            {editingMilestoneId === ms.id ? (
                                                <div className="flex-1 grid grid-cols-12 gap-4 items-end">
                                                    <div className="col-span-4">
                                                        <Label>{t("contract.milestones.name")}</Label>
                                                        <Input
                                                            value={editMilestoneData.name}
                                                            onChange={e => setEditMilestoneData({ ...editMilestoneData, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Label>{t("contract.milestones.amount")}</Label>
                                                        <Input
                                                            type="number"
                                                            value={editMilestoneData.amount}
                                                            onChange={e => setEditMilestoneData({ ...editMilestoneData, amount: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <Label>{t("contract.milestones.dueDate")}</Label>
                                                        <Input
                                                            type="date"
                                                            value={editMilestoneData.dueDate ? new Date(editMilestoneData.dueDate).toISOString().split('T')[0] : ''}
                                                            onChange={e => setEditMilestoneData({ ...editMilestoneData, dueDate: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex gap-2">
                                                        <Button size="sm" onClick={() => handleSaveMilestoneEdit(ms.id)}>{t("common.save")}</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingMilestoneId(null)}>{t("common.cancel")}</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div>
                                                        <div className="font-semibold">{ms.name}</div>
                                                        <div className="text-sm text-slate-500">{t("contract.milestones.dueDate")}: {ms.dueDate ? new Date(ms.dueDate).toLocaleDateString() : 'TBD'}</div>
                                                    </div>
                                                    <div className="text-right flex items-center gap-4">
                                                        <div>
                                                            <div className="font-mono">¥{Number(ms.amount).toLocaleString()}</div>
                                                            <Badge variant="outline">{ms.status}</Badge>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="sm" onClick={() => {
                                                                setEditingMilestoneId(ms.id);
                                                                setEditMilestoneData({ ...ms });
                                                            }}>
                                                                <Pencil className="h-4 w-4 text-slate-500" />
                                                            </Button>
                                                            {isDraft && (
                                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMilestone(ms.id)} className="text-red-500">
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 py-8 border-dashed border-2 rounded">
                                        <p className="mb-4">{t("contract.milestones.empty")}</p>
                                        {isDraft && (
                                            <Button variant="outline" onClick={async () => {
                                                try {
                                                    await api.post(`/contracts/${id}/milestones/defaults`, {});
                                                    toast.success(t("common.saved"));
                                                    fetchContract();
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error(t("common.error"));
                                                }
                                            }}>
                                                初始化默认里程碑 (3项)
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{t("contract.documents.title")}</CardTitle>
                            <div className="relative">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} />
                                <Button variant="outline">{t("contract.documents.upload")}</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {contract.documents && contract.documents.length > 0 ? (
                                    contract.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                <div>
                                                    <div className="font-medium">{doc.filename}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {t("contract.documents.uploadedBy")} {doc.uploadedBy?.username} on {new Date(doc.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${doc.filepath}`, '_blank')}>{t("contract.documents.download")}</Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 py-8">{t("contract.documents.empty")}</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Linked Procurement Contracts Tab Content */}
                <TabsContent value="linked-contracts">
                    <Card>
                        <CardHeader>
                            <CardTitle>关联采购合同</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!(contract as any).linkedProcurementContracts || (contract as any).linkedProcurementContracts.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    暂无关联的采购合同
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>合同编号</TableHead>
                                            <TableHead>供应商</TableHead>
                                            <TableHead>最终客户</TableHead>
                                            <TableHead>金额</TableHead>
                                            <TableHead>状态</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(contract as any).linkedProcurementContracts.map((linkedContract: any) => (
                                            <TableRow
                                                key={linkedContract.id}
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() => router.push(`/contracts/${linkedContract.id}`)}
                                            >
                                                <TableCell className="font-medium font-mono">
                                                    {linkedContract.contractNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {linkedContract.vendor?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {linkedContract.endCustomer?.companyName || (
                                                        <span className="text-slate-400">继承自关联合同</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(linkedContract.wonPrice || linkedContract.totalContractValue || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {t(`contract.status.${linkedContract.status}`)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >
        </div >
    );
}
