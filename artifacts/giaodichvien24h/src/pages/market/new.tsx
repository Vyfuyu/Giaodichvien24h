import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCreateMarketItem } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";

const schema = z.object({
  title: z.string().min(5, "Tiêu đề quá ngắn"),
  gameType: z.string().min(2, "Vui lòng nhập tên game"),
  price: z.coerce.number().min(1000, "Giá phải từ 1,000đ trở lên"),
  description: z.string().min(10, "Mô tả chi tiết quá ngắn"),
});

export default function CreateMarketItem() {
  const createItem = useCreateMarketItem();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      gameType: "",
      price: undefined,
      description: "",
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createItem.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Đăng tin thành công!" });
        setLocation("/market");
      },
      onError: () => {
        toast({ title: "Lỗi", description: "Không thể đăng tin", variant: "destructive" });
      }
    });
  };

  return (
    <MobileLayout>
      <div className="bg-background min-h-full pb-8">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur flex items-center p-4 border-b border-border">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/market"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="font-semibold text-lg flex-1 truncate">Đăng Bán Sản Phẩm</h1>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Thông tin sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề tin đăng <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Bán acc VIP, bán vàng..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gameType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Game <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Liên Quân, Tốc Chiến, Genshin..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Giá bán (VNĐ) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chi tiết <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea placeholder="Chi tiết thông tin sản phẩm, tình trạng acc..." className="min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full mt-4" disabled={createItem.isPending}>
                    {createItem.isPending ? "Đang đăng..." : "Đăng Bán Ngay"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
