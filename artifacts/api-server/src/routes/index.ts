import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import contactRouter from "./contact";
import adminRouter from "./admin";
import chatRouter from "./chat";
import testimonialsRouter from "./testimonials";
import staffRouter from "./staff";
import rolesRouter from "./roles";
import leadsRouter from "./leads";
import tasksRouter from "./tasks";
import emailAssetsRouter from "./email-assets";
import blogRouter from "./blog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(testimonialsRouter);
router.use(staffRouter);
router.use(rolesRouter);
router.use(leadsRouter);
router.use(tasksRouter);
router.use(emailAssetsRouter);
router.use(blogRouter);

export default router;
