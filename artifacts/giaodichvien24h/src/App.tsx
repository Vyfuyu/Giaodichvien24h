import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/lib/auth";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import Market from "@/pages/market/index";
import MarketDetail from "@/pages/market/[id]";
import CreateMarketItem from "@/pages/market/new";
import Report from "@/pages/report";
import Middlemen from "@/pages/middlemen/index";
import MiddlemanProfile from "@/pages/middlemen/[id]";
import Account from "@/pages/account";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminReports from "@/pages/admin/reports";
import AdminMarket from "@/pages/admin/market";
import AdminUsers from "@/pages/admin/users";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      <Route path="/market" component={Market} />
      <Route path="/market/new">
        <ProtectedRoute><CreateMarketItem /></ProtectedRoute>
      </Route>
      <Route path="/market/:id" component={MarketDetail} />
      <Route path="/report" component={Report} />
      <Route path="/middlemen" component={Middlemen} />
      <Route path="/middlemen/:id" component={MiddlemanProfile} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/account">
        <ProtectedRoute><Account /></ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>
      </Route>
      <Route path="/admin/market">
        <ProtectedRoute adminOnly><AdminMarket /></ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
