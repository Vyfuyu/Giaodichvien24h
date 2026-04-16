import { useState } from "react";
import {
  useAdminListReports,
  useApproveReport,
  useRejectReport,
  useAdminDeleteReport,
  getGetAdminDashboardQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, FileText, CreditCard, Link as LinkIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Chờ duyệt</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Đã duyệt</Badge>;
    case "REJECTED":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Từ chối</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reports, isLoading } = useAdminListReports(
    statusFilter !== "ALL" ? { status: statusFilter } : {}
  );
  const approveReport = useApproveReport();
  const rejectReport = useRejectReport();
  const deleteReport = useAdminDeleteReport();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    queryClient.invalidateQueries({ queryKey: getGetAdminDashboardQueryKey() });
  };

  const handleApprove = (id: number) => {
    approveReport.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã duyệt báo cáo" }); invalidate(); },
      onError: () => toast({ title: "Lỗi duyệt báo cáo", variant: "destructive" }),
    });
  };

  const handleReject = (id: number) => {
    rejectReport.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã từ chối báo cáo" }); invalidate(); },
      onError: () => toast({ title: "Lỗi từ chối báo cáo", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Xóa vĩnh viễn báo cáo về "${name}"? Hành động này không thể hoàn tác.`)) return;
    deleteReport.mutate({ id }, {
      onSuccess: () => { toast({ title: "Đã xóa báo cáo" }); invalidate(); },
      onError: () => toast({ title: "Lỗi xóa báo cáo", variant: "destructive" }),
    });
  };

  const pendingCount = reports?.filter(r => r.status === "PENDING").length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Báo Cáo Tố Cáo</h1>
            <p className="text-muted-foreground text-sm">Kiểm tra và duyệt các tố cáo lừa đảo từ người dùng.</p>
          </div>
          {pendingCount > 0 && statusFilter !== "PENDING" && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm px-3 py-1">
              {pendingCount} đang chờ duyệt
            </Badge>
          )}
        </div>

        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="PENDING">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="APPROVED">Đã duyệt</TabsTrigger>
            <TabsTrigger value="REJECTED">Từ chối</TabsTrigger>
            <TabsTrigger value="ALL">Tất cả</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
        ) : reports?.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map(report => (
              <Card key={report.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight">{report.scammerName}</CardTitle>
                    {getStatusBadge(report.status)}
                  </div>
                  <CardDescription>
                    Gửi bởi: {report.reporterName || "Ẩn danh"} • {format(new Date(report.createdAt), "dd/MM/yyyy HH:mm")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-md">
                    {report.scammerPhone && (
                      <div className="col-span-2"><strong>SĐT:</strong> {report.scammerPhone}</div>
                    )}
                    {report.scammerBankNumber && (
                      <div className="col-span-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-muted-foreground" />
                        <strong>STK:</strong> {report.scammerBankNumber} ({report.scammerBankName})
                      </div>
                    )}
                    {report.scammerSocialLink && (
                      <div className="col-span-2 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-muted-foreground" />
                        <a href={report.scammerSocialLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline line-clamp-1">
                          {report.scammerSocialLink}
                        </a>
                      </div>
                    )}
                    {report.amountLost && (
                      <div className="col-span-2 text-destructive">
                        <strong>Thiệt hại:</strong> {report.amountLost.toLocaleString()} VNĐ
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3" /> Nội dung sự việc:
                    </h4>
                    <p className="text-sm text-muted-foreground bg-card border border-border p-3 rounded-md whitespace-pre-wrap line-clamp-4">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4 mt-auto border-t border-border">
                    {report.status === "PENDING" && (
                      <>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                          onClick={() => handleApprove(report.id)}
                          disabled={approveReport.isPending || rejectReport.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                          onClick={() => handleReject(report.id)}
                          disabled={approveReport.isPending || rejectReport.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Từ chối
                        </Button>
                      </>
                    )}
                    {report.status === "REJECTED" && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                        onClick={() => handleApprove(report.id)}
                        disabled={approveReport.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Duyệt lại
                      </Button>
                    )}
                    {report.status === "APPROVED" && (
                      <Button
                        variant="outline"
                        className="flex-1 text-orange-400 border-orange-500/30"
                        size="sm"
                        onClick={() => handleReject(report.id)}
                        disabled={rejectReport.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Thu hồi duyệt
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(report.id, report.scammerName)}
                      disabled={deleteReport.isPending}
                      title="Xóa báo cáo"
                    >
                      <Trash2 className="w-4 h-4" />
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
              <p>Không có báo cáo nào{statusFilter !== "ALL" ? ` ở trạng thái này` : ""}.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
