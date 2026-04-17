import { useListMiddlemen, useAdminRemoveGdv } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { Users, ShieldCheck, Star, UserPlus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Middlemen() {
  const { data: middlemen, isLoading } = useListMiddlemen();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [, navigate] = useLocation();

  const removeGdv = useAdminRemoveGdv();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRemove = (e: React.MouseEvent, profileId: number, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Thu hồi quyền GDV của "${name}"? Hồ sơ GDV sẽ bị xóa.`)) return;
    removeGdv.mutate({ id: profileId }, {
      onSuccess: () => {
        toast({ title: `Đã thu hồi GDV: ${name}` });
        queryClient.invalidateQueries({ queryKey: ["/api/middlemen"] });
      },
      onError: () => toast({ title: "Lỗi thu hồi GDV", variant: "destructive" }),
    });
  };

  return (
    <MobileLayout>
      <div className="bg-background min-h-full pb-6">
        <div className="pt-12 pb-6 px-6 bg-gradient-to-b from-primary/10 to-transparent border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Trung Gian Uy Tín</h1>
            </div>
            {isAdmin && (
              <Button size="sm" onClick={() => navigate("/admin/gdv")}>
                <UserPlus className="w-4 h-4 mr-1" />
                Thêm GDV
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Danh sách Giao Dịch Viên đã được xác thực và đóng bảo hiểm.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 flex gap-4 items-center">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : middlemen?.length ? (
            middlemen.map((gdv) => (
              <Link key={gdv.id} href={`/middlemen/${gdv.id}`}>
                <Card className="hover:border-primary/50 transition-colors bg-card border-border cursor-pointer">
                  <CardContent className="p-4 flex gap-4 items-center">
                    <Avatar className="w-16 h-16 border-2 border-primary/20 shrink-0">
                      <AvatarImage src={(gdv as any).avatar || gdv.userAvatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {gdv.realName?.charAt(0) || "G"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-base truncate flex items-center gap-1">
                          {gdv.realName}
                          {gdv.verificationBadge && (
                            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            {gdv.successRate}%
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={(e) => handleRemove(e, gdv.id, gdv.realName)}
                              disabled={removeGdv.isPending}
                              title="Thu hồi GDV"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Quỹ bảo hiểm:{" "}
                        <span className="font-semibold text-primary">
                          {(gdv.insuranceFund / 1000000).toFixed(1)}M VNĐ
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {gdv.servicesOffered.slice(0, 2).map(srv => (
                          <Badge key={srv} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {srv}
                          </Badge>
                        ))}
                        {gdv.servicesOffered.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{gdv.servicesOffered.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Chưa có trung gian nào.</p>
              {isAdmin && (
                <Button size="sm" className="mt-3" onClick={() => navigate("/admin/gdv")}>
                  <UserPlus className="w-4 h-4 mr-1" /> Thêm GDV đầu tiên
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
