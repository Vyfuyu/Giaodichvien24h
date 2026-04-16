import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, marketItemsTable, usersTable } from "@workspace/db";
import { CreateMarketItemBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/session";

const router: IRouter = Router();

function formatItem(
  item: typeof marketItemsTable.$inferSelect,
  sellerName?: string | null
) {
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

router.get("/market", async (req, res): Promise<void> => {
  const gameType = typeof req.query.gameType === "string" ? req.query.gameType : undefined;
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  let where = eq(marketItemsTable.status, "AVAILABLE");
  if (gameType) {
    where = and(eq(marketItemsTable.status, "AVAILABLE"), eq(marketItemsTable.gameType, gameType)) as typeof where;
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(marketItemsTable)
    .where(where);

  const items = await db
    .select()
    .from(marketItemsTable)
    .where(where)
    .orderBy(marketItemsTable.createdAt)
    .limit(limit)
    .offset(offset);

  const sellerIds = items.map(i => i.sellerId).filter((id): id is number => id !== null);
  let sellers: Array<{ id: number; name: string }> = [];
  if (sellerIds.length > 0) {
    sellers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  }
  const sellerMap = new Map(sellers.map(s => [s.id, s.name]));

  res.json({
    items: items.map(i => formatItem(i, i.sellerId ? sellerMap.get(i.sellerId) : null)),
    total: Number(total),
    page,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

router.post("/market", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateMarketItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db.insert(marketItemsTable).values({
    sellerId: req.sessionUser!.id,
    ...parsed.data,
    images: parsed.data.images ?? [],
    status: "PENDING",
  }).returning();

  res.status(201).json(formatItem(item, req.sessionUser!.name));
});

router.get("/market/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [item] = await db.select().from(marketItemsTable).where(eq(marketItemsTable.id, id));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  let sellerName: string | null = null;
  if (item.sellerId) {
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, item.sellerId));
    sellerName = user?.name ?? null;
  }

  res.json(formatItem(item, sellerName));
});

router.get("/my/market", requireAuth, async (req, res): Promise<void> => {
  const items = await db
    .select()
    .from(marketItemsTable)
    .where(eq(marketItemsTable.sellerId, req.sessionUser!.id))
    .orderBy(marketItemsTable.createdAt);

  res.json(items.map(i => formatItem(i, req.sessionUser!.name)));
});

export default router;
