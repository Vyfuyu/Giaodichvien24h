import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import scamReportsRouter from "./scam-reports";
import middlemenRouter from "./middlemen";
import marketRouter from "./market";
import adminRouter from "./admin";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(scamReportsRouter);
router.use(middlemenRouter);
router.use(marketRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
