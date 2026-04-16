import { useParams, Link } from "wouter";
import { useGetMiddleman, getGetMiddlemanQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, Facebook, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MiddlemanProfile() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id || "0", 10);
  
  const { data: gdv, isLoading } = useGetMiddleman(userId, {
    query: {
      enabled: !!userId,
      queryKey: getGetMiddlemanQueryKey(userId),
    }
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  if (!gdv) {
    return (
      <MobileLayout>
        <div className="p-6 text-center">
          <p>Không tìm thấy Giao Dịch Viên</p>
          <Button asChild className="mt-4">
            <Link href="/middlemen">Quay lại danh sách</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center p-4 border-b border-border">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/middlemen"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-semibold text-lg flex-1 truncate">Hồ sơ GDV</h1>
        </div>

        <div className="bg-card border-b border-border relative overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5"></div>
          <div className="px-6 pb-6 relative">
            <Avatar className="w-24 h-24 border-4 border-background absolute -top-12 shadow-lg">
              <AvatarImage src={gdv.userAvatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-3xl">
                {gdv.realName?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            
            <div className="mt-14">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {gdv.realName}
                {gdv.verificationBadge && (
                  <ShieldCheck className="w-6 h-6 text-primary" />
                )}
              </h2>
              <p className="text-muted-foreground">@{gdv.userName}</p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                Quỹ bảo hiểm: {(gdv.insuranceFund / 1000000).toFixed(1)}M VNĐ
              </Badge>
              <Badge variant="outline" className="border-primary/20">
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> 
                Tỉ lệ thành công: {gdv.successRate}%
              </Badge>
              <Badge variant="outline" className="border-primary/20">
                {gdv.totalTransactions} Giao dịch
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Dịch vụ cung cấp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {gdv.servicesOffered.map((srv) => (
                  <Badge key={srv} variant="secondary">{srv}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Liên hệ công việc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gdv.facebookLink && (
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href={gdv.facebookLink} target="_blank" rel="noreferrer">
                    <Facebook className="w-5 h-5 mr-3 text-blue-500" /> Facebook Cá Nhân
                  </a>
                </Button>
              )}
              {gdv.zaloLink && (
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href={gdv.zaloLink} target="_blank" rel="noreferrer">
                    <MessageCircle className="w-5 h-5 mr-3 text-blue-400" /> Zalo
                  </a>
                </Button>
              )}
              {gdv.telegramLink && (
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                  <a href={gdv.telegramLink} target="_blank" rel="noreferrer">
                    <Send className="w-5 h-5 mr-3 text-sky-500" /> Telegram
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="bg-destructive/10 rounded-xl p-4 flex items-start gap-3 border border-destructive/20">
            <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-destructive mb-1">Cảnh báo giả mạo</p>
              <p className="text-muted-foreground">Luôn kiểm tra kỹ link Facebook, Zalo, Telegram. Cẩn thận các tài khoản giả mạo (fake link, fake avatar).</p>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
