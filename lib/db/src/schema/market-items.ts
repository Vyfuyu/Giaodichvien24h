import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const marketItemStatusEnum = pgEnum("market_item_status", ["AVAILABLE", "SOLD"]);

export const marketItemsTable = pgTable("market_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => usersTable.id),
  title: text("title").notNull(),
  gameType: text("game_type").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull().default([]),
  status: marketItemStatusEnum("status").notNull().default("AVAILABLE"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMarketItemSchema = createInsertSchema(marketItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarketItem = z.infer<typeof insertMarketItemSchema>;
export type MarketItem = typeof marketItemsTable.$inferSelect;
