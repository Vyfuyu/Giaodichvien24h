import { useState, useRef } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/lib/auth";
import {
  useGetMyReports, getGetMyReportsQueryKey,
  useGetMyMarketItems, getGetMyMarketItemsQueryKey,
  useLogout, setAuthTokenGetter,
  useUpdateProfile,
  getGetMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut, User as UserIcon, ShieldAlert, ShoppingBag,
  Clock, CheckCircle2, XCircle, Camera, Pencil, Check, X,
  Shield, AlertTriangle, Star,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10"><Clock className="w-3 h-3 mr-1" /> Đang duyệt</Badge>;
    case "APPROVED":
      return <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10"><CheckCircle2 className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
    case "REJECTED":
      return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getMarketStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <span className="text-yellow-500 text-xs">Chờ duyệt</span>;
    case "AVAILABLE":
      return <span className="text-green-500 text-xs">Đang bán</span>;
    case "SOLD":
      return <span className="text-muted-foreground text-xs">Đã bán</span>;
    case "REJECTED":
      return <span className="text-destructive text-xs">Bị từ chối</span>;
    default:
      return <span className="text-xs">{status}</span>;
  }
}

function getUserBadge(badge: string) {
  switch (badge) {
    case "TRUSTED_GDV":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Star className="w-3 h-3 mr-1" />GDV Uy Tín</Badge>;
    case "TRUSTED_SELLER":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="w-3 h-3 mr-1" />Người Bán Uy Tín</Badge>;
    default:
      return null;
  }
}

function getAccountStatusBadge(status: string) {
  if (status === "SCAM") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Scam</Badge>;
  if (status === "TRUSTED") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Shield className="w-3 h-3 mr-1" />Uy Tín</Badge>;
  return null;
}

export default function Account() {
  const { user } = useAuth();
  const logout = useLogout();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: reports, isLoading: reportsLoading } = useGetMyReports({
    query: { enabled: !!user, queryKey: getGetMyReportsQueryKey() },
  });

  const { data: marketItems, isLoading: itemsLoading } = useGetMyMarketItems({
    query: { enabled: !!user, queryKey: getGetMyMarketItemsQueryKey() },
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

  const handleStartEditName = () => {
    setNameInput(user?.name ?? "");
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (!nameInput.trim() || nameInput === user?.name) {
      setEditingName(false);
      return;
    }
    updateProfile.mutate({ data: { name: nameInput.trim() } }, {
      onSuccess: () => {
        toast({ title: "Đã cập nhật tên" });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEditingName(false);
      },
      onError: () => toast({ title: "Lỗi cập nhật tên", variant: "destructive" }),
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Ảnh quá lớn (tối đa 5MB)", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX = 300;
            let { width, height } = img;
            if (width > height) {
              if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
            } else {
              if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("canvas error")); return; }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.75));
          };
          img.onerror = reject;
          img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      updateProfile.mutate({ data: { avatar: base64 } }, {
        onSuccess: () => {
          toast({ title: "Đã cập nhật ảnh đại diện" });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: () => toast({ title: "Lỗi lưu ảnh đại diện", variant: "destructive" }),
      });
    } catch (err) {
      toast({ title: "Upload thất bại", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <UserIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Chưa đăng nhập</h2>
          <p className="text-muted-foreground mb-8">Đăng nhập để quản lý tài khoản của bạn.</p>
          <div className="w-full space-y-3">
            <Button className="w-full h-12" asChild><Link href="/login">Đăng Nhập</Link></Button>
            <Button variant="outline" className="w-full h-12" asChild><Link href="/register">Đăng Ký</Link></Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="bg-background min-h-full pb-8">
        <div className="pt-10 pb-6 px-6 bg-card border-b border-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary/20">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary/80 transition-colors"
              >
                {uploadingAvatar ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <Input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="h-8 text-sm font-bold"
                    onKeyDown={e => e.key === "Enter" && handleSaveName()}
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-green-500 hover:text-green-400">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold truncate">{user.name}</h1>
                  <button onClick={handleStartEditName} className="text-muted-foreground hover:text-primary shrink-0">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-1">{user.email}</p>
              {user.uid && (
                <p className="text-xs text-muted-foreground font-mono mb-2">UID: {user.uid}</p>
              )}
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                  {user.role === "ADMIN" ? "Quản Trị Viên" : user.role === "GDV" ? "Giao Dịch Viên" : "Thành Viên"}
                </Badge>
                {getAccountStatusBadge(user.status ?? "NORMAL")}
                {getUserBadge(user.badge ?? "NONE")}
              </div>
            </div>
          </div>

          {user.role === "ADMIN" && (
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
                <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
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
                        {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm")}
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
                <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
              ) : marketItems?.length ? (
                marketItems.map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4 flex gap-3">
                      <div className="w-14 h-14 bg-muted rounded-md shrink-0 flex items-center justify-center">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover rounded-md" />
                        ) : <ShoppingBag className="w-5 h-5 opacity-20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-sm line-clamp-1 flex-1">{item.title}</h3>
                        </div>
                        <div className="text-primary font-bold text-sm mb-1">{item.price.toLocaleString()}đ</div>
                        <div className="flex justify-between items-center text-xs">
                          <Badge variant="outline" className="text-[10px] py-0">{item.gameType}</Badge>
                          {getMarketStatusBadge(item.status)}
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
