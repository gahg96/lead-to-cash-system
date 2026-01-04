'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useI18n } from "@/lib/i18n/I18nContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ArrowLeft, Plus, Trash2, Save, FileText, AlertTriangle, Edit, Upload, Download, TrendingUp, DollarSign, X } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

export default function ProjectDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useI18n();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    // Helper for profit margin
    const calculateProfitMargin = (revenue: number, cost: number) => {
        if (!revenue || revenue === 0) return 0;
        return Number((((revenue - cost) / revenue) * 100).toFixed(1));
    };

    // UI Logic
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [activeTab, setActiveTab] = useState('overview');
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingMeetingId, setUploadingMeetingId] = useState<string | null>(null);

    // Sub-forms state
    const [newResource, setNewResource] = useState({ userId: '', role: '', allocationPct: '100' });
    const [newMeeting, setNewMeeting] = useState({ title: '', type: 'Weekly', planDate: '' });
    const [newRisk, setNewRisk] = useState({ description: '', impact: 'Medium', mitigationPlan: '' });
    const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
    const [editingRiskData, setEditingRiskData] = useState<any>({});

    useEffect(() => {
        fetchProject();
        fetchUsers();
    }, [id]);

    // Auto-sync emergency cost when complexity changes in edit mode
    useEffect(() => {
        // Use wonPrice if available, otherwise totalContractValue, to match the rest of the UI
        const baseValue = Number(project?.contract?.wonPrice || project?.contract?.totalContractValue || 0);

        if (isEditing && baseValue > 0) {
            let rate = 0.03;
            if (editData.complexity === 'Medium') rate = 0.05;
            if (editData.complexity === 'High') rate = 0.10;
            const newCost = baseValue * rate;

            // Only update if difference is significant (floating point safety)
            if (Math.abs(editData.emergencySupportCost - newCost) > 0.01) {
                setEditData((prev: any) => ({ ...prev, emergencySupportCost: newCost }));
            }
        }
    }, [editData.complexity, isEditing, project?.contract?.totalContractValue, project?.contract?.wonPrice]);

    const fetchProject = async () => {
        try {
            const data = await api.get(`/projects/${id}`);
            setProject(data);
            setEditData({
                status: data.status,
                description: data.description || '',
                // Default to Today if not set
                startDate: data.startDate ? data.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
                // Default to 3 months later if not set
                endDate: data.endDate ? data.endDate.split('T')[0] : (() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 3);
                    return d.toISOString().split('T')[0];
                })(),
                budget: data.budget || 0,
                targetProfitMargin: data.targetProfitMargin || 0,
                laborCost: data.laborCost || 0,
                outsourceCost: data.outsourceCost || 0,
                travelCost: data.travelCost || 0,
                emergencySupportCost: data.emergencySupportCost || 0,
                thirdPartyEquipmentCost: data.thirdPartyEquipmentCost || 0,
                softwareCost: data.softwareCost || 0,
                otherWeight: data.otherWeight || 0,
                complexity: data.complexity || 'Low',
                financialRemarks: data.financialRemarks || '',
                isDelayed: data.isDelayed || false
            });
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.get('/users');
            setUsers(data);
        } catch (error) { console.error(error); }
    };

    const validateRequiredFields = () => {
        const errors: { [key: string]: boolean } = {};
        let firstErrorTab = '';

        // Overview tab required fields
        if (!editData.status) {
            errors.status = true;
            if (!firstErrorTab) firstErrorTab = 'overview';
        }
        if (!editData.startDate || editData.startDate.trim() === '') {
            errors.startDate = true;
            if (!firstErrorTab) firstErrorTab = 'overview';
        }
        if (!editData.endDate || editData.endDate.trim() === '') {
            errors.endDate = true;
            if (!firstErrorTab) firstErrorTab = 'overview';
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            setActiveTab(firstErrorTab);
            alert(`请填写所有必填字段（标记为红色 * 的字段）`);
            return false;
        }
        return true;
    };

    const handleSaveProject = async () => {
        // Validate required fields first
        if (!validateRequiredFields()) {
            return;
        }

        try {
            // Convert string inputs to numbers for validation
            const payload: any = {
                status: editData.status,
                description: editData.description,
                budget: editData.budget ? parseFloat(editData.budget as any) : 0,
                targetProfitMargin: editData.targetProfitMargin ? parseFloat(editData.targetProfitMargin as any) : 0,
                laborCost: editData.laborCost ? parseFloat(editData.laborCost as any) : 0,
                outsourceCost: editData.outsourceCost ? parseFloat(editData.outsourceCost as any) : 0,
                travelCost: editData.travelCost ? parseFloat(editData.travelCost as any) : 0,
                emergencySupportCost: editData.emergencySupportCost ? parseFloat(editData.emergencySupportCost as any) : 0,
                thirdPartyEquipmentCost: editData.thirdPartyEquipmentCost ? parseFloat(editData.thirdPartyEquipmentCost as any) : 0,
                softwareCost: editData.softwareCost ? parseFloat(editData.softwareCost as any) : 0,
                otherWeight: editData.otherWeight ? parseFloat(editData.otherWeight as any) : 0,
                complexity: editData.complexity,
                financialRemarks: editData.financialRemarks,
                isDelayed: editData.isDelayed,
            };

            // Only include dates if they are not empty strings
            if (editData.startDate && editData.startDate.trim() !== '') {
                payload.startDate = new Date(editData.startDate).toISOString();
            }
            if (editData.endDate && editData.endDate.trim() !== '') {
                payload.endDate = new Date(editData.endDate).toISOString();
            }

            console.log('Saving project with payload:', payload);
            await api.patch(`/projects/${id}`, payload);
            setIsEditing(false);
            setValidationErrors({});
            fetchProject();
            alert('项目保存成功！');
        } catch (error: any) {
            console.error('Save project error:', error);
            const errorMessage = error?.message || '保存失败，请查看控制台了解详情';
            alert(`保存失败: ${errorMessage}`);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !uploadingMeetingId) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.upload(`/projects/meetings/${uploadingMeetingId}/upload`, formData);
            fetchProject();
            alert('会议纪要上传成功！');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('上传失败，请重试');
        } finally {
            setUploadingMeetingId(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAddResource = async () => {
        if (!newResource.userId || !newResource.role) return;
        try {
            await api.post(`/projects/${id}/resources`, newResource);
            setNewResource({ userId: '', role: '', allocationPct: '100' });
            fetchProject();
        } catch (error) { console.error(error); }
    };

    const handleAddMeeting = async () => {
        if (!newMeeting.title || !newMeeting.planDate) return;
        try {
            await api.post(`/projects/${id}/meetings`, newMeeting);
            setNewMeeting({ title: '', type: 'Weekly', planDate: '' });
            fetchProject();
        } catch (error) { console.error(error); }
    };

    const handleAddRisk = async () => {
        if (!newRisk.description) return;
        try {
            await api.post(`/projects/${id}/risks`, newRisk);
            setNewRisk({ description: '', impact: 'Medium', mitigationPlan: '' });
            fetchProject();
        } catch (error) { console.error(error); }
    };

    const handleDeleteMeeting = async (meetingId: string) => {
        if (!confirm('确定要删除这个会议吗？')) return;
        try {
            await api.delete(`/projects/meetings/${meetingId}`);
            fetchProject();
            alert('会议已删除');
        } catch (error) {
            console.error('Delete meeting error:', error);
            alert('删除失败，请重试');
        }
    };

    const handleUpdateRiskStatus = async (riskId: string, newStatus: string) => {
        try {
            await api.patch(`/projects/risks/${riskId}`, { status: newStatus });
            fetchProject();
        } catch (error) {
            console.error('Update risk status error:', error);
            alert('更新失败，请重试');
        }
    };

    const handleEditRisk = (risk: any) => {
        setEditingRiskId(risk.id);
        setEditingRiskData({
            description: risk.description,
            impact: risk.impact,
            status: risk.status,
            mitigationPlan: risk.mitigationPlan || ''
        });
    };

    // Quick Add Transaction State
    const [newTransaction, setNewTransaction] = useState({
        transactionDate: new Date().toISOString().split('T')[0],
        type: 'ADVANCE',
        partyName: '',
        description: '',
        amount: ''
    });

    const handleAddTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.type) {
            alert('请填写金额和类型');
            return;
        }
        try {
            await api.post('/funds/transactions', {
                projectId: id,
                type: newTransaction.type,
                totalAmount: parseFloat(newTransaction.amount),
                partyName: newTransaction.partyName,
                description: newTransaction.description,
                transactionDate: newTransaction.transactionDate,
                status: 'ACTIVE'
            });
            setNewTransaction({
                transactionDate: new Date().toISOString().split('T')[0],
                type: 'ADVANCE',
                partyName: '',
                description: '',
                amount: ''
            });
            fetchProject();
        } catch (error) {
            console.error('Add transaction error:', error);
            alert('添加失败');
        }
    };

    const handleDeleteTransaction = async (txId: string) => {
        if (!confirm('确定要删除这笔交易吗？')) return;

        // Optimistic update: Remove from UI immediately
        const prevTransactions = project.fundTransactions;
        setProject((prev: any) => ({
            ...prev,
            fundTransactions: prev.fundTransactions.map((tx: any) =>
                tx.id === txId ? { ...tx, status: 'ARCHIVED' } : tx
            )
        }));

        try {
            await api.post(`/funds/transactions/${txId}`, { status: 'ARCHIVED' });
            fetchProject(); // Fetch to confirm and get latest data
        } catch (error) {
            console.error('Delete transaction error:', error);
            // Revert on error
            setProject(prev => ({ ...prev, fundTransactions: prevTransactions }));
            alert('删除失败');
        }
    };

    const handleSaveRisk = async (riskId: string) => {
        try {
            await api.patch(`/projects/risks/${riskId}`, editingRiskData);
            setEditingRiskId(null);
            setEditingRiskData({});
            fetchProject();
            alert('风险已更新');
        } catch (error) {
            console.error('Update risk error:', error);
            alert('更新失败，请重试');
        }
    };

    const handleCancelEditRisk = () => {
        setEditingRiskId(null);
        setEditingRiskData({});
    };

    if (loading || !project) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    // Financial calculations
    const contractValue = Number(project.contract.wonPrice || project.contract.totalContractValue);

    // Use editData if editing to ensure reactive updates in UI
    const currentLaborCost = Number((isEditing ? editData.laborCost : project.laborCost) || 0);
    const currentOutsourceCost = Number((isEditing ? editData.outsourceCost : project.outsourceCost) || 0);
    const currentTravelCost = Number((isEditing ? editData.travelCost : project.travelCost) || 0);
    const currentThirdPartyCost = Number((isEditing ? editData.thirdPartyEquipmentCost : project.thirdPartyEquipmentCost) || 0);
    const currentSoftwareCost = Number((isEditing ? editData.softwareCost : project.softwareCost) || 0);
    const currentOtherWeight = Number((isEditing ? editData.otherWeight : project.otherWeight) || 0);

    const currentComplexity = isEditing ? editData.complexity : project.complexity;

    // Emergency support calc logic
    let emergencySupportRate = 0.03;
    if (currentComplexity === 'Medium') emergencySupportRate = 0.05;
    if (currentComplexity === 'High') emergencySupportRate = 0.10;

    const calculatedEmergencySupport = contractValue * emergencySupportRate;
    const currentEmergencySupport = isEditing ? editData.emergencySupportCost : Number(project.emergencySupportCost || 0);

    const transactionTotal = project.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').reduce((sum: number, tx: any) => sum + Number(tx.totalAmount), 0) || 0;
    const totalCost = currentLaborCost + currentOutsourceCost + currentTravelCost + currentThirdPartyCost + currentSoftwareCost + currentOtherWeight + currentEmergencySupport + transactionTotal;
    const netProfit = contractValue - totalCost;
    const profitMargin = contractValue > 0 ? (netProfit / contractValue) * 100 : 0;


    return (
        <div className="container mx-auto p-6 space-y-6">
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
            />

            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {project.contract.opportunity.title}
                        <Badge variant="outline">{t(`project.status.${project.status.toLowerCase()}`)}</Badge>
                        {project.isDelayed && <Badge variant="destructive" className="animate-pulse">{t("project.fields.isDelayed")}</Badge>}
                    </h1>
                    <p className="text-slate-500">{project.contract.contractNumber} - {project.contract.opportunity.customer.companyName}</p>
                </div>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 mr-2" /> {t("project.actions.edit")}
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4 mr-2" /> {t("project.actions.cancel")}
                            </Button>
                            <Button onClick={handleSaveProject} className="bg-green-600 hover:bg-green-700 text-white">
                                <Save className="h-4 w-4 mr-2" /> {t("project.actions.save")}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">{t("project.tabs.overview")}</TabsTrigger>
                    <TabsTrigger value="financial">{t("project.tabs.financial") || "财务运营"}</TabsTrigger>
                    <TabsTrigger value="resources">{t("project.tabs.resources")}</TabsTrigger>
                    <TabsTrigger value="communication">{t("project.tabs.communication")}</TabsTrigger>
                    <TabsTrigger value="risks">{t("project.tabs.risks")}</TabsTrigger>
                    <TabsTrigger value="billing">{t("project.billing.milestoneTitle")}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card shadow-sm="true">
                            <CardHeader><CardTitle className="text-lg">{t("project.fields.financials")}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            {t("project.fields.budget")}
                                            <span className="text-[10px] text-blue-600 font-semibold">((自动计算))</span>
                                        </Label>
                                        <div className="text-lg font-bold text-blue-600">¥{totalCost.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 italic">根据利润分析中的成本明细自动汇总</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider">{t("project.fields.contractValue")}</Label>
                                        <div className="text-lg font-bold text-slate-400">¥{contractValue.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="space-y-1 pt-2">
                                    <Label className="text-xs text-slate-500 uppercase tracking-wider">{t("project.fields.description")}</Label>
                                    {isEditing ? (
                                        <Textarea rows={4} value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                                    ) : (
                                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md min-h-[100px] border border-slate-100 italic">
                                            {project.description || t("project.placeholders.noDesc")}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card shadow-sm="true">
                            <CardHeader><CardTitle className="text-lg">{t("project.fields.timeline")}</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                                            {t("project.fields.startDate")}
                                            {isEditing && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={editData.startDate}
                                                onChange={e => setEditData({ ...editData, startDate: e.target.value })}
                                                className={validationErrors.startDate ? 'border-red-500 focus:border-red-500' : ''}
                                            />
                                        ) : (
                                            <div className="text-lg font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString() : t("project.placeholders.notSet")}</div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider">
                                            {t("project.fields.endDate")}
                                            {isEditing && <span className="text-red-500 ml-1">*</span>}
                                        </Label>
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                value={editData.endDate}
                                                onChange={e => setEditData({ ...editData, endDate: e.target.value })}
                                                className={validationErrors.endDate ? 'border-red-500 focus:border-red-500' : ''}
                                            />
                                        ) : (
                                            <div className="text-lg font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : t("project.placeholders.notSet")}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 pt-6 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <Checkbox
                                        id="delayed"
                                        checked={isEditing ? editData.isDelayed : project.isDelayed}
                                        disabled={!isEditing}
                                        onCheckedChange={(checked) => setEditData({ ...editData, isDelayed: checked })}
                                        className="h-5 w-5"
                                    />
                                    <Label htmlFor="delayed" className={`cursor-pointer font-semibold ${project.isDelayed ? 'text-red-600' : 'text-slate-700'}`}>
                                        {t("project.fields.delayedLabel")}
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="financial">
                    <div className="space-y-6">
                        {/* Financial Header & KPIs */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight mb-2">项目财务运营</h1>
                                <p className="text-muted-foreground">统筹管理项目收入与支出明细。</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2 border p-2 rounded-lg bg-white">
                                    <Checkbox
                                        id="invoicing"
                                        checked={project.requiresInvoicing}
                                        onCheckedChange={async (checked) => {
                                            try {
                                                const res = await api.patch(`/projects/${id}`, { requiresInvoicing: checked });
                                                setProject(res);
                                            } catch (e) { console.error(e); }
                                        }}
                                        disabled={!isEditing}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label
                                            htmlFor="invoicing"
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
                                            需要开票
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {project.requiresInvoicing ? (
                                                project.invoicingCompleted ?
                                                    <span className="text-green-600 font-bold">已完成开票</span> :
                                                    <span className="text-orange-600">待完成开票</span>
                                            ) : "本项目无需开票"}
                                        </p>
                                    </div>
                                </div>
                                {!isEditing && (
                                    <Button onClick={() => setIsEditing(true)}>
                                        <Edit className="h-4 w-4 mr-2" /> 编辑财务数据
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Top KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-slate-900 text-white border-0">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">{t('project.financialOps.cards.netProfit')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">¥{(contractValue - totalCost).toLocaleString()}</div>
                                    <div className={`text-sm mt-1 font-medium ${calculateProfitMargin(contractValue, totalCost) >= 20 ? 'text-green-400' : 'text-orange-400'}`}>
                                        {calculateProfitMargin(contractValue, totalCost)}% {t('project.financialOps.cards.margin')}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">{t('project.financialOps.cards.totalIncome')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        ¥{project.fundTransactions?.reduce((sum: number, tx: any) => sum + (tx.collections?.reduce((cSum: number, c: any) => cSum + Number(c.amount), 0) || 0), 0).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {t('project.financialOps.cards.totalIncomeDesc')} ¥{contractValue.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">{t('project.financialOps.cards.totalExpense')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        ¥{totalCost.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {t('project.financialOps.cards.totalExpenseDesc')}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">{t('project.financialOps.cards.fundsAdvanced')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        ¥{project.fundTransactions?.filter((tx: any) => tx.type === 'ADVANCE' && tx.status !== 'ARCHIVED').reduce((sum: number, tx: any) => sum + Number(tx.totalAmount), 0).toLocaleString()}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {t('project.financialOps.cards.fundsAdvancedDesc')}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Unified Income vs Expenditure View */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* LEFT: INCOME (收入) */}
                            <Card className="shadow-sm h-fit">
                                <CardHeader className="bg-green-50 border-b border-green-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-green-800">收入明细 (Income)</CardTitle>
                                            <CardDescription className="text-green-600">来自客户的回款与合同金额</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-green-700 font-semibold">收款进度</div>
                                            <div className="text-2xl font-bold text-green-800">
                                                {Math.round((project.fundTransactions?.reduce((sum: number, tx: any) => sum + (tx.collections?.reduce((cSum: number, c: any) => cSum + Number(c.amount), 0) || 0), 0) / (contractValue || 1)) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {/* 1. Contract Base */}
                                        <div className="p-4 flex justify-between items-center bg-slate-50/50">
                                            <div>
                                                <div className="font-semibold text-slate-900">合同总金额</div>
                                                <div className="text-xs text-slate-500">Contract Total Value</div>
                                            </div>
                                            <div className="font-bold text-slate-900">¥{contractValue.toLocaleString()}</div>
                                        </div>

                                        {/* 2. Collections List */}
                                        {project.fundTransactions?.map((tx: any) => (
                                            tx.collections?.map((c: any) => (
                                                <div key={c.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {c.customerName || '客户回款'}
                                                            <Badge variant="outline" className="ml-2 text-[10px]">{tx.type === 'ADVANCE' ? '垫资回款' : tx.type === 'PASS_THROUGH' ? '过单回款' : tx.type}</Badge>
                                                        </div>
                                                        <div className="text-xs text-slate-500">{new Date(c.receivedDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <div className="text-green-600 font-bold">+ ¥{Number(c.amount).toLocaleString()}</div>
                                                </div>
                                            ))
                                        ))}

                                        {(!project.fundTransactions || project.fundTransactions.every((tx: any) => !tx.collections || tx.collections.length === 0)) && (
                                            <div className="p-8 text-center text-slate-400 italic">
                                                暂无回款记录
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* RIGHT: EXPENDITURE (支出) */}
                            <Card className="shadow-sm h-fit">
                                <CardHeader className="bg-red-50 border-b border-red-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-red-800">
                                                支出明细 (Expenditure)
                                                <span className="ml-2 text-lg font-bold">
                                                    ¥{(
                                                        (currentLaborCost + currentEmergencySupport) +
                                                        (currentOutsourceCost + currentThirdPartyCost + currentSoftwareCost) +
                                                        (project.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').reduce((sum: number, tx: any) => sum + Number(tx.totalAmount), 0) || 0) +
                                                        (currentTravelCost || 0) +
                                                        (currentOtherWeight || 0)
                                                    ).toLocaleString()}
                                                </span>
                                            </CardTitle>
                                            <CardDescription className="text-red-600">包括人力、采购、及所有交易支出</CardDescription>
                                        </div>
                                        {isEditing && (
                                            <Button size="sm" variant="destructive" onClick={() => router.push(`/finance/funds/new?projectId=${id}`)}>
                                                <Plus className="h-4 w-4 mr-1" /> 新增交易
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">

                                        {/* Category A: Normal Labor (Project Fields) */}
                                        <div className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                    {t('project.financialOps.groups.labor')}
                                                    {isEditing && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">可编辑</Badge>}
                                                </div>
                                                <div className="font-bold text-red-600">¥{(currentLaborCost + currentEmergencySupport).toLocaleString()}</div>
                                            </div>
                                            {isEditing ? (
                                                <div className="grid gap-2 mt-2 pl-4 border-l-2 border-red-100">
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.laborCost')}</Label>
                                                        <Input type="number" className="h-8" value={editData.laborCost} onChange={e => setEditData({ ...editData, laborCost: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.projectComplexity')}</Label>
                                                        <Select
                                                            value={editData.complexity || 'Low'}
                                                            onValueChange={(val) => setEditData({ ...editData, complexity: val })}
                                                        >
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Select complexity" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Low">Low (3%)</SelectItem>
                                                                <SelectItem value="Medium">Medium (5%)</SelectItem>
                                                                <SelectItem value="High">High (10%)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <div className="flex flex-col">
                                                            <Label className="text-xs">{t('project.financialOps.fields.emergencySupport')}</Label>
                                                            <span className="text-[10px] text-slate-400">{t('project.financialOps.fields.formula', { rate: emergencySupportRate * 100 })}</span>
                                                        </div>
                                                        <div className="text-sm text-slate-500">¥{calculatedEmergencySupport.toLocaleString()} ({t('project.financialOps.fields.autoCalc')})</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 pl-4 border-l-2 border-slate-200">
                                                    包含: 人力成本 ¥{currentLaborCost.toLocaleString()} + 支持费 ¥{currentEmergencySupport.toLocaleString()}
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        * 紧急支持费 = 合同总额 × {emergencySupportRate * 100}% (基于{currentComplexity}复杂度)
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Category B: Third-Party Purchase (Project Fields) */}
                                        <div className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                    {t('project.financialOps.groups.purchase')}
                                                    {isEditing && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">可编辑</Badge>}
                                                </div>
                                                <div className="font-bold text-red-600">¥{(currentOutsourceCost + currentThirdPartyCost + currentSoftwareCost).toLocaleString()}</div>
                                            </div>
                                            {isEditing ? (
                                                <div className="grid gap-2 mt-2 pl-4 border-l-2 border-red-100">
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.outsource')}</Label>
                                                        <Input type="number" className="h-8" value={editData.outsourceCost} onChange={e => setEditData({ ...editData, outsourceCost: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.equipment')}</Label>
                                                        <Input type="number" className="h-8" value={editData.thirdPartyEquipmentCost} onChange={e => setEditData({ ...editData, thirdPartyEquipmentCost: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.software')}</Label>
                                                        <Input type="number" className="h-8" value={editData.softwareCost} onChange={e => setEditData({ ...editData, softwareCost: e.target.value })} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 pl-4 border-l-2 border-slate-200">
                                                    外包 ¥{currentOutsourceCost.toLocaleString()} | 设备 ¥{currentThirdPartyCost.toLocaleString()} | 软件 ¥{currentSoftwareCost.toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Category C: Transaction Ledger (Unified) */}
                                        <div className="p-4 bg-slate-50/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="font-semibold text-slate-800">{t('project.financialOps.groups.ledger')}</div>
                                                <div className="text-xs text-slate-500">
                                                    总计: <span className="font-bold text-red-600 text-sm ml-1">
                                                        ¥{project.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').reduce((sum: number, tx: any) => sum + Number(tx.totalAmount), 0).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ledger Table */}
                                            <div className="border rounded-md bg-white overflow-hidden text-sm">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-100 border-b text-slate-500">
                                                        <tr>
                                                            <th className="p-2 font-medium w-24">{t('project.financialOps.ledger.table.date')}</th>
                                                            <th className="p-2 font-medium w-24">{t('project.financialOps.ledger.table.type')}</th>
                                                            <th className="p-2 font-medium w-32">{t('project.financialOps.ledger.table.party')}</th>
                                                            <th className="p-2 font-medium">{t('project.financialOps.ledger.table.desc')}</th>
                                                            <th className="p-2 font-medium text-right w-24">{t('project.financialOps.ledger.table.amount')}</th>
                                                            {isEditing && <th className="p-2 font-medium w-16 text-center">{t('project.financialOps.ledger.table.action')}</th>}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {/* Quick Add Row */}
                                                        {isEditing && (
                                                            <tr className="bg-blue-50/30">
                                                                <td className="p-2">
                                                                    <Input
                                                                        type="date"
                                                                        className="h-7 text-xs px-1"
                                                                        value={newTransaction.transactionDate}
                                                                        onChange={e => setNewTransaction({ ...newTransaction, transactionDate: e.target.value })}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <select
                                                                        className="h-7 text-xs w-full border rounded px-1 bg-white"
                                                                        value={newTransaction.type}
                                                                        onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}
                                                                    >
                                                                        <option value="ADVANCE">{t('project.financialOps.ledger.types.advance')}</option>
                                                                        <option value="PASS_THROUGH">{t('project.financialOps.ledger.types.passthrough')}</option>
                                                                        <option value="SIMPLE_PASS">{t('project.financialOps.ledger.types.simplePass')}</option>
                                                                        <option value="BOOST">{t('project.financialOps.ledger.types.boost')}</option>
                                                                        <option value="EXPENSE_ONLY">{t('project.financialOps.ledger.types.expenseOnly')}</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-2">
                                                                    <Input
                                                                        placeholder="对方名称"
                                                                        className="h-7 text-xs px-2"
                                                                        value={newTransaction.partyName}
                                                                        onChange={e => setNewTransaction({ ...newTransaction, partyName: e.target.value })}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <Input
                                                                        placeholder="备注说明"
                                                                        className="h-7 text-xs px-2"
                                                                        value={newTransaction.description}
                                                                        onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        className="h-7 text-xs px-2 text-right"
                                                                        value={newTransaction.amount}
                                                                        onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                                                    />
                                                                </td>
                                                                <td className="p-2 text-center">
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white rounded-full"
                                                                        onClick={handleAddTransaction}
                                                                    >
                                                                        <Plus className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        )}

                                                        {/* Existing Transactions */}
                                                        {project.fundTransactions?.filter((tx: any) => tx.status !== 'ARCHIVED').map((tx: any) => (
                                                            <tr key={tx.id} className="hover:bg-slate-50 group">
                                                                <td className="p-2 text-slate-600">
                                                                    {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString() : '-'}
                                                                </td>
                                                                <td className="p-2">
                                                                    <Badge variant="outline" className="text-[10px] font-normal">
                                                                        {tx.type === 'ADVANCE' ? t('project.financialOps.ledger.types.advance') :
                                                                            tx.type === 'PASS_THROUGH' ? t('project.financialOps.ledger.types.passthrough') :
                                                                                tx.type === 'SIMPLE_PASS' ? t('project.financialOps.ledger.types.simplePass') : tx.type}
                                                                    </Badge>
                                                                </td>
                                                                <td className="p-2 text-slate-800 font-medium">
                                                                    {tx.partyName || '-'}
                                                                </td>
                                                                <td className="p-2 text-slate-500 truncate max-w-[150px]" title={tx.description}>
                                                                    {tx.description || '-'}
                                                                </td>
                                                                <td className="p-2 text-right font-bold text-slate-700">
                                                                    ¥{Number(tx.totalAmount).toLocaleString()}
                                                                </td>
                                                                {isEditing && (
                                                                    <td className="p-2 text-center">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                                            onClick={() => handleDeleteTransaction(tx.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        ))}

                                                        {(!project.fundTransactions || project.fundTransactions.filter((tx: any) => tx.status !== 'ARCHIVED').length === 0) && (
                                                            <tr>
                                                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                                                    {t('project.financialOps.ledger.table.noData')}
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Category E: Other Expenses */}
                                        <div className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                                    {t('project.financialOps.groups.other')}
                                                    {isEditing && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">可编辑</Badge>}
                                                </div>
                                                <div className="font-bold text-red-600">¥{(currentTravelCost + currentOtherWeight).toLocaleString()}</div>
                                            </div>
                                            {isEditing ? (
                                                <div className="grid gap-2 mt-2 pl-4 border-l-2 border-red-100">
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.travel')}</Label>
                                                        <Input type="number" className="h-8" value={editData.travelCost} onChange={e => setEditData({ ...editData, travelCost: e.target.value })} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 items-center">
                                                        <Label className="text-xs">{t('project.financialOps.fields.misc')}</Label>
                                                        <Input type="number" className="h-8" value={editData.otherWeight} onChange={e => setEditData({ ...editData, otherWeight: e.target.value })} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 pl-4 border-l-2 border-slate-200">
                                                    差旅 ¥{currentTravelCost.toLocaleString()} | 杂费 ¥{currentOtherWeight.toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial Remarks */}
                                        <div className="p-4 bg-yellow-50/50 border-t border-yellow-100">
                                            <div className="mb-2 font-semibold text-slate-800 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-500" />
                                                {t('project.financialOps.groups.remarks')}
                                                {isEditing && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">可编辑</Badge>}
                                            </div>
                                            {isEditing ? (
                                                <Textarea
                                                    placeholder={t('project.financialOps.fields.remarksPlaceholder')}
                                                    className="min-h-[80px] bg-white"
                                                    value={editData.financialRemarks}
                                                    onChange={e => setEditData({ ...editData, financialRemarks: e.target.value })}
                                                />
                                            ) : (
                                                <div className="text-sm text-slate-600 whitespace-pre-wrap pl-6">
                                                    {project.financialRemarks || t('project.financialOps.fields.noRemarks')}
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    {isEditing && <div className="p-4 bg-slate-50 border-t flex justify-end">
                                        <Button onClick={handleSaveProject} className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                                            <Save className="h-4 w-4 mr-2" /> 保存全部更改
                                        </Button>
                                    </div>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="billing">
                    <div className="grid grid-cols-1 gap-6 mt-6">
                        {/* 1. Contract Milestones (Single Source of Truth) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    {t("project.billing.milestoneTitle")}
                                </CardTitle>
                                <CardDescription>{t("project.billing.milestoneDesc")} ({project.contract.contractNumber})</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.milestone")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.amount")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.status")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.dueDate")}</th>
                                                <th className="p-3 text-right font-medium text-slate-500">{t("project.billing.action")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.contract.milestones?.map((m: any) => (
                                                <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="p-3 font-medium">{m.name}</td>
                                                    <td className="p-3">¥{Number(m.amount).toLocaleString()}</td>
                                                    <td className="p-3">
                                                        <Badge variant={
                                                            m.status === 'Paid' ? 'default' :
                                                                m.status === 'Invoiced' ? 'secondary' :
                                                                    m.status === 'Verified' ? 'outline' : 'secondary'
                                                        } className={m.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                                            {m.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-slate-500">{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}</td>
                                                    <td className="p-3 text-right flex items-center justify-end gap-2">
                                                        {/* Verify Action */}
                                                        {m.status !== 'Invoiced' && m.status !== 'Paid' && (
                                                            m.status === 'Verified' ? (
                                                                <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-slate-600"
                                                                    onClick={async () => {
                                                                        if (!confirm(t("project.billing.confirmUnverify"))) return;
                                                                        await api.patch(`/contracts/milestones/${m.id}`, { status: 'WIP' });
                                                                        fetchProject();
                                                                    }}>
                                                                    {t("project.billing.unverify")}
                                                                </Button>
                                                            ) : (
                                                                <Button size="sm" variant="outline" className="h-7 text-xs border-green-200 text-green-600 hover:bg-green-50"
                                                                    onClick={async () => {
                                                                        await api.patch(`/contracts/milestones/${m.id}`, { status: 'Verified' });
                                                                        fetchProject();
                                                                    }}>
                                                                    {t("project.billing.verify")}
                                                                </Button>
                                                            )
                                                        )}

                                                        {(m.status === 'Verified' || m.status === 'Ready_to_Invoice') && !m.invoiceDate && (
                                                            <Button size="sm" variant="outline" className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    router.push(`/finance/invoices/new?milestoneId=${m.id}`);
                                                                }}>
                                                                {t("project.billing.generateInvoice")}
                                                            </Button>
                                                        )}
                                                        {m.status === 'Invoiced' && <span className="text-xs text-slate-400">{t("project.billing.invoiceCreated")}</span>}
                                                        {m.status === 'Paid' && <span className="text-xs text-green-600 font-bold">{t("project.billing.paid")}</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!project.contract.milestones || project.contract.milestones.length === 0) && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t("project.billing.noMilestones")}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Project Invoices */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">{t("project.billing.relatedInvoices")}</CardTitle></CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b">
                                            <tr>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.invoiceNumber")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.amount")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.date")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.status")}</th>
                                                <th className="p-3 text-left font-medium text-slate-500">{t("project.billing.milestone")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {project.invoices?.map((inv: any) => (
                                                <tr key={inv.id} className="border-b last:border-0">
                                                    <td className="p-3 font-medium">
                                                        <Link
                                                            href={`/finance/invoices/${inv.id}`}
                                                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                                        >
                                                            {inv.invoiceNumber}
                                                        </Link>
                                                    </td>
                                                    <td className="p-3">¥{inv.totalAmount.toLocaleString()}</td>
                                                    <td className="p-3 text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                                    <td className="p-3">
                                                        <Badge variant={inv.status === 'Paid' ? 'default' : 'outline'}>{inv.status}</Badge>
                                                    </td>
                                                    <td className="p-3 text-slate-500">{project.contract.milestones?.find((m: any) => m.id === inv.milestoneId)?.name || '-'}</td>
                                                </tr>
                                            ))}
                                            {(!project.invoices || project.invoices.length === 0) && (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t("project.billing.noInvoices")}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="funds">
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t("project.tabs.funds")}</CardTitle>
                            <CardDescription>项目相关的资金交易和垫资记录</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Fund Usage Quota */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">合同金额</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        ¥{contractValue.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">已使用资金</p>
                                    <p className="text-lg font-semibold text-orange-600">
                                        ¥{project.fundTransactions.reduce((sum: number, tx: any) => sum + (Number(tx.totalAmount) || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">剩余额度</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        ¥{(contractValue - project.fundTransactions.reduce((sum: number, tx: any) => sum + (Number(tx.totalAmount) || 0), 0)).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">
                                    查看和管理与此项目相关的所有资金交易，包括垫资、过单和费用处理。
                                </p>
                                <Button
                                    onClick={() => router.push(`/finance/funds/new?projectId=${project.id}`)}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    新建资金交易
                                </Button>
                            </div>

                            {/* Fund Transactions Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-slate-500">交易类型</th>
                                            <th className="px-4 py-3 text-left font-medium text-slate-500">描述</th>
                                            <th className="px-4 py-3 text-left font-medium text-slate-500">总金额</th>
                                            <th className="px-4 py-3 text-left font-medium text-slate-500">状态</th>
                                            <th className="px-4 py-3 text-left font-medium text-slate-500">创建时间</th>
                                            <th className="px-4 py-3 text-right font-medium text-slate-500">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.fundTransactions && project.fundTransactions.length > 0 ? (
                                            project.fundTransactions.map((transaction: any) => (
                                                <tr key={transaction.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">{transaction.type}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{transaction.description || '-'}</td>
                                                    <td className="px-4 py-3 font-semibold">¥{Number(transaction.totalAmount).toLocaleString()}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                            {transaction.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500">
                                                        {new Date(transaction.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/finance/funds/${transaction.id}`)}
                                                        >
                                                            查看详情
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <DollarSign className="h-12 w-12 text-slate-300" />
                                                        <p>暂无资金交易记录</p>
                                                        <p className="text-xs">点击上方按钮创建新的资金交易</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Cards */}
                            {project.fundTransactions && project.fundTransactions.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 pt-4">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-slate-500 mb-1">总交易额</div>
                                            <div className="text-2xl font-bold">
                                                ¥{project.fundTransactions.reduce((sum: number, t: any) => sum + Number(t.totalAmount), 0).toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-slate-500 mb-1">活跃交易</div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {project.fundTransactions.filter((t: any) => t.status === 'ACTIVE').length}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-slate-500 mb-1">已完成交易</div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {project.fundTransactions.filter((t: any) => t.status === 'COMPLETED').length}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resources">
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t("project.tabs.resources")}</CardTitle>
                            <CardDescription>{t("project.descriptions.resourceAlloc")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <div className="flex-1 w-full space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.member")}</Label>
                                    <Select value={newResource.userId} onValueChange={(val) => setNewResource({ ...newResource, userId: val })}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder={t("project.placeholders.selectUser")} /></SelectTrigger>
                                        <SelectContent>
                                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.displayName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 w-full space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.role")}</Label>
                                    <Input className="bg-white" placeholder={t("project.placeholders.rolePlaceholder")} value={newResource.role} onChange={e => setNewResource({ ...newResource, role: e.target.value })} />
                                </div>
                                <div className="w-full md:w-32 space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.allocation")}</Label>
                                    <Input className="bg-white" type="number" value={newResource.allocationPct} onChange={e => setNewResource({ ...newResource, allocationPct: e.target.value })} />
                                </div>
                                <Button onClick={handleAddResource} className="w-full md:w-auto bg-slate-900 text-white">
                                    <Plus className="h-4 w-4 mr-1" /> {t("project.actions.add")}
                                </Button>
                            </div>

                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-slate-600">{t("project.fields.member")}</th>
                                            <th className="px-6 py-4 text-left font-bold text-slate-600">{t("project.fields.role")}</th>
                                            <th className="px-6 py-4 text-left font-bold text-slate-600">{t("project.fields.allocation")}</th>
                                            <th className="px-6 py-4 text-right font-bold text-slate-600">{t("project.fields.action")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {!project.resources || project.resources.length === 0 ? (
                                            <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No resources assigned yet.</td></tr>
                                        ) : project.resources.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900">{r.user?.displayName || "Unknown User"}</div>
                                                    <div className="text-xs text-slate-400 font-mono uppercase">{r.user?.role || "USER"}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{r.role}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold">{r.allocationPct}%</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        onClick={async () => {
                                                            try {
                                                                await api.delete(`/projects/resources/${r.id}`);
                                                                fetchProject();
                                                            } catch (error) { console.error(error); }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="communication">
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t("project.tabs.communication")}</CardTitle>
                            <CardDescription>{t("project.descriptions.commPlan")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.meetingTitle")}</Label>
                                    <Input className="bg-white" placeholder={t("project.placeholders.meetingTitle")} value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.meetingType")}</Label>
                                    <Select value={newMeeting.type} onValueChange={(val: any) => setNewMeeting({ ...newMeeting, type: val })}>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Weekly" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Kickoff">Kickoff</SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Review">Review</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.planDate")}</Label>
                                    <Input className="bg-white" type="date" value={newMeeting.planDate} onChange={e => setNewMeeting({ ...newMeeting, planDate: e.target.value })} />
                                </div>
                                <Button onClick={handleAddMeeting} className="bg-slate-900 text-white">
                                    <Plus className="h-4 w-4 mr-1" /> {t("project.actions.schedule")}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {project.meetings.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl italic">No meetings scheduled yet.</div>
                                ) : project.meetings.map((m: any) => (
                                    <div key={m.id} className="flex flex-col md:flex-row items-center justify-between p-5 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white group">
                                        <div className="flex items-center gap-5 w-full">
                                            <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    {m.title}
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter h-5">{m.type}</Badge>
                                                </div>
                                                <div className="text-sm text-slate-400 flex items-center gap-4 font-medium">
                                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {new Date(m.planDate).toLocaleDateString()}</span>
                                                    {m.filename && <span className="flex items-center gap-1 text-green-600"><Save className="h-3 w-3" /> {m.filename}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 md:mt-0 w-full md:w-auto">
                                            {m.filename ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 md:flex-none border-green-200 text-green-700 hover:bg-green-50"
                                                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/${m.filepath}`)}
                                                >
                                                    <Download className="h-4 w-4 mr-2" /> {t("project.actions.downloadMinutes")}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 md:flex-none border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    disabled={uploadingMeetingId === m.id}
                                                    onClick={() => { setUploadingMeetingId(m.id); fileInputRef.current?.click(); }}
                                                >
                                                    {uploadingMeetingId === m.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                                    {t("project.actions.uploadMinutes")}
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                onClick={() => handleDeleteMeeting(m.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="risks">
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>{t("project.tabs.risks")}</CardTitle>
                            <CardDescription>{t("project.descriptions.riskTrack")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-semibold">{t("project.fields.riskDesc")}</Label>
                                        <Input className="bg-white" placeholder={t("project.placeholders.riskDesc")} value={newRisk.description} onChange={e => setNewRisk({ ...newRisk, description: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600 font-semibold">{t("project.fields.impactLevel")}</Label>
                                        <Select onValueChange={(val) => setNewRisk({ ...newRisk, impact: val as any })}>
                                            <SelectTrigger className="bg-white"><SelectValue placeholder="Medium" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-semibold">{t("project.fields.mitigation")}</Label>
                                    <Textarea className="bg-white" rows={3} placeholder={t("project.placeholders.mitigation")} value={newRisk.mitigationPlan} onChange={e => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })} />
                                </div>
                                <Button onClick={handleAddRisk} className="bg-slate-900 text-white w-full md:w-auto">
                                    <AlertTriangle className="h-4 w-4 mr-1" /> {t("project.actions.logRisk")}
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {project.risks.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl italic">No risks identified. Good job PM!</div>
                                ) : project.risks.map((risk: any) => (
                                    <div key={risk.id} className="p-6 border rounded-xl hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: risk.impact === 'Critical' || risk.impact === 'High' ? '#ef4444' : risk.impact === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                                        {editingRiskId === risk.id ? (
                                            // Edit Mode
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">{t("project.fields.riskDesc")}</Label>
                                                    <Input
                                                        value={editingRiskData.description}
                                                        onChange={e => setEditingRiskData({ ...editingRiskData, description: e.target.value })}
                                                        className="font-medium"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-semibold text-slate-700">{t("project.fields.impactLevel")}</Label>
                                                        <Select value={editingRiskData.impact} onValueChange={(val) => setEditingRiskData({ ...editingRiskData, impact: val })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Low">Low</SelectItem>
                                                                <SelectItem value="Medium">Medium</SelectItem>
                                                                <SelectItem value="High">High</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-semibold text-slate-700">状态</Label>
                                                        <Select value={editingRiskData.status} onValueChange={(val) => setEditingRiskData({ ...editingRiskData, status: val })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Open">OPEN</SelectItem>
                                                                <SelectItem value="Mitigated">MITIGATED</SelectItem>
                                                                <SelectItem value="Closed">CLOSED</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700">缓解策略</Label>
                                                    <Textarea
                                                        rows={3}
                                                        value={editingRiskData.mitigationPlan}
                                                        onChange={e => setEditingRiskData({ ...editingRiskData, mitigationPlan: e.target.value })}
                                                        placeholder="如何应对这个风险？"
                                                    />
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" size="sm" onClick={handleCancelEditRisk}>
                                                        <X className="h-4 w-4 mr-1" /> 取消
                                                    </Button>
                                                    <Button size="sm" onClick={() => handleSaveRisk(risk.id)} className="bg-green-600 hover:bg-green-700">
                                                        <Save className="h-4 w-4 mr-1" /> 保存
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View Mode
                                            <>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={risk.impact === 'High' || risk.impact === 'Critical' ? 'bg-red-50 text-red-600 border-red-100 uppercase' : risk.impact === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100 uppercase' : 'bg-blue-50 text-blue-600 border-blue-100 uppercase'} variant="outline">
                                                            {risk.impact}
                                                        </Badge>
                                                        <h3 className="font-bold text-slate-900">{risk.description}</h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-bold text-[10px] tracking-wide bg-slate-100 text-slate-700 uppercase">
                                                            {risk.status}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditRisk(risk)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {risk.mitigationPlan && (
                                                    <div className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg font-medium leading-relaxed">
                                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1"><Save className="h-3 w-3" /> Mitigation Strategy</div>
                                                        {risk.mitigationPlan}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
