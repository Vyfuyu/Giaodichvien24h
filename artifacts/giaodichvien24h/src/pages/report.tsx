import { MobileLayout } from "@/components/layout/MobileLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { useCreateScamReport } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const bankScamSchema = z.object({
  scammerName: z.string().min(2, "Tên người lừa đảo quá ngắn"),
  scammerPhone: z.string().optional(),
  scammerBankNumber: z.string().min(5, "Số tài khoản không hợp lệ"),
  scammerBankName: z.string().min(2, "Tên ngân hàng quá ngắn"),
  amountLost: z.coerce.number().min(10000, "Số tiền lừa đảo quá nhỏ"),
  description: z.string().min(20, "Mô tả chi tiết quá ngắn (tối thiểu 20 ký tự)"),
});

const socialScamSchema = z.object({
  scammerName: z.string().min(2, "Tên người lừa đảo quá ngắn"),
  scammerPhone: z.string().optional(),
  scammerSocialLink: z.string().url("Link mạng xã hội không hợp lệ"),
  amountLost: z.coerce.number().optional(),
  description: z.string().min(20, "Mô tả chi tiết quá ngắn (tối thiểu 20 ký tự)"),
});

export default function Report() {
  const createReport = useCreateScamReport();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const bankForm = useForm<z.infer<typeof bankScamSchema>>({
    resolver: zodResolver(bankScamSchema),
    defaultValues: {
      scammerName: "",
      scammerPhone: "",
      scammerBankNumber: "",
      scammerBankName: "",
      amountLost: undefined,
      description: "",
    },
  });

  const socialForm = useForm<z.infer<typeof socialScamSchema>>({
    resolver: zodResolver(socialScamSchema),
    defaultValues: {
      scammerName: "",
      scammerPhone: "",
      scammerSocialLink: "",
      amountLost: undefined,
      description: "",
    },
  });

  const onSubmitBank = (data: z.infer<typeof bankScamSchema>) => {
    createReport.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Đã gửi báo cáo", description: "Báo cáo của bạn đang được duyệt." });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Lỗi", description: "Có lỗi xảy ra khi gửi báo cáo", variant: "destructive" });
      }
    });
  };

  const onSubmitSocial = (data: z.infer<typeof socialScamSchema>) => {
    createReport.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Đã gửi báo cáo", description: "Báo cáo của bạn đang được duyệt." });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Lỗi", description: "Có lỗi xảy ra khi gửi báo cáo", variant: "destructive" });
      }
    });
  };

  return (
    <MobileLayout>
      <div className="bg-background min-h-full pb-8">
        <div className="pt-12 pb-6 px-6 bg-gradient-to-b from-destructive/10 to-transparent border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-8 h-8 text-destructive" />
            <h1 className="text-2xl font-bold tracking-tight">Gửi Tố Cáo</h1>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Chung tay xây dựng cộng đồng trong sạch bằng cách báo cáo các trường hợp lừa đảo.
          </p>
        </div>

        <div className="p-4">
          <Tabs defaultValue="bank" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="bank">Ngân Hàng</TabsTrigger>
              <TabsTrigger value="social">Mạng Xã Hội</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bank">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tố cáo qua Ngân hàng</CardTitle>
                  <CardDescription>Cung cấp chính xác STK ngân hàng lừa đảo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...bankForm}>
                    <form onSubmit={bankForm.handleSubmit(onSubmitBank)} className="space-y-4">
                      <FormField
                        control={bankForm.control}
                        name="scammerBankNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số tài khoản lừa đảo <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="VD: 1903..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="scammerBankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên ngân hàng <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="VD: Techcombank, MB Bank..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="scammerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên chủ tài khoản <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Nhập chính xác tên in trên thẻ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="scammerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại (nếu có)</FormLabel>
                            <FormControl>
                              <Input placeholder="SĐT lừa đảo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="amountLost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số tiền bị lừa (VNĐ) <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="500000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả sự việc <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Textarea placeholder="Trình bày rõ sự việc lừa đảo diễn ra như thế nào..." className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="bg-muted p-3 rounded-lg flex items-start gap-2 text-sm text-muted-foreground mt-6">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Thông tin của bạn sẽ được giấu kín. Quản trị viên sẽ kiểm duyệt trước khi hiển thị công khai.</p>
                      </div>

                      <Button type="submit" className="w-full mt-4" disabled={createReport.isPending}>
                        {createReport.isPending ? "Đang gửi..." : "Gửi Tố Cáo"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tố cáo qua Mạng Xã Hội</CardTitle>
                  <CardDescription>Báo cáo Facebook, Zalo, Telegram lừa đảo</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...socialForm}>
                    <form onSubmit={socialForm.handleSubmit(onSubmitSocial)} className="space-y-4">
                      <FormField
                        control={socialForm.control}
                        name="scammerSocialLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link MXH lừa đảo <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="https://facebook.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="scammerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên hiển thị <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Tên nick Facebook/Zalo..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="scammerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại (nếu có)</FormLabel>
                            <FormControl>
                              <Input placeholder="SĐT đăng ký MXH" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="amountLost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số tiền bị lừa (VNĐ) (Nếu có)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={socialForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả sự việc <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Textarea placeholder="Hình thức lừa đảo: scam nick, scam tiền, mạo danh GDV..." className="min-h-[100px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-muted p-3 rounded-lg flex items-start gap-2 text-sm text-muted-foreground mt-6">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Hãy đảm bảo link Facebook chính xác là link cá nhân (ID), không nhập tên giả.</p>
                      </div>

                      <Button type="submit" className="w-full mt-4" disabled={createReport.isPending}>
                        {createReport.isPending ? "Đang gửi..." : "Gửi Tố Cáo"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
}
