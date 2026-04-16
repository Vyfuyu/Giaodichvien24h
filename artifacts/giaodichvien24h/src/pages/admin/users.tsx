import { useState } from "react";
import {
  useAdminListUsers,
  usePromoteToGdv,
  useAdminDeleteUser,
  useAdminSetUserRole,
  useAdminSetUserStatus,
  useAdminRemoveGdv,
  PromoteGdvBody,
  getGetAdminDashboardQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldAlert, UserPlus, MoreHorizontal, Trash2, ShieldX, ShieldCheck, Star, UserCog, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const promoteSchema = z.object({
  realName: z.string().min(2, "Tên thật bắt buộc"),
  insuranceFund: z.coerce.number().min(1000000, "Bảo hiểm tối thiểu 1 triệu"),
  servicesOffered: z.string().min(2, "Nhập ít nhất 1 dịch vụ"),
  facebookLink: z.string().url("Link không hợp lệ").optional().or(z.literal("")),
  zaloLink: z.string().optional(),
  telegramLink: z.string().optional(),
});

function getRoleBadge(role: string) {
  if (role === "ADMIN") return <Badge variant="destructive">Admin</Badge>;
  if (role === "GDV") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">GDV</Badge>;
  return <Badge variant="secondary">Thành viên</Badge>;
}

function getStatusBadge(status?: string) {
  if (status === "SCAM") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Scam</Badge>;
  if (status === "TRUSTED") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Uy tín</Badge>;
  return null;
}

function getBadgeBadge(badge?: string) {
  if (badge === "TRUSTED_GDV") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Star className="w-3 h-3 mr-1" />GDV Uy Tín</Badge>;
  if (badge === "TRUSTED_SELLER") return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Người bán uy tín</Badge>;
  return null;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [promoteUserId, setPromoteUserId] = useState<number | null>(null);
  const [roleDialogUser, setRoleDialogUser] = useState<{ id: number; name: string; role: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: users, isLoading } = useAdminListUsers({ search: debouncedSearch });

  const promote = usePromoteToGdv();
  const deleteUser = useAdminDeleteUser();
  const setRole = useAdminSetUserRole();
  const setStatus = useAdminSetUserStatus();
  const removeGdv = useAdminRemoveGdv();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`)) return;
    deleteUser.mutate({ id }, {
      onSuccess: () => { toast({ title: `Đã xóa tài khoản ${name}` }); invalidate(); },
      onError: (e: any) => toast({ title: e?.response?.data?.error ?? "Lỗi xóa tài khoản", variant: "destructive" }),
    });
  };

  const handleSetStatus = (id: number, status: "NORMAL" | "SCAM" | "TRUSTED") => {
    setStatus.mutate({ id, data: { status } }, {
      onSuccess: () => { toast({ title: "Đã cập nhật trạng thái" }); invalidate(); },
      onError: () => toast({ title: "Lỗi cập nhật trạng thái", variant: "destructive" }),
    });
  };

  const handleSetBadge = (id: number, badge: "NONE" | "TRUSTED_GDV" | "TRUSTED_SELLER") => {
    setStatus.mutate({ id, data: { badge } }, {
      onSuccess: () => { toast({ title: "Đã cập nhật huy hiệu" }); invalidate(); },
      onError: () => toast({ title: "Lỗi cập nhật huy hiệu", variant: "destructive" }),
    });
  };

  const handleRemoveGdv = (id: number, name: string) => {
    if (!confirm(`Thu hồi quyền GDV của "${name}"?`)) return;
    removeGdv.mutate({ id }, {
      onSuccess: () => { toast({ title: `Đã thu hồi GDV của ${name}` }); invalidate(); },
      onError: () => toast({ title: "Lỗi thu hồi GDV", variant: "destructive" }),
    });
  };

  const handleSetRole = () => {
    if (!roleDialogUser || !selectedRole) return;
    setRole.mutate({ id: roleDialogUser.id, data: { role: selectedRole as any } }, {
      onSuccess: () => {
        toast({ title: `Đã đổi role thành ${selectedRole}` });
        setRoleDialogUser(null);
        invalidate();
      },
      onError: () => toast({ title: "Lỗi đổi role", variant: "destructive" }),
    });
  };

  const form = useForm<z.infer<typeof promoteSchema>>({
    resolver: zodResolver(promoteSchema),
    defaultValues: {
      realName: "", insuranceFund: 5000000,
      servicesOffered: "Trung gian mua bán acc, Mua bán vàng in-game",
      facebookLink: "", zaloLink: "", telegramLink: "",
    },
  });

  const onSubmitPromote = (data: z.infer<typeof promoteSchema>) => {
    if (!promoteUserId) return;
    const services = data.servicesOffered.split(",").map(s => s.trim()).filter(s => s);
    const payload: PromoteGdvBody = {
      realName: data.realName,
      insuranceFund: data.insuranceFund,
      servicesOffered: services,
      facebookLink: data.facebookLink || undefined,
      zaloLink: data.zaloLink || undefined,
      telegramLink: data.telegramLink || undefined,
    };
    promote.mutate({ id: promoteUserId, data: payload }, {
      onSuccess: () => {
        toast({ title: "Thăng cấp GDV thành công" });
        setPromoteUserId(null);
        form.reset();
        invalidate();
      },
      onError: () => toast({ title: "Lỗi thăng cấp GDV", variant: "destructive" }),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Người Dùng</h1>
            <p className="text-muted-foreground text-sm">Xem, chỉnh sửa role, trạng thái và quản lý tài khoản.</p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center w-72">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm email, tên, sđt..."
                className="pl-8 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="ml-2">Tìm</Button>
          </form>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>Tên / Email</TableHead>
                      <TableHead>SĐT</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{user.uid ?? `#${user.id}`}</TableCell>
                        <TableCell>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getRoleBadge(user.role)}
                            {getBadgeBadge(user.badge)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status) ?? <span className="text-xs text-muted-foreground">Bình thường</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {user.role === "MEMBER" && (
                              <Dialog open={promoteUserId === user.id} onOpenChange={open => !open && setPromoteUserId(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="text-blue-400 border-blue-500/20 hover:bg-blue-500/10" onClick={() => setPromoteUserId(user.id)}>
                                    <UserPlus className="w-3.5 h-3.5 mr-1" /> GDV
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Thăng cấp Giao Dịch Viên</DialogTitle>
                                    <DialogDescription>Nhập thông tin để nâng cấp {user.name} thành GDV.</DialogDescription>
                                  </DialogHeader>
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmitPromote)} className="space-y-3">
                                      <FormField control={form.control} name="realName" render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Tên thật (CCCD)</FormLabel>
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
                                          <FormLabel>Dịch vụ (cách nhau dấu phẩy)</FormLabel>
                                          <FormControl><Input {...field} /></FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} />
                                      <FormField control={form.control} name="facebookLink" render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Facebook</FormLabel>
                                          <FormControl><Input {...field} placeholder="https://facebook.com/..." /></FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )} />
                                      <FormField control={form.control} name="zaloLink" render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Zalo</FormLabel>
                                          <FormControl><Input {...field} placeholder="SĐT Zalo" /></FormControl>
                                        </FormItem>
                                      )} />
                                      <FormField control={form.control} name="telegramLink" render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Telegram</FormLabel>
                                          <FormControl><Input {...field} placeholder="@username" /></FormControl>
                                        </FormItem>
                                      )} />
                                      <Button type="submit" className="w-full" disabled={promote.isPending}>
                                        {promote.isPending ? "Đang xử lý..." : "Xác nhận thăng cấp"}
                                      </Button>
                                    </form>
                                  </Form>
                                </DialogContent>
                              </Dialog>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Quản lý {user.name}</DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => { setRoleDialogUser({ id: user.id, name: user.name, role: user.role }); setSelectedRole(user.role); }}>
                                  <UserCog className="w-4 h-4 mr-2" /> Đổi Role
                                </DropdownMenuItem>

                                {user.role === "GDV" && (
                                  <DropdownMenuItem onClick={() => handleRemoveGdv(user.id, user.name)} className="text-orange-400">
                                    <UserMinus className="w-4 h-4 mr-2" /> Thu hồi GDV
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Trạng thái tài khoản</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSetStatus(user.id, "NORMAL")}>
                                  Bình thường
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetStatus(user.id, "SCAM")} className="text-red-400">
                                  <ShieldX className="w-4 h-4 mr-2" /> Đánh dấu Scam
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetStatus(user.id, "TRUSTED")} className="text-green-400">
                                  <ShieldCheck className="w-4 h-4 mr-2" /> Đánh dấu Uy Tín
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Huy hiệu</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleSetBadge(user.id, "NONE")}>Không có</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetBadge(user.id, "TRUSTED_GDV")} className="text-blue-400">
                                  <Star className="w-4 h-4 mr-2" /> GDV Uy Tín
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSetBadge(user.id, "TRUSTED_SELLER")} className="text-purple-400">
                                  Người Bán Uy Tín
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(user.id, user.name)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Xóa tài khoản
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Không có dữ liệu.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!roleDialogUser} onOpenChange={open => !open && setRoleDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi Role</DialogTitle>
            <DialogDescription>Chọn role mới cho {roleDialogUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Thành viên (MEMBER)</SelectItem>
                <SelectItem value="GDV">Giao Dịch Viên (GDV)</SelectItem>
                <SelectItem value="ADMIN">Quản Trị Viên (ADMIN)</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleSetRole} disabled={setRole.isPending}>
              {setRole.isPending ? "Đang xử lý..." : "Xác nhận đổi role"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
