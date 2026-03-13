import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emotionRouter from "./emotion";

const router: IRouter = Router();

router.use(healthRouter);
router.use(emotionRouter);

export default router;
