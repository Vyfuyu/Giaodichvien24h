import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, middlemanProfilesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function formatProfile(
  profile: typeof middlemanProfilesTable.$inferSelect,
  user: { name: string; avatar: string | null }
) {
  return {
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
  };
}

router.get("/middlemen", async (_req, res): Promise<void> => {
  const profiles = await db
    .select()
    .from(middlemanProfilesTable)
    .leftJoin(usersTable, eq(middlemanProfilesTable.userId, usersTable.id))
    .orderBy(middlemanProfilesTable.totalTransactions);

  res.json(profiles.map(({ middleman_profiles, users }) =>
    formatProfile(middleman_profiles, { name: users?.name ?? "", avatar: users?.avatar ?? null })
  ));
});

router.get("/middlemen/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid userId" });
    return;
  }

  const [row] = await db
    .select()
    .from(middlemanProfilesTable)
    .leftJoin(usersTable, eq(middlemanProfilesTable.userId, usersTable.id))
    .where(eq(middlemanProfilesTable.userId, userId));

  if (!row) {
    res.status(404).json({ error: "Middleman not found" });
    return;
  }

  res.json(formatProfile(row.middleman_profiles, { name: row.users?.name ?? "", avatar: row.users?.avatar ?? null }));
});

export default router;
