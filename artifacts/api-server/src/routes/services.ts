import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListServicesResponse,
  GetServiceParams,
  GetServiceResponse,
  CreateServiceBody,
  UpdateServiceParams,
  UpdateServiceBody,
  DeleteServiceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/services", async (req, res) => {
  try {
    const services = await db
      .select()
      .from(servicesTable)
      .orderBy(servicesTable.sortOrder);
    res.json(ListServicesResponse.parse(services.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }))));
  } catch (err) {
    req.log.error({ err }, "Failed to list services");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/services", requireAuth, async (req, res) => {
  try {
    const body = CreateServiceBody.parse(req.body);
    const [service] = await db.insert(servicesTable).values({
      title: body.title,
      description: body.description,
      icon: body.icon,
      category: body.category,
      sortOrder: body.sortOrder ?? 0,
      active: body.active ?? true,
    }).returning();
    res.status(201).json({ ...service, createdAt: service.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create service");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/services/:id", async (req, res) => {
  try {
    const { id } = GetServiceParams.parse({ id: Number(req.params.id) });
    const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
    if (!service) { res.status(404).json({ error: "Not found" }); return; }
    res.json(GetServiceResponse.parse({ ...service, createdAt: service.createdAt.toISOString() }));
  } catch (err) {
    req.log.error({ err }, "Failed to get service");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/services/:id", requireAuth, async (req, res) => {
  try {
    const { id } = UpdateServiceParams.parse({ id: Number(req.params.id) });
    const body = UpdateServiceBody.parse(req.body);
    const [service] = await db
      .update(servicesTable)
      .set(body)
      .where(eq(servicesTable.id, id))
      .returning();
    if (!service) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...service, createdAt: service.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update service");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/services/:id", requireAuth, async (req, res) => {
  try {
    const { id } = DeleteServiceParams.parse({ id: Number(req.params.id) });
    await db.delete(servicesTable).where(eq(servicesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete service");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
