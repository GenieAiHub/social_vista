import { useState } from "react";
import { format } from "date-fns";
import { UserCog, Trash2, KeyRound, Plus, ShieldCheck } from "lucide-react";
import {
  useListStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  useResetStaffPassword,
  getListStaffQueryKey,
  ApiError,
  type StaffMember,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getStoredUser } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) return "You don't have permission to do this. Sign in as an owner.";
    const data = err.data;
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
  }
  return fallback;
}

function CreateStaffDialog({ onCreated }: { onCreated: () => void }) {
  const createStaff = useCreateStaff();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "staff" });

  function submit() {
    if (!form.name || !form.username || !form.password) {
      toast({ title: "Name, username and password are required.", variant: "destructive" });
      return;
    }
    createStaff.mutate(
      {
        data: {
          name: form.name,
          username: form.username,
          email: form.email || undefined,
          password: form.password,
          role: form.role as "owner" | "staff",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Team member added." });
          setForm({ name: "", username: "", email: "", password: "", role: "staff" });
          setOpen(false);
          onCreated();
        },
        onError: (err) => toast({ title: errorMessage(err, "Could not add member. Username may already exist."), variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-staff"><Plus className="w-4 h-4 mr-1" /> Add member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="s-name">Full name</Label>
            <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-staff-name" />
          </div>
          <div>
            <Label htmlFor="s-username">Username</Label>
            <Input id="s-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} data-testid="input-staff-username" />
          </div>
          <div>
            <Label htmlFor="s-email">Email (optional)</Label>
            <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-staff-email" />
          </div>
          <div>
            <Label htmlFor="s-password">Temporary password</Label>
            <Input id="s-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="input-staff-password" />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1" data-testid="select-staff-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={createStaff.isPending} data-testid="button-submit-staff">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ member }: { member: StaffMember }) {
  const resetPassword = useResetStaffPassword();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  function submit() {
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    resetPassword.mutate(
      { id: member.id, data: { password } },
      {
        onSuccess: () => {
          toast({ title: `Password reset for ${member.name}.` });
          setPassword("");
          setOpen(false);
        },
        onError: (err) => toast({ title: errorMessage(err, "Could not reset password."), variant: "destructive" }),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" data-testid={`button-reset-${member.id}`}>
          <KeyRound className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset password — {member.name}</DialogTitle></DialogHeader>
        <div>
          <Label htmlFor="new-pw">New password</Label>
          <Input id="new-pw" value={password} onChange={(e) => setPassword(e.target.value)} data-testid={`input-newpw-${member.id}`} />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={resetPassword.isPending} data-testid={`button-submit-reset-${member.id}`}>Reset password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffAdmin() {
  const { data: staff, isLoading } = useListStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const currentUser = getStoredUser();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListStaffQueryKey() });
  }

  function toggleActive(member: StaffMember) {
    updateStaff.mutate({ id: member.id, data: { active: !member.active } }, { onSuccess: invalidate });
  }

  function changeRole(member: StaffMember, role: string) {
    updateStaff.mutate({ id: member.id, data: { role: role as "owner" | "staff" } }, { onSuccess: invalidate });
  }

  function remove(member: StaffMember) {
    if (member.id === currentUser?.id) {
      toast({ title: "You can't delete your own account.", variant: "destructive" });
      return;
    }
    deleteStaff.mutate({ id: member.id }, {
      onSuccess: invalidate,
      onError: (err) => toast({ title: errorMessage(err, "Could not delete member."), variant: "destructive" }),
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Staff</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage who can access the admin portal.</p>
          </div>
          <CreateStaffDialog onCreated={invalidate} />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-20" />
            ))}
          </div>
        ) : (staff?.length ?? 0) === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <UserCog className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No team members yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {staff!.map((member) => (
              <div key={member.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4 flex-wrap" data-testid={`card-staff-${member.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{member.name}</span>
                      {member.role === "owner" && (
                        <Badge variant="outline" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                          <ShieldCheck className="w-3 h-3 mr-0.5" /> Owner
                        </Badge>
                      )}
                      {member.id === currentUser?.id && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                      {!member.active && <Badge variant="secondary" className="text-[10px] text-muted-foreground">Inactive</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">@{member.username}{member.email ? ` · ${member.email}` : ""}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Joined {format(new Date(member.createdAt), "MMM d, yyyy")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Select value={member.role} onValueChange={(v) => changeRole(member, v)} disabled={member.id === currentUser?.id}>
                    <SelectTrigger className="h-8 w-[110px] text-xs" data-testid={`select-role-${member.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1.5" title="Active">
                    <Switch checked={member.active} onCheckedChange={() => toggleActive(member)} disabled={member.id === currentUser?.id} data-testid={`switch-active-${member.id}`} />
                  </div>
                  <ResetPasswordDialog member={member} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => remove(member)}
                    disabled={deleteStaff.isPending || member.id === currentUser?.id}
                    data-testid={`button-delete-staff-${member.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
