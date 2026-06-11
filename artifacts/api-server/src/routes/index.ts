import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import contactRouter from "./contact";
import adminRouter from "./admin";
import chatRouter from "./chat";
import testimonialsRouter from "./testimonials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(testimonialsRouter);

export default router;
