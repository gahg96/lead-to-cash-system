'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useI18n } from "@/lib/i18n/I18nContext";

export default function NewProcurementContractPage() {
    const { t } = useI18n();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [salesContracts, setSalesContracts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        contractNumber: '',
        vendorId: '',
        procurementCategory: 'OTHER',
        relatedSalesContractId: undefined as string | undefined,
        endCustomerId: undefined as string | undefined,  // 最终客户
        totalContractValue: '',
        startDate: '',
        endDate: '',
        paymentTerms: '',
        description: '',
        scope: '',
    });

    useEffect(() => {
        fetchVendors();
        fetchSalesContracts();
        fetchCustomers();
        generateContractNumber();
    }, []);

    const fetchVendors = async () => {
        try {
            const data = await api.get('/vendors');
            setVendors(data);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
        }
    };

    const fetchSalesContracts = async () => {
        try {
            const data = await api.get('/contracts');
            // Filter only SALES contracts
            const salesOnly = data.filter((c: any) => !c.contractType || c.contractType === 'SALES');
            setSalesContracts(salesOnly);
        } catch (error) {
            console.error('Failed to fetch sales contracts', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const data = await api.get('/customers');
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    const generateContractNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        setFormData(prev => ({ ...prev, contractNumber: `PC-${year}-${random}` }));
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-inherit customer from related sales contract
        if (field === 'relatedSalesContractId' && value) {
            const selectedContract = salesContracts.find((c: any) => c.id === value);
            if (selectedContract?.opportunity?.customer?.id) {
                setFormData(prev => ({
                    ...prev,
                    [field]: value,
                    endCustomerId: selectedContract.opportunity.customer.id
                }));
                return;
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                totalContractValue: parseFloat(formData.totalContractValue),
                relatedSalesContractId: formData.relatedSalesContractId || undefined,
            };

            await api.post('/contracts/procurement', payload);
            toast.success('Procurement Contract created successfully!');
            router.push('/contracts');
        } catch (error: any) {
            console.error('Failed to create procurement contract', error);
            toast.error(error.message || 'Failed to create contract');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/contracts">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold text-slate-800">{t("contract.newProcurement") || "新建采购合同"}</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t("contract.contractInfo") || "合同信息"}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Contract Number */}
                        <div className="grid gap-2">
                            <Label htmlFor="contractNumber">{t("contract.number") || "合同编号"} *</Label>
                            <Input
                                id="contractNumber"
                                value={formData.contractNumber}
                                onChange={(e) => handleChange('contractNumber', e.target.value)}
                                required
                            />
                        </div>

                        {/* Vendor Selection */}
                        <div className="grid gap-2">
                            <Label htmlFor="vendorId">{t("vendor.vendor") || "供应商"} *</Label>
                            <Select value={formData.vendorId} onValueChange={(value) => handleChange('vendorId', value)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("vendor.selectVendor") || "选择供应商"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(vendor => (
                                        <SelectItem key={vendor.id} value={vendor.id}>
                                            {vendor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Procurement Category */}
                        <div className="grid gap-2">
                            <Label htmlFor="procurementCategory">{t("contract.category") || "类别"} *</Label>
                            <Select value={formData.procurementCategory} onValueChange={(value) => handleChange('procurementCategory', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SUBCONTRACTING">Subcontracting (项目分包)</SelectItem>
                                    <SelectItem value="SOFTWARE_LICENSE">Software License (软件许可)</SelectItem>
                                    <SelectItem value="OFFICE_RENT">Office Rent (办公室租赁)</SelectItem>
                                    <SelectItem value="CONSULTING">Consulting (咨询服务)</SelectItem>
                                    <SelectItem value="OTHER">Other (其他)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Related Sales Contract (Optional) */}
                        <div className="grid gap-2">
                            <Label htmlFor="relatedSalesContractId">
                                {t("contract.relatedSalesContract") || "关联销售合同"} ({t("common.optional") || "可选"})
                                <span className="text-sm text-slate-500 ml-2">{t("contract.forSubcontracting") || "用于分包"}</span>
                            </Label>
                            <Select value={formData.relatedSalesContractId || ''} onValueChange={(value) => handleChange('relatedSalesContractId', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("common.none") || "无"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {salesContracts.map(contract => (
                                        <SelectItem key={contract.id} value={contract.id}>
                                            {contract.contractNumber} - {contract.opportunity?.customer?.companyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* End Customer Selection (NEW) */}
                        <div className="grid gap-2">
                            <Label htmlFor="endCustomerId">
                                {t("contract.endCustomer") || "最终客户"}
                                {formData.relatedSalesContractId && (
                                    <span className="text-xs text-blue-600 ml-2">(已从关联合同继承)</span>
                                )}
                            </Label>
                            <Select
                                value={formData.endCustomerId || ''}
                                onValueChange={(value) => handleChange('endCustomerId', value)}
                                disabled={!!formData.relatedSalesContractId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("contract.selectEndCustomer") || "选择最终客户（可选）"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">{t("common.none") || "无"}</SelectItem>
                                    {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.companyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formData.relatedSalesContractId && formData.endCustomerId && (
                                <p className="text-xs text-slate-500">
                                    已自动继承关联销售合同的客户信息
                                </p>
                            )}
                        </div>

                        {/* Contract Value */}
                        <div className="grid gap-2">
                            <Label htmlFor="totalContractValue">{t("contract.totalValue") || "合同总额"} (CNY) *</Label>
                            <Input
                                id="totalContractValue"
                                type="number"
                                step="0.01"
                                value={formData.totalContractValue}
                                onChange={(e) => handleChange('totalContractValue', e.target.value)}
                                required
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">{t("contract.startDate") || "开始日期"}</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">{t("contract.endDate") || "结束日期"}</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div className="grid gap-2">
                            <Label htmlFor="paymentTerms">{t("contract.paymentTerms") || "付款条款"}</Label>
                            <Textarea
                                id="paymentTerms"
                                value={formData.paymentTerms}
                                onChange={(e) => handleChange('paymentTerms', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Description */}
                        <div className="grid gap-2">
                            <Label htmlFor="description">{t("common.description") || "描述"}</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Scope */}
                        <div className="grid gap-2">
                            <Label htmlFor="scope">{t("contract.scope") || "工作范围"}</Label>
                            <Textarea
                                id="scope"
                                value={formData.scope}
                                onChange={(e) => handleChange('scope', e.target.value)}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end gap-4">
                    <Link href="/contracts">
                        <Button type="button" variant="outline">
                            {t("common.cancel") || "取消"}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.creating") || "创建中..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {t("contract.createProcurement") || "创建采购合同"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
