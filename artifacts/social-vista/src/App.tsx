import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { setAuthTokenGetter, ApiError } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import AdminLogin from "@/pages/admin/Login";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminServices from "@/pages/admin/ServicesAdmin";
import AdminContent from "@/pages/admin/ContentAdmin";
import AdminContacts from "@/pages/admin/ContactsAdmin";
import AdminLeads from "@/pages/admin/LeadsAdmin";
import AdminEmail from "@/pages/admin/EmailComposerPage";
import AdminTasks from "@/pages/admin/TasksAdmin";
import AdminStaff from "@/pages/admin/StaffAdmin";
import AdminRoles from "@/pages/admin/RolesAdmin";
import AdminTheme from "@/pages/admin/ThemeAdmin";
import AdminSEO from "@/pages/admin/SEOAdmin";
import AdminBlog from "@/pages/admin/BlogAdmin";
import AIChatWidget from "@/components/AIChatWidget";
import ThemeApplier from "@/components/ThemeApplier";
import CustomMetaInjector from "@/components/CustomMetaInjector";
import { getToken, clearAuth, isAuthenticated, isOwner } from "@/lib/admin-auth";

// Attach the stored bearer token to every API request.
setAuthTokenGetter(() => getToken());

function handleAuthError(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 401 &&
    getToken() &&
    !window.location.pathname.endsWith("/admin/login")
  ) {
    clearAuth();
    window.location.assign(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/admin/login`);
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Redirect to="/admin/login" />;
  }
  return <>{children}</>;
}

function OwnerGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Redirect to="/admin/login" />;
  }
  if (!isOwner()) {
    return <Redirect to="/admin" />;
  }
  return <>{children}</>;
}

function Router() {
  return (
    <>
      <ThemeApplier />
      <CustomMetaInjector />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/services" component={Services} />
        <Route path="/services/:slug" component={ServiceDetail} />
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/faq" component={FAQ} />
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
        <Route path="/admin/leads">
          <AdminGuard><AdminLeads /></AdminGuard>
        </Route>
        <Route path="/admin/email">
          <AdminGuard><AdminEmail /></AdminGuard>
        </Route>
        <Route path="/admin/tasks">
          <AdminGuard><AdminTasks /></AdminGuard>
        </Route>
        <Route path="/admin/staff">
          <OwnerGuard><AdminStaff /></OwnerGuard>
        </Route>
        <Route path="/admin/roles">
          <OwnerGuard><AdminRoles /></OwnerGuard>
        </Route>
        <Route path="/admin/theme">
          <AdminGuard><AdminTheme /></AdminGuard>
        </Route>
        <Route path="/admin/seo">
          <AdminGuard><AdminSEO /></AdminGuard>
        </Route>
        <Route path="/admin/blog">
          <AdminGuard><AdminBlog /></AdminGuard>
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
