import { useState } from "react";
import { Plus, Pencil, Trash2, Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool, ToggleLeft, ToggleRight } from "lucide-react";
import { useListServices, useCreateService, useUpdateService, useDeleteService, getListServicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ElementType> = { Share2, Bot, MessageCircle, Video, Code2, Coins, Layers, PenTool };
const iconOptions = Object.keys(iconMap);
const categoryOptions = ["Social Media", "Automation", "Productivity", "Development", "Web3"];

const serviceSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  icon: z.string().min(1),
  category: z.string().min(1),
  sortOrder: z.coerce.number().optional(),
  active: z.boolean().optional(),
});
type ServiceForm = z.infer<typeof serviceSchema>;

type EditingService = { id: number; title: string; description: string; icon: string; category: string; sortOrder: number; active: boolean } | null;

export default function ServicesAdmin() {
  const { data: services, isLoading } = useListServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EditingService>(null);

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { title: "", description: "", icon: "Share2", category: "Social Media", sortOrder: 0, active: true },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ title: "", description: "", icon: "Share2", category: "Social Media", sortOrder: (services?.length ?? 0) + 1, active: true });
    setDialogOpen(true);
  }

  function openEdit(s: NonNullable<EditingService>) {
    setEditing(s);
    form.reset({ title: s.title, description: s.description, icon: s.icon, category: s.category, sortOrder: s.sortOrder, active: s.active });
    setDialogOpen(true);
  }

  function onSubmit(values: ServiceForm) {
    const refetch = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    if (editing) {
      updateService.mutate(
        { id: editing.id, data: values },
        { onSuccess: () => { refetch(); setDialogOpen(false); toast({ title: "Service updated." }); }, onError: () => toast({ title: "Failed to update.", variant: "destructive" }) }
      );
    } else {
      createService.mutate(
        { data: { ...values, sortOrder: values.sortOrder ?? 0, active: values.active ?? true } },
        { onSuccess: () => { refetch(); setDialogOpen(false); toast({ title: "Service created." }); }, onError: () => toast({ title: "Failed to create.", variant: "destructive" }) }
      );
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this service?")) return;
    deleteService.mutate(
      { id },
      { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() }); toast({ title: "Service deleted." }); }, onError: () => toast({ title: "Failed to delete.", variant: "destructive" }) }
    );
  }

  function handleToggleActive(s: { id: number; active: boolean }) {
    updateService.mutate(
      { id: s.id, data: { active: !s.active } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() }) }
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Services</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your service offerings.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={openCreate} data-testid="button-add-service">
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {services?.map((s) => {
              const Icon = iconMap[s.icon] ?? Share2;
              return (
                <div key={s.id} className={`bg-card rounded-xl border p-4 flex items-center gap-4 ${s.active ? "border-border" : "border-border/50 opacity-60"}`} data-testid={`row-service-${s.id}`}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{s.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>
                      {!s.active && <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`transition-colors ${s.active ? "text-green-400 hover:text-muted-foreground" : "text-muted-foreground hover:text-green-400"}`}
                      data-testid={`button-toggle-service-${s.id}`}
                      title={s.active ? "Deactivate" : "Activate"}
                    >
                      {s.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(s)} data-testid={`button-edit-service-${s.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:text-destructive" onClick={() => handleDelete(s.id)} data-testid={`button-delete-service-${s.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Edit Service" : "Add New Service"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Title</FormLabel>
                  <FormControl><Input {...field} className="bg-muted border-input" data-testid="input-service-title" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Description</FormLabel>
                  <FormControl><Textarea {...field} rows={3} className="bg-muted border-input resize-none" data-testid="input-service-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-muted border-input" data-testid="select-service-icon"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="bg-muted border-input" data-testid="select-service-category"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{categoryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="sortOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Sort Order</FormLabel>
                  <FormControl><Input type="number" {...field} className="bg-muted border-input" data-testid="input-service-sort-order" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={createService.isPending || updateService.isPending} data-testid="button-save-service">
                  {editing ? "Save Changes" : "Create Service"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
