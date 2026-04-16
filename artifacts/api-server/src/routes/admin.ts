import { Router, type IRouter } from "express";
import { eq, ilike, or, count } from "drizzle-orm";
import { db, scamReportsTable, marketItemsTable, usersTable, middlemanProfilesTable, activityLogTable } from "@workspace/db";
import { PromoteToGdvBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/session";

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

router.get("/admin/reports", requireAdmin, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  let reports;
  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    reports = await db.select().from(scamReportsTable).where(eq(scamReportsTable.status, status)).orderBy(scamReportsTable.createdAt);
  } else {
    reports = await db.select().from(scamReportsTable).orderBy(scamReportsTable.createdAt);
  }

  const reporterIds = reports.map(r => r.reporterId).filter((id): id is number => id !== null);
  let reporters: Array<{ id: number; name: string }> = [];
  if (reporterIds.length > 0) {
    reporters = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  }
  const reporterMap = new Map(reporters.map(r => [r.id, r.name]));

  res.json(reports.map(r => formatReport(r, r.reporterId ? reporterMap.get(r.reporterId) : null)));
});

router.patch("/admin/reports/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [report] = await db.update(scamReportsTable).set({ status: "APPROVED" }).where(eq(scamReportsTable.id, id)).returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await db.insert(activityLogTable).values({ type: "REPORT_APPROVED", description: `Report #${id} approved: ${report.scammerName}` });

  res.json(formatReport(report));
});

router.patch("/admin/reports/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [report] = await db.update(scamReportsTable).set({ status: "REJECTED" }).where(eq(scamReportsTable.id, id)).returning();
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  await db.insert(activityLogTable).values({ type: "REPORT_REJECTED", description: `Report #${id} rejected: ${report.scammerName}` });

  res.json(formatReport(report));
});

router.delete("/admin/market/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [item] = await db.delete(marketItemsTable).where(eq(marketItemsTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  await db.insert(activityLogTable).values({ type: "MARKET_DELETED", description: `Market item #${id} deleted: ${item.title}` });

  res.sendStatus(204);
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;

  let users;
  if (search) {
    users = await db.select().from(usersTable).where(
      or(
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.name, `%${search}%`),
        ilike(usersTable.phone, `%${search}%`)
      )
    ).orderBy(usersTable.createdAt);
  } else {
    users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  }

  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar: u.avatar,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.post("/admin/users/:id/promote-gdv", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const parsed = PromoteToGdvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.update(usersTable).set({ role: "GDV" }).where(eq(usersTable.id, id));

  const existing = await db.select().from(middlemanProfilesTable).where(eq(middlemanProfilesTable.userId, id));
  let profile;
  if (existing.length > 0) {
    const [updated] = await db.update(middlemanProfilesTable).set({
      realName: parsed.data.realName,
      insuranceFund: parsed.data.insuranceFund,
      servicesOffered: parsed.data.servicesOffered,
      facebookLink: parsed.data.facebookLink ?? null,
      zaloLink: parsed.data.zaloLink ?? null,
      telegramLink: parsed.data.telegramLink ?? null,
    }).where(eq(middlemanProfilesTable.userId, id)).returning();
    profile = updated;
  } else {
    const [created] = await db.insert(middlemanProfilesTable).values({
      userId: id,
      realName: parsed.data.realName,
      insuranceFund: parsed.data.insuranceFund,
      servicesOffered: parsed.data.servicesOffered,
      facebookLink: parsed.data.facebookLink ?? null,
      zaloLink: parsed.data.zaloLink ?? null,
      telegramLink: parsed.data.telegramLink ?? null,
      verificationBadge: "true",
    }).returning();
    profile = created;
  }

  await db.insert(activityLogTable).values({ type: "USER_PROMOTED_GDV", description: `User ${user.name} promoted to GDV` });

  res.json({
    id: profile.id,
    userId: profile.userId,
    userName: user.name,
    userAvatar: user.avatar,
    realName: profile.realName,
    servicesOffered: profile.servicesOffered ?? [],
    insuranceFund: profile.insuranceFund,
    facebookLink: profile.facebookLink,
    zaloLink: profile.zaloLink,
    telegramLink: profile.telegramLink,
    totalTransactions: profile.totalTransactions,
    successRate: profile.successRate,
    verificationBadge: profile.verificationBadge === "true",
    createdAt: profile.createdAt.toISOString(),
  });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const [pendingCount] = await db.select({ count: count() }).from(scamReportsTable).where(eq(scamReportsTable.status, "PENDING"));
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [gdvCount] = await db.select({ count: count() }).from(middlemanProfilesTable);
  const [marketCount] = await db.select({ count: count() }).from(marketItemsTable);

  const recentActivity = await db
    .select()
    .from(activityLogTable)
    .orderBy(activityLogTable.createdAt)
    .limit(20);

  res.json({
    pendingReports: pendingCount.count,
    totalUsers: userCount.count,
    totalMiddlemen: gdvCount.count,
    totalMarketItems: marketCount.count,
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

export default router;
