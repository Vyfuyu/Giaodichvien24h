import { useState, useRef } from "react";
import { useListMiddlemen, useAdminRemoveGdv, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, ShieldCheck, Facebook, MessageCircle, Send, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 300;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = height * MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width = width * MAX / height; height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas error")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const defaultForm = {
  realName: "",
  avatar: "",
  insuranceFund: "5000000",
  servicesOffered: "Trung gian mua bán acc",
  facebookLink: "",
  zaloLink: "",
  telegramLink: "",
};

export default function AdminGdv() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: gdvList, isLoading } = useListMiddlemen();
  const removeGdv = useAdminRemoveGdv();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/middlemen"] });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Ảnh quá lớn (tối đa 5MB)", variant: "destructive" });
      return;
    }
    try {
      const base64 = await compressImage(file);
      setAvatarPreview(base64);
      setForm(f => ({ ...f, avatar: base64 }));
    } catch {
      toast({ title: "Lỗi xử lý ảnh", variant: "destructive" });
    }
  };

  const handleRemove = (profileId: number, name: string) => {
    if (!confirm(`Xóa hồ sơ GDV "${name}"? Hành động này không thể hoàn tác.`)) return;
    removeGdv.mutate({ id: profileId }, {
      onSuccess: () => { toast({ title: `Đã xóa GDV: ${name}` }); invalidate(); },
      onError: () => toast({ title: "Lỗi xóa GDV", variant: "destructive" }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.realName.trim() || form.realName.trim().length < 2) {
      toast({ title: "Tên thật bắt buộc (tối thiểu 2 ký tự)", variant: "destructive" });
      return;
    }
    if (!form.insuranceFund || isNaN(Number(form.insuranceFund))) {
      toast({ title: "Quỹ cọc không hợp lệ", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/admin/gdv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          realName: form.realName.trim(),
          avatar: form.avatar || null,
          insuranceFund: Number(form.insuranceFund),
          servicesOffered: form.servicesOffered,
          facebookLink: form.facebookLink || null,
          zaloLink: form.zaloLink || null,
          telegramLink: form.telegramLink || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Lỗi không xác định");
      }
      toast({ title: `Đã thêm GDV: ${form.realName}` });
      setAddDialogOpen(false);
      setForm(defaultForm);
      setAvatarPreview("");
      invalidate();
    } catch (err: any) {
      toast({ title: err.message ?? "Lỗi thêm GDV", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openAdd = () => {
    setForm(defaultForm);
    setAvatarPreview("");
    setAddDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý GDV</h1>
            <p className="text-muted-foreground text-sm">Thêm và quản lý Giao Dịch Viên.</p>
          </div>
          <Button onClick={openAdd}>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm GDV
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : gdvList?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gdvList.map(gdv => (
              <Card key={gdv.id} className="flex flex-col">
                <CardContent className="p-4 flex-1">
                  <div className="flex gap-3 mb-3">
                    <Avatar className="w-14 h-14 border-2 border-primary/20 shrink-0">
                      <AvatarImage src={(gdv as any).avatar || gdv.userAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {gdv.realName?.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate flex items-center gap-1">
                        {gdv.realName}
                        {gdv.verificationBadge && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Quỹ cọc: <span className="font-semibold text-primary">{(gdv.insuranceFund / 1000000).toFixed(1)}M VNĐ</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-wrap mb-3">
                    {gdv.servicesOffered.map(srv => (
                      <Badge key={srv} variant="secondary" className="text-[10px] px-1.5 py-0">{srv}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                    {gdv.facebookLink && (
                      <a href={gdv.facebookLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400">
                        <Facebook className="w-3.5 h-3.5" /> Facebook
                      </a>
                    )}
                    {gdv.zaloLink && (
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> {gdv.zaloLink}
                      </span>
                    )}
                    {gdv.telegramLink && (
                      <span className="flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" /> {gdv.telegramLink}
                      </span>
                    )}
                  </div>
                </CardContent>
                <div className="px-4 pb-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRemove(gdv.id, gdv.realName)}
                    disabled={removeGdv.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Xóa GDV
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <UserPlus className="w-12 h-12 mb-2 opacity-30" />
              <p>Chưa có GDV nào. Nhấn "Thêm GDV" để bắt đầu.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm Giao Dịch Viên</DialogTitle>
            <DialogDescription>Điền thông tin GDV. Không cần liên kết tài khoản người dùng.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-primary/20">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                    {form.realName?.charAt(0) || "G"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <p className="text-xs text-muted-foreground">Hoặc nhập URL ảnh:</p>
              <Input
                placeholder="https://... (URL ảnh đại diện)"
                value={form.avatar.startsWith("data:") ? "" : form.avatar}
                onChange={e => {
                  setForm(f => ({ ...f, avatar: e.target.value }));
                  setAvatarPreview(e.target.value);
                }}
              />
            </div>

            <div className="space-y-1">
              <Label>Tên thật *</Label>
              <Input
                required
                placeholder="Nguyễn Văn A"
                value={form.realName}
                onChange={e => setForm(f => ({ ...f, realName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Quỹ cọc (VNĐ) *</Label>
              <Input
                required
                type="number"
                min={0}
                placeholder="5000000"
                value={form.insuranceFund}
                onChange={e => setForm(f => ({ ...f, insuranceFund: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Dịch vụ (cách nhau bằng dấu phẩy)</Label>
              <Input
                placeholder="Trung gian mua bán acc, Mua bán vàng..."
                value={form.servicesOffered}
                onChange={e => setForm(f => ({ ...f, servicesOffered: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Link Facebook</Label>
              <Input
                placeholder="https://facebook.com/..."
                value={form.facebookLink}
                onChange={e => setForm(f => ({ ...f, facebookLink: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Zalo (SĐT hoặc link)</Label>
              <Input
                placeholder="0987654321"
                value={form.zaloLink}
                onChange={e => setForm(f => ({ ...f, zaloLink: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Telegram</Label>
              <Input
                placeholder="@username"
                value={form.telegramLink}
                onChange={e => setForm(f => ({ ...f, telegramLink: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</> : "Xác nhận thêm GDV"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
