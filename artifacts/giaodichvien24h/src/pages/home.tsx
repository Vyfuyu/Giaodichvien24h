import { useState } from "react";
import { useGetStats, useListScamReports, getListScamReportsQueryKey } from "@workspace/api-client-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldAlert, AlertTriangle, Activity, TrendingUp, CreditCard } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { data: stats, isLoading: statsLoading } = useGetStats();
  
  // Add a small delay for search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const { data: searchResults, isLoading: searchLoading } = useListScamReports(
    { search: debouncedSearch },
    { query: { enabled: !!debouncedSearch, queryKey: getListScamReportsQueryKey({ search: debouncedSearch }) } }
  );

  const reportsList = debouncedSearch ? searchResults?.reports : stats?.recentReports;

  return (
    <MobileLayout>
      <div className="bg-primary/5 pb-6">
        {/* Header Hero */}
        <div className="pt-12 pb-6 px-6 bg-gradient-to-b from-primary/20 to-transparent">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">GiaoDichVien<span className="text-primary">24h</span></h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Nền tảng kiểm tra lừa đảo và giao dịch an toàn cộng đồng game Việt Nam.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input 
              type="search" 
              placeholder="Nhập SĐT, STK ngân hàng..." 
              className="pl-10 h-14 bg-background shadow-lg text-base rounded-xl border-primary/20 focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button 
              type="submit" 
              className="absolute right-2 top-2 bottom-2 rounded-lg"
              size="sm"
            >
              Kiểm tra
            </Button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="px-4 grid grid-cols-2 gap-3 -mt-2">
          <Card className="bg-card border-none shadow-md overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-destructive/10 rounded-full blur-xl"></div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" /> Kẻ lừa đảo
                </span>
                {statsLoading ? (
                  <div className="h-8 bg-muted rounded animate-pulse w-16 mt-1"></div>
                ) : (
                  <span className="text-2xl font-bold text-foreground">
                    {stats?.totalScammers.toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-none shadow-md overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-primary" /> Thiệt hại (VNĐ)
                </span>
                {statsLoading ? (
                  <div className="h-8 bg-muted rounded animate-pulse w-24 mt-1"></div>
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {stats?.totalAmountLost ? (stats.totalAmountLost / 1000000).toFixed(1) + 'M' : '0'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="p-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-destructive" />
            {debouncedSearch ? "Kết quả tìm kiếm" : "Cảnh báo mới nhất"}
          </h2>
          {!debouncedSearch && (
            <Badge variant="secondary" className="text-xs font-normal">Cập nhật liên tục</Badge>
          )}
        </div>

        {searchLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-32"></Card>
            ))}
          </div>
        ) : reportsList && reportsList.length > 0 ? (
          <div className="space-y-3">
            {reportsList.map((report) => (
              <Card key={report.id} className="border-border shadow-sm overflow-hidden group">
                <div className="h-1 w-full bg-destructive"></div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base truncate pr-4">{report.scammerName}</h3>
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 rounded-md shrink-0">Lừa đảo</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-3">
                    {report.scammerPhone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0">
                          <Activity className="w-3 h-3" />
                        </div>
                        <span className="truncate">{report.scammerPhone}</span>
                      </div>
                    )}
                    {report.scammerBankNumber && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0">
                          <CreditCard className="w-3 h-3" />
                        </div>
                        <span className="truncate">{report.scammerBankNumber} - {report.scammerBankName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Bởi: {report.reporterName || "Ẩn danh"}
                    </span>
                    <span className="text-xs font-medium text-destructive">
                      -{report.amountLost?.toLocaleString()}đ
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
            <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              {debouncedSearch ? "Không tìm thấy thông tin lừa đảo nào khớp với từ khóa." : "Chưa có dữ liệu cảnh báo."}
            </p>
            {debouncedSearch && (
              <p className="text-xs text-primary mt-2">Tuy nhiên vẫn nên giao dịch qua Trung Gian!</p>
            )}
          </div>
        )}

        <div className="mt-8 mb-6">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-primary mb-1">Giao dịch an toàn?</h3>
                <p className="text-xs text-muted-foreground">Tìm trung gian uy tín có bảo hiểm.</p>
              </div>
              <Button asChild size="sm">
                <Link href="/middlemen">Tìm GDV</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
