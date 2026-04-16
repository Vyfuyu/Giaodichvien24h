import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const ADMIN_EMAIL = "admin@giaodichvien24h.vn";
const ADMIN_PASSWORD = "admin@2008";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function ensureAdminExists(): Promise<void> {
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL));

    if (existing) {
      return;
    }

    await db.insert(usersTable).values({
      uid: "#000000",
      name: "Admin",
      email: ADMIN_EMAIL,
      phone: "0000000000",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
      status: "NORMAL",
      badge: "NONE",
    });

    logger.info({ email: ADMIN_EMAIL }, "Default admin account created");
  } catch (err) {
    logger.error({ err }, "Failed to ensure admin exists");
  }
}
