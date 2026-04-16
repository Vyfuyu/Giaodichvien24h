import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["MEMBER", "GDV", "ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["NORMAL", "SCAM", "TRUSTED"]);
export const userBadgeEnum = pgEnum("user_badge", ["NONE", "TRUSTED_GDV", "TRUSTED_SELLER"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("MEMBER"),
  status: userStatusEnum("status").notNull().default("NORMAL"),
  badge: userBadgeEnum("badge").notNull().default("NONE"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
