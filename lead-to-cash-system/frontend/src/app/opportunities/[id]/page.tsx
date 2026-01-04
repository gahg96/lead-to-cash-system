"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Save, Plus, Upload, Paperclip, FileText, CheckCircle, Clock, MoreHorizontal, Target, Receipt, Briefcase, File as FileIcon, Trash, Pencil, X, Building2, Users, DollarSign, Eye, Calendar, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nContext";
import { RichTextEditor } from "@/components/RichTextEditor";

interface Opportunity {
    id: string;
    opportunityNumber: string;
    title: string;
    status: string;
    estimatedValue: number;
    probability: number;
    source: string;
    expectedCloseDate: string;
    salesStage: string;
    competitors: string;
    decisionMakers: string;
    salesOwner: string;
    dealType: string;
    deliveryModel: string;
    estimatedEffort: number;
    richDescription: string;
    projectBudget: number;
    businessCost: number;
    laborCost: number;
    otherCost: number;
    grossProfit: number;
    profitMargin: number;
    createdAt: string;
    customer: {
        id: string;
        companyName: string;
        industry: string;
        companySize: string;
        city: string;
        contactName: string;
        contactTitle: string;
        contactPhone: string;
        contactEmail: string;
    };
    vendors?: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    followUps: Array<{
        id: string;
        content: string;
        createdBy: string;
        createdAt: string;
        user?: {
            displayName: string;
        };
    }>;
    attachments: Array<{
        id: string;
        filename: string;
        filepath: string;
        mimetype: string;
        size: number;
        createdAt: string;
    }>;
}

interface BiddingTask {
    id: string;
    name: string;
    category: string;
    isCompleted: boolean;
    assignee: string | null;
}

interface ProcurementDocument {
    id: string;
    filename: string;
    size: number;
    docType: string;
}

interface Procurement {
    id: string;
    procurementNumber: string;
    type: string;
    status: string;
    commercialOwner: string | null;
    technicalOwner: string | null;
    customerBudget: number | null;
    ourQuote: number | null;
    submissionDeadline: string | null;
    notificationDate: string | null;
    wonPrice?: number;
    tenderFee?: number;
    agencyFee?: number;
    bondAmount?: number;
    printingFee?: number;
    lineItems?: Array<{
        name: string;
        type: string;
        amount: number;
        description?: string;
    }>;
    bidLocation: string | null;
    depositAmount: number | null;
    notes: string | null;
    resultNote?: string;
    tasks: BiddingTask[];
    documents: ProcurementDocument[];
}

