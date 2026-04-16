import { useState } from "react";
import { useAdminListUsers, usePromoteToGdv, PromoteGdvBody, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, ShieldAlert, UserPlus } from "lucide-react";
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

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [promoteUserId, setPromoteUserId] = useState<number | null>(null);
  
  const { data: users, isLoading } = useAdminListUsers(
    { search: debouncedSearch }
  );
  
  const promote = usePromoteToGdv();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
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

  const onSubmitPromote = (data: z.infer<typeof promoteSchema>) => {
    if (!promoteUserId) return;
    
    // Parse comma separated services
    const services = data.servicesOffered.split(',').map(s => s.trim()).filter(s => s);
    
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
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Người Dùng</h1>
            <p className="text-muted-foreground">Xem danh sách và thăng cấp người dùng lên GDV.</p>
          </div>
          <form onSubmit={handleSearch} className="flex items-center w-72">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm email, sđt..."
                className="pl-8 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên hiển thị</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SĐT</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày đăng ký</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'GDV' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.role === 'MEMBER' && (
                          <Dialog open={promoteUserId === user.id} onOpenChange={(open) => !open && setPromoteUserId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/10" onClick={() => setPromoteUserId(user.id)}>
                                <ShieldAlert className="w-4 h-4 mr-2" /> Lên GDV
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Thăng cấp Giao Dịch Viên</DialogTitle>
                                <DialogDescription>Nhập thông tin xác thực để nâng cấp người dùng {user.name} thành GDV.</DialogDescription>
                              </DialogHeader>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmitPromote)} className="space-y-3">
                                  <FormField
                                    control={form.control}
                                    name="realName"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Tên thật (CCCD)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="insuranceFund"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Số tiền quỹ bảo hiểm (VNĐ)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="servicesOffered"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Dịch vụ (cách nhau dấu phẩy)</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name="facebookLink"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Facebook Link</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button type="submit" className="w-full mt-4" disabled={promote.isPending}>
                                    {promote.isPending ? "Đang xử lý..." : "Xác nhận thăng cấp"}
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!users || users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không có dữ liệu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
