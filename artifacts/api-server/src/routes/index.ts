import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import contactRouter from "./contact";
import adminRouter from "./admin";
import chatRouter from "./chat";
import testimonialsRouter from "./testimonials";
import staffRouter from "./staff";
import leadsRouter from "./leads";
import tasksRouter from "./tasks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(testimonialsRouter);
router.use(staffRouter);
router.use(leadsRouter);
router.use(tasksRouter);

export default router;