export default function OpportunityDetailPage() {
    const { t } = useI18n();
    const params = useParams();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Edit form state
    const [form, setForm] = useState({
        title: "",
        status: "",
        estimatedValue: 0,
        probability: 0,
        source: "",
        expectedCloseDate: "",
        salesStage: "",
        competitors: "",
        decisionMakers: "",
        salesOwner: "",
        dealType: "",
        deliveryModel: "",
        estimatedEffort: 0,
        richDescription: "",
        projectBudget: 0,
        businessCost: 0,
        laborCost: 0,
        otherCost: 0,
        grossProfit: 0,
        profitMargin: 0,
        vendorIds: [] as string[],
    });

    // Follow-up state
    const [showFollowUpEditor, setShowFollowUpEditor] = useState(false);
    const [followUpContent, setFollowUpContent] = useState("");
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

    // Procurement state
    const [procurements, setProcurements] = useState<Procurement[]>([]);
    const [showNewProcurement, setShowNewProcurement] = useState(false);
    const [newProcType, setNewProcType] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [allVendors, setAllVendors] = useState<any[]>([]);

    const opportunityId = params.id as string;

    useEffect(() => {
        if (opportunityId) {
            fetchOpportunity();
            fetchProcurements();
            fetchUsers();
            api.get("/vendors").then(setAllVendors).catch(console.error);
        }
    }, [opportunityId]);

    const fetchUsers = async () => {
        try {
            const data = await api.get("/users");
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const fetchProcurements = async () => {
        try {
            const data = await api.get(`/procurements?opportunityId=${opportunityId}`);
            setProcurements(data);
        } catch (error) {
            console.error("Failed to fetch procurements", error);
        }
    };

    const handleCreateProcurement = async () => {
        if (!newProcType) return;
        try {
            await api.post("/procurements", {
                opportunityId,
                type: newProcType,
            });
            setShowNewProcurement(false);
            setNewProcType("");
            fetchProcurements();
        } catch (error) {
            console.error("Failed to create procurement", error);
        }
    };

    const handleUpdate = async (field: keyof Opportunity, value: any) => {
        if (!opportunity) return;
        try {
            await api.patch(`/opportunities/${params.id}`, { [field]: value });
            setOpportunity({ ...opportunity, [field]: value });
        } catch (error) {
            console.error("Failed to update opportunity:", error);
        }
    };

    const handleCustomerUpdate = async (field: keyof Opportunity['customer'], value: any) => {
        if (!opportunity?.customer) return;
        try {
            setOpportunity({
                ...opportunity,
                customer: {
                    ...opportunity.customer,
                    [field]: value
                }
            });
            await api.patch(`/customers/${opportunity.customer.id}`, { [field]: value });
        } catch (error) {
            console.error("Failed to update customer:", error);
            // Revert could be implemented here if needed, but for now we rely on re-fetch or user retry
        }
    };

    const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/procurements/tasks/${taskId}`, {
                isCompleted: !currentStatus,
            });
            fetchProcurements();
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const fetchOpportunity = async () => {
        try {
            const data = await api.get(`/opportunities/${opportunityId}`);
            setOpportunity(data);
            // Initialize form with opportunity data
            setForm({
                title: data.title || "",
                status: data.status || "New",
                estimatedValue: data.estimatedValue || 0,
                probability: data.probability || 0,
                source: data.source || "",
                expectedCloseDate: data.expectedCloseDate ? data.expectedCloseDate.split('T')[0] : "",
                salesStage: data.salesStage || "",
                competitors: data.competitors || "",
                decisionMakers: data.decisionMakers || "",
                salesOwner: data.salesOwner || "",
                dealType: data.dealType || "",
                deliveryModel: data.deliveryModel || "",
                estimatedEffort: data.estimatedEffort || 0,
                richDescription: data.richDescription || "",
                projectBudget: data.projectBudget || 0,
                businessCost: data.businessCost || 0,
                laborCost: data.laborCost || 0,
                otherCost: data.otherCost || 0,
                grossProfit: data.grossProfit || 0,
                profitMargin: data.profitMargin || 0,
                vendorIds: data.vendors?.map((v: any) => v.id) || [],
            });
        } catch (error) {
            console.error("Failed to fetch opportunity", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.patch(`/opportunities/${opportunityId}`, {
                title: form.title,
                status: form.status,
                estimatedValue: Number(form.estimatedValue),
                probability: Number(form.probability),
                source: form.source || undefined,
                expectedCloseDate: form.expectedCloseDate || undefined,
                salesStage: form.salesStage || undefined,
                competitors: form.competitors || undefined,
                decisionMakers: form.decisionMakers || undefined,
                salesOwner: form.salesOwner || undefined,
                dealType: form.dealType || undefined,
                deliveryModel: form.deliveryModel || undefined,
                estimatedEffort: Number(form.estimatedEffort) || undefined,
                richDescription: form.richDescription || undefined,
                projectBudget: Number(form.projectBudget) || undefined,
                businessCost: Number(form.businessCost) || undefined,
                laborCost: Number(form.laborCost) || undefined,
                otherCost: Number(form.otherCost) || undefined,
                grossProfit: Number(form.grossProfit) || undefined,
                profitMargin: Number(form.profitMargin) || undefined,
                vendorIds: form.vendorIds,
            });
            setIsEditing(false);
            fetchOpportunity();
        } catch (error) {
            console.error("Failed to update opportunity", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (opportunity) {
            setForm({
                title: opportunity.title || "",
                status: opportunity.status || "New",
                estimatedValue: opportunity.estimatedValue || 0,
                probability: opportunity.probability || 0,
                source: opportunity.source || "",
                expectedCloseDate: opportunity.expectedCloseDate ? opportunity.expectedCloseDate.split('T')[0] : "",
                salesStage: opportunity.salesStage || "",
                competitors: opportunity.competitors || "",
                decisionMakers: opportunity.decisionMakers || "",
                salesOwner: opportunity.salesOwner || "",
                dealType: opportunity.dealType || "",
                deliveryModel: opportunity.deliveryModel || "",
                estimatedEffort: opportunity.estimatedEffort || 0,
                richDescription: opportunity.richDescription || "",
                projectBudget: opportunity.projectBudget || 0,
                businessCost: opportunity.businessCost || 0,
                laborCost: opportunity.laborCost || 0,
                otherCost: opportunity.otherCost || 0,
                grossProfit: opportunity.grossProfit || 0,
                profitMargin: opportunity.profitMargin || 0,
                vendorIds: opportunity.vendors?.map(v => v.id) || [],
            });
        }
        setIsEditing(false);
    };

    const handleAddFollowUp = async () => {
        if (!followUpContent.trim()) return;
        setIsSubmittingFollowUp(true);
        try {
            await api.post(`/opportunities/${opportunityId}/follow-ups`, {
                content: followUpContent,
                createdBy: "Current User",
            });
            setFollowUpContent("");
            setShowFollowUpEditor(false);
            fetchOpportunity();
        } catch (error) {
            console.error("Failed to add follow-up", error);
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/opportunities/${opportunityId}/attachments`, {
                method: 'POST',
                body: formData,
            });
            fetchOpportunity();
        } catch (error) {
            console.error("Failed to upload file", error);
        }
    };

    const handleCreateContract = async () => {
        try {
            const res = await api.post("/contracts", {
                opportunityId,
                contractNumber: `CTR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                totalContractValue: Number(opportunity?.estimatedValue) || 0,
            });
            router.push(`/contracts/${res.id}`);
        } catch (error) {
            console.error("Failed to create contract", error);
        }
    };

    const handleUpdateProcurement = async (id: string, data: any) => {
        try {
            await api.patch(`/procurements/${id}`, data);
            fetchProcurements();
        } catch (error) {
            console.error("Failed to update procurement", error);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!confirm('确定要删除这个附件吗？')) return;
        try {
            await api.delete(`/procurements/documents/${docId}`);
            fetchProcurements();
        } catch (error) {
            console.error("Failed to delete document", error);
        }
    };

    // Calculate financial fields
    const recalculateFinancials = (field: string, value: number) => {
        const newForm = { ...form, [field]: value };
        const budget = field === 'projectBudget' ? value : Number(newForm.projectBudget) || 0;
        const businessCost = field === 'businessCost' ? value : Number(newForm.businessCost) || 0;
        const laborCost = field === 'laborCost' ? value : Number(newForm.laborCost) || 0;
        const otherCost = field === 'otherCost' ? value : Number(newForm.otherCost) || 0;
        const totalCost = businessCost + laborCost + otherCost;
        const grossProfit = budget - totalCost;
        const profitMargin = budget > 0 ? Math.round((grossProfit / budget) * 100) : 0;
        setForm({ ...newForm, grossProfit, profitMargin });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="text-slate-500">Loading...</div>
            </div>
        );
    }

    if (!opportunity) {
        return (
            <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
                <div className="text-slate-500">Opportunity not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/opportunities" className="flex items-center text-sm text-slate-600 hover:text-slate-900 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        {t("nav.opportunities")}
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{opportunity.title}</h1>
                                {opportunity.opportunityNumber && (
                                    <span className="text-sm font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                        {opportunity.opportunityNumber}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500">{opportunity.customer?.companyName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {opportunity.status === 'Won' && (
                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCreateContract}>
                                    <FileText className="h-4 w-4 mr-1" />
                                    拟定合同
                                </Button>
                            )}
                            {isEditing ? (
                                <>
                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4 mr-1" />
                                        取消
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                        <Save className="h-4 w-4 mr-1" />
                                        {isSaving ? "保存中..." : "保存"}
                                    </Button>
                                </>
                            ) : (
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-1" />
                                    {t("detail.edit")}
                                </Button>
                            )}
                            {opportunity.status === 'Won' && (
                                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCreateContract}>
                                    <FileText className="h-4 w-4 mr-1" />
                                    拟定合同
                                </Button>
                            )}
                            <Badge variant={opportunity.status === 'Won' ? 'default' : opportunity.status === 'Lost' ? 'destructive' : 'secondary'}>
                                {opportunity.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Tabs - Same structure as new opportunity form */}
                <Tabs defaultValue="customer" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 mb-6">
                        <TabsTrigger value="customer" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {t("form.sections.customer")}
                        </TabsTrigger>
                        <TabsTrigger value="opportunity" className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {t("form.sections.opportunity")}
                        </TabsTrigger>
                        <TabsTrigger value="enterprise" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t("form.sections.enterprise")}
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t("detail.financials")}
                        </TabsTrigger>
                        <TabsTrigger value="description" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t("form.sections.description")}
                        </TabsTrigger>
                        <TabsTrigger value="followups" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            跟进记录
                        </TabsTrigger>
                        <TabsTrigger value="procurement" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            投标管理
                        </TabsTrigger>
                    </TabsList>

                    {/* Customer Tab */}
                    <TabsContent value="customer">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.customer")}</CardTitle>
                                <CardDescription>{t("form.sectionDesc.customer")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                                    <div className="flex items-center gap-2 text-lg font-semibold">
                                        <Building2 className="h-5 w-5 text-blue-500" />
                                        <Input
                                            value={opportunity.customer?.companyName || ""}
                                            onChange={(e) => handleCustomerUpdate("companyName", e.target.value)}
                                            className="max-w-md font-semibold text-lg bg-transparent border-transparent hover:border-slate-300 focus:bg-white transition-colors p-0 h-auto"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">行业</Label>
                                            <Input
                                                value={opportunity.customer?.industry || ""}
                                                onChange={(e) => handleCustomerUpdate("industry", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">规模</Label>
                                            <Select
                                                value={opportunity.customer?.companySize || ""}
                                                onValueChange={(val) => handleCustomerUpdate("companySize", val)}
                                            >
                                                <SelectTrigger className="bg-white h-8">
                                                    <SelectValue placeholder="Select size" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Small">{t("options.companySize.Small")}</SelectItem>
                                                    <SelectItem value="Medium">{t("options.companySize.Medium")}</SelectItem>
                                                    <SelectItem value="Large">{t("options.companySize.Large")}</SelectItem>
                                                    <SelectItem value="Enterprise">{t("options.companySize.Enterprise")}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">城市</Label>
                                            <Input
                                                value={opportunity.customer?.city || ""}
                                                onChange={(e) => handleCustomerUpdate("city", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">联系人</Label>
                                            <Input
                                                value={opportunity.customer?.contactName || ""}
                                                onChange={(e) => handleCustomerUpdate("contactName", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">职位</Label>
                                            <Input
                                                value={opportunity.customer?.contactTitle || ""}
                                                onChange={(e) => handleCustomerUpdate("contactTitle", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">电话</Label>
                                            <Input
                                                value={opportunity.customer?.contactPhone || ""}
                                                onChange={(e) => handleCustomerUpdate("contactPhone", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500">邮箱</Label>
                                            <Input
                                                value={opportunity.customer?.contactEmail || ""}
                                                onChange={(e) => handleCustomerUpdate("contactEmail", e.target.value)}
                                                className="bg-white h-8"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Vendors Section */}
                                <div className="mt-6 border-t pt-6 space-y-3">
                                    <Label className="text-base font-medium">涉及厂商 / Associated Vendors</Label>

                                    {isEditing ? (
                                        <>
                                            <div className="text-sm text-slate-500 mb-2">选择此商机涉及的合作伙伴或供应商</div>
                                            {form.vendorIds && form.vendorIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {form.vendorIds.map((id: string) => {
                                                        // We need to find the vendor name. 
                                                        // Since we don't have the full vendor list loaded in this component yet, 
                                                        // we might only show IDs or we need to fetch all vendors.
                                                        // For now, let's look it up in opportunity.vendors if it exists there, 
                                                        // otherwise we really should have fetched all vendors like in the create page.
                                                        // *Self-correction*: We need to fetch vendors to support editing properly.
                                                        // Let's assume we'll add the fetch logic separately or rely on what we have.
                                                        // Actually, let's rely on `vendors` state if I add it, or just show placeholders?
                                                        // No, I must add the fetch logic.
                                                        return (
                                                            <div key={id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm border border-blue-100">
                                                                <span>
                                                                    {allVendors.find((v: any) => v.id === id)?.name ||
                                                                        opportunity.vendors?.find(v => v.id === id)?.name ||
                                                                        "Loading..."}
                                                                </span>
                                                                <button type="button" onClick={() => setForm(prev => ({ ...prev, vendorIds: prev.vendorIds?.filter((pid: string) => pid !== id) }))} className="text-blue-400 hover:text-blue-600">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <Select
                                                onValueChange={(val) => {
                                                    const currentIds = form.vendorIds || [];
                                                    if (!currentIds.includes(val)) {
                                                        setForm({ ...form, vendorIds: [...currentIds, val] });
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="添加关联厂商..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allVendors.filter((v: any) => !(form.vendorIds || []).includes(v.id)).map((v: any) => (
                                                        <SelectItem key={v.id} value={v.id}>
                                                            {v.name} <span className="text-slate-400 text-xs ml-2">({v.type || '未分类'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {opportunity.vendors && opportunity.vendors.length > 0 ? (
                                                opportunity.vendors.map((vendor) => (
                                                    <Link key={vendor.id} href={`/settings/vendors?id=${vendor.id}`}>
                                                        <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-sm transition-colors border border-slate-200">
                                                            <Building2 className="h-3 w-3 text-slate-400" />
                                                            <span className="font-medium">{vendor.name}</span>
                                                            {vendor.type && <span className="text-xs text-slate-500 border-l pl-2 border-slate-300">{vendor.type}</span>}
                                                        </div>
                                                    </Link>
                                                ))
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">暂无关联厂商</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Opportunity Tab */}
                    <TabsContent value="opportunity">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.opportunity")}</CardTitle>
                                <CardDescription>项目和财务基本信息</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>{t("form.projectName")} *</Label>
                                    {isEditing ? (
                                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.title}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>状态</Label>
                                    {isEditing ? (
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="New">{t("options.status.New")}</SelectItem>
                                                <SelectItem value="Proposal">{t("options.status.Proposal")}</SelectItem>
                                                <SelectItem value="Negotiation">{t("options.status.Negotiation")}</SelectItem>
                                                <SelectItem value="Bidding">{t("options.status.Bidding")}</SelectItem>
                                                <SelectItem value="Comparison">{t("options.status.Comparison")}</SelectItem>
                                                <SelectItem value="SingleSource">{t("options.status.SingleSource")}</SelectItem>
                                                <SelectItem value="Sourcing">{t("options.status.Sourcing")}</SelectItem>
                                                <SelectItem value="Won">{t("options.status.Won")}</SelectItem>
                                                <SelectItem value="Lost">{t("options.status.Lost")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{t(`options.status.${opportunity.status}`) || opportunity.status}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.closeDate")}</Label>
                                    {isEditing ? (
                                        <Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">
                                            {opportunity.expectedCloseDate ? new Date(opportunity.expectedCloseDate).toLocaleDateString() : '-'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.estValue")}</Label>
                                    {isEditing ? (
                                        <Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">
                                            ¥{(opportunity.estimatedValue || 0).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.probability")}</Label>
                                    {isEditing ? (
                                        <Input type="number" value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.probability || 0}%</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.source")}</Label>
                                    {isEditing ? (
                                        <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                                            <SelectTrigger><SelectValue placeholder="选择来源" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="referral">客户推荐</SelectItem>
                                                <SelectItem value="website">官网</SelectItem>
                                                <SelectItem value="cold_call">主动拓展</SelectItem>
                                                <SelectItem value="event">展会/活动</SelectItem>
                                                <SelectItem value="partner">合作伙伴</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.source ? t(`options.source.${opportunity.source}`) || opportunity.source : '-'}</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Enterprise Tab */}
                    <TabsContent value="enterprise">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.enterprise")}</CardTitle>
                                <CardDescription>{t("form.sectionDesc.enterprise")}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t("form.salesStage")}</Label>
                                    {isEditing ? (
                                        <Select value={form.salesStage} onValueChange={(v) => setForm({ ...form, salesStage: v })}>
                                            <SelectTrigger><SelectValue placeholder="选择阶段" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="initial_contact">初步接触</SelectItem>
                                                <SelectItem value="requirement">需求确认</SelectItem>
                                                <SelectItem value="proposal">方案提交</SelectItem>
                                                <SelectItem value="negotiation">商务谈判</SelectItem>
                                                <SelectItem value="contract">合同签订</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.salesStage ? t(`options.salesStage.${opportunity.salesStage}`) || opportunity.salesStage : '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.dealType")}</Label>
                                    {isEditing ? (
                                        <Select value={form.dealType} onValueChange={(v) => setForm({ ...form, dealType: v })}>
                                            <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">新签</SelectItem>
                                                <SelectItem value="renewal">续约</SelectItem>
                                                <SelectItem value="upsell">追加</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.dealType ? t(`options.dealType.${opportunity.dealType}`) || opportunity.dealType : '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.salesOwner")}</Label>
                                    {isEditing ? (
                                        <Input value={form.salesOwner} onChange={(e) => setForm({ ...form, salesOwner: e.target.value })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.salesOwner || '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.deliveryModel")}</Label>
                                    {isEditing ? (
                                        <Select value={form.deliveryModel} onValueChange={(v) => setForm({ ...form, deliveryModel: v })}>
                                            <SelectTrigger><SelectValue placeholder="选择模式" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="onsite">驻场</SelectItem>
                                                <SelectItem value="remote">远程</SelectItem>
                                                <SelectItem value="hybrid">混合</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.deliveryModel ? t(`options.deliveryModel.${opportunity.deliveryModel}`) || opportunity.deliveryModel : '-'}</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.estimatedEffort")}</Label>
                                    {isEditing ? (
                                        <Input type="number" value={form.estimatedEffort} onChange={(e) => setForm({ ...form, estimatedEffort: Number(e.target.value) })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.estimatedEffort || 0} 人天</div>
                                    )}
                                </div>
                                <div>
                                    <Label>{t("form.competitors")}</Label>
                                    {isEditing ? (
                                        <Input value={form.competitors} onChange={(e) => setForm({ ...form, competitors: e.target.value })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.competitors || '-'}</div>
                                    )}
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>涉及厂商</Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {form.vendorIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {form.vendorIds.map(id => {
                                                        const v = allVendors.find(item => item.id === id);
                                                        return v ? (
                                                            <div key={id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm border border-blue-100">
                                                                <span>{v.name}</span>
                                                                <button type="button" onClick={() => setForm(prev => ({ ...prev, vendorIds: prev.vendorIds.filter(pid => pid !== id) }))} className="text-blue-400 hover:text-blue-600">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            )}
                                            <Select
                                                onValueChange={(val) => {
                                                    if (!form.vendorIds.includes(val)) {
                                                        setForm(prev => ({ ...prev, vendorIds: [...prev.vendorIds, val] }));
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="添加关联厂商..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allVendors.filter(v => !form.vendorIds.includes(v.id)).map(v => (
                                                        <SelectItem key={v.id} value={v.id}>
                                                            {v.name} <span className="text-slate-400 text-xs ml-2">({v.type || '未分类'})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border flex flex-wrap gap-2">
                                            {opportunity.vendors && opportunity.vendors.length > 0 ? (
                                                opportunity.vendors.map(v => (
                                                    <span key={v.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white border border-slate-200 text-slate-700">
                                                        {v.name}
                                                    </span>
                                                ))
                                            ) : (
                                                '-'
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <Label>{t("form.decisionMakers")}</Label>
                                    {isEditing ? (
                                        <Input value={form.decisionMakers} onChange={(e) => setForm({ ...form, decisionMakers: e.target.value })} />
                                    ) : (
                                        <div className="p-2 bg-slate-50 rounded border">{opportunity.decisionMakers || '-'}</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Financial Tab */}
                    <TabsContent value="financial">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.financial")}</CardTitle>
                                <CardDescription>{t("form.sectionDesc.financial")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>{t("detail.projectBudget")}</Label>
                                        {isEditing ? (
                                            <Input type="number" value={form.projectBudget} onChange={(e) => recalculateFinancials('projectBudget', Number(e.target.value))} />
                                        ) : (
                                            <div className="p-2 bg-slate-50 rounded border">¥{(opportunity.projectBudget || 0).toLocaleString()}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t("detail.businessCost")}</Label>
                                        {isEditing ? (
                                            <Input type="number" value={form.businessCost} onChange={(e) => recalculateFinancials('businessCost', Number(e.target.value))} />
                                        ) : (
                                            <div className="p-2 bg-slate-50 rounded border">¥{(opportunity.businessCost || 0).toLocaleString()}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t("detail.laborCost")}</Label>
                                        {isEditing ? (
                                            <Input type="number" value={form.laborCost} onChange={(e) => recalculateFinancials('laborCost', Number(e.target.value))} />
                                        ) : (
                                            <div className="p-2 bg-slate-50 rounded border">¥{(opportunity.laborCost || 0).toLocaleString()}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t("detail.otherCost")}</Label>
                                        {isEditing ? (
                                            <Input type="number" value={form.otherCost} onChange={(e) => recalculateFinancials('otherCost', Number(e.target.value))} />
                                        ) : (
                                            <div className="p-2 bg-slate-50 rounded border">¥{(opportunity.otherCost || 0).toLocaleString()}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Calculated results */}
                                <div className="border-t pt-4">
                                    <div className="text-sm text-slate-500 mb-3">计算结果</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                            <Label className="text-green-700">{t("detail.grossProfit")}</Label>
                                            <div className="text-2xl font-bold text-green-600 mt-1">
                                                ¥{(isEditing ? form.grossProfit : (opportunity.grossProfit || 0)).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <Label className="text-blue-700">{t("detail.profitMargin")}</Label>
                                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                                {isEditing ? form.profitMargin : (opportunity.profitMargin || 0)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Description Tab */}
                    <TabsContent value="description">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t("form.sections.description")}</CardTitle>
                                <CardDescription>详细描述和附件</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditing ? (
                                    <RichTextEditor
                                        content={form.richDescription}
                                        onChange={(v) => setForm({ ...form, richDescription: v })}
                                        placeholder="输入项目详细描述..."
                                    />
                                ) : (
                                    <div>
                                        {opportunity.richDescription ? (
                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: opportunity.richDescription }} />
                                        ) : (
                                            <div className="text-slate-400 italic">暂无描述</div>
                                        )}
                                    </div>
                                )}

                                {/* Attachments */}
                                <div className="border-t pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-base font-medium">附件</Label>
                                        {isEditing && (
                                            <>
                                                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    上传附件
                                                </Button>
                                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                            </>
                                        )}
                                    </div>
                                    {opportunity.attachments?.length > 0 ? (
                                        <div className="space-y-2">
                                            {opportunity.attachments.map((attachment) => (
                                                <div key={attachment.id} className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50">
                                                    <Paperclip className="h-5 w-5 text-blue-500" />
                                                    <div className="flex-1">
                                                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/opportunities/attachments/download/${attachment.filename}`}
                                                            className="font-medium text-sm text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                            {attachment.filename}
                                                        </a>
                                                        <div className="text-xs text-slate-500">{(attachment.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 border-2 border-dashed rounded-lg">
                                            暂无附件
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Follow-ups Tab */}
                    <TabsContent value="followups">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>跟进记录</CardTitle>
                                    <CardDescription>活动和沟通历史</CardDescription>
                                </div>
                                {isEditing && (
                                    <Button size="sm" onClick={() => setShowFollowUpEditor(true)}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        添加跟进
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {showFollowUpEditor && (
                                    <div className="mb-6 space-y-3">
                                        <RichTextEditor content={followUpContent} onChange={setFollowUpContent} placeholder="输入跟进内容..." />
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setShowFollowUpEditor(false)}>取消</Button>
                                            <Button size="sm" onClick={handleAddFollowUp} disabled={isSubmittingFollowUp}>
                                                {isSubmittingFollowUp ? '保存中...' : '保存'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {opportunity.followUps?.length > 0 ? (
                                    <div className="space-y-4">
                                        {opportunity.followUps.map((followUp) => (
                                            <div key={followUp.id} className="border-l-2 border-blue-200 pl-4 py-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                                    <span className="font-medium text-slate-700">{followUp.user?.displayName || followUp.createdBy || 'Unknown'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(followUp.createdAt).toLocaleString()}</span>
                                                </div>
                                                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: followUp.content }} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">暂无跟进记录</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Procurement Tab */}
                    <TabsContent value="procurement">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>投标管理</CardTitle>
                                    <CardDescription>响应客户标书/投标流程管理</CardDescription>
                                </div>
                                {isEditing && !showNewProcurement && (
                                    <Button size="sm" onClick={() => setShowNewProcurement(true)}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        发起投标
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {showNewProcurement && (
                                    <div className="mb-6 p-4 border rounded-lg bg-slate-50">
                                        <Label className="mb-2 block">选择投标类型</Label>
                                        <Select value={newProcType} onValueChange={setNewProcType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="请选择投标类型" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="DirectQuote">{t("options.procurement.type.DirectQuote")}</SelectItem>
                                                <SelectItem value="Negotiation">{t("options.procurement.type.Negotiation")}</SelectItem>
                                                <SelectItem value="Comparison">{t("options.procurement.type.Comparison")}</SelectItem>
                                                <SelectItem value="Consultation">{t("options.procurement.type.Consultation")}</SelectItem>
                                                <SelectItem value="PublicTender">{t("options.procurement.type.PublicTender")}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button variant="outline" size="sm" onClick={() => setShowNewProcurement(false)}>取消</Button>
                                            <Button size="sm" onClick={handleCreateProcurement} disabled={!newProcType}>
                                                创建投标
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {procurements.length > 0 ? (
                                    <div className="space-y-6">
                                        {procurements.map((proc) => {
                                            const completedTasks = proc.tasks?.filter(t => t.isCompleted).length || 0;
                                            const totalTasks = proc.tasks?.length || 0;
                                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                                            return (
                                                <div key={proc.id} className="bg-white border rounded-lg p-6 relative">
                                                    {/* Status Badge */}
                                                    <div className="absolute top-6 right-6">
                                                        <Badge variant={proc.status === 'Won' ? 'default' : proc.status === 'Lost' ? 'destructive' : 'secondary'}>
                                                            {proc.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Briefcase className="h-5 w-5 text-blue-600" />
                                                        <h3 className="font-semibold text-lg">{proc.procurementNumber}</h3>
                                                        <span className="text-slate-500 text-sm">({t(`options.procurement.type.${proc.type}`)})</span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="mb-6">
                                                        <div className="flex justify-between text-sm text-slate-500 mb-1">
                                                            <span>材料准备进度</span>
                                                            <span>{Math.round(progress)}% ({completedTasks}/{totalTasks})</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Info Grid */}
                                                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                                        <div className="space-y-1">
                                                            <span className="text-slate-500 block text-xs">截止日期</span>
                                                            <Input
                                                                type="date"
                                                                className="h-8 bg-white"
                                                                defaultValue={proc.submissionDeadline ? new Date(proc.submissionDeadline).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => handleUpdateProcurement(proc.id, { submissionDeadline: e.target.value ? new Date(e.target.value) : null })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-slate-500 block text-xs">开标日期</span>
                                                            <Input
                                                                type="date"
                                                                className="h-8 bg-white"
                                                                defaultValue={proc.notificationDate ? new Date(proc.notificationDate).toISOString().split('T')[0] : ''}
                                                                onChange={(e) => handleUpdateProcurement(proc.id, { notificationDate: e.target.value ? new Date(e.target.value) : null })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-slate-500 block text-xs">商务负责人</span>
                                                            <Select
                                                                value={proc.commercialOwner || undefined}
                                                                onValueChange={(val) => handleUpdateProcurement(proc.id, { commercialOwner: val })}
                                                            >
                                                                <SelectTrigger className="h-8 bg-white w-full">
                                                                    <SelectValue placeholder="选择商务负责人" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {users.length === 0 ? (
                                                                        <div className="p-2 text-xs text-slate-400 text-center">暂无用户数据</div>
                                                                    ) : (
                                                                        users.map((u) => (
                                                                            <SelectItem key={u.id} value={u.displayName}>
                                                                                {u.displayName} ({u.role})
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-slate-500 block text-xs">技术负责人</span>
                                                            <Select
                                                                value={proc.technicalOwner || undefined}
                                                                onValueChange={(val) => handleUpdateProcurement(proc.id, { technicalOwner: val })}
                                                            >
                                                                <SelectTrigger className="h-8 bg-white w-full">
                                                                    <SelectValue placeholder="选择技术负责人" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {users.length === 0 ? (
                                                                        <div className="p-2 text-xs text-slate-400 text-center">暂无用户数据</div>
                                                                    ) : (
                                                                        users.map((u) => (
                                                                            <SelectItem key={u.id} value={u.displayName}>
                                                                                {u.displayName} ({u.role})
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Cost Information Section */}
                                                    <div className="mb-6 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
                                                        <h4 className="text-sm font-medium text-slate-700 mb-3">{t("options.procurement.fees.total")}</h4>
                                                        <div className="grid grid-cols-4 gap-4">
                                                            <div className="space-y-1">
                                                                <span className="text-slate-500 block text-xs">{t("options.procurement.fees.tenderFee")}</span>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-xs text-slate-400">¥</span>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 pl-5 bg-white"
                                                                        defaultValue={proc.tenderFee || 0}
                                                                        onBlur={(e) => handleUpdateProcurement(proc.id, { tenderFee: Number(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-slate-500 block text-xs">{t("options.procurement.fees.bondAmount")}</span>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-xs text-slate-400">¥</span>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 pl-5 bg-white"
                                                                        defaultValue={proc.bondAmount || 0}
                                                                        onBlur={(e) => handleUpdateProcurement(proc.id, { bondAmount: Number(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-slate-500 block text-xs">{t("options.procurement.fees.agencyFee")}</span>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-xs text-slate-400">¥</span>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 pl-5 bg-white"
                                                                        defaultValue={proc.agencyFee || 0}
                                                                        onBlur={(e) => handleUpdateProcurement(proc.id, { agencyFee: Number(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-slate-500 block text-xs">{t("options.procurement.fees.printingFee")}</span>
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-xs text-slate-400">¥</span>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8 pl-5 bg-white"
                                                                        defaultValue={proc.printingFee || 0}
                                                                        onBlur={(e) => handleUpdateProcurement(proc.id, { printingFee: Number(e.target.value) })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        {/* Tasks Section */}
                                                        <div>
                                                            <h4 className="text-sm font-medium text-slate-700 mb-3">材料清单</h4>
                                                            <div className="space-y-2">
                                                                {proc.tasks?.map((task: any) => (
                                                                    <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={task.isCompleted}
                                                                            onChange={() => handleToggleTask(task.id, task.isCompleted)}
                                                                            className="rounded border-slate-300"
                                                                        />
                                                                        <span className={task.isCompleted ? "text-slate-400 line-through text-sm" : "text-sm"}>
                                                                            {task.name}
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs ml-auto">
                                                                            {task.category}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Documents Section */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="text-sm font-medium text-slate-700">附件文件</div>
                                                                <label className="cursor-pointer flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                                                                    <Upload className="h-4 w-4" />
                                                                    <span>上传</span>
                                                                    <input
                                                                        type="file"
                                                                        multiple
                                                                        className="hidden"
                                                                        onChange={async (e) => {
                                                                            if (!e.target.files?.length) return;
                                                                            const files = Array.from(e.target.files);
                                                                            try {
                                                                                await Promise.all(files.map(async (file) => {
                                                                                    const formData = new FormData();
                                                                                    formData.append('file', file);
                                                                                    formData.append('docType', 'bidding');
                                                                                    return api.upload(`/procurements/${proc.id}/documents`, formData);
                                                                                }));
                                                                                fetchProcurements();
                                                                                e.target.value = '';
                                                                            } catch (error) {
                                                                                console.error('Upload failed', error);
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                            </div>

                                                            {proc.documents && proc.documents.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {proc.documents.map((doc: any) => (
                                                                        <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileIcon className="h-4 w-4 text-blue-500" />
                                                                                <span className="text-sm">{doc.filename}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-xs text-slate-400">
                                                                                    {(doc.size / 1024).toFixed(1)} KB
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => handleDeleteDocument(doc.id)}
                                                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                                                    title="删除附件"
                                                                                >
                                                                                    <Trash className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 text-slate-400 text-sm">暂无附件</div>
                                                            )}
                                                        </div>

                                                        {/* Notes Section */}
                                                        <div className="p-4 border-t">
                                                            <div className="text-sm font-medium text-slate-700 mb-3">备注信息</div>
                                                            {isEditing ? (
                                                                <RichTextEditor
                                                                    content={proc.notes || ""}
                                                                    onChange={async (newNotes) => {
                                                                        try {
                                                                            await api.patch(`/procurements/${proc.id}`, { notes: newNotes });
                                                                        } catch (error) {
                                                                            console.error("Failed to update notes", error);
                                                                        }
                                                                    }}
                                                                    placeholder="添加投标备注信息..."
                                                                />
                                                            ) : proc.notes ? (
                                                                <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: proc.notes }} />
                                                            ) : (
                                                                <div className="text-slate-400 text-sm">暂无备注</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Result Registration */}
                                                    <div className="mt-8 pt-6 border-t border-slate-100">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <Target className="h-4 w-4 text-blue-600" />
                                                            <h4 className="text-sm font-medium text-slate-900">投标结果登记</h4>
                                                        </div>
                                                        <div className="bg-slate-50 p-4 rounded-lg space-y-6">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <Label className="text-xs text-slate-500 mb-1.5 block">中标状态</Label>
                                                                    <Select
                                                                        value={proc.status}
                                                                        onValueChange={async (val) => {
                                                                            await api.patch(`/procurements/${proc.id}`, { status: val });
                                                                            fetchProcurements();
                                                                            if (val === 'Won') {
                                                                                fetchOpportunity();
                                                                            }
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="w-full bg-white h-9 text-sm">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Draft">{t("options.procurement.status.Draft")}</SelectItem>
                                                                            <SelectItem value="Preparing">{t("options.procurement.status.Preparing")}</SelectItem>
                                                                            <SelectItem value="Submitted">{t("options.procurement.status.Submitted")}</SelectItem>
                                                                            <SelectItem value="InProgress">{t("options.procurement.status.InProgress")}</SelectItem>
                                                                            <SelectItem value="Won">{t("options.procurement.status.Won")}</SelectItem>
                                                                            <SelectItem value="Lost">{t("options.procurement.status.Lost")}</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                {proc.status === 'Won' && (
                                                                    <div>
                                                                        <Label className="text-xs text-slate-500 mb-1.5 block">实际中标金额 (自动计算)</Label>
                                                                        <div className="relative">
                                                                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                                            <Input
                                                                                type="number"
                                                                                className="pl-9 h-9 bg-slate-50 font-semibold text-slate-900"
                                                                                value={proc.wonPrice || 0}
                                                                                readOnly
                                                                                title="总金额由分项报价自动汇总，无需手动填写"
                                                                            />
                                                                        </div>
                                                                        {(proc.lineItems && proc.lineItems.length > 0) && (
                                                                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                                                                {(() => {
                                                                                    const summary = (proc.lineItems || []).reduce((acc: any, item: any) => {
                                                                                        const rate = (item.type === 'Product' || item.type === 'ThirdParty') ? 0.13 : (item.type === 'Service' ? 0.06 : 0);
                                                                                        const amount = Number(item.amount) || 0;
                                                                                        const exTax = amount / (1 + rate);
                                                                                        return {
                                                                                            exTaxTotal: acc.exTaxTotal + exTax,
                                                                                            taxTotal: acc.taxTotal + (amount - exTax)
                                                                                        };
                                                                                    }, { exTaxTotal: 0, taxTotal: 0 });

                                                                                    return (
                                                                                        <>
                                                                                            <span>不含税合计: <span className="font-mono font-medium">{summary.exTaxTotal.toFixed(2)}</span></span>
                                                                                            <span>税额合计: <span className="font-mono font-medium">{summary.taxTotal.toFixed(2)}</span></span>
                                                                                        </>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {proc.status === 'Won' && (
                                                                    <div className="border-t pt-4 mt-2">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <Label className="text-sm font-medium text-slate-700">分项报价</Label>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    const newItems = [...(proc.lineItems || []), { name: opportunity.title, type: 'Product', amount: 0, description: '' }];
                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems });
                                                                                }}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1" /> 添加分项
                                                                            </Button>
                                                                        </div>
                                                                        <div className="space-y-4">
                                                                            {(proc.lineItems || []).map((item: any, idx: number) => {
                                                                                // Calculate tax details for display
                                                                                const rate = (item.type === 'Product' || item.type === 'ThirdParty') ? 0.13 : (item.type === 'Service' ? 0.06 : 0);
                                                                                const amount = Number(item.amount) || 0;
                                                                                const exTax = amount / (1 + rate);
                                                                                const tax = amount - exTax;

                                                                                return (
                                                                                    <div key={idx} className="flex flex-col gap-2 p-3 bg-white rounded border border-slate-100">
                                                                                        <div className="flex gap-2 items-start">
                                                                                            <Input
                                                                                                placeholder="项目名称"
                                                                                                className="h-8 bg-slate-50 flex-1"
                                                                                                defaultValue={item.name}
                                                                                                onBlur={(e) => {
                                                                                                    const newItems = [...(proc.lineItems || [])];
                                                                                                    newItems[idx] = { ...newItems[idx], name: e.target.value };
                                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems });
                                                                                                }}
                                                                                            />
                                                                                            <Select
                                                                                                defaultValue={item.type}
                                                                                                onValueChange={(val) => {
                                                                                                    const newItems = [...(proc.lineItems || [])];
                                                                                                    newItems[idx] = { ...newItems[idx], type: val };
                                                                                                    // Recalculate total
                                                                                                    const total = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems, wonPrice: total });
                                                                                                }}
                                                                                            >
                                                                                                <SelectTrigger className="h-8 w-[140px] bg-slate-50">
                                                                                                    <SelectValue />
                                                                                                </SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    <SelectItem value="Product">产品 (13%)</SelectItem>
                                                                                                    <SelectItem value="ThirdParty">第三方外购 (13%)</SelectItem>
                                                                                                    <SelectItem value="Service">服务 (6%)</SelectItem>
                                                                                                    <SelectItem value="Other">其他 (0%)</SelectItem>
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                            <Input
                                                                                                type="number"
                                                                                                placeholder="含税金额"
                                                                                                className="h-8 w-[120px] bg-slate-50 font-medium"
                                                                                                defaultValue={item.amount}
                                                                                                onBlur={(e) => {
                                                                                                    const val = Number(e.target.value);
                                                                                                    const newItems = [...(proc.lineItems || [])];
                                                                                                    newItems[idx] = { ...newItems[idx], amount: val };
                                                                                                    // Auto-sum total wonPrice
                                                                                                    const total = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems, wonPrice: total });
                                                                                                }}
                                                                                            />
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="icon"
                                                                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                                                                onClick={() => {
                                                                                                    const newItems = (proc.lineItems || []).filter((_: any, i: number) => i !== idx);
                                                                                                    const total = newItems.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems, wonPrice: total });
                                                                                                }}
                                                                                            >
                                                                                                <Trash className="h-4 w-4" />
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="flex gap-2 items-center">
                                                                                            <Input
                                                                                                placeholder="备注描述 (可选)"
                                                                                                className="h-7 text-xs bg-transparent border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 placeholder:text-slate-300"
                                                                                                defaultValue={item.description || ''}
                                                                                                onBlur={(e) => {
                                                                                                    const newItems = [...(proc.lineItems || [])];
                                                                                                    newItems[idx] = { ...newItems[idx], description: e.target.value };
                                                                                                    handleUpdateProcurement(proc.id, { lineItems: newItems });
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex gap-4 text-xs text-slate-500 pl-1">
                                                                                            <span>不含税: <span className="font-mono">{exTax.toFixed(2)}</span></span>
                                                                                            <span>税额: <span className="font-mono">{tax.toFixed(2)}</span></span>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                            {(!proc.lineItems || proc.lineItems.length === 0) && (
                                                                                <div className="text-center py-2 text-xs text-slate-400 border border-dashed rounded bg-slate-50/50">
                                                                                    暂无分项报价信息
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <Label className="text-xs text-slate-500 mb-1.5 block">结果通知书/凭证</Label>
                                                                    <div className="space-y-2">
                                                                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-dashed rounded-md text-sm text-slate-500 hover:border-blue-500 hover:text-blue-500 transition-colors w-full justify-center">
                                                                            <Upload className="h-4 w-4" />
                                                                            <span>上传凭证文件</span>
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                onChange={async (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (!file) return;
                                                                                    const formData = new FormData();
                                                                                    formData.append('file', file);
                                                                                    formData.append('docType', 'result');
                                                                                    try {
                                                                                        await api.upload(`/procurements/${proc.id}/documents`, formData);
                                                                                        fetchProcurements();
                                                                                        e.target.value = '';
                                                                                    } catch (error) {
                                                                                        console.error('Upload failed', error);
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </label>
                                                                        <div className="space-y-1">
                                                                            {proc.documents?.filter((d: any) => d.docType === 'result').map((d: any) => (
                                                                                <div key={d.id} className="flex items-center gap-2 text-xs bg-white px-2 py-1 rounded border">
                                                                                    <FileIcon className="h-3 w-3 text-blue-500" />
                                                                                    <span className="truncate">{d.filename}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-slate-500 mb-1.5 block">结果说明 / 复盘总结</Label>
                                                                <textarea
                                                                    className="w-full h-32 p-3 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                                    placeholder="请输入结果说明，如中标原因、流标分析等..."
                                                                    defaultValue={proc.resultNote || ''}
                                                                    onBlur={async (e) => {
                                                                        if (e.target.value !== proc.resultNote) {
                                                                            await api.patch(`/procurements/${proc.id}`, { resultNote: e.target.value });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : !showNewProcurement && (
                                    <div className="text-center py-12 text-slate-400">
                                        <Target className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                        <div>暂无投标记录</div>
                                        <div className="text-sm mt-1">点击"发起投标"开始响应客户标书</div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div >
    );
}
