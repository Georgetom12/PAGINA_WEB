// build-refresh: 2026-07-05T23-14 — forzar rebuild sin cache stale
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import psyChatRouter from "./psy-chat";
import psyBrainRouter from "./psy-brain";
import degateProxyRouter from "./degate-proxy";
import superadminAuthRouter from "./superadmin-auth";
import telegramRouter from "./telegram";
import signalsRouter from "./signals";
import channelsRouter from "./channels";
import marketRouter from "./market";
// operatorsRouter eliminado — un único superadmin (jamogollon vía env vars)
import botStatusRouter from "./bot-status";
import testInterpretRouter from "./test-interpret";
import psyAutopsyRouter from "./psy-autopsy";
import psyWeeklyReportRouter from "./psy-weekly-report";
import adminConfigRouter from "./admin-config";
import marketProxyRouter from "./market-proxy";
import vaultRouter from "./vault";
import certificatesRouter from "./certificates";
import newsRouter from "./news";
import oneInchRouter from "./oneinch";
import membersRouter from "./members";
import botXRouter from "./bot-x";
import exchangeRouter from "./exchange";
import altcoinSignalsRouter from "./altcoin-signals";
import psyWhalesRouter from "./psy-whales";
import iaTradingProxyRouter from "./ia-trading-proxy";
import iaSignalsRouter from "./ia-signals";
import freeAuthRouter from "./free-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use(psyChatRouter);
router.use(psyBrainRouter);
router.use(degateProxyRouter);
router.use(superadminAuthRouter);
router.use(telegramRouter);
router.use(signalsRouter);
router.use(channelsRouter);
router.use(marketRouter);
// router.use(operatorsRouter); — eliminado, un único superadmin
router.use(botStatusRouter);
router.use(testInterpretRouter);
router.use(psyAutopsyRouter);
router.use(psyWeeklyReportRouter);
router.use(adminConfigRouter);
router.use(marketProxyRouter);
router.use(vaultRouter);
router.use(certificatesRouter);
router.use(newsRouter);
router.use(oneInchRouter);
router.use(membersRouter);
router.use(botXRouter);
router.use(exchangeRouter);
router.use(altcoinSignalsRouter);
router.use(psyWhalesRouter);
router.use(iaTradingProxyRouter);
router.use(iaSignalsRouter);
router.use(freeAuthRouter);

export default router;
