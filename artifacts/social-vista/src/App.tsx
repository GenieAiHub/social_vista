import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminServices from "@/pages/admin/ServicesAdmin";
import AdminContent from "@/pages/admin/ContentAdmin";
import AdminContacts from "@/pages/admin/ContactsAdmin";
import AIChatWidget from "@/components/AIChatWidget";

const queryClient = new QueryClient();

function isAdminAuthenticated() {
  return !!localStorage.getItem("sv_admin_token");
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Redirect to="/admin/login" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin">
          <AdminGuard><AdminDashboard /></AdminGuard>
        </Route>
        <Route path="/admin/services">
          <AdminGuard><AdminServices /></AdminGuard>
        </Route>
        <Route path="/admin/content">
          <AdminGuard><AdminContent /></AdminGuard>
        </Route>
        <Route path="/admin/contacts">
          <AdminGuard><AdminContacts /></AdminGuard>
        </Route>
        <Route component={NotFound} />
      </Switch>
      <AIChatWidget />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
