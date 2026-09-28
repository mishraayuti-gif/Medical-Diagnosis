import { Router, type IRouter } from "express";
import healthRouter from "./health";
import medigridRouter from "./medigrid";

const router: IRouter = Router();

router.use(healthRouter);
router.use(medigridRouter);

export default router;
