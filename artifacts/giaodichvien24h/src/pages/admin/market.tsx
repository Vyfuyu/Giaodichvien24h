import { useListMarketItems, useAdminDeleteMarketItem, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminMarket() {
  const { data, isLoading } = useListMarketItems();
  const deleteItem = useAdminDeleteMarketItem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa tin đăng này?")) {
      deleteItem.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Đã xóa tin đăng" });
          queryClient.invalidateQueries({ queryKey: ['/api/market-items'] });
          queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản Lý Chợ Giao Dịch</h1>
          <p className="text-muted-foreground">Kiểm duyệt và xóa các tin đăng vi phạm.</p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
            ) : (
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
                  {data?.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="line-clamp-1 max-w-[250px]" title={item.title}>
                          {item.title}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.gameType}</Badge></TableCell>
                      <TableCell className="font-bold text-primary">{item.price.toLocaleString()}đ</TableCell>
                      <TableCell>{item.sellerName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteItem.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data?.items || data.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
