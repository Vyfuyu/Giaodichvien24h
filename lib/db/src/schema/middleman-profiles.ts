import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const middlemanProfilesTable = pgTable("middleman_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).unique(),
  avatar: text("avatar"),
  realName: text("real_name").notNull(),
  servicesOffered: text("services_offered").array().notNull().default([]),
  insuranceFund: integer("insurance_fund").notNull().default(0),
  facebookLink: text("facebook_link"),
  zaloLink: text("zalo_link"),
  telegramLink: text("telegram_link"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  successRate: real("success_rate").notNull().default(100),
  verificationBadge: text("verification_badge").notNull().default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMiddlemanProfileSchema = createInsertSchema(middlemanProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMiddlemanProfile = z.infer<typeof insertMiddlemanProfileSchema>;
export type MiddlemanProfile = typeof middlemanProfilesTable.$inferSelect;
