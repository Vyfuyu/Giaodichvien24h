import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/lib/auth";
import { useGetMyReports, getGetMyReportsQueryKey, useGetMyMarketItems, getGetMyMarketItemsQueryKey, useLogout, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User as UserIcon, ShieldAlert, ShoppingBag, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function Account() {
  const { user } = useAuth();
  const logout = useLogout();
  const queryClient = useQueryClient();
  
  const { data: reports, isLoading: reportsLoading } = useGetMyReports({
    query: { enabled: !!user, queryKey: getGetMyReportsQueryKey() }
  });
  
  const { data: marketItems, isLoading: itemsLoading } = useGetMyMarketItems({
    query: { enabled: !!user, queryKey: getGetMyMarketItemsQueryKey() }
  });

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        setAuthTokenGetter(() => null);
        queryClient.clear();
        window.location.href = "/";
      },
      onError: () => {
        localStorage.removeItem("auth_token");
        setAuthTokenGetter(() => null);
        queryClient.clear();
        window.location.href = "/";
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1"/> Đang duyệt</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1"/> Đã duyệt</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> Từ chối</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <UserIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Chưa đăng nhập</h2>
          <p className="text-muted-foreground mb-8">Đăng nhập để quản lý báo cáo và tin đăng của bạn.</p>
          <div className="w-full space-y-3">
            <Button className="w-full h-12" asChild>
              <Link href="/login">Đăng Nhập</Link>
            </Button>
            <Button variant="outline" className="w-full h-12" asChild>
              <Link href="/register">Đăng Ký Tài Khoản</Link>
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="bg-background min-h-full pb-6">
        <div className="pt-12 pb-6 px-6 bg-card border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {user.role === 'ADMIN' ? 'Quản Trị Viên' : user.role === 'GDV' ? 'Giao Dịch Viên' : 'Thành Viên'}
              </Badge>
            </div>
          </div>
          
          {user.role === 'ADMIN' && (
            <Button variant="outline" className="w-full mt-4 border-primary/20 text-primary" asChild>
              <Link href="/admin">Vào Trang Quản Trị</Link>
            </Button>
          )}
        </div>

        <div className="p-4">
          <Tabs defaultValue="reports">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="reports">Tố Cáo Của Tôi</TabsTrigger>
              <TabsTrigger value="market">Tin Đăng Chợ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reports" className="space-y-3">
              {reportsLoading ? (
                <div className="text-center py-4">Đang tải...</div>
              ) : reports?.length ? (
                reports.map(report => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{report.scammerName}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{report.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm">Bạn chưa gửi báo cáo nào.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="market" className="space-y-3">
              {itemsLoading ? (
                <div className="text-center py-4">Đang tải...</div>
              ) : marketItems?.length ? (
                marketItems.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-md shrink-0 flex items-center justify-center">
                         {item.images?.[0] ? (
                           <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                         ) : <ShoppingBag className="w-6 h-6 opacity-20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1 flex-1">{item.title}</h3>
                        </div>
                        <div className="text-primary font-bold text-sm mb-1">{item.price.toLocaleString()}đ</div>
                        <div className="flex justify-between items-center text-xs">
                          <Badge variant="outline" className="text-[10px] py-0">{item.gameType}</Badge>
                          <span className={item.status === 'AVAILABLE' ? 'text-green-500' : 'text-muted-foreground'}>
                            {item.status === 'AVAILABLE' ? 'Đang bán' : 'Đã bán'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground text-sm">Bạn chưa có tin đăng nào.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button 
            variant="destructive" 
            className="w-full mt-8" 
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng Xuất
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
