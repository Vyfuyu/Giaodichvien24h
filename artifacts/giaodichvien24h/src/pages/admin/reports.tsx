import { useAdminListReports, useApproveReport, useRejectReport, getGetAdminDashboardQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileText, CreditCard, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export default function AdminReports() {
  const { data: reports, isLoading } = useAdminListReports({ status: "PENDING" });
  const approveReport = useApproveReport();
  const rejectReport = useRejectReport();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApprove = (id: number) => {
    approveReport.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Đã duyệt báo cáo" });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectReport.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Đã từ chối báo cáo" });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
        queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Duyệt Báo Cáo Tố Cáo</h1>
          <p className="text-muted-foreground">Kiểm tra và duyệt các tố cáo lừa đảo từ người dùng.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : reports?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map(report => (
              <Card key={report.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{report.scammerName}</CardTitle>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Chờ duyệt</Badge>
                  </div>
                  <CardDescription>Gửi bởi: {report.reporterName || 'Ẩn danh'} • {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-md">
                    {report.scammerPhone && (
                      <div className="col-span-2"><strong>SĐT:</strong> {report.scammerPhone}</div>
                    )}
                    {report.scammerBankNumber && (
                      <div className="col-span-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-muted-foreground"/> 
                        <strong>STK:</strong> {report.scammerBankNumber} ({report.scammerBankName})
                      </div>
                    )}
                    {report.scammerSocialLink && (
                      <div className="col-span-2 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-muted-foreground"/>
                        <a href={report.scammerSocialLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline line-clamp-1">{report.scammerSocialLink}</a>
                      </div>
                    )}
                    {report.amountLost && (
                      <div className="col-span-2 text-destructive"><strong>Thiệt hại:</strong> {report.amountLost.toLocaleString()} VNĐ</div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1 mb-1"><FileText className="w-3 h-3"/> Nội dung sự việc:</h4>
                    <p className="text-sm text-muted-foreground bg-card border border-border p-3 rounded-md whitespace-pre-wrap">{report.description}</p>
                  </div>
                  
                  <div className="flex gap-2 pt-4 mt-auto border-t border-border">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                      onClick={() => handleApprove(report.id)}
                      disabled={approveReport.isPending || rejectReport.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Duyệt
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => handleReject(report.id)}
                      disabled={approveReport.isPending || rejectReport.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Từ chối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mb-2 opacity-50" />
              <p>Không có báo cáo nào đang chờ duyệt.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
