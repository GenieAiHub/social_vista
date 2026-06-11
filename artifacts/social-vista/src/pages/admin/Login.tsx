import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Zap, Lock } from "lucide-react";
import { useAdminLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const adminLogin = useAdminLogin();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  function onSubmit(values: LoginForm) {
    adminLogin.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          if (data.success) {
            localStorage.setItem("sv_admin_token", data.token);
            setLocation("/admin");
          } else {
            toast({ title: "Invalid credentials. Please try again.", variant: "destructive" });
          }
        },
        onError: () => {
          toast({ title: "Invalid credentials. Please try again.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden grid-bg">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center glow-primary mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif text-gradient">Social Vista</h1>
          <p className="text-muted-foreground text-sm mt-1">Admin Portal</p>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Sign In to Admin</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-foreground">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin"
                        {...field}
                        data-testid="input-admin-username"
                        className="bg-muted border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-foreground">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        data-testid="input-admin-password"
                        className="bg-muted border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold glow-primary"
                disabled={adminLogin.isPending}
                data-testid="button-admin-login"
              >
                {adminLogin.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-muted-foreground text-center mt-5">
            Default: <span className="text-primary font-mono">admin</span> / <span className="text-primary font-mono">socialvista2024</span>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{" "}
          <a href="https://gnx.co.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            GNX AI
          </a>
        </p>
      </div>
    </div>
  );
}
