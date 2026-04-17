import { Router, type IRouter } from "express";
import { eq, ilike, or, count } from "drizzle-orm";
import { db, scamReportsTable, marketItemsTable, usersTable, middlemanProfilesTable, activityLogTable } from "@workspace/db";
import { PromoteToGdvBody, AdminSetUserRoleBody, AdminSetUserStatusBody } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/session";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    uid: u.uid,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    badge: u.badge,
    avatar: u.avatar,
    createdAt: u.createdAt.toISOString(),
  };
}

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

function formatMarketItem(item: typeof marketItemsTable.$inferSelect, sellerName?: string | null) {
  return {
    id: item.id,
    sellerId: item.sellerId,
    sellerName: sellerName ?? null,
    title: item.title,
    gameType: item.gameType,
    price: item.price,
    description: item.description,
    images: item.images ?? [],
    status: item.status,
    createdAt: item.createdAt.toISOString(),
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
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [report] = await db.update(scamReportsTable).set({ status: "APPROVED" }).where(eq(scamReportsTable.id, id)).returning();
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }

  await db.insert(activityLogTable).values({ type: "REPORT_APPROVED", description: `Duyệt báo cáo #${id}: ${report.scammerName}` });
  res.json(formatReport(report));
});

router.patch("/admin/reports/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [report] = await db.update(scamReportsTable).set({ status: "REJECTED" }).where(eq(scamReportsTable.id, id)).returning();
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }

  await db.insert(activityLogTable).values({ type: "REPORT_REJECTED", description: `Từ chối báo cáo #${id}: ${report.scammerName}` });
  res.json(formatReport(report));
});

router.delete("/admin/reports/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [report] = await db.delete(scamReportsTable).where(eq(scamReportsTable.id, id)).returning();
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }

  await db.insert(activityLogTable).values({ type: "REPORT_DELETED", description: `Xóa báo cáo #${id}: ${report.scammerName}` });
  res.sendStatus(204);
});

router.get("/admin/market", requireAdmin, async (req, res): Promise<void> => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  let items;
  if (status === "PENDING" || status === "AVAILABLE" || status === "SOLD" || status === "REJECTED") {
    items = await db.select().from(marketItemsTable).where(eq(marketItemsTable.status, status)).orderBy(marketItemsTable.createdAt);
  } else {
    items = await db.select().from(marketItemsTable).orderBy(marketItemsTable.createdAt);
  }

  const sellerIds = items.map(i => i.sellerId).filter((id): id is number => id !== null);
  let sellers: Array<{ id: number; name: string }> = [];
  if (sellerIds.length > 0) {
    sellers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  }
  const sellerMap = new Map(sellers.map(s => [s.id, s.name]));

  res.json({
    items: items.map(i => formatMarketItem(i, i.sellerId ? sellerMap.get(i.sellerId) : null)),
    total: items.length,
    page: 1,
    totalPages: 1,
  });
});

router.delete("/admin/market/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [item] = await db.delete(marketItemsTable).where(eq(marketItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  await db.insert(activityLogTable).values({ type: "MARKET_DELETED", description: `Xóa tin đăng #${id}: ${item.title}` });
  res.sendStatus(204);
});

router.patch("/admin/market/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [item] = await db.update(marketItemsTable).set({ status: "AVAILABLE" }).where(eq(marketItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  await db.insert(activityLogTable).values({ type: "MARKET_APPROVED", description: `Duyệt tin đăng #${id}: ${item.title}` });
  res.json(formatMarketItem(item));
});

router.patch("/admin/market/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [item] = await db.update(marketItemsTable).set({ status: "REJECTED" }).where(eq(marketItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }

  await db.insert(activityLogTable).values({ type: "MARKET_REJECTED", description: `Từ chối tin đăng #${id}: ${item.title}` });
  res.json(formatMarketItem(item));
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

  res.json(users.map(formatUser));
});

router.delete("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  if (id === req.sessionUser!.id) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }

  await db.delete(middlemanProfilesTable).where(eq(middlemanProfilesTable.userId, id));
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(activityLogTable).values({ type: "USER_DELETED", description: `Xóa tài khoản: ${user.name} (${user.email})` });
  res.sendStatus(204);
});

router.patch("/admin/users/:id/role", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = AdminSetUserRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set({ role: parsed.data.role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(activityLogTable).values({ type: "USER_ROLE_CHANGED", description: `Đổi role ${user.name} → ${parsed.data.role}` });
  res.json(formatUser(user));
});

router.patch("/admin/users/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = AdminSetUserStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.badge !== undefined) updates.badge = parsed.data.badge;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(activityLogTable).values({ type: "USER_STATUS_CHANGED", description: `Cập nhật trạng thái ${user.name}: ${user.status} / ${user.badge}` });
  res.json(formatUser(user));
});

router.post("/admin/gdv", requireAdmin, async (req, res): Promise<void> => {
  const { realName, avatar, insuranceFund, servicesOffered, facebookLink, zaloLink, telegramLink } = req.body;
  if (!realName || typeof realName !== "string" || realName.trim().length < 2) {
    res.status(400).json({ error: "Tên thật bắt buộc (tối thiểu 2 ký tự)" });
    return;
  }
  if (!insuranceFund || isNaN(Number(insuranceFund)) || Number(insuranceFund) < 0) {
    res.status(400).json({ error: "Quỹ bảo hiểm không hợp lệ" });
    return;
  }

  const services: string[] = Array.isArray(servicesOffered)
    ? servicesOffered
    : typeof servicesOffered === "string"
      ? servicesOffered.split(",").map((s: string) => s.trim()).filter(Boolean)
      : ["Trung gian mua bán"];

  const [profile] = await db.insert(middlemanProfilesTable).values({
    userId: null,
    avatar: avatar || null,
    realName: realName.trim(),
    insuranceFund: Number(insuranceFund),
    servicesOffered: services,
    facebookLink: facebookLink || null,
    zaloLink: zaloLink || null,
    telegramLink: telegramLink || null,
    verificationBadge: "true",
  }).returning();

  await db.insert(activityLogTable).values({ type: "USER_PROMOTED_GDV", description: `Thêm GDV độc lập: ${profile.realName}` });

  res.json({
    id: profile.id,
    userId: profile.userId,
    userName: null,
    userAvatar: profile.avatar,
    avatar: profile.avatar,
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

router.post("/admin/users/:id/promote-gdv", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const parsed = PromoteToGdvBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

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

  await db.insert(activityLogTable).values({ type: "USER_PROMOTED_GDV", description: `Nâng cấp GDV: ${user.name}` });

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

router.delete("/admin/middlemen/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [profile] = await db.delete(middlemanProfilesTable).where(eq(middlemanProfilesTable.id, id)).returning();
  if (!profile) { res.status(404).json({ error: "GDV profile not found" }); return; }

  if (profile.userId) {
    await db.update(usersTable).set({ role: "MEMBER" }).where(eq(usersTable.id, profile.userId));
  }

  await db.insert(activityLogTable).values({ type: "GDV_REMOVED", description: `Thu hồi GDV: ${profile.realName}` });

  res.sendStatus(204);
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const [pendingCount] = await db.select({ count: count() }).from(scamReportsTable).where(eq(scamReportsTable.status, "PENDING"));
  const [pendingMarketCount] = await db.select({ count: count() }).from(marketItemsTable).where(eq(marketItemsTable.status, "PENDING"));
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
    pendingMarketItems: pendingMarketCount.count,
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
