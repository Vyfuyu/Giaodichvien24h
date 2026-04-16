import { useState } from "react";
import {
  useAdminListMarketItems,
  useAdminDeleteMarketItem,
  useAdminApproveMarketItem,
  useAdminRejectMarketItem,
  getGetAdminDashboardQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type StatusFilter = "ALL" | "PENDING" | "AVAILABLE" | "SOLD" | "REJECTED";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>;
    case "AVAILABLE":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đang bán</Badge>;
    case "SOLD":
      return <Badge variant="secondary">Đã bán</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Từ chối</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminMarket() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useAdminListMarketItems(
    statusFilter !== "ALL" ? { status: statusFilter } : {}
  );

  const deleteItem = useAdminDeleteMarketItem();
  const approveItem = useAdminApproveMarketItem();
  const rejectItem = useAdminRejectMarketItem();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/market"] });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`Xóa tin đăng "${title}"?`)) return;
    deleteItem.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã xóa tin đăng" }); invalidate(); },
      onError: () => toast({ title: "Lỗi xóa tin đăng", variant: "destructive" }),
    });
  };

  const handleApprove = (id: number) => {
    approveItem.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã duyệt tin đăng" }); invalidate(); },
      onError: () => toast({ title: "Lỗi duyệt tin đăng", variant: "destructive" }),
    });
  };

  const handleReject = (id: number) => {
    rejectItem.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã từ chối tin đăng" }); invalidate(); },
      onError: () => toast({ title: "Lỗi từ chối tin đăng", variant: "destructive" }),
    });
  };

  const items = data?.items ?? [];
  const pendingCount = items.filter(i => i.status === "PENDING").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Chợ Giao Dịch</h1>
            <p className="text-muted-foreground text-sm">Kiểm duyệt và quản lý tin đăng.</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm px-3 py-1">
              {pendingCount} tin chờ duyệt
            </Badge>
          )}
        </div>

        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
            <TabsTrigger value="PENDING">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="AVAILABLE">Đang bán</TabsTrigger>
            <TabsTrigger value="REJECTED">Từ chối</TabsTrigger>
            <TabsTrigger value="SOLD">Đã bán</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Người đăng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đăng</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id} className={item.status === "PENDING" ? "bg-yellow-500/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.images?.[0] && (
                              <img src={item.images[0]} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                            )}
                            <div className="line-clamp-1 max-w-[200px] font-medium text-sm" title={item.title}>
                              {item.title}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{item.gameType}</Badge></TableCell>
                        <TableCell className="font-bold text-primary whitespace-nowrap">{item.price.toLocaleString()}đ</TableCell>
                        <TableCell className="text-sm">{item.sellerName || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(item.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.status === "PENDING" && (
                              <>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                  onClick={() => handleApprove(item.id)}
                                  disabled={approveItem.isPending}
                                  title="Duyệt"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-8 w-8 text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                  onClick={() => handleReject(item.id)}
                                  disabled={rejectItem.isPending}
                                  title="Từ chối"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id, item.title)}
                              disabled={deleteItem.isPending}
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Không có tin đăng nào.
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
    </AdminLayout>
  );
}
