import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { ClipboardList, Plus, Trash2, Pencil, CalendarClock, User } from "lucide-react";
import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useListStaff,
  getListTasksQueryKey,
  type Task,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  in_progress: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  done: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  high: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

const STATUS_OPTIONS = ["todo", "in_progress", "done"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

const UNASSIGNED = "unassigned";

type StaffOption = { id: number; name: string };

interface TaskFormState {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string;
  dueDate: string;
}

function emptyForm(): TaskFormState {
  return { title: "", description: "", status: "todo", priority: "medium", assignedTo: UNASSIGNED, dueDate: "" };
}

function formFromTask(task: Task): TaskFormState {
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo != null ? String(task.assignedTo) : UNASSIGNED,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
  };
}

function TaskDialog({
  staff,
  task,
  trigger,
  onSaved,
}: {
  staff: StaffOption[];
  task?: Task;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>(task ? formFromTask(task) : emptyForm());
  const isEdit = Boolean(task);
  const pending = createTask.isPending || updateTask.isPending;

  function reset() {
    setForm(task ? formFromTask(task) : emptyForm());
  }

  function submit() {
    if (!form.title.trim()) {
      toast({ title: "A task title is required.", variant: "destructive" });
      return;
    }
    const description = form.description.trim();
    const common = {
      title: form.title.trim(),
      status: form.status as "todo" | "in_progress" | "done",
      priority: form.priority as "low" | "medium" | "high",
      assignedTo: form.assignedTo === UNASSIGNED ? null : Number(form.assignedTo),
      dueDate: form.dueDate || null,
    };
    const onSuccess = () => {
      toast({ title: isEdit ? "Task updated." : "Task created." });
      setOpen(false);
      onSaved();
    };
    const onError = () => toast({ title: "Could not save the task.", variant: "destructive" });
    if (isEdit && task) {
      updateTask.mutate({ id: task.id, data: { ...common, description: description || null } }, { onSuccess, onError });
    } else {
      createTask.mutate({ data: { ...common, description: description || undefined } }, {
        onSuccess: () => { reset(); onSuccess(); },
        onError,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-task-title" />
          </div>
          <div>
            <Label htmlFor="t-desc">Description (optional)</Label>
            <Textarea id="t-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-task-description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assign to</Label>
              <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                <SelectTrigger className="mt-1" data-testid="select-task-assignee"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="t-due">Due date</Label>
              <Input id="t-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} data-testid="input-task-due" />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger className="mt-1" data-testid="select-task-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1" data-testid="select-task-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending} data-testid="button-submit-task">{isEdit ? "Save changes" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function parseLocalDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function DueDate({ value }: { value: string }) {
  const date = parseLocalDate(value);
  const overdue = isPast(date) && !isToday(date);
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
      <CalendarClock className="w-3.5 h-3.5" />
      {isToday(date) ? "Today" : format(date, "MMM d, yyyy")}
    </span>
  );
}

export default function TasksAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const { data: tasks, isLoading } = useListTasks();
  const { data: staff } = useListStaff();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const staffOptions: StaffOption[] = (staff ?? [])
    .filter((s) => s.active)
    .map((s) => ({ id: s.id, name: s.name }));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
  }

  function changeStatus(task: Task, status: string) {
    updateTask.mutate(
      { id: task.id, data: { status: status as "todo" | "in_progress" | "done" } },
      { onSuccess: invalidate, onError: () => toast({ title: "Could not update status.", variant: "destructive" }) }
    );
  }

  function changeAssignee(task: Task, value: string) {
    updateTask.mutate(
      { id: task.id, data: { assignedTo: value === UNASSIGNED ? null : Number(value) } },
      { onSuccess: invalidate, onError: () => toast({ title: "Could not reassign task.", variant: "destructive" }) }
    );
  }

  function remove(task: Task) {
    deleteTask.mutate({ id: task.id }, {
      onSuccess: invalidate,
      onError: () => toast({ title: "Could not delete task.", variant: "destructive" }),
    });
  }

  const filtered = (tasks ?? []).filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (assigneeFilter === "unassigned" && t.assignedTo != null) return false;
    if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && String(t.assignedTo) !== assigneeFilter) return false;
    return true;
  });

  const counts = {
    all: tasks?.length ?? 0,
    todo: tasks?.filter((t) => t.status === "todo").length ?? 0,
    in_progress: tasks?.filter((t) => t.status === "in_progress").length ?? 0,
    done: tasks?.filter((t) => t.status === "done").length ?? 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Tasks</h1>
            <p className="text-muted-foreground text-sm mt-1">Create tasks and assign them to your team.</p>
          </div>
          <TaskDialog
            staff={staffOptions}
            onSaved={invalidate}
            trigger={<Button size="sm" data-testid="button-add-task"><Plus className="w-4 h-4 mr-1" /> New task</Button>}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            {(["all", ...STATUS_OPTIONS] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                data-testid={`filter-status-${s}`}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]} <span className="opacity-70">({counts[s]})</span>
              </button>
            ))}
          </div>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="h-9 w-[180px] text-xs" data-testid="filter-assignee"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {staffOptions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tasks here yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <div
                key={task.id}
                className={`bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-4 flex-wrap ${task.status === "done" ? "opacity-70" : ""}`}
                data-testid={`card-task-${task.id}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-foreground ${task.status === "done" ? "line-through" : ""}`}>{task.title}</span>
                    <Badge variant="outline" className={`text-[10px] capitalize ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.low}`}>{task.priority}</Badge>
                  </div>
                  {task.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{task.description}</p>}
                  <div className="flex items-center gap-3 flex-wrap mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      {task.assigneeName ?? "Unassigned"}
                    </span>
                    {task.dueDate && <DueDate value={task.dueDate} />}
                    {task.creatorName && <span className="text-[11px] text-muted-foreground">Created by {task.creatorName}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Select value={task.status} onValueChange={(v) => changeStatus(task, v)}>
                    <SelectTrigger className="h-8 w-[130px] text-xs" data-testid={`select-status-${task.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={task.assignedTo != null ? String(task.assignedTo) : UNASSIGNED} onValueChange={(v) => changeAssignee(task, v)}>
                    <SelectTrigger className="h-8 w-[130px] text-xs" data-testid={`select-assignee-${task.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
                      {staffOptions.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TaskDialog
                    staff={staffOptions}
                    task={task}
                    onSaved={invalidate}
                    trigger={
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" data-testid={`button-edit-task-${task.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => remove(task)}
                    disabled={deleteTask.isPending}
                    data-testid={`button-delete-task-${task.id}`}
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
