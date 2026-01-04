
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/I18nContext";

interface CustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: any; // If present, it's edit mode
    onSuccess: () => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        companySize: "",
        city: "",
        contactName: "",
        contactTitle: "",
        contactPhone: "",
        contactEmail: "",
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                companyName: customer.companyName || "",
                industry: customer.industry || "",
                companySize: customer.companySize || "",
                city: customer.city || "",
                contactName: customer.contactName || "",
                contactTitle: customer.contactTitle || "",
                contactPhone: customer.contactPhone || "",
                contactEmail: customer.contactEmail || "",
            });
        } else {
            setFormData({
                companyName: "",
                industry: "",
                companySize: "",
                city: "",
                contactName: "",
                contactTitle: "",
                contactPhone: "",
                contactEmail: "",
            });
        }
    }, [customer, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (customer) {
                await api.patch(`/customers/${customer.id}`, formData);
            } else {
                await api.post("/customers", formData);
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
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{customer ? "编辑客户" : "新建客户"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>客户名称 *</Label>
                            <Input
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>行业</Label>
                            <Input
                                value={formData.industry}
                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>规模</Label>
                            <Select
                                value={formData.companySize}
                                onValueChange={(val) => setFormData({ ...formData, companySize: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择规模" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Small">1-50人</SelectItem>
                                    <SelectItem value="Medium">51-200人</SelectItem>
                                    <SelectItem value="Large">201-1000人</SelectItem>
                                    <SelectItem value="Enterprise">1000人以上</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>城市</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">联系人信息</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>联系人姓名</Label>
                                <Input
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>职位</Label>
                                <Input
                                    value={formData.contactTitle}
                                    onChange={(e) => setFormData({ ...formData, contactTitle: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>电话</Label>
                                <Input
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>邮箱</Label>
                                <Input
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                />
                            </div>
                        </div>
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
