import { useState } from "react";
import { ShieldCheck, Trash2, Plus, Pencil } from "lucide-react";
import {
  useListRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  getListRolesQueryKey,
  getListStaffQueryKey,
  ApiError,
  type Role,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const data = err.data;
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
  }
  return fallback;
}

interface PermState {
  canViewLeads: boolean;
  canCreateLeads: boolean;
  canEditLeads: boolean;
  canDeleteLeads: boolean;
  canAssignLeads: boolean;
  canEmailLeads: boolean;
  canManageSEO: boolean;
  canManageBlog: boolean;
}

const PERMISSIONS: { key: keyof PermState; label: string; description: string }[] = [
  { key: "canViewLeads", label: "View leads", description: "See the leads list and timelines." },
  { key: "canCreateLeads", label: "Create leads", description: "Add leads manually and import." },
  { key: "canEditLeads", label: "Edit leads", description: "Change status, notes, mark contacted." },
  { key: "canAssignLeads", label: "Assign leads", description: "Assign leads to team members." },
  { key: "canEmailLeads", label: "Email leads", description: "Send email replies to leads." },
  { key: "canDeleteLeads", label: "Delete leads", description: "Permanently remove leads." },
  { key: "canManageSEO", label: "Manage SEO", description: "Edit meta tags, keywords, and OG data for all pages." },
  { key: "canManageBlog", label: "Manage Blog", description: "Create, edit, and publish blog posts." },
];

const DEFAULT_PERMS: PermState = {
  canViewLeads: true,
  canCreateLeads: false,
  canEditLeads: false,
  canDeleteLeads: false,
  canAssignLeads: false,
  canEmailLeads: false,
  canManageSEO: false,
  canManageBlog: false,
};

function PermissionToggles({ value, onChange }: { value: PermState; onChange: (v: PermState) => void }) {
  return (
    <div className="space-y-2.5">
      {PERMISSIONS.map((p) => (
        <div key={p.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{p.label}</div>
            <div className="text-xs text-muted-foreground">{p.description}</div>
          </div>
          <Switch
            checked={value[p.key]}
            onCheckedChange={(checked) => onChange({ ...value, [p.key]: checked })}
            data-testid={`switch-perm-${p.key}`}
          />
        </div>
      ))}
    </div>
  );
}

function RoleDialog({
  trigger,
  title,
  initialName,
  initialPerms,
  pending,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  initialName: string;
  initialPerms: PermState;
  pending: boolean;
  onSubmit: (name: string, perms: PermState, close: () => void) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [perms, setPerms] = useState<PermState>(initialPerms);
  const { toast } = useToast();

  function reset() {
    setName(initialName);
    setPerms(initialPerms);
  }

  function submit() {
    if (!name.trim()) {
      toast({ title: "Role name is required.", variant: "destructive" });
      return;
    }
    onSubmit(name.trim(), perms, () => setOpen(false));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Name the role and choose what its members can do with leads.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales rep"
              className="mt-1"
              data-testid="input-role-name"
            />
          </div>
          <PermissionToggles value={perms} onChange={setPerms} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending} data-testid="button-submit-role">
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesAdmin() {
  const { data: roles, isLoading } = useListRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRolesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
  }

  function permsOf(role: Role): PermState {
    return {
      canViewLeads: role.canViewLeads,
      canCreateLeads: role.canCreateLeads,
      canEditLeads: role.canEditLeads,
      canDeleteLeads: role.canDeleteLeads,
      canAssignLeads: role.canAssignLeads,
      canEmailLeads: role.canEmailLeads,
      canManageSEO: role.canManageSEO ?? false,
      canManageBlog: role.canManageBlog ?? false,
    };
  }

  function handleCreate(name: string, perms: PermState, close: () => void) {
    createRole.mutate(
      { data: { name, ...perms } },
      {
        onSuccess: () => {
          toast({ title: "Role created." });
          close();
          invalidate();
        },
        onError: (err) => toast({ title: errorMessage(err, "Could not create role."), variant: "destructive" }),
      },
    );
  }

  function handleUpdate(role: Role, name: string, perms: PermState, close: () => void) {
    updateRole.mutate(
      { id: role.id, data: { name, ...perms } },
      {
        onSuccess: () => {
          toast({ title: "Role updated." });
          close();
          invalidate();
        },
        onError: (err) => toast({ title: errorMessage(err, "Could not update role."), variant: "destructive" }),
      },
    );
  }

  function remove(role: Role) {
    deleteRole.mutate(
      { id: role.id },
      {
        onSuccess: () => {
          toast({ title: "Role deleted. Members revert to view-only access." });
          invalidate();
        },
        onError: (err) => toast({ title: errorMessage(err, "Could not delete role."), variant: "destructive" }),
      },
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Roles &amp; Permissions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define what staff can do with leads, then assign roles on the Staff page. Owners always have full access.
            </p>
          </div>
          <RoleDialog
            trigger={
              <Button size="sm" data-testid="button-add-role">
                <Plus className="w-4 h-4 mr-1" /> New role
              </Button>
            }
            title="Create role"
            initialName=""
            initialPerms={DEFAULT_PERMS}
            pending={createRole.isPending}
            onSubmit={handleCreate}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-24" />
            ))}
          </div>
        ) : (roles?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No roles yet. Create one to grant staff lead permissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roles!.map((role) => {
              const granted = PERMISSIONS.filter((p) => permsOf(role)[p.key]);
              return (
                <div
                  key={role.id}
                  className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3"
                  data-testid={`card-role-${role.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground truncate">{role.name}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <RoleDialog
                        trigger={
                          <Button size="sm" variant="ghost" className="h-8 px-2" data-testid={`button-edit-role-${role.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        }
                        title={`Edit role — ${role.name}`}
                        initialName={role.name}
                        initialPerms={permsOf(role)}
                        pending={updateRole.isPending}
                        onSubmit={(name, perms, close) => handleUpdate(role, name, perms, close)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(role)}
                        disabled={deleteRole.isPending}
                        data-testid={`button-delete-role-${role.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {granted.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No permissions granted.</span>
                    ) : (
                      granted.map((p) => (
                        <span
                          key={p.key}
                          className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5"
                        >
                          {p.label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
