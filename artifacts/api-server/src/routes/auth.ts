import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody, UpdateProfileBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/auth";
import { createSession, deleteSession, requireAuth } from "../middlewares/session";

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

function generateUid(id: number): string {
  return "#" + String(id).padStart(6, "0");
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone: phone ?? null,
    passwordHash,
    role: "MEMBER",
  }).returning();

  const uid = generateUid(user.id);
  const [updated] = await db.update(usersTable).set({ uid }).where(eq(usersTable.id, user.id)).returning();

  const token = createSession({ id: updated.id, role: updated.role, name: updated.name, email: updated.email });

  res.status(201).json({
    user: formatUser(updated),
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createSession({ id: user.id, role: user.role, name: user.name, email: user.email });

  res.json({
    user: formatUser(user),
    token,
  });
});

router.post("/auth/logout", (req, res): void => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    deleteSession(auth.slice(7));
  }
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, req.sessionUser!.id));
  if (!u) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(u));
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.avatar !== undefined) updates.avatar = parsed.data.avatar ?? null;

  const [u] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.sessionUser!.id)).returning();
  if (!u) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(u));
});

export default router;
