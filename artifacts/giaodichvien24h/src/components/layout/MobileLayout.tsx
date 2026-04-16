import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, ShieldAlert, Users, User, PlusCircle } from "lucide-react";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Trang Chủ", href: "/" },
    { icon: ShoppingBag, label: "Chợ", href: "/market" },
    { icon: ShieldAlert, label: "Tố Cáo", href: "/report", isFab: true },
    { icon: Users, label: "GDV", href: "/middlemen" },
    { icon: User, label: "Tài Khoản", href: "/account" },
  ];

  return (
    <div className="min-h-[100dvh] bg-neutral-950 flex justify-center">
      <div className="w-full max-w-md bg-background relative flex flex-col min-h-[100dvh] shadow-2xl border-x border-border">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 w-full max-w-md bg-background/90 backdrop-blur-md border-t border-border z-50 px-2 pb-safe">
          <div className="flex justify-between items-center h-16">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

              if (item.isFab) {
                return (
                  <Link key={item.href} href={item.href} className="relative -top-5 flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/25 active:scale-95 transition-transform">
                      <PlusCircle className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-medium mt-1 text-muted-foreground">{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-full gap-1 active:scale-95 transition-transform ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
