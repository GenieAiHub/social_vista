import { Router } from "express";
import { db, tasksTable, staffTable } from "@workspace/db";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
  ListTasksQueryParams,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth.js";

const router = Router();

const assignee = alias(staffTable, "assignee");
const creator = alias(staffTable, "creator");

const taskColumns = {
  id: tasksTable.id,
  title: tasksTable.title,
  description: tasksTable.description,
  status: tasksTable.status,
  priority: tasksTable.priority,
  assignedTo: tasksTable.assignedTo,
  assigneeName: assignee.name,
  createdBy: tasksTable.createdBy,
  creatorName: creator.name,
  dueDate: tasksTable.dueDate,
  createdAt: tasksTable.createdAt,
  updatedAt: tasksTable.updatedAt,
};

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: number | null;
  assigneeName: string | null;
  createdBy: number | null;
  creatorName: string | null;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeTask(t: TaskRow) {
  return {
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

async function getTaskWithNames(id: number): Promise<TaskRow | undefined> {
  const [row] = await db
    .select(taskColumns)
    .from(tasksTable)
    .leftJoin(assignee, eq(tasksTable.assignedTo, assignee.id))
    .leftJoin(creator, eq(tasksTable.createdBy, creator.id))
    .where(eq(tasksTable.id, id));
  return row;
}

router.get("/admin/tasks", requireAuth, async (req, res) => {
  try {
    const query = ListTasksQueryParams.parse(req.query);
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(tasksTable.status, query.status));
    if (query.assignedTo !== undefined) conditions.push(eq(tasksTable.assignedTo, query.assignedTo));
    const rows = await db
      .select(taskColumns)
      .from(tasksTable)
      .leftJoin(assignee, eq(tasksTable.assignedTo, assignee.id))
      .leftJoin(creator, eq(tasksTable.createdBy, creator.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(tasksTable.createdAt));
    res.json(rows.map(serializeTask));
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/tasks", requireAuth, async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const body = CreateTaskBody.parse(req.body);
    const [created] = await db
      .insert(tasksTable)
      .values({
        title: body.title,
        description: body.description ?? null,
        status: body.status ?? "todo",
        priority: body.priority ?? "medium",
        assignedTo: body.assignedTo ?? null,
        createdBy: author?.id ?? null,
        dueDate: body.dueDate ?? null,
      })
      .returning({ id: tasksTable.id });
    const task = await getTaskWithNames(created.id);
    if (!task) { res.status(500).json({ error: "Internal server error" }); return; }
    res.status(201).json(serializeTask(task));
  } catch (err) {
    req.log.error({ err }, "Failed to create task");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/admin/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = UpdateTaskParams.parse({ id: Number(req.params.id) });
    const body = UpdateTaskBody.parse(req.body);
    const [existing] = await db
      .select({ id: tasksTable.id })
      .from(tasksTable)
      .where(eq(tasksTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updates: Partial<typeof tasksTable.$inferInsert> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ?? null;
    await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id));
    const task = await getTaskWithNames(id);
    if (!task) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serializeTask(task));
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/tasks/:id", requireAuth, async (req, res) => {
  try {
    const { id } = DeleteTaskParams.parse({ id: Number(req.params.id) });
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
