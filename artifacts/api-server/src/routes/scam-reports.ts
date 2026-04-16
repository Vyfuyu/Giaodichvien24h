import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, scamReportsTable, usersTable } from "@workspace/db";
import { CreateScamReportBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/session";

const router: IRouter = Router();

function formatReport(r: typeof scamReportsTable.$inferSelect, reporterName?: string | null) {
  return {
    id: r.id,
    reporterId: r.reporterId,
    reporterName: reporterName ?? null,
    scammerName: r.scammerName,
    scammerPhone: r.scammerPhone,
    scammerBankNumber: r.scammerBankNumber,
    scammerBankName: r.scammerBankName,
    scammerSocialLink: r.scammerSocialLink,
    amountLost: r.amountLost,
    description: r.description,
    evidenceImages: r.evidenceImages ?? [],
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/scam-reports", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  let where = eq(scamReportsTable.status, "APPROVED");

  if (search) {
    where = and(
      eq(scamReportsTable.status, "APPROVED"),
      or(
        ilike(scamReportsTable.scammerName, `%${search}%`),
        ilike(scamReportsTable.scammerPhone, `%${search}%`),
        ilike(scamReportsTable.scammerBankNumber, `%${search}%`)
      )
    ) as typeof where;
  }

  const [{ count }] = await db
    .select({ count: db.$count(scamReportsTable, where) })
    .from(scamReportsTable)
    .where(where);

  const reports = await db
    .select()
    .from(scamReportsTable)
    .where(where)
    .orderBy(scamReportsTable.createdAt)
    .limit(limit)
    .offset(offset);

  const reporterIds = reports.map(r => r.reporterId).filter((id): id is number => id !== null);
  let reporters: Array<{ id: number; name: string }> = [];
  if (reporterIds.length > 0) {
    reporters = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  }
  const reporterMap = new Map(reporters.map(r => [r.id, r.name]));

  const total = Number(count);
  res.json({
    reports: reports.map(r => formatReport(r, r.reporterId ? reporterMap.get(r.reporterId) : null)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/scam-reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateScamReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [report] = await db.insert(scamReportsTable).values({
    reporterId: req.sessionUser!.id,
    ...parsed.data,
    status: "PENDING",
    evidenceImages: parsed.data.evidenceImages ?? [],
  }).returning();

  res.status(201).json(formatReport(report, req.sessionUser!.name));
});

router.get("/scam-reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [report] = await db.select().from(scamReportsTable).where(eq(scamReportsTable.id, id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  let reporterName: string | null = null;
  if (report.reporterId) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, report.reporterId));
    reporterName = user?.name ?? null;
  }

  res.json(formatReport(report, reporterName));
});

router.get("/my/reports", requireAuth, async (req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(scamReportsTable)
    .where(eq(scamReportsTable.reporterId, req.sessionUser!.id))
    .orderBy(scamReportsTable.createdAt);

  res.json(reports.map(r => formatReport(r, req.sessionUser!.name)));
});

export default router;
