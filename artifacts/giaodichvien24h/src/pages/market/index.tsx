import { useListMarketItems } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ShoppingBag, Gamepad2, ChevronRight, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function Market() {
  const { data, isLoading } = useListMarketItems();
  const { user } = useAuth();

  return (
    <MobileLayout>
      <div className="bg-background min-h-full">
        <div className="pt-12 pb-6 px-6 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Chợ Giao Dịch</h1>
            </div>
            {user && (
              <Button size="sm" asChild>
                <Link href="/market/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Đăng bán
                </Link>
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Mua bán tài khoản, vật phẩm game an toàn qua Trung Gian.
          </p>
        </div>

        <div className="px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))
            ) : data?.items?.length ? (
              data.items.map((item) => (
                <Link key={item.id} href={`/market/${item.id}`}>
                  <Card className="overflow-hidden h-full flex flex-col hover:border-primary/50 transition-colors bg-card border-border cursor-pointer">
                    <div className="relative aspect-square bg-muted">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Gamepad2 className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur text-xs">
                          {item.gameType}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3 flex flex-col flex-1">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 flex-1">{item.title}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-bold text-primary">{item.price.toLocaleString()}đ</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Chưa có sản phẩm nào.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
