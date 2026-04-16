import { useState } from "react";
import {
  useListMiddlemen,
  useAdminListUsers,
  usePromoteToGdv,
  useAdminRemoveGdv,
  PromoteGdvBody,
  getGetAdminDashboardQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  UserPlus, Trash2, ShieldCheck, Star, Search, Facebook, MessageCircle, Send,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const promoteSchema = z.object({
  realName: z.string().min(2, "Tên thật bắt buộc"),
  insuranceFund: z.coerce.number().min(1000000, "Bảo hiểm tối thiểu 1 triệu"),
  servicesOffered: z.string().min(2, "Nhập ít nhất 1 dịch vụ"),
  facebookLink: z.string().url("Link không hợp lệ").optional().or(z.literal("")),
  zaloLink: z.string().optional(),
  telegramLink: z.string().optional(),
});

export default function AdminGdv() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  const { data: gdvList, isLoading } = useListMiddlemen();
  const { data: searchResults } = useAdminListUsers(
    userSearch.length >= 2 ? { search: userSearch } : {},
  );

  const promote = usePromoteToGdv();
  const removeGdv = useAdminRemoveGdv();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/middlemen"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const form = useForm<z.infer<typeof promoteSchema>>({
    resolver: zodResolver(promoteSchema),
    defaultValues: {
      realName: "",
      insuranceFund: 5000000,
      servicesOffered: "Trung gian mua bán acc, Mua bán vàng in-game",
      facebookLink: "",
      zaloLink: "",
      telegramLink: "",
    },
  });

  const handleRemove = (userId: number, name: string) => {
    if (!confirm(`Thu hồi quyền GDV của "${name}"? Hồ sơ GDV sẽ bị xóa.`)) return;
    removeGdv.mutate({ id: userId }, {
      onSuccess: () => { toast({ title: `Đã thu hồi GDV của ${name}` }); invalidate(); },
      onError: () => toast({ title: "Lỗi thu hồi GDV", variant: "destructive" }),
    });
  };

  const handleSelectUser = (id: number, name: string) => {
    setSelectedUserId(id);
    setSelectedUserName(name);
    setUserSearch(name);
  };

  const onSubmitPromote = (data: z.infer<typeof promoteSchema>) => {
    if (!selectedUserId) { toast({ title: "Vui lòng chọn người dùng", variant: "destructive" }); return; }
    const services = data.servicesOffered.split(",").map(s => s.trim()).filter(s => s);
    const payload: PromoteGdvBody = {
      realName: data.realName,
      insuranceFund: data.insuranceFund,
      servicesOffered: services,
      facebookLink: data.facebookLink || undefined,
      zaloLink: data.zaloLink || undefined,
      telegramLink: data.telegramLink || undefined,
    };
    promote.mutate({ id: selectedUserId, data: payload }, {
      onSuccess: () => {
        toast({ title: `Đã thêm GDV: ${selectedUserName}` });
        setAddDialogOpen(false);
        setSelectedUserId(null);
        setUserSearch("");
        form.reset();
        invalidate();
      },
      onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Lỗi thêm GDV", variant: "destructive" }),
    });
  };

  const nonAdminResults = searchResults?.filter(u => u.role !== "ADMIN") ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý GDV</h1>
            <p className="text-muted-foreground text-sm">Thêm, xem và thu hồi Giao Dịch Viên.</p>
          </div>
          <Button onClick={() => { setAddDialogOpen(true); setSelectedUserId(null); setUserSearch(""); form.reset(); }}>
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
                      <AvatarImage src={gdv.userAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {gdv.realName?.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate flex items-center gap-1">
                        {gdv.realName}
                        {gdv.verificationBadge && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                      </h3>
                      <p className="text-xs text-muted-foreground">{gdv.userName}</p>
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{gdv.successRate}%</span>
                        <span className="text-muted-foreground">• {gdv.totalTransactions} giao dịch</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-2">
                    Quỹ bảo hiểm: <span className="font-semibold text-primary">{(gdv.insuranceFund / 1000000).toFixed(1)}M VNĐ</span>
                  </div>

                  <div className="flex gap-1 flex-wrap mb-3">
                    {gdv.servicesOffered.map(srv => (
                      <Badge key={srv} variant="secondary" className="text-[10px] px-1.5 py-0">{srv}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-2 text-xs text-muted-foreground mb-3">
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
                    onClick={() => handleRemove(gdv.userId, gdv.realName)}
                    disabled={removeGdv.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Thu hồi GDV
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
            <DialogDescription>Tìm tài khoản người dùng rồi điền thông tin GDV.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tìm tài khoản người dùng</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nhập tên, email hoặc SĐT..."
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setSelectedUserId(null); }}
                />
              </div>
              {userSearch.length >= 2 && !selectedUserId && nonAdminResults.length > 0 && (
                <div className="mt-1 border border-border rounded-md bg-card divide-y divide-border max-h-40 overflow-y-auto">
                  {nonAdminResults.map(u => (
                    <button
                      key={u.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                      onClick={() => handleSelectUser(u.id, u.name)}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email} • {u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUserId && (
                <p className="mt-1 text-sm text-green-400">Đã chọn: <strong>{selectedUserName}</strong> (ID: {selectedUserId})</p>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitPromote)} className="space-y-3">
                <FormField control={form.control} name="realName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên thật (theo CCCD)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="insuranceFund" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quỹ bảo hiểm (VNĐ)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="servicesOffered" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dịch vụ cung cấp (cách nhau bằng dấu phẩy)</FormLabel>
                    <FormControl><Input {...field} placeholder="Trung gian mua bán acc, Mua bán vàng..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="facebookLink" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Facebook</FormLabel>
                    <FormControl><Input {...field} placeholder="https://facebook.com/..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="zaloLink" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zalo (SĐT)</FormLabel>
                    <FormControl><Input {...field} placeholder="0987654321" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="telegramLink" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telegram</FormLabel>
                    <FormControl><Input {...field} placeholder="@username" /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={promote.isPending || !selectedUserId}>
                  {promote.isPending ? "Đang xử lý..." : "Xác nhận thêm GDV"}
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
