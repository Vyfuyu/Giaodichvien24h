import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const scamReportStatusEnum = pgEnum("scam_report_status", ["PENDING", "APPROVED", "REJECTED"]);

export const scamReportsTable = pgTable("scam_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").references(() => usersTable.id),
  scammerName: text("scammer_name").notNull(),
  scammerPhone: text("scammer_phone"),
  scammerBankNumber: text("scammer_bank_number"),
  scammerBankName: text("scammer_bank_name"),
  scammerSocialLink: text("scammer_social_link"),
  amountLost: integer("amount_lost"),
  description: text("description").notNull(),
  evidenceImages: text("evidence_images").array().notNull().default([]),
  status: scamReportStatusEnum("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertScamReportSchema = createInsertSchema(scamReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertScamReport = z.infer<typeof insertScamReportSchema>;
export type ScamReport = typeof scamReportsTable.$inferSelect;
