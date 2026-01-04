

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Textarea } from '@/components/ui/textarea';

const SCENARIOS = [
    { id: 'ADVANCE', name: '垫资 (Fund Advancing)', description: '先行垫付资金给上游，后期收回。' },
    { id: 'PASS_THROUGH', name: '纯过单-含费 (Pass w/ Expense)', description: '处理交易流水并支付相关费用。' },
    { id: 'SIMPLE_PASS', name: '普通过单 (Simple Pass)', description: '简单的资金过账，保留利润，无复杂支出。' },
    { id: 'BOOST', name: '做业绩 (Performance Boost)', description: '仅为冲量，零成本过账。' },
    { id: 'EXPENSE_ONLY', name: '纯处理费用 (Expense Only)', description: '仅处理提现或支出。' },
];

export default function NewFundTransaction() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1);
    const [type, setType] = useState<string>('');
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [formData, setFormData] = useState({
        description: '',
        projectId: '',
        totalAmount: '', // 总交易额
        principalAmount: '',
        expectedDuration: '',
        costRuleType: 'MONTHLY',
        costRate: '',
        passThreshold: ''
    });

    // Upstream/Downstream data
    const [collections, setCollections] = useState<Array<{
        customerName: string;
        amount: string;
        receivedDate: string;
    }>>([]);
    const [allocations, setAllocations] = useState<Array<{
        vendorName: string;
        amount: string;
        paymentDate: string;
    }>>([]);
    const [payouts, setPayouts] = useState<Array<{
        beneficiary: string;
        baseAmount: string;
        payoutType: string;
        conversionRate: string;
    }>>([]);

    // Fetch projects and auto-select from URL parameter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get('/projects');
                setProjects(data);

                // Check if projectId is in URL
                const urlProjectId = searchParams.get('projectId');
                if (urlProjectId) {
                    const project = data.find((p: any) => p.id === urlProjectId);
                    if (project) {
                        setSelectedProject(project);
                        setFormData(prev => ({
                            ...prev,
                            projectId: urlProjectId,
                            description: `${project.contract.opportunity.title} - 资金交易`
                        }));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            }
        };
        fetchProjects();
    }, [searchParams]);

    const handleSubmit = async () => {
        try {
            const payload = {
                type,
                description: formData.description,
                projectId: formData.projectId || undefined,
                totalAmount: formData.totalAmount ? Number(formData.totalAmount) : undefined,
                principalAmount: formData.principalAmount ? Number(formData.principalAmount) : undefined,
                expectedDuration: formData.expectedDuration ? Number(formData.expectedDuration) : undefined,
                costRuleType: formData.costRuleType,
                costRate: formData.costRate ? Number(formData.costRate) : undefined,
                passThreshold: formData.passThreshold ? Number(formData.passThreshold) : undefined,
                collections: collections.length > 0 ? collections.map(c => ({
                    customerName: c.customerName,
                    amount: Number(c.amount),
                    receivedDate: c.receivedDate
                })) : undefined,
                allocations: allocations.length > 0 ? allocations.map(a => ({
                    vendorName: a.vendorName,
                    amount: Number(a.amount),
                    paymentDate: a.paymentDate
                })) : undefined,
                payouts: payouts.length > 0 ? payouts.map(p => ({
                    beneficiary: p.beneficiary,
                    baseAmount: Number(p.baseAmount),
                    payoutType: p.payoutType,
                    conversionRate: Number(p.conversionRate)
                })) : undefined,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/funds/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/finance/funds');
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`创建交易失败: ${errorData.message || res.statusText}`);
            }
        } catch (e) {
            console.error(e);
            alert('创建交易出错 (Network/Client Error)');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Link href="/finance/funds" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回仪表盘
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">新建资金交易</h1>
                <p className="text-muted-foreground">请选择业务场景以配置资金流向。</p>
            </div>

            {step === 1 && (
                <div className="grid gap-4">
                    {SCENARIOS.map((scenario) => (
                        <Card
                            key={scenario.id}
                            className={`cursor-pointer transition-all hover:border-primary ${type === scenario.id ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}`}
                            onClick={() => setType(scenario.id)}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-semibold">
                                    {scenario.name}
                                </CardTitle>
                                {type === scenario.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{scenario.description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                    <Button
                        className="mt-4"
                        disabled={!type}
                        onClick={() => setStep(2)}
                    >
                        下一步
                    </Button>
                </div>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>交易详情</CardTitle>
                        <CardDescription>配置参数：{SCENARIOS.find(s => s.id === type)?.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>描述 / 备注</Label>
                            <Input
                                placeholder="例如：Alpha项目垫资50万"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>关联项目 (可选)</Label>
                            <Select
                                value={formData.projectId || undefined}
                                onValueChange={(value) => {
                                    const project = projects.find(p => p.id === value);
                                    setSelectedProject(project || null);
                                    setFormData({ ...formData, projectId: value || '' });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择项目..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(project => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.contract.opportunity.title} - {project.contract.contractNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedProject && (
                                <p className="text-xs text-muted-foreground">
                                    客户: {selectedProject.contract.opportunity.customer.companyName}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>总交易额 (Total Amount) *</Label>
                            <Input
                                type="number"
                                placeholder="1000000"
                                value={formData.totalAmount}
                                onChange={e => setFormData({ ...formData, totalAmount: e.target.value })}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                项目可能混合多种资金类型，请输入总交易金额
                            </p>
                        </div>

                        {/* Conditional Fields based on Type */}
                        {type === 'ADVANCE' && (
                            <>
                                <div className="space-y-2">
                                    <Label>本金金额 (Principal Amount)</Label>
                                    <Input
                                        type="number"
                                        placeholder="500000"
                                        value={formData.principalAmount}
                                        onChange={e => setFormData({ ...formData, principalAmount: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>预计周期 (月)</Label>
                                        <Input
                                            type="number"
                                            placeholder="3"
                                            value={formData.expectedDuration}
                                            onChange={e => setFormData({ ...formData, expectedDuration: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>资金成本率 (月化 %)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.01"
                                            value={formData.costRate}
                                            onChange={e => setFormData({ ...formData, costRate: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground">0.01 = 1%</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {['PASS_THROUGH', 'SIMPLE_PASS'].includes(type) && (
                            <div className="space-y-2">
                                <Label>通道费率 / 留存比例</Label>
                                <Input
                                    type="number"
                                    placeholder="0.05"
                                    value={formData.passThreshold}
                                    onChange={e => setFormData({ ...formData, passThreshold: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">公司留存比例 (例如 0.05)</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
                            <Button onClick={() => setStep(3)}>下一步：上下游信息</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>上下游信息</CardTitle>
                        <CardDescription>配置资金流向：收入来源和支出去向</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Revenue Collections */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">收入来源 (Revenue Collections)</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCollections([...collections, {
                                        customerName: '',
                                        amount: '',
                                        receivedDate: new Date().toISOString().split('T')[0]
                                    }])}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> 添加收入
                                </Button>
                            </div>
                            {collections.map((collection, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-xs">客户名称</Label>
                                        <Input
                                            placeholder="客户名称"
                                            value={collection.customerName}
                                            onChange={e => {
                                                const newCollections = [...collections];
                                                newCollections[index].customerName = e.target.value;
                                                setCollections(newCollections);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">金额</Label>
                                        <Input
                                            type="number"
                                            placeholder="金额"
                                            value={collection.amount}
                                            onChange={e => {
                                                const newCollections = [...collections];
                                                newCollections[index].amount = e.target.value;
                                                setCollections(newCollections);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-xs">收款日期</Label>
                                        <Input
                                            type="date"
                                            value={collection.receivedDate}
                                            onChange={e => {
                                                const newCollections = [...collections];
                                                newCollections[index].receivedDate = e.target.value;
                                                setCollections(newCollections);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setCollections(collections.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {collections.length === 0 && (
                                <p className="text-sm text-muted-foreground">暂无收入来源，点击"添加收入"按钮添加</p>
                            )}
                        </div>

                        {/* Capital Allocations */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">资金分配 (Capital Allocations)</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAllocations([...allocations, {
                                        vendorName: '',
                                        amount: '',
                                        paymentDate: new Date().toISOString().split('T')[0]
                                    }])}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> 添加支出
                                </Button>
                            </div>
                            {allocations.map((allocation, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-xs">供应商名称</Label>
                                        <Input
                                            placeholder="供应商名称"
                                            value={allocation.vendorName}
                                            onChange={e => {
                                                const newAllocations = [...allocations];
                                                newAllocations[index].vendorName = e.target.value;
                                                setAllocations(newAllocations);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">金额</Label>
                                        <Input
                                            type="number"
                                            placeholder="金额"
                                            value={allocation.amount}
                                            onChange={e => {
                                                const newAllocations = [...allocations];
                                                newAllocations[index].amount = e.target.value;
                                                setAllocations(newAllocations);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-1">
                                        <Label className="text-xs">付款日期</Label>
                                        <Input
                                            type="date"
                                            value={allocation.paymentDate}
                                            onChange={e => {
                                                const newAllocations = [...allocations];
                                                newAllocations[index].paymentDate = e.target.value;
                                                setAllocations(newAllocations);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setAllocations(allocations.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {allocations.length === 0 && (
                                <p className="text-sm text-muted-foreground">暂无资金分配，点击"添加支出"按钮添加</p>
                            )}
                        </div>

                        {/* Expense Payouts */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">商务费用 (Expense Payouts)</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPayouts([...payouts, { beneficiary: '', baseAmount: '', payoutType: 'PRODUCT_13', conversionRate: '0.87' }])}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> 添加费用
                                </Button>
                            </div>
                            {payouts.map((payout, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">受益人</Label>
                                        <Input
                                            placeholder="受益人"
                                            value={payout.beneficiary}
                                            onChange={e => {
                                                const newPayouts = [...payouts];
                                                newPayouts[index].beneficiary = e.target.value;
                                                setPayouts(newPayouts);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">类型</Label>
                                        <Select
                                            value={payout.payoutType}
                                            onValueChange={value => {
                                                const newPayouts = [...payouts];
                                                newPayouts[index].payoutType = value;
                                                setPayouts(newPayouts);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PRODUCT_13">产品 13%</SelectItem>
                                                <SelectItem value="SERVICE_6">服务 6%</SelectItem>
                                                <SelectItem value="SERVICE_0">服务 0%</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <Label className="text-xs">基数</Label>
                                        <Input
                                            type="number"
                                            placeholder="基数"
                                            value={payout.baseAmount}
                                            onChange={e => {
                                                const newPayouts = [...payouts];
                                                newPayouts[index].baseAmount = e.target.value;
                                                setPayouts(newPayouts);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-xs">折算率</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.87"
                                            value={payout.conversionRate}
                                            onChange={e => {
                                                const newPayouts = [...payouts];
                                                newPayouts[index].conversionRate = e.target.value;
                                                setPayouts(newPayouts);
                                            }}
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setPayouts(payouts.filter((_, i) => i !== index))}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {payouts.length === 0 && (
                                <p className="text-sm text-muted-foreground">暂无商务费用，点击"添加费用"按钮添加</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setStep(2)}>上一步</Button>
                            <Button onClick={handleSubmit}>创建交易</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
