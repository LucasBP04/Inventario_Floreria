import { NextRequest } from "next/server";
import { addDays } from "date-fns";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/utils";
import { requireAuth } from "@/lib/session";

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? 2);

/**
 * GET /api/alerts
 * Returns three alert categories:
 *   - lowStock: batches with remaining <= threshold
 *   - expiring: batches expiring within 2 days
 *   - upcomingSeasons: seasons starting within 14 days
 */
export async function GET(_req: NextRequest) {
  const { response } = await requireAuth();
  if (response) return response;

  const now = new Date();
  const in14Days = addDays(now, 14);
  const in2Days = addDays(now, 2);

  // All active batches with stock summary
  const batches = await prisma.flowerBatch.findMany({
    where: { expiresAt: { gte: now } }, // exclude already-expired
    include: {
      flower: { select: { name: true } },
      movements: { select: { type: true, quantity: true } },
    },
  });

  const enriched = batches.map((b) => {
    const consumed = b.movements
      .filter((m) => m.type === "OUT" || m.type === "WASTE")
      .reduce((acc, m) => acc + m.quantity, 0);
    return { ...b, remaining: b.quantity - consumed };
  });

  const lowStock = enriched.filter((b) => b.remaining <= LOW_STOCK_THRESHOLD);

  const expiring = enriched.filter(
    (b) => new Date(b.expiresAt) <= in2Days && b.remaining > 0
  );

  const upcomingSeasons = await prisma.season.findMany({
    where: {
      isActive: true,
      startDate: { gte: now, lte: in14Days },
    },
    orderBy: { startDate: "asc" },
  });

  return apiSuccess({ lowStock, expiring, upcomingSeasons });
}
