import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nContext";
import { X } from "lucide-react";

interface VendorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendor?: any;
    onSuccess: () => void;
}

export function VendorDialog({ open, onOpenChange, vendor, onSuccess }: VendorDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [allVendors, setAllVendors] = useState<any[]>([]); // For parent selection
    const [formData, setFormData] = useState({
        name: "",
        type: "",
        industry: "",
        region: "",
        brand: "",
        parentId: "",
        contactName: "",
        contactPhone: "",
        description: "",
        customerIds: [] as string[],
    });

    useEffect(() => {
        if (open) {
            api.get("/customers").then(setAllCustomers).catch(console.error);
            api.get("/vendors").then(setAllVendors).catch(console.error);
        }
    }, [open]);

    useEffect(() => {
        if (vendor) {
            setFormData({
                name: vendor.name || "",
                type: vendor.type || "",
                industry: vendor.industry || "",
                region: vendor.region || "",
                brand: vendor.brand || "",
                parentId: vendor.parentId || "",
                contactName: vendor.contactName || "",
                contactPhone: vendor.contactPhone || "",
                description: vendor.description || "",
                customerIds: vendor.customers?.map((c: any) => c.id) || [],
            });
        } else {
            setFormData({
                name: "",
                type: "",
                industry: "",
                region: "",
                brand: "",
                parentId: "",
                contactName: "",
                contactPhone: "",
                description: "",
                customerIds: [],
            });
        }
    }, [vendor, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (vendor) {
                await api.patch(`/vendors/${vendor.id}`, formData);
            } else {
                await api.post("/vendors", formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert("Saving failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{vendor ? "编辑厂商" : "新建厂商"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>厂商名称 *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="例如：WPS, 东方通, 达蒙"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>类型</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择类型" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Middleware">中间件</SelectItem>
                                    <SelectItem value="Database">数据库</SelectItem>
                                    <SelectItem value="OS">操作系统</SelectItem>
                                    <SelectItem value="Office">办公软件</SelectItem>
                                    <SelectItem value="Security">安全</SelectItem>
                                    <SelectItem value="Hardware">硬件</SelectItem>
                                    <SelectItem value="Other">其他</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>品牌/产品</Label>
                                <Input
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    placeholder="例如：东方通"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>上级厂商</Label>
                                <Select
                                    value={formData.parentId}
                                    onValueChange={(val) => setFormData({ ...formData, parentId: val === "none" ? "" : val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="选择上级厂商(可选)..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">无</SelectItem>
                                        {allVendors
                                            .filter(v => (!vendor || v.id !== vendor.id)) // Exclude self
                                            .map(v => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>行业</Label>
                            <Input
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                placeholder="例如：金融, 政府"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>区域</Label>
                            <Input
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                placeholder="例如：华东, 北京"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>关联客户</Label>
                        {formData.customerIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.customerIds.map(id => {
                                    const c = allCustomers.find(item => item.id === id);
                                    return c ? (
                                        <div key={id} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm border border-blue-100">
                                            <span>{c.companyName}</span>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, customerIds: prev.customerIds.filter(cid => cid !== id) }))} className="text-blue-400 hover:text-blue-600">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                        <Select
                            onValueChange={(val) => {
                                if (!formData.customerIds.includes(val)) {
                                    setFormData(prev => ({ ...prev, customerIds: [...prev.customerIds, val] }));
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="添加关联客户..." />
                            </SelectTrigger>
                            <SelectContent>
                                {allCustomers.filter(c => !formData.customerIds.includes(c.id)).map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.companyName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">联系方式</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>联系人</Label>
                                <Input
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>电话</Label>
                                <Input
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>备注</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
