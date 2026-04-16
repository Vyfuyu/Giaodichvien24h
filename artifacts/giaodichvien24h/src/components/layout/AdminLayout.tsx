import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShieldAlert, Store, Users, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = useLogout();

  const navItems = [
    { icon: LayoutDashboard, label: "Tổng Quan", href: "/admin" },
    { icon: ShieldAlert, label: "Tố Cáo", href: "/admin/reports" },
    { icon: Store, label: "Chợ Giao Dịch", href: "/admin/market" },
    { icon: UserCheck, label: "Giao Dịch Viên", href: "/admin/gdv" },
    { icon: Users, label: "Người Dùng", href: "/admin/users" },
  ];

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="text-lg font-bold text-primary flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            GDV24h Admin
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">Admin</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur md:hidden">
          <Link href="/admin" className="text-lg font-bold text-primary flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            GDV24h
          </Link>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-md transition-colors ${
                  location === item.href || (item.href !== "/admin" && location.startsWith(item.href))
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                }`}
                title={item.label}
              >
                <item.icon className="w-4 h-4" />
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
