import { Router, type IRouter } from "express";
import { eq, count, sum } from "drizzle-orm";
import { db, scamReportsTable, usersTable, middlemanProfilesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (req, res): Promise<void> => {
  const [scamCount] = await db.select({ count: count() }).from(scamReportsTable).where(eq(scamReportsTable.status, "APPROVED"));
  const [amountResult] = await db.select({ total: sum(scamReportsTable.amountLost) }).from(scamReportsTable).where(eq(scamReportsTable.status, "APPROVED"));
  const [totalReports] = await db.select({ count: count() }).from(scamReportsTable);
  const [middlemanCount] = await db.select({ count: count() }).from(middlemanProfilesTable);

  const recentReports = await db
    .select()
    .from(scamReportsTable)
    .where(eq(scamReportsTable.status, "APPROVED"))
    .orderBy(scamReportsTable.createdAt)
    .limit(5);

  const reporterIds = recentReports.map(r => r.reporterId).filter((id): id is number => id !== null);
  let reporters: Array<{ id: number; name: string }> = [];
  if (reporterIds.length > 0) {
    reporters = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  }

  const reporterMap = new Map(reporters.map(r => [r.id, r.name]));

  res.json({
    totalScammers: scamCount.count,
    totalAmountLost: Number(amountResult.total ?? 0),
    totalReports: totalReports.count,
    totalMiddlemen: middlemanCount.count,
    recentReports: recentReports.map(r => ({
      id: r.id,
      reporterId: r.reporterId,
      reporterName: r.reporterId ? (reporterMap.get(r.reporterId) ?? null) : null,
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
    })),
  });
});

export default router;
