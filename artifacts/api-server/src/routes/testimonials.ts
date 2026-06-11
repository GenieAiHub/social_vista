import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsResponse } from "@workspace/api-zod";

const router = Router();

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await db.select().from(testimonialsTable);
    res.json(ListTestimonialsResponse.parse(testimonials.map(t => ({
      ...t,
      avatarUrl: t.avatarUrl ?? null,
    }))));
  } catch (err) {
    req.log.error({ err }, "Failed to list testimonials");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
