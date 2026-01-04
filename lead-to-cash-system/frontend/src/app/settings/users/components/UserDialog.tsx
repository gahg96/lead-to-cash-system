
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: any; // If present, it's edit mode
    onSuccess: () => void;
}

const ROLES = [
    { value: "ADMIN", label: "系统管理员 (ADMIN)" },
    { value: "MANAGER", label: "经理/审批人 (MANAGER)" },
    { value: "SALES", label: "销售 (SALES)" },
    { value: "PRE_SALES", label: "售前 (PRE_SALES)" },
    { value: "COMMERCIAL", label: "商务 (COMMERCIAL)" },
    { value: "TECHNICAL", label: "技术 (TECHNICAL)" },
    { value: "DEVELOPER", label: "开发 (DEVELOPER)" },
    { value: "USER", label: "普通用户 (USER)" },
];

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        displayName: "",
        role: "USER",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username, // Immutable usually
                password: "", // Empty means no change
                displayName: user.displayName || "",
                role: user.role || "USER",
            });
        } else {
            setFormData({
                username: "",
                password: "",
                displayName: "",
                role: "USER",
            });
        }
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = {
                displayName: formData.displayName,
                role: formData.role,
            };

            if (user) {
                if (formData.password) {
                    payload.password = formData.password;
                }
                await api.patch(`/users/${user.id}`, payload);
            } else {
                payload.username = formData.username;
                payload.password = formData.password;
                await api.post("/users", payload);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            alert("Saving failed: " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? "编辑用户" : "新建用户"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>用户名 *</Label>
                        <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            disabled={!!user} // Cannot change username
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>显示名称 *</Label>
                        <Input
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>角色 *</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(role => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>{user ? "重置密码 (留空则不修改)" : "密码 *"}</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                            minLength={6}
                        />
                        {!user && <p className="text-xs text-muted-foreground">最少6位字符</p>}
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
