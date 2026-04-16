import { useParams, Link } from "wouter";
import { useGetMarketItem, getGetMarketItemQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, ShieldCheck, Gamepad2, Info } from "lucide-react";

export default function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id || "0", 10);
  
  const { data: item, isLoading } = useGetMarketItem(itemId, {
    query: {
      enabled: !!itemId,
      queryKey: getGetMarketItemQueryKey(itemId),
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

  if (!item) {
    return (
      <MobileLayout>
        <div className="p-6 text-center">
          <p>Không tìm thấy sản phẩm</p>
          <Button asChild className="mt-4">
            <Link href="/market">Quay lại chợ</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center p-4 border-b border-border">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/market"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-semibold text-lg flex-1 truncate">{item.title}</h1>
        </div>

        {/* Image Gallery */}
        <div className="aspect-video bg-muted relative">
          {item.images && item.images.length > 0 ? (
             <img 
               src={item.images[0]} 
               alt={item.title} 
               className="w-full h-full object-cover"
             />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
              <Gamepad2 className="w-12 h-12 opacity-20 mb-2" />
              <span className="text-sm opacity-50">Không có hình ảnh</span>
            </div>
          )}
          <div className="absolute top-4 right-4">
            <Badge className={item.status === 'AVAILABLE' ? 'bg-primary' : 'bg-muted text-muted-foreground'}>
              {item.status === 'AVAILABLE' ? 'Đang bán' : 'Đã bán'}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{item.gameType}</Badge>
            </div>
            <h2 className="text-xl font-bold mb-2">{item.title}</h2>
            <p className="text-2xl font-bold text-primary">{item.price.toLocaleString()} VNĐ</p>
          </div>

          <Card className="border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" /> Thông tin người bán
              </h3>
              <div className="flex items-center justify-between">
                <div className="font-medium">{item.sellerName || "Người dùng ẩn danh"}</div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/middlemen`}>Nhờ Trung Gian</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" /> Mô tả chi tiết
            </h3>
            <div className="bg-card rounded-xl p-4 border border-border text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {item.description}
            </div>
          </div>
          
          <div className="bg-primary/10 rounded-xl p-4 flex items-start gap-3 border border-primary/20">
            <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary mb-1">Giao dịch an toàn</p>
              <p className="text-muted-foreground">Luôn sử dụng Giao Dịch Viên trung gian để tránh bị lừa đảo. Không chuyển tiền trực tiếp cho người bán.</p>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action */}
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 bg-background border-t border-border z-20">
          <Button className="w-full h-12 text-lg" disabled={item.status !== 'AVAILABLE'} asChild={item.status === 'AVAILABLE'}>
            {item.status === 'AVAILABLE' ? (
              <Link href="/middlemen">Thuê Trung Gian Mua Ngay</Link>
            ) : (
              <span>Sản phẩm đã bán</span>
            )}
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
